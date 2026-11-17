import type { Equipo, Partido, PosicionTabla } from "@/schemas/liga";

/**
 * Función pura que calcula la tabla de posiciones de una liga deportiva.
 *
 * Reglas de negocio:
 * 1. Recalcula siempre desde cero a partir de los partidos con `jugado === true`.
 * 2. Asigna puntuación: 3 puntos por victoria, 1 por empate, 0 por derrota.
 * 3. Calcula diferencia de goles como (goles a favor - goles en contra).
 * 4. Criterios de desempate en orden de prioridad:
 *    1º Puntos (pts) descendente.
 *    2º Diferencia de goles (dg) descendente.
 *    3º Goles a favor (gf) descendente.
 *    4º Orden alfabético por nombre de equipo ascendente.
 * 5. La posición final es un índice correlativo base 1 (1, 2, 3, ...).
 *
 * @param equipos Lista de equipos registrados en la liga.
 * @param partidos Lista de partidos registrados (jugados y pendientes).
 * @returns Lista ordenada de posiciones con las estadísticas acumuladas.
 */
export function calcularTablaPosiciones(
  equipos: readonly Equipo[],
  partidos: readonly Partido[]
): PosicionTabla[] {
  // Inicializamos un registro para cada equipo con estadísticas en cero
  const tablaMap = new Map<string, Omit<PosicionTabla, "posicion">>();

  for (const equipo of equipos) {
    tablaMap.set(equipo.id, {
      equipoId: equipo.id,
      nombre: equipo.nombre,
      escudoUrl: equipo.escudoUrl,
      pj: 0,
      pg: 0,
      pe: 0,
      pp: 0,
      gf: 0,
      gc: 0,
      dg: 0,
      pts: 0,
    });
  }

  // Procesamos únicamente los partidos completados (jugado === true)
  for (const partido of partidos) {
    if (!partido.jugado) {
      continue;
    }

    const { localId, visitanteId, golesLocal, golesVisitante } = partido;

    // Validación defensiva para goles válidos
    if (golesLocal === null || golesVisitante === null) {
      continue;
    }

    const localStats = tablaMap.get(localId);
    const visitanteStats = tablaMap.get(visitanteId);

    // Si alguno de los equipos no está en la lista de equipos, se ignora
    if (!localStats || !visitanteStats) {
      continue;
    }

    // Actualizamos partidos jugados y goles
    localStats.pj += 1;
    localStats.gf += golesLocal;
    localStats.gc += golesVisitante;
    localStats.dg = localStats.gf - localStats.gc;

    visitanteStats.pj += 1;
    visitanteStats.gf += golesVisitante;
    visitanteStats.gc += golesLocal;
    visitanteStats.dg = visitanteStats.gf - visitanteStats.gc;

    // Asignación de puntos y resultados (victoria, empate, derrota)
    if (golesLocal > golesVisitante) {
      // Gana local
      localStats.pg += 1;
      localStats.pts += 3;
      visitanteStats.pp += 1;
    } else if (golesVisitante > golesLocal) {
      // Gana visitante
      visitanteStats.pg += 1;
      visitanteStats.pts += 3;
      localStats.pp += 1;
    } else {
      // Empate
      localStats.pe += 1;
      localStats.pts += 1;
      visitanteStats.pe += 1;
      visitanteStats.pts += 1;
    }
  }

  // Ordenamiento con criterios de desempate obligatorios:
  // 1) pts descendente
  // 2) dg descendente
  // 3) gf descendente
  // 4) nombre alfabético ascendente
  const filasOrdenadas = Array.from(tablaMap.values()).sort((a, b) => {
    if (b.pts !== a.pts) {
      return b.pts - a.pts;
    }
    if (b.dg !== a.dg) {
      return b.dg - a.dg;
    }
    if (b.gf !== a.gf) {
      return b.gf - a.gf;
    }
    return a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" });
  });

  // Asignamos la posición correlativa (1..N)
  return filasOrdenadas.map((fila, index) => ({
    ...fila,
    posicion: index + 1,
  }));
}
