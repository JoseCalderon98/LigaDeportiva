import {
  TorneoSchema,
  EquipoSchema,
  PartidoSchema,
  GoleadorSchema,
  type Torneo,
  type Equipo,
  type Partido,
  type Goleador,
} from "@/schemas/liga";
import { z } from "zod";

/**
 * Torneo de demostración validado con Zod.
 */
export const torneoDemo: Torneo = TorneoSchema.parse({
  id: "torneo-interno-2026",
  nombre: "Torneo Interno 2026",
  temporada: "2026",
  activo: true,
});

/**
 * 6 Equipos de demostración validados con Zod.
 */
export const equiposDemo: Equipo[] = z.array(EquipoSchema).parse([
  {
    id: "eq-1",
    nombre: "Águilas Doradas",
    escudoUrl: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=128&q=80",
  },
  {
    id: "eq-2",
    nombre: "Halcones Azules",
    escudoUrl: "https://images.unsplash.com/photo-1518091043644-c1d4457512c6?w=128&q=80",
  },
  {
    id: "eq-3",
    nombre: "Leones FC",
    escudoUrl: null,
  },
  {
    id: "eq-4",
    nombre: "Pumas del Norte",
    escudoUrl: null,
  },
  {
    id: "eq-5",
    nombre: "Tiburones Rojos",
    escudoUrl: "https://images.unsplash.com/photo-1516478177764-9fe5bd7e9717?w=128&q=80",
  },
  {
    id: "eq-6",
    nombre: "Vikingos SC",
    escudoUrl: null,
  },
]);

/**
 * 12 Partidos: 10 jugados (con empates en puntos para activar criterios de desempate)
 * y 2 pendientes (`jugado: false`), validados con Zod.
 */
export const partidosDemo: Partido[] = z.array(PartidoSchema).parse([
  // Jornada 1
  {
    id: "part-1",
    localId: "eq-1",
    visitanteId: "eq-2",
    fecha: "2026-11-01T15:00:00Z",
    golesLocal: 2,
    golesVisitante: 1,
    jugado: true,
    jornada: 1,
  },
  {
    id: "part-2",
    localId: "eq-3",
    visitanteId: "eq-4",
    fecha: "2026-11-01T17:00:00Z",
    golesLocal: 3,
    golesVisitante: 2,
    jugado: true,
    jornada: 1,
  },
  {
    id: "part-3",
    localId: "eq-5",
    visitanteId: "eq-6",
    fecha: "2026-11-01T19:00:00Z",
    golesLocal: 1,
    golesVisitante: 1,
    jugado: true,
    jornada: 1,
  },
  // Jornada 2
  {
    id: "part-4",
    localId: "eq-1",
    visitanteId: "eq-3",
    fecha: "2026-11-08T15:00:00Z",
    golesLocal: 1,
    golesVisitante: 2,
    jugado: true,
    jornada: 2,
  },
  {
    id: "part-5",
    localId: "eq-2",
    visitanteId: "eq-5",
    fecha: "2026-11-08T17:00:00Z",
    golesLocal: 3,
    golesVisitante: 0,
    jugado: true,
    jornada: 2,
  },
  {
    id: "part-6",
    localId: "eq-4",
    visitanteId: "eq-6",
    fecha: "2026-11-08T19:00:00Z",
    golesLocal: 2,
    golesVisitante: 2,
    jugado: true,
    jornada: 2,
  },
  // Jornada 3
  {
    id: "part-7",
    localId: "eq-1",
    visitanteId: "eq-5",
    fecha: "2026-11-15T15:00:00Z",
    golesLocal: 4,
    golesVisitante: 1,
    jugado: true,
    jornada: 3,
  },
  {
    id: "part-8",
    localId: "eq-2",
    visitanteId: "eq-4",
    fecha: "2026-11-15T17:00:00Z",
    golesLocal: 2,
    golesVisitante: 0,
    jugado: true,
    jornada: 3,
  },
  {
    id: "part-9",
    localId: "eq-3",
    visitanteId: "eq-6",
    fecha: "2026-11-15T19:00:00Z",
    golesLocal: 0,
    golesVisitante: 1,
    jugado: true,
    jornada: 3,
  },
  // Jornada 4
  {
    id: "part-10",
    localId: "eq-4",
    visitanteId: "eq-5",
    fecha: "2026-11-22T16:00:00Z",
    golesLocal: 1,
    golesVisitante: 1,
    jugado: true,
    jornada: 4,
  },
  // Partidos pendientes (jugado: false)
  {
    id: "part-11",
    localId: "eq-1",
    visitanteId: "eq-6",
    fecha: "2026-11-28T16:00:00Z",
    golesLocal: null,
    golesVisitante: null,
    jugado: false,
    jornada: 5,
  },
  {
    id: "part-12",
    localId: "eq-2",
    visitanteId: "eq-3",
    fecha: "2026-11-28T18:00:00Z",
    golesLocal: null,
    golesVisitante: null,
    jugado: false,
    jornada: 5,
  },
]);

/**
 * Tabla de goleadores de demostración validada con Zod.
 */
export const goleadoresDemo: Goleador[] = z.array(GoleadorSchema).parse([
  {
    id: "gol-1",
    nombre: "Carlos Gómez",
    equipoId: "eq-1",
    goles: 5,
  },
  {
    id: "gol-2",
    nombre: "Mateo Silva",
    equipoId: "eq-2",
    goles: 4,
  },
  {
    id: "gol-3",
    nombre: "Lucas Benítez",
    equipoId: "eq-3",
    goles: 3,
  },
  {
    id: "gol-4",
    nombre: "Andrés Rivas",
    equipoId: "eq-6",
    goles: 2,
  },
  {
    id: "gol-5",
    nombre: "Esteban Morales",
    equipoId: "eq-4",
    goles: 2,
  },
  {
    id: "gol-6",
    nombre: "Diego Castro",
    equipoId: "eq-5",
    goles: 2,
  },
]);
