import { describe, it, expect } from "vitest";
import { GET } from "@/app/api/torneos/demo/posiciones/route";

describe("Route Handler: GET /api/torneos/demo/posiciones", () => {
  it("responde 200 con torneo, equipos, partidos, posiciones y goleadores calculados", async () => {
    const response = await GET();
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty("torneo");
    expect(body.torneo.nombre).toBe("Torneo Interno 2026");

    expect(body).toHaveProperty("equipos");
    expect(body.equipos).toHaveLength(6);

    expect(body).toHaveProperty("partidos");
    expect(body.partidos).toHaveLength(12);

    expect(body).toHaveProperty("posiciones");
    expect(body.posiciones).toHaveLength(6);
    // Verificamos que las posiciones tengan posiciones correlativas 1..6
    expect(body.posiciones.map((p: { posicion: number }) => p.posicion)).toEqual([
      1, 2, 3, 4, 5, 6,
    ]);

    expect(body).toHaveProperty("goleadores");
    expect(body.goleadores.length).toBeGreaterThan(0);
  });
});
