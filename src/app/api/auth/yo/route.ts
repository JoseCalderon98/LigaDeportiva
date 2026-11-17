import { NextResponse, type NextRequest } from "next/server";
import { manejar } from "@/lib/errores";
import { requerirUsuario } from "@/lib/auth-server";

export const runtime = "nodejs";

export const GET = manejar(async (request: NextRequest) => {
  const usuario = await requerirUsuario(request);

  return NextResponse.json(
    {
      usuario: {
        uid: usuario.uid,
        correo: usuario.correo,
        rol: usuario.rol,
      },
    },
    { status: 200 }
  );
});
