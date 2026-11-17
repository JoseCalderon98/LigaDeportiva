import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { PUT } from "@/app/api/torneos/[id]/partidos/[pid]/resultado/route";
import { GET as getPosiciones } from "@/app/api/torneos/[id]/posiciones/route";
import type { TorneoRegistro } from "@/repositories/torneos.repo";
import type { Equipo, Partido } from "@/schemas/liga";

// Mock del Auth de Firebase Admin
vi.mock("@/lib/firebase-admin", () => ({
  getAdminAuth: () => ({
    verifySessionCookie: vi.fn(async (cookie: string) => {
      if (cookie === "sesion-valida-organizador") {
        return { uid: "org-123", email: "organizador@liga.com", rol: "organizador" };
      }
      if (cookie === "sesion-otro-usuario") {
        return { uid: "otro-999", email: "intruso@liga.com", rol: "usuario" };
      }
      throw new Error("Sesión inválida");
    }),
    verifyIdToken: vi.fn(async (token: string) => {
      if (token === "token-organizador") {
        return { uid: "org-123", email: "organizador@liga.com", rol: "organizador" };
      }
      throw new Error("Token inválido");
    }),
  }),
  getAdminDb: vi.fn(),
}));

// Base de datos en memoria para simular el repositorio de Firestore
let torneosDb: Map<string, TorneoRegistro>;
let equiposDb: Map<string, Equipo[]>;
let partidosDb: Map<string, Partido[]>;

vi.mock("@/repositories/torneos.repo", () => ({
  TorneosRepository: {
    obtenerTorneoPorId: vi.fn(async (id: string) => {
      return torneosDb.get(id) ?? null;
    }),
    obtenerPartido: vi.fn(async (torneoId: string, partidoId: string) => {
      const partidos = partidosDb.get(torneoId) || [];
      return partidos.find((p) => p.id === partidoId) ?? null;
    }),
    actualizarResultado: vi.fn(
      async (torneoId: string, partidoId: string, gl: number, gv: number) => {
        const partidos = partidosDb.get(torneoId) || [];
        const index = partidos.findIndex((p) => p.id === partidoId);
        if (index === -1) throw new Error("Partido no encontrado");

        const actualizado: Partido = {
          ...partidos[index]!,
          golesLocal: gl,
          golesVisitante: gv,
          jugado: true,
        };
        partidos[index] = actualizado;
        return actualizado;
      }
    ),
    obtenerEquipos: vi.fn(async (torneoId: string) => {
      return equiposDb.get(torneoId) || [];
    }),
    obtenerPartidos: vi.fn(async (torneoId: string) => {
      return partidosDb.get(torneoId) || [];
    }),
    obtenerGoleadores: vi.fn(async () => []),
  },
}));

describe("Route Handler: PUT /api/torneos/[id]/partidos/[pid]/resultado", () => {
  beforeEach(() => {
    torneosDb = new Map([
      [
        "torneo-1",
        {
          id: "torneo-1",
          nombre: "Torneo Clausura",
          organizadorUid: "org-123",
          creadoEn: "2026-11-01T00:00:00Z",
        },
      ],
    ]);

    equiposDb = new Map([
      [
        "torneo-1",
        [
          { id: "eq-1", nombre: "Águilas", escudoUrl: null },
          { id: "eq-2", nombre: "Tigres", escudoUrl: null },
        ],
      ],
    ]);

    partidosDb = new Map([
      [
        "torneo-1",
        [
          {
            id: "part-1",
            localId: "eq-1",
            visitanteId: "eq-2",
            fecha: "2026-11-20T18:00:00Z",
            golesLocal: null,
            golesVisitante: null,
            jugado: false,
            jornada: 1,
          },
        ],
      ],
    ]);
  });

  it("1. Petición sin sesión -> 401 No autenticado", async () => {
    const req = new NextRequest(
      "http://localhost:3000/api/torneos/torneo-1/partidos/part-1/resultado",
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ golesLocal: 2, golesVisitante: 1 }),
      }
    );

    const res = await PUT(req, {
      params: Promise.resolve({ id: "torneo-1", pid: "part-1" }),
    });

    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toContain("No autenticado");
  });

  it("2. Petición con goles negativos o campos desconocidos -> 400 Datos inválidos", async () => {
    // Caso goles negativos
    const reqNegativo = new NextRequest(
      "http://localhost:3000/api/torneos/torneo-1/partidos/part-1/resultado",
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          cookie: "sesion=sesion-valida-organizador",
        },
        body: JSON.stringify({ golesLocal: -1, golesVisitante: 2 }),
      }
    );

    const resNegativo = await PUT(reqNegativo, {
      params: Promise.resolve({ id: "torneo-1", pid: "part-1" }),
    });

    expect(resNegativo.status).toBe(400);
    const dataNeg = await resNegativo.json();
    expect(dataNeg.error).toBe("Datos inválidos");

    // Caso campo desconocido (modo strict)
    const reqExtra = new NextRequest(
      "http://localhost:3000/api/torneos/torneo-1/partidos/part-1/resultado",
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          cookie: "sesion=sesion-valida-organizador",
        },
        body: JSON.stringify({
          golesLocal: 1,
          golesVisitante: 0,
          campoInesperado: "hacker",
        }),
      }
    );

    const resExtra = await PUT(reqExtra, {
      params: Promise.resolve({ id: "torneo-1", pid: "part-1" }),
    });

    expect(resExtra.status).toBe(400);
  });

  it("3. Usuario autenticado que NO es el organizador del torneo -> 403 Prohibido", async () => {
    const req = new NextRequest(
      "http://localhost:3000/api/torneos/torneo-1/partidos/part-1/resultado",
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          cookie: "sesion=sesion-otro-usuario", // uid otro-999 !== org-123
        },
        body: JSON.stringify({ golesLocal: 2, golesVisitante: 1 }),
      }
    );

    const res = await PUT(req, {
      params: Promise.resolve({ id: "torneo-1", pid: "part-1" }),
    });

    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toContain("No tienes permisos de organizador");
  });

  it("4. Partido o torneo inexistente -> 404 No encontrado", async () => {
    const req = new NextRequest(
      "http://localhost:3000/api/torneos/torneo-1/partidos/partido-inexistente/resultado",
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          cookie: "sesion=sesion-valida-organizador",
        },
        body: JSON.stringify({ golesLocal: 1, golesVisitante: 0 }),
      }
    );

    const res = await PUT(req, {
      params: Promise.resolve({ id: "torneo-1", pid: "partido-inexistente" }),
    });

    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.error).toContain("El partido especificado no existe");
  });

  it("5. Integración completa: Registro y corrección de marcador oficial y recálculo de tabla de posiciones -> 200", async () => {
    // Paso 1: Registrar resultado inicial (Águilas 3 - 0 Tigres)
    const req1 = new NextRequest(
      "http://localhost:3000/api/torneos/torneo-1/partidos/part-1/resultado",
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          cookie: "sesion=sesion-valida-organizador",
        },
        body: JSON.stringify({ golesLocal: 3, golesVisitante: 0 }),
      }
    );

    const res1 = await PUT(req1, {
      params: Promise.resolve({ id: "torneo-1", pid: "part-1" }),
    });
    expect(res1.status).toBe(200);

    // Verificamos tabla tras el registro: Águilas en posición 1 con 3 pts
    const reqPos1 = new NextRequest("http://localhost:3000/api/torneos/torneo-1/posiciones");
    const resPos1 = await getPosiciones(reqPos1, {
      params: Promise.resolve({ id: "torneo-1" }),
    });
    expect(resPos1.status).toBe(200);
    const dataPos1 = await resPos1.json();

    expect(dataPos1.posiciones[0].nombre).toBe("Águilas");
    expect(dataPos1.posiciones[0].pts).toBe(3);
    expect(dataPos1.posiciones[1].nombre).toBe("Tigres");
    expect(dataPos1.posiciones[1].pts).toBe(0);

    // Paso 2: Corrección oficial del marcador (Águilas 1 - 2 Tigres)
    const reqCorreccion = new NextRequest(
      "http://localhost:3000/api/torneos/torneo-1/partidos/part-1/resultado",
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          cookie: "sesion=sesion-valida-organizador",
        },
        body: JSON.stringify({ golesLocal: 1, golesVisitante: 2 }),
      }
    );

    const resCorreccion = await PUT(reqCorreccion, {
      params: Promise.resolve({ id: "torneo-1", pid: "part-1" }),
    });
    expect(resCorreccion.status).toBe(200);

    // Verificamos tabla corregida: Tigres pasa al puesto 1 con 3 pts, Águilas queda con 0 pts
    const reqPos2 = new NextRequest("http://localhost:3000/api/torneos/torneo-1/posiciones");
    const resPos2 = await getPosiciones(reqPos2, {
      params: Promise.resolve({ id: "torneo-1" }),
    });
    expect(resPos2.status).toBe(200);
    const dataPos2 = await resPos2.json();

    expect(dataPos2.posiciones[0].nombre).toBe("Tigres");
    expect(dataPos2.posiciones[0].pts).toBe(3);
    expect(dataPos2.posiciones[1].nombre).toBe("Águilas");
    expect(dataPos2.posiciones[1].pts).toBe(0);
  });
});
