import { NextResponse, type NextRequest } from "next/server";
import { manejar, AppError } from "@/lib/errores";
import { TorneosRepository } from "@/repositories/torneos.repo";
import { calcularTablaPosiciones } from "@/services/posiciones";

export const runtime = "nodejs";

export const GET = manejar(
  async (
    _request: NextRequest,
    context: { params: Promise<Record<string, string | string[]>> }
  ) => {
    const params = await context.params;
    const torneoId = typeof params?.id === "string" ? params.id : "";

    const torneo = await TorneosRepository.obtenerTorneoPorId(torneoId);
    if (!torneo) {
      throw new AppError(404, "El torneo especificado no existe");
    }

    const [equipos, partidos, goleadores] = await Promise.all([
      TorneosRepository.obtenerEquipos(torneoId),
      TorneosRepository.obtenerPartidos(torneoId),
      TorneosRepository.obtenerGoleadores(torneoId),
    ]);

    const posiciones = calcularTablaPosiciones(equipos, partidos);

    return NextResponse.json(
      {
        torneo,
        equipos,
        partidos,
        posiciones,
        goleadores,
      },
      { status: 200 }
    );
  }
);
