import { NextResponse, type NextRequest } from "next/server";
import { getAdminAuth } from "@/lib/firebase-admin";
import { manejar, AppError } from "@/lib/errores";
import { verificarOrigen } from "@/lib/auth-server";
import { z } from "zod";

export const runtime = "nodejs";

const SesionInputSchema = z
  .object({
    idToken: z.string().min(1, "El idToken es requerido"),
  })
  .strict();

const CINCO_DIAS_MS = 5 * 24 * 60 * 60 * 1000;

export const POST = manejar(async (request: NextRequest) => {
  verificarOrigen(request);

  const body = await request.json().catch(() => null);
  const { idToken } = SesionInputSchema.parse(body);

  try {
    const auth = getAdminAuth();
    const sessionCookie = await auth.createSessionCookie(idToken, {
      expiresIn: CINCO_DIAS_MS,
    });

    const response = new NextResponse(null, { status: 204 });

    response.cookies.set({
      name: "sesion",
      value: sessionCookie,
      maxAge: Math.floor(CINCO_DIAS_MS / 1000),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    return response;
  } catch (error) {
    throw new AppError(
      401,
      "No fue posible crear la sesión con el token proporcionado",
      error instanceof Error ? error.message : undefined
    );
  }
});

export const DELETE = manejar(async (request: NextRequest) => {
  verificarOrigen(request);

  const response = new NextResponse(null, { status: 204 });

  response.cookies.set({
    name: "sesion",
    value: "",
    maxAge: 0,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });

  return response;
});
