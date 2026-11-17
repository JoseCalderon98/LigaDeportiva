import { describe, it, expect } from "vitest";
import { calcularTablaPosiciones } from "@/services/posiciones";
import type { Equipo, Partido } from "@/schemas/liga";

describe("calcularTablaPosiciones", () => {
  const equiposMock: Equipo[] = [
    { id: "eq-1", nombre: "Barcelona", escudoUrl: null },
    { id: "eq-2", nombre: "Real Madrid", escudoUrl: "https://example.com/rm.png" },
    { id: "eq-3", nombre: "Atlético", escudoUrl: null },
    { id: "eq-4", nombre: "Sevilla", escudoUrl: null },
  ];

  it("devuelve una lista vacía cuando no hay equipos", () => {
    const resultado = calcularTablaPosiciones([], []);
    expect(resultado).toEqual([]);
  });

  it("inicializa todos los equipos con 0 puntos cuando no hay partidos jugados", () => {
    const partidosPendientes: Partido[] = [
      {
        id: "p-1",
        localId: "eq-1",
        visitanteId: "eq-2",
        fecha: "2026-11-20T18:00:00Z",
        golesLocal: null,
        golesVisitante: null,
        jugado: false,
      },
    ];

    const tabla = calcularTablaPosiciones(equiposMock, partidosPendientes);

    expect(tabla).toHaveLength(4);
    for (const fila of tabla) {
      expect(fila.pj).toBe(0);
      expect(fila.pg).toBe(0);
      expect(fila.pe).toBe(0);
      expect(fila.pp).toBe(0);
      expect(fila.gf).toBe(0);
      expect(fila.gc).toBe(0);
      expect(fila.dg).toBe(0);
      expect(fila.pts).toBe(0);
    }
    // Desempate por orden alfabético cuando todo está en cero
    expect(tabla.map((f) => f.nombre)).toEqual([
      "Atlético",
      "Barcelona",
      "Real Madrid",
      "Sevilla",
    ]);
    expect(tabla.map((f) => f.posicion)).toEqual([1, 2, 3, 4]);
  });

  it("asigna 3 puntos por victoria y 0 por derrota", () => {
    const partidos: Partido[] = [
      {
        id: "p-1",
        localId: "eq-1",
        visitanteId: "eq-2",
        fecha: "2026-11-20T18:00:00Z",
        golesLocal: 2,
        golesVisitante: 0,
        jugado: true,
      },
    ];

    const tabla = calcularTablaPosiciones(equiposMock, partidos);

    const barcelona = tabla.find((f) => f.equipoId === "eq-1");
    const realMadrid = tabla.find((f) => f.equipoId === "eq-2");

    expect(barcelona).toMatchObject({
      posicion: 1,
      pj: 1,
      pg: 1,
      pe: 0,
      pp: 0,
      gf: 2,
      gc: 0,
      dg: 2,
      pts: 3,
    });

    expect(realMadrid).toMatchObject({
      pj: 1,
      pg: 0,
      pe: 0,
      pp: 1,
      gf: 0,
      gc: 2,
      dg: -2,
      pts: 0,
    });
  });

  it("asigna 1 punto a cada equipo en caso de empate", () => {
    const partidos: Partido[] = [
      {
        id: "p-1",
        localId: "eq-1",
        visitanteId: "eq-2",
        fecha: "2026-11-20T18:00:00Z",
        golesLocal: 1,
        golesVisitante: 1,
        jugado: true,
      },
    ];

    const tabla = calcularTablaPosiciones(equiposMock, partidos);

    const barcelona = tabla.find((f) => f.equipoId === "eq-1");
    const realMadrid = tabla.find((f) => f.equipoId === "eq-2");

    expect(barcelona).toMatchObject({
      pj: 1,
      pg: 0,
      pe: 1,
      pp: 0,
      gf: 1,
      gc: 1,
      dg: 0,
      pts: 1,
    });

    expect(realMadrid).toMatchObject({
      pj: 1,
      pg: 0,
      pe: 1,
      pp: 0,
      gf: 1,
      gc: 1,
      dg: 0,
      pts: 1,
    });
  });

  describe("Criterios de desempate obligatorios (Criterio de aceptación 1)", () => {
    const eqA: Equipo = { id: "a", nombre: "Zeta FC", escudoUrl: null };
    const eqB: Equipo = { id: "b", nombre: "Alfa FC", escudoUrl: null };

    it("1) Desempate por puntos (pts descendente)", () => {
      const partidos: Partido[] = [
        {
          id: "1",
          localId: "a",
          visitanteId: "b",
          fecha: "2026-11-20T18:00:00Z",
          golesLocal: 1,
          golesVisitante: 0,
          jugado: true,
        },
      ];

      const tabla = calcularTablaPosiciones([eqA, eqB], partidos);
      // Zeta FC tiene 3 pts, Alfa FC tiene 0 pts
      expect(tabla[0]?.nombre).toBe("Zeta FC");
      expect(tabla[0]?.pts).toBe(3);
      expect(tabla[1]?.nombre).toBe("Alfa FC");
      expect(tabla[1]?.pts).toBe(0);
    });

    it("2) Desempate por diferencia de goles (dg descendente) ante igualdad de puntos", () => {
      // Ambos con 3 puntos (1 victoria c/u), pero eqA tiene dg +3 y eqB tiene dg +1
      const partidos: Partido[] = [
        {
          id: "1",
          localId: "a",
          visitanteId: "c",
          fecha: "2026-11-20T18:00:00Z",
          golesLocal: 4,
          golesVisitante: 1, // eqA: +3 dg
          jugado: true,
        },
        {
          id: "2",
          localId: "b",
          visitanteId: "c",
          fecha: "2026-11-20T19:00:00Z",
          golesLocal: 2,
          golesVisitante: 1, // eqB: +1 dg
          jugado: true,
        },
      ];

      const eqC: Equipo = { id: "c", nombre: "Rival FC", escudoUrl: null };
      const tabla = calcularTablaPosiciones([eqA, eqB, eqC], partidos);

      expect(tabla[0]?.nombre).toBe("Zeta FC");
      expect(tabla[0]?.dg).toBe(3);
      expect(tabla[1]?.nombre).toBe("Alfa FC");
      expect(tabla[1]?.dg).toBe(1);
    });

    it("3) Desempate por goles a favor (gf descendente) ante igualdad de pts y dg", () => {
      // Ambos con 3 pts y dg +2:
      // eqA: gf 4, gc 2 -> dg +2
      // eqB: gf 3, gc 1 -> dg +2
      const eqC: Equipo = { id: "c", nombre: "Rival FC", escudoUrl: null };
      const partidos: Partido[] = [
        {
          id: "1",
          localId: "a",
          visitanteId: "c",
          fecha: "2026-11-20T18:00:00Z",
          golesLocal: 4,
          golesVisitante: 2,
          jugado: true,
        },
        {
          id: "2",
          localId: "b",
          visitanteId: "c",
          fecha: "2026-11-20T19:00:00Z",
          golesLocal: 3,
          golesVisitante: 1,
          jugado: true,
        },
      ];

      const tabla = calcularTablaPosiciones([eqA, eqB, eqC], partidos);

      // Zeta FC tiene gf=4 vs Alfa FC gf=3
      expect(tabla[0]?.nombre).toBe("Zeta FC");
      expect(tabla[0]?.gf).toBe(4);
      expect(tabla[1]?.nombre).toBe("Alfa FC");
      expect(tabla[1]?.gf).toBe(3);
    });

    it("4) Desempate por orden alfabético por nombre ante igualdad de pts, dg y gf", () => {
      // Ambos con idénticas estadísticas: Alfa FC debe ir primero por orden alfabético
      const eqC: Equipo = { id: "c", nombre: "Rival FC", escudoUrl: null };
      const partidos: Partido[] = [
        {
          id: "1",
          localId: "a",
          visitanteId: "c",
          fecha: "2026-11-20T18:00:00Z",
          golesLocal: 2,
          golesVisitante: 1,
          jugado: true,
        },
        {
          id: "2",
          localId: "b",
          visitanteId: "c",
          fecha: "2026-11-20T19:00:00Z",
          golesLocal: 2,
          golesVisitante: 1,
          jugado: true,
        },
      ];

      const tabla = calcularTablaPosiciones([eqA, eqB, eqC], partidos);

      expect(tabla[0]?.nombre).toBe("Alfa FC");
      expect(tabla[1]?.nombre).toBe("Zeta FC");
    });
  });

  it("ignora los partidos pendientes (jugado === false) y recalcula siempre desde cero", () => {
    const partidos: Partido[] = [
      {
        id: "p-1",
        localId: "eq-1",
        visitanteId: "eq-2",
        fecha: "2026-11-20T18:00:00Z",
        golesLocal: 3,
        golesVisitante: 0,
        jugado: true,
      },
      {
        id: "p-2",
        localId: "eq-3",
        visitanteId: "eq-4",
        fecha: "2026-11-21T18:00:00Z",
        golesLocal: null,
        golesVisitante: null,
        jugado: false,
      },
    ];

    const tabla = calcularTablaPosiciones(equiposMock, partidos);

    const atletico = tabla.find((f) => f.equipoId === "eq-3");
    const sevilla = tabla.find((f) => f.equipoId === "eq-4");

    expect(atletico?.pj).toBe(0);
    expect(sevilla?.pj).toBe(0);
  });

  it("no muta los arreglos ni los objetos de entrada (función pura)", () => {
    const equiposCopia = JSON.parse(JSON.stringify(equiposMock));
    const partidos: Partido[] = [
      {
        id: "p-1",
        localId: "eq-1",
        visitanteId: "eq-2",
        fecha: "2026-11-20T18:00:00Z",
        golesLocal: 2,
        golesVisitante: 1,
        jugado: true,
      },
    ];
    const partidosCopia = JSON.parse(JSON.stringify(partidos));

    calcularTablaPosiciones(equiposMock, partidos);

    expect(equiposMock).toEqual(equiposCopia);
    expect(partidos).toEqual(partidosCopia);
  });
});
