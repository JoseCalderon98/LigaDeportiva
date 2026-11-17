import { NextResponse, type NextRequest } from "next/server";
import { manejar } from "@/lib/errores";
import { requerirUsuario, verificarOrigen } from "@/lib/auth-server";
import { TorneosRepository } from "@/repositories/torneos.repo";
import { z } from "zod";

export const runtime = "nodejs";

const CrearTorneoSchema = z
  .object({
    nombre: z.string().min(1, "El nombre del torneo es requerido"),
    temporada: z.string().min(1).optional(),
  })
  .strict();

export const GET = manejar(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const limite = Math.min(
    Math.max(Number(searchParams.get("limite") || "10"), 1),
    50
  );
  const cursor = searchParams.get("cursor") || undefined;

  const resultado = await TorneosRepository.listarTorneos(limite, cursor);

  return NextResponse.json(resultado, { status: 200 });
});

export const POST = manejar(async (request: NextRequest) => {
  verificarOrigen(request);
  const usuario = await requerirUsuario(request);

  const body = await request.json().catch(() => null);
  const datosValidados = CrearTorneoSchema.parse(body);

  const nuevoTorneo = await TorneosRepository.crearTorneo(
    datosValidados,
    usuario.uid
  );

  return NextResponse.json(nuevoTorneo, { status: 201 });
});
