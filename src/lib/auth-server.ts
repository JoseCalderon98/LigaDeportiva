import type { NextRequest } from "next/server";
import { getAdminAuth } from "./firebase-admin";
import { AppError } from "./errores";

export interface UsuarioSesion {
  uid: string;
  correo: string | null;
  rol: string;
}

/**
 * Valida la cabecera Origin contra el Host de la petición para mitigar ataques CSRF
 * en peticiones mutadoras (POST, PUT, DELETE, PATCH).
 */
export function verificarOrigen(request: NextRequest): void {
  const method = request.method.toUpperCase();
  if (["POST", "PUT", "DELETE", "PATCH"].includes(method)) {
    const origin = request.headers.get("origin");
    const host =
      request.headers.get("host") || request.headers.get("x-forwarded-host");

    if (origin && host) {
      try {
        const originUrl = new URL(origin);
        // Compara host (incluyendo puerto si aplica)
        if (originUrl.host !== host) {
          throw new AppError(
            403,
            "Violación de seguridad: Origen no permitido (CSRF)"
          );
        }
      } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError(403, "Encabezado de origen no válido");
      }
    }
  }
}

/**
 * Extrae y valida la identidad del usuario:
 * 1) A través de la cookie HttpOnly `sesion` usando `verifySessionCookie(cookie, true)`.
 * 2) O mediante la cabecera `Authorization: Bearer <idToken>` con `verifyIdToken(token)`.
 *
 * Lanza AppError(401) si no existe sesión válida o está revocada.
 */
export async function requerirUsuario(
  request: NextRequest
): Promise<UsuarioSesion> {
  const auth = getAdminAuth();

  // 1. Intentar validar cookie HttpOnly `sesion`
  const sesionCookie = request.cookies.get("sesion")?.value;
  if (sesionCookie) {
    try {
      const decodedClaims = await auth.verifySessionCookie(sesionCookie, true);
      return {
        uid: decodedClaims.uid,
        correo: decodedClaims.email ?? null,
        rol: (decodedClaims.rol as string) || "organizador",
      };
    } catch {
      // Cookie expirada o inválida; revisamos cabecera Authorization como fallback
    }
  }

  // 2. Intentar validar cabecera `Authorization: Bearer <token>`
  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const idToken = authHeader.substring(7).trim();
    if (idToken) {
      try {
        const decodedToken = await auth.verifyIdToken(idToken, true);
        return {
          uid: decodedToken.uid,
          correo: decodedToken.email ?? null,
          rol: (decodedToken.rol as string) || "organizador",
        };
      } catch {
        throw new AppError(401, "Token de autorización inválido o expirado");
      }
    }
  }

  throw new AppError(401, "No autenticado: Se requiere iniciar sesión");
}
