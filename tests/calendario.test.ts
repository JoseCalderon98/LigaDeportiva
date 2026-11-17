import { describe, it, expect } from "vitest";
import { generarCalendarioTodosContraTodos } from "@/services/calendario";
import { PartidoSchema, type Equipo } from "@/schemas/liga";

describe("generarCalendarioTodosContraTodos", () => {
  const equiposMock: Equipo[] = [
    { id: "eq-1", nombre: "Águilas Doradas", escudoUrl: null },
    { id: "eq-2", nombre: "Halcones Azules", escudoUrl: null },
    { id: "eq-3", nombre: "Leones FC", escudoUrl: null },
    { id: "eq-4", nombre: "Pumas del Norte", escudoUrl: null },
    { id: "eq-5", nombre: "Tiburones Rojos", escudoUrl: null },
    { id: "eq-6", nombre: "Vikingos SC", escudoUrl: null },
  ];

  it("devuelve un arreglo vacío si hay menos de 2 equipos", () => {
    expect(generarCalendarioTodosContraTodos([], "2026-11-01T15:00:00Z")).toEqual([]);
    expect(generarCalendarioTodosContraTodos([equiposMock[0]!], "2026-11-01T15:00:00Z")).toEqual([]);
  });

  it("genera exactamente N*(N-1)/2 partidos para un número par de equipos (N=6 -> 15 partidos)", () => {
    const n = equiposMock.length;
    const esperados = (n * (n - 1)) / 2; // 15
    const partidos = generarCalendarioTodosContraTodos(equiposMock, "2026-11-01T15:00:00Z");

    expect(partidos).toHaveLength(esperados);
  });

  it("genera exactamente N*(N-1)/2 partidos para un número impar de equipos (N=5 -> 10 partidos)", () => {
    const equiposImpar = equiposMock.slice(0, 5);
    const n = equiposImpar.length;
    const esperados = (n * (n - 1)) / 2; // 10
    const partidos = generarCalendarioTodosContraTodos(equiposImpar, "2026-11-01T15:00:00Z");

    expect(partidos).toHaveLength(esperados);
  });

  it("garantiza que ningún equipo juegue contra sí mismo (localId !== visitanteId)", () => {
    const partidos = generarCalendarioTodosContraTodos(equiposMock, "2026-11-01T15:00:00Z");

    for (const p of partidos) {
      expect(p.localId).not.toBe(p.visitanteId);
    }
  });

  it("no repite enfrentamientos entre ningún par de equipos (ausencia de duplicados)", () => {
    const partidos = generarCalendarioTodosContraTodos(equiposMock, "2026-11-01T15:00:00Z");
    const enfrentamientos = new Set<string>();

    for (const p of partidos) {
      const clave = [p.localId, p.visitanteId].sort().join(" vs ");
      expect(enfrentamientos.has(clave)).toBe(false);
      enfrentamientos.add(clave);
    }

    expect(enfrentamientos.size).toBe(15);
  });

  it("asigna fechas válidas en formato ISO 8601 y partidos pendientes (jugado: false)", () => {
    const fechaInicio = "2026-11-01T15:00:00Z";
    const partidos = generarCalendarioTodosContraTodos(equiposMock, fechaInicio);

    for (const p of partidos) {
      expect(p.jugado).toBe(false);
      expect(p.golesLocal).toBeNull();
      expect(p.golesVisitante).toBeNull();

      // Validación con Zod PartidoSchema
      const validacion = PartidoSchema.safeParse(p);
      expect(validacion.success).toBe(true);

      const timestamp = Date.parse(p.fecha);
      expect(isNaN(timestamp)).toBe(false);
    }
  });

  it("distribuye los partidos en jornadas correlativas con descansos adecuados", () => {
    const partidos = generarCalendarioTodosContraTodos(equiposMock, "2026-11-01T15:00:00Z");
    const jornadas = new Set(partidos.map((p) => p.jornada));

    // Para 6 equipos deben existir 5 jornadas
    expect(jornadas.size).toBe(5);
    expect(Array.from(jornadas).sort((a, b) => (a ?? 0) - (b ?? 0))).toEqual([1, 2, 3, 4, 5]);
  });
});
