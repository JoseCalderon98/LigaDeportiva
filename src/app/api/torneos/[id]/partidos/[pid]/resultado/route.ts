import { NextResponse, type NextRequest } from "next/server";
import { revalidateTag } from "next/cache";
import { manejar, AppError } from "@/lib/errores";
import { requerirUsuario, verificarOrigen } from "@/lib/auth-server";
import { TorneosRepository } from "@/repositories/torneos.repo";
import { ResultadoInputSchema } from "@/schemas/liga";

export const runtime = "nodejs";

export const PUT = manejar(
  async (
    request: NextRequest,
    context: { params: Promise<Record<string, string | string[]>> }
  ) => {
    verificarOrigen(request);
    const usuario = await requerirUsuario(request);

    const params = await context.params;
    const torneoId = typeof params?.id === "string" ? params.id : "";
    const partidoId = typeof params?.pid === "string" ? params.pid : "";

    // 1. Validar cuerpo con Zod en modo strict (400 si falla)
    const body = await request.json().catch(() => null);
    const { golesLocal, golesVisitante } = ResultadoInputSchema.parse(body);

    // 2. Verificar existencia del torneo (404)
    const torneo = await TorneosRepository.obtenerTorneoPorId(torneoId);
    if (!torneo) {
      throw new AppError(404, "El torneo especificado no existe");
    }

    // 3. Verificar permisos de organizador (403 si no coincide uid)
    if (torneo.organizadorUid !== usuario.uid) {
      throw new AppError(
        403,
        "No tienes permisos de organizador para registrar resultados en este torneo"
      );
    }

    // 4. Verificar existencia del partido (404)
    const partido = await TorneosRepository.obtenerPartido(torneoId, partidoId);
    if (!partido) {
      throw new AppError(404, "El partido especificado no existe en este torneo");
    }

    // 5. Actualizar en Firestore
    const partidoActualizado = await TorneosRepository.actualizarResultado(
      torneoId,
      partidoId,
      golesLocal,
      golesVisitante
    );

    // 6. Invalidar caché de posiciones
    try {
      revalidateTag(`posiciones-${torneoId}`, "default");
    } catch {
      // Entorno de test o build sin cache handler
    }

    return NextResponse.json(
      { partido: partidoActualizado },
      { status: 200 }
    );
  }
);
