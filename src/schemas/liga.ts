import { z } from "zod";

const iso8601Regex =
  /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?)?$/;

/**
 * Esquema de validación para un Equipo.
 */
export const EquipoSchema = z
  .object({
    id: z.string().min(1, "El id es requerido"),
    nombre: z.string().min(1, "El nombre es requerido"),
    escudoUrl: z.string().url("El escudo debe ser una URL válida").nullable(),
  })
  .strict();

export type Equipo = z.infer<typeof EquipoSchema>;

/**
 * Esquema de validación para un Partido.
 * Incluye validaciones cruzadas:
 * - Un equipo no puede jugar contra sí mismo (localId !== visitanteId).
 * - Si el partido está marcado como jugado (jugado === true), ambos goles deben ser enteros no nulos.
 */
export const PartidoSchema = z
  .object({
    id: z.string().min(1, "El id es requerido"),
    localId: z.string().min(1, "El ID del equipo local es requerido"),
    visitanteId: z.string().min(1, "El ID del equipo visitante es requerido"),
    fecha: z.string().refine(
      (val) => iso8601Regex.test(val) && !isNaN(Date.parse(val)),
      { message: "La fecha debe estar en formato ISO 8601 válido" }
    ),
    golesLocal: z
      .number()
      .int("Los goles del local deben ser un número entero")
      .min(0, "Los goles del local no pueden ser negativos")
      .nullable(),
    golesVisitante: z
      .number()
      .int("Los goles del visitante deben ser un número entero")
      .min(0, "Los goles del visitante no pueden ser negativos")
      .nullable(),
    jugado: z.boolean(),
    jornada: z.number().int("La jornada debe ser un número entero").min(1).optional(),
  })
  .strict()
  .refine((data) => data.localId !== data.visitanteId, {
    message: "Un equipo no puede jugar contra sí mismo",
    path: ["visitanteId"],
  })
  .refine(
    (data) => {
      if (data.jugado) {
        return (
          data.golesLocal !== null &&
          Number.isInteger(data.golesLocal) &&
          data.golesLocal >= 0 &&
          data.golesVisitante !== null &&
          Number.isInteger(data.golesVisitante) &&
          data.golesVisitante >= 0
        );
      }
      return true;
    },
    {
      message: "Si el partido fue jugado, ambos goles deben ser enteros no nulos",
      path: ["jugado"],
    }
  );

export type Partido = z.infer<typeof PartidoSchema>;

/**
 * Esquema de validación para registrar o actualizar el resultado de un partido.
 */
export const ResultadoInputSchema = z
  .object({
    golesLocal: z
      .number()
      .int("Los goles del local deben ser un número entero")
      .min(0, "Los goles del local no pueden ser negativos"),
    golesVisitante: z
      .number()
      .int("Los goles del visitante deben ser un número entero")
      .min(0, "Los goles del visitante no pueden ser negativos"),
  })
  .strict();

export type ResultadoInput = z.infer<typeof ResultadoInputSchema>;

/**
 * Esquema de validación para una fila en la tabla de posiciones.
 */
export const PosicionTablaSchema = z
  .object({
    posicion: z.number().int().min(1),
    equipoId: z.string().min(1),
    nombre: z.string().min(1),
    escudoUrl: z.string().url().nullable(),
    pj: z.number().int().min(0),
    pg: z.number().int().min(0),
    pe: z.number().int().min(0),
    pp: z.number().int().min(0),
    gf: z.number().int().min(0),
    gc: z.number().int().min(0),
    dg: z.number().int(),
    pts: z.number().int().min(0),
  })
  .strict();

export type PosicionTabla = z.infer<typeof PosicionTablaSchema>;

/**
 * Esquema de validación para un Goleador del torneo.
 */
export const GoleadorSchema = z
  .object({
    id: z.string().min(1, "El id es requerido"),
    nombre: z.string().min(1, "El nombre es requerido"),
    equipoId: z.string().min(1, "El equipoId es requerido"),
    goles: z
      .number()
      .int("Los goles deben ser un número entero")
      .min(0, "Los goles no pueden ser negativos"),
  })
  .strict();

export type Goleador = z.infer<typeof GoleadorSchema>;

/**
 * Esquema de validación para el Torneo.
 */
export const TorneoSchema = z
  .object({
    id: z.string().min(1, "El id es requerido"),
    nombre: z.string().min(1, "El nombre es requerido"),
    temporada: z.string().min(1).optional(),
    activo: z.boolean().optional(),
  })
  .strict();

export type Torneo = z.infer<typeof TorneoSchema>;

