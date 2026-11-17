import { NextResponse, type NextRequest } from "next/server";
import { manejar, AppError } from "@/lib/errores";
import { requerirUsuario, verificarOrigen } from "@/lib/auth-server";
import { TorneosRepository } from "@/repositories/torneos.repo";
import { generarCalendarioTodosContraTodos } from "@/services/calendario";
import { z } from "zod";

export const runtime = "nodejs";

const GenerarCalendarioInputSchema = z
  .object({
    fechaInicio: z.string().min(1, "La fecha de inicio es requerida"),
  })
  .strict();

export const POST = manejar(
  async (
    request: NextRequest,
    context: { params: Promise<Record<string, string | string[]>> }
  ) => {
    verificarOrigen(request);
    const usuario = await requerirUsuario(request);

    const params = await context.params;
    const torneoId = typeof params?.id === "string" ? params.id : "";

    const torneo = await TorneosRepository.obtenerTorneoPorId(torneoId);
    if (!torneo) {
      throw new AppError(404, "El torneo especificado no existe");
    }

    if (torneo.organizadorUid !== usuario.uid) {
      throw new AppError(
        403,
        "No tienes permisos de organizador para generar el calendario"
      );
    }

    const body = await request.json().catch(() => null);
    const { fechaInicio } = GenerarCalendarioInputSchema.parse(body);

    const equipos = await TorneosRepository.obtenerEquipos(torneoId);
    if (equipos.length < 2) {
      throw new AppError(
        400,
        "Se requieren al menos 2 equipos registrados para generar el calendario"
      );
    }

    const partidosGenerados = generarCalendarioTodosContraTodos(
      equipos,
      fechaInicio
    );
    await TorneosRepository.guardarPartidos(torneoId, partidosGenerados);

    return NextResponse.json(
      { partidos: partidosGenerados },
      { status: 201 }
    );
  }
);
