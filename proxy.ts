import { NextResponse, type NextRequest } from "next/server";

/**
 * proxy.ts — Redirección UX para Next.js 16 (reemplazo de middleware.ts).
 *
 * NOTA DE SEGURIDAD:
 * Este archivo actúa exclusivamente como un facilitador de experiencia de usuario (UX),
 * redirigiendo a /login si no se detecta la cookie de sesión en el navegador.
 * La SEGURIDAD REAL y verificación criptográfica estricta reside en cada Route Handler
 * y Server Component a través de `requerirUsuario()`.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin")) {
    const sesion = request.cookies.get("sesion")?.value;

    if (!sesion) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
