import { NextResponse } from "next/server";
import {
  torneoDemo,
  equiposDemo,
  partidosDemo,
  goleadoresDemo,
} from "@/lib/datos-demo";
import { calcularTablaPosiciones } from "@/services/posiciones";

export const runtime = "nodejs";

/**
 * GET /api/torneos/demo/posiciones
 * Devuelve el estado completo del torneo demo con la tabla de posiciones
 * calculada dinámicamente en el servidor a partir de los partidos jugados.
 */
export async function GET() {
  try {
    const posiciones = calcularTablaPosiciones(equiposDemo, partidosDemo);

    return NextResponse.json(
      {
        torneo: torneoDemo,
        equipos: equiposDemo,
        partidos: partidosDemo,
        posiciones,
        goleadores: goleadoresDemo,
      },
      { status: 200 }
    );
  } catch (error) {
    const mensaje =
      error instanceof Error
        ? error.message
        : "Error interno al calcular las posiciones";

    return NextResponse.json({ error: mensaje }, { status: 500 });
  }
}
