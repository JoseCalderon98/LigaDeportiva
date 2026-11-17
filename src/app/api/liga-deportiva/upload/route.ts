import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse, type NextRequest } from "next/server";
import { requerirUsuario } from "@/lib/auth-server";
import { manejar } from "@/lib/errores";

export const runtime = "nodejs";

/**
 * POST /api/liga-deportiva/upload
 * Endpoint de carga de escudos a Vercel Blob:
 * - Valida sesión obligatoria (401 si no está autenticado).
 * - Restringe tipos de contenido permitidos a png, jpeg, webp.
 * - Limita el tamaño máximo a 2MB.
 * - Asigna el prefijo seguro de usuario `usuarios/<uid>/`.
 */
export const POST = manejar(async (request: NextRequest) => {
  const usuario = await requerirUsuario(request);
  const body = (await request.json()) as HandleUploadBody;

  const jsonResponse = await handleUpload({
    body,
    request,
    onBeforeGenerateToken: async (pathname: string) => {
      // Prefijo seguro de usuario
      const sanitizedPath = pathname.replace(/^\/+/, "");
      return {
        allowedContentTypes: ["image/png", "image/jpeg", "image/webp"],
        maximumSizeInBytes: 2 * 1024 * 1024, // 2MB
        tokenPayload: JSON.stringify({
          userId: usuario.uid,
          destination: `usuarios/${usuario.uid}/${sanitizedPath}`,
        }),
      };
    },
    onUploadCompleted: async () => {
      // Callback opcional tras completar la subida
    },
  });

  return NextResponse.json(jsonResponse);
});
