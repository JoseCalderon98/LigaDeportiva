import { describe, it, expect } from "vitest";
import {
  EquipoSchema,
  PartidoSchema,
  ResultadoInputSchema,
} from "@/schemas/liga";

describe("EquipoSchema", () => {
  it("valida un equipo válido con escudoUrl null", () => {
    const input = {
      id: "equipo-1",
      nombre: "Los Pumas",
      escudoUrl: null,
    };
    const result = EquipoSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("valida un equipo con escudoUrl válido", () => {
    const input = {
      id: "equipo-2",
      nombre: "Águilas Doradas",
      escudoUrl: "https://example.com/escudo.png",
    };
    const result = EquipoSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("rechaza si falta el nombre", () => {
    const input = {
      id: "equipo-3",
      escudoUrl: null,
    };
    const result = EquipoSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rechaza si el escudoUrl no es una URL válida", () => {
    const input = {
      id: "equipo-4",
      nombre: "Tigres",
      escudoUrl: "no-es-una-url",
    };
    const result = EquipoSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rechaza propiedades adicionales debido a .strict()", () => {
    const input = {
      id: "equipo-5",
      nombre: "Halcones",
      escudoUrl: null,
      propiedadExtra: "invalida",
    };
    const result = EquipoSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});

describe("PartidoSchema", () => {
  it("valida un partido pendiente (jugado: false) con goles null", () => {
    const input = {
      id: "partido-1",
      localId: "eq-1",
      visitanteId: "eq-2",
      fecha: "2026-11-20T18:00:00Z",
      golesLocal: null,
      golesVisitante: null,
      jugado: false,
    };
    const result = PartidoSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("valida un partido completado (jugado: true) con goles enteros", () => {
    const input = {
      id: "partido-2",
      localId: "eq-1",
      visitanteId: "eq-2",
      fecha: "2026-11-20T18:00:00Z",
      golesLocal: 3,
      golesVisitante: 1,
      jugado: true,
    };
    const result = PartidoSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("rechaza un partido donde un equipo juega contra sí mismo (localId === visitanteId)", () => {
    const input = {
      id: "partido-3",
      localId: "eq-1",
      visitanteId: "eq-1",
      fecha: "2026-11-20T18:00:00Z",
      golesLocal: null,
      golesVisitante: null,
      jugado: false,
    };
    const result = PartidoSchema.safeParse(input);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain(
        "no puede jugar contra sí mismo"
      );
    }
  });

  it("rechaza si jugado === true pero los goles son null", () => {
    const input = {
      id: "partido-4",
      localId: "eq-1",
      visitanteId: "eq-2",
      fecha: "2026-11-20T18:00:00Z",
      golesLocal: null,
      golesVisitante: 0,
      jugado: true,
    };
    const result = PartidoSchema.safeParse(input);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain(
        "ambos goles deben ser enteros no nulos"
      );
    }
  });

  it("rechaza si los goles son números negativos", () => {
    const input = {
      id: "partido-5",
      localId: "eq-1",
      visitanteId: "eq-2",
      fecha: "2026-11-20T18:00:00Z",
      golesLocal: -1,
      golesVisitante: 2,
      jugado: true,
    };
    const result = PartidoSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rechaza si los goles no son enteros", () => {
    const input = {
      id: "partido-6",
      localId: "eq-1",
      visitanteId: "eq-2",
      fecha: "2026-11-20T18:00:00Z",
      golesLocal: 1.5,
      golesVisitante: 0,
      jugado: true,
    };
    const result = PartidoSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rechaza fechas con formato ISO inválido", () => {
    const input = {
      id: "partido-7",
      localId: "eq-1",
      visitanteId: "eq-2",
      fecha: "fecha-invalida",
      golesLocal: null,
      golesVisitante: null,
      jugado: false,
    };
    const result = PartidoSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rechaza campos adicionales por .strict()", () => {
    const input = {
      id: "partido-8",
      localId: "eq-1",
      visitanteId: "eq-2",
      fecha: "2026-11-20T18:00:00Z",
      golesLocal: null,
      golesVisitante: null,
      jugado: false,
      campoInesperado: 123,
    };
    const result = PartidoSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});

describe("ResultadoInputSchema", () => {
  it("valida un resultado con goles enteros no negativos", () => {
    const input = { golesLocal: 2, golesVisitante: 0 };
    const result = ResultadoInputSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("rechaza goles negativos", () => {
    const input = { golesLocal: -1, golesVisitante: 3 };
    const result = ResultadoInputSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rechaza goles con decimales", () => {
    const input = { golesLocal: 2.5, golesVisitante: 1 };
    const result = ResultadoInputSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rechaza propiedades adicionales (.strict())", () => {
    const input = { golesLocal: 2, golesVisitante: 1, arbitro: "Perez" };
    const result = ResultadoInputSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});
