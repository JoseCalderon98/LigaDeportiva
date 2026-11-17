import { NextResponse, type NextRequest } from "next/server";
import { manejar, AppError } from "@/lib/errores";
import { requerirUsuario, verificarOrigen } from "@/lib/auth-server";
import { TorneosRepository } from "@/repositories/torneos.repo";
import { z } from "zod";

export const runtime = "nodejs";

const CrearEquipoSchema = z
  .object({
    nombre: z.string().min(1, "El nombre del equipo es requerido"),
    escudoUrl: z.string().url("El escudo debe ser una URL válida").nullable().optional(),
  })
  .strict();

export const POST = manejar(
  async (
    request: NextRequest,
    context?: { params?: Promise<Record<string, string | string[]>> }
  ) => {
    verificarOrigen(request);
    const usuario = await requerirUsuario(request);

    const params = await context?.params;
    const torneoId = typeof params?.id === "string" ? params.id : "";

    const torneo = await TorneosRepository.obtenerTorneoPorId(torneoId);
    if (!torneo) {
      throw new AppError(404, "El torneo especificado no existe");
    }

    // Solo el organizador puede agregar equipos al torneo
    if (torneo.organizadorUid !== usuario.uid) {
      throw new AppError(
        403,
        "No tienes permisos de organizador para modificar este torneo"
      );
    }

    const body = await request.json().catch(() => null);
    const datosValidados = CrearEquipoSchema.parse(body);

    const equipoCreado = await TorneosRepository.crearEquipo(
      torneoId,
      datosValidados
    );

    return NextResponse.json(equipoCreado, { status: 201 });
  }
);
