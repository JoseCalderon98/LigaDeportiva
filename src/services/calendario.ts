import type { Equipo, Partido } from "@/schemas/liga";

/**
 * Función pura que genera un calendario completo todos contra todos (round-robin simple).
 *
 * Reglas de negocio:
 * 1. Cada equipo juega contra todos los demás exactamente una vez (sin repetición de cruces).
 * 2. Ningún equipo juega contra sí mismo (localId !== visitanteId).
 * 3. Para N equipos, genera exactamente N * (N - 1) / 2 partidos distribuidos por jornadas.
 * 4. Si el número de equipos es impar, se gestiona automáticamente una jornada de descanso por equipo.
 * 5. Asigna fechas válidas en formato ISO 8601 a partir de fechaInicio.
 * 6. No importa React, Next.js ni Firebase (función pura y testeable).
 *
 * @param equipos Lista de equipos participantes.
 * @param fechaInicio Fecha inicial del torneo (Date o string ISO 8601).
 * @returns Lista de partidos programados (`jugado: false`).
 */
export function generarCalendarioTodosContraTodos(
  equipos: readonly Equipo[],
  fechaInicio: Date | string
): Partido[] {
  if (!equipos || equipos.length < 2) {
    return [];
  }

  const teamList: (Equipo | null)[] = [...equipos];
  // Si el número de equipos es impar, agregamos un "bye" (descanso)
  if (teamList.length % 2 !== 0) {
    teamList.push(null);
  }

  const totalEquiposVirtuales = teamList.length;
  const numJornadas = totalEquiposVirtuales - 1;
  const partidosPorJornada = totalEquiposVirtuales / 2;

  const baseDate =
    typeof fechaInicio === "string" ? new Date(fechaInicio) : new Date(fechaInicio.getTime());

  // Validación de fecha de inicio
  const fechaValida = isNaN(baseDate.getTime()) ? new Date() : baseDate;

  const partidos: Partido[] = [];
  let contadorId = 1;

  for (let jornadaIdx = 0; jornadaIdx < numJornadas; jornadaIdx++) {
    // Cada jornada se programa con una semana de separación
    const fechaJornada = new Date(
      fechaValida.getTime() + jornadaIdx * 7 * 24 * 60 * 60 * 1000
    );

    for (let matchIdx = 0; matchIdx < partidosPorJornada; matchIdx++) {
      const eq1 = teamList[matchIdx];
      const eq2 = teamList[totalEquiposVirtuales - 1 - matchIdx];

      // Ignoramos si alguno es el descanso (null)
      if (eq1 !== null && eq2 !== null) {
        // Alternar localía para equilibrar local y visitante
        const [local, visitante] =
          (jornadaIdx + matchIdx) % 2 === 0 ? [eq1, eq2] : [eq2, eq1];

        // Separar horarios de partidos dentro de la misma jornada (2 horas)
        const fechaPartido = new Date(
          fechaJornada.getTime() + matchIdx * 2 * 60 * 60 * 1000
        );

        partidos.push({
          id: `partido-gen-${contadorId++}`,
          localId: local.id,
          visitanteId: visitante.id,
          fecha: fechaPartido.toISOString(),
          golesLocal: null,
          golesVisitante: null,
          jugado: false,
          jornada: jornadaIdx + 1,
        });
      }
    }

    // Rotación circular fija para round-robin (algoritmo Berger)
    // El elemento en índice 0 permanece fijo, el resto rota
    const elementoFijo = teamList[0];
    const resto = teamList.slice(1);
    const ultimo = resto.pop();
    if (ultimo !== undefined) {
      resto.unshift(ultimo);
    }
    teamList.length = 0;
    teamList.push(elementoFijo, ...resto);
  }

  return partidos;
}
