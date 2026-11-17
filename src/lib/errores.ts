import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";
import crypto from "node:crypto";

/**
 * Error de aplicación estructurado para control de flujo en Route Handlers.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly detalles?: unknown;

  constructor(statusCode: number, mensaje: string, detalles?: unknown) {
    super(mensaje);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.detalles = detalles;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

type RouteHandlerContext = {
  params?: Promise<Record<string, string | string[]>>;
};

type RouteHandler = (
  request: NextRequest,
  context?: RouteHandlerContext
) => Promise<NextResponse | Response> | NextResponse | Response;

/**
 * Envoltorio común para Route Handlers que estandariza el manejo de errores:
 * - Convierte errores de Zod a 400: `{ error: "Datos inválidos", detalles: [{ campo, mensaje }] }`.
 * - Convierte AppError a su respectivo código (401, 403, 404, 409, 429).
 * - Convierte errores no controlados a 500: `{ error: "Error interno del servidor" }` sin filtrar secretos.
 * - Inyecta y registra `x-request-id` para trazabilidad segura.
 */
export function manejar(handler: RouteHandler): RouteHandler {
  return async (request: NextRequest, context?: RouteHandlerContext) => {
    const requestId =
      request.headers.get("x-request-id") || crypto.randomUUID();

    try {
      const response = await handler(request, context);
      if (response instanceof NextResponse || response instanceof Response) {
        response.headers.set("x-request-id", requestId);
      }
      return response;
    } catch (error: unknown) {
      // Error de validación Zod -> 400
      if (error instanceof ZodError) {
        const detalles = error.issues.map((issue) => ({
          campo: issue.path.join(".") || "cuerpo",
          mensaje: issue.message,
        }));

        return NextResponse.json(
          {
            error: "Datos inválidos",
            detalles,
          },
          {
            status: 400,
            headers: { "x-request-id": requestId },
          }
        );
      }

      // Error de aplicación conocido -> statusCode
      if (error instanceof AppError) {
        return NextResponse.json(
          {
            error: error.message,
            ...(error.detalles ? { detalles: error.detalles } : {}),
          },
          {
            status: error.statusCode,
            headers: { "x-request-id": requestId },
          }
        );
      }

      // Error inesperado -> 500 genérico sin revelar stack trace ni datos privados
      const mensajeSeguro =
        error instanceof Error ? error.message : "Error no identificado";
      console.error(`[RequestId: ${requestId}] Error interno no controlado:`, mensajeSeguro);

      return NextResponse.json(
        {
          error: "Error interno del servidor",
          ...(process.env.NODE_ENV !== "production"
            ? { detalles: mensajeSeguro }
            : {}),
        },
        {
          status: 500,
          headers: { "x-request-id": requestId },
        }
      );
    }
  };
}
