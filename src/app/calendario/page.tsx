import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { equiposDemo, partidosDemo, goleadoresDemo } from "@/lib/datos-demo";
import { formatearFecha } from "@/lib/fechas";
import { BotonImprimir } from "@/components/BotonImprimir";
import type { Partido } from "@/schemas/liga";

export const metadata: Metadata = {
  title: "Calendario de Partidos — Liga Deportiva",
  description:
    "Calendario oficial de partidos del torneo agrupados por jornada, con resultados y tabla de goleadores.",
};

export default function CalendarioPage() {
  const equiposMap = new Map(equiposDemo.map((eq) => [eq.id, eq]));

  // Agrupamos los partidos por jornada
  const partidosPorJornada = partidosDemo.reduce<Record<number, Partido[]>>(
    (acc, partido) => {
      const jornada = partido.jornada ?? 1;
      if (!acc[jornada]) {
        acc[jornada] = [];
      }
      acc[jornada].push(partido);
      return acc;
    },
    {}
  );

  const jornadasOrdenadas = Object.keys(partidosPorJornada)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <div className="w-full space-y-10">
      {/* Encabezado con título único de página y botón de imprimir */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
            Calendario de Partidos y Goleadores
          </h1>
          <p className="mt-1 text-sm sm:text-base text-slate-600 dark:text-slate-400">
            Programación oficial de jornadas, marcadores finales y tabla de artilleros.
          </p>
        </div>
        <div>
          <BotonImprimir />
        </div>
      </div>

      {/* Partidos agrupados por jornada */}
      <section aria-labelledby="titulo-partidos" className="space-y-8">
        <h2 id="titulo-partidos" className="sr-only">
          Listado de partidos agrupados por jornada
        </h2>

        {jornadasOrdenadas.map((numJornada) => {
          const partidosJornada = partidosPorJornada[numJornada] ?? [];
          return (
            <div
              key={numJornada}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm"
            >
              <div className="bg-slate-100 dark:bg-slate-800/80 px-4 py-3 border-b border-slate-200 dark:border-slate-800">
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                  Jornada {numJornada}
                </h3>
              </div>

              <ul className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {partidosJornada.map((partido) => {
                  const local = equiposMap.get(partido.localId);
                  const visitante = equiposMap.get(partido.visitanteId);

                  return (
                    <li
                      key={partido.id}
                      className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      {/* Equipos y Marcador */}
                      <div className="flex items-center gap-3 sm:gap-6 flex-1">
                        {/* Equipo Local */}
                        <div className="flex items-center gap-2 flex-1 justify-end text-right">
                          <Link
                            href={`/equipos/${partido.localId}`}
                            className="font-semibold text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded px-1 transition-colors"
                          >
                            {local?.nombre ?? partido.localId}
                          </Link>
                          {local?.escudoUrl ? (
                            <Image
                              src={local.escudoUrl}
                              alt=""
                              width={24}
                              height={24}
                              unoptimized
                              aria-hidden="true"
                              className="w-6 h-6 rounded-full object-cover shrink-0"
                            />
                          ) : (
                            <span
                              aria-hidden="true"
                              className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-700 dark:text-slate-300 shrink-0"
                            >
                              {(local?.nombre ?? "L").charAt(0)}
                            </span>
                          )}
                        </div>

                        {/* Marcador o VS */}
                        <div className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg min-w-[72px] text-center shrink-0">
                          {partido.jugado ? (
                            <span
                              className="font-bold text-base text-slate-900 dark:text-slate-100 tracking-wider"
                              aria-label={`Resultado: ${partido.golesLocal} a ${partido.golesVisitante}`}
                            >
                              {partido.golesLocal} - {partido.golesVisitante}
                            </span>
                          ) : (
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                              VS
                            </span>
                          )}
                        </div>

                        {/* Equipo Visitante */}
                        <div className="flex items-center gap-2 flex-1 justify-start text-left">
                          {visitante?.escudoUrl ? (
                            <Image
                              src={visitante.escudoUrl}
                              alt=""
                              width={24}
                              height={24}
                              unoptimized
                              aria-hidden="true"
                              className="w-6 h-6 rounded-full object-cover shrink-0"
                            />
                          ) : (
                            <span
                              aria-hidden="true"
                              className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-700 dark:text-slate-300 shrink-0"
                            >
                              {(visitante?.nombre ?? "V").charAt(0)}
                            </span>
                          )}
                          <Link
                            href={`/equipos/${partido.visitanteId}`}
                            className="font-semibold text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded px-1 transition-colors"
                          >
                            {visitante?.nombre ?? partido.visitanteId}
                          </Link>
                        </div>
                      </div>

                      {/* Fecha y Estado */}
                      <div className="flex items-center justify-between sm:justify-end gap-3 text-xs sm:text-sm text-slate-500 dark:text-slate-400 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 dark:border-slate-800">
                        <time dateTime={partido.fecha}>
                          {formatearFecha(partido.fecha)}
                        </time>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            partido.jugado
                              ? "bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300"
                              : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                          }`}
                        >
                          {partido.jugado ? "Finalizado" : "Pendiente"}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </section>

      {/* Tabla accesible de Goleadores (RF-05) */}
      <section
        aria-labelledby="titulo-goleadores"
        className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm sm:text-base">
            <caption className="p-4 text-left font-bold text-lg text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800">
              Tabla de Goleadores del Torneo
            </caption>
            <thead className="bg-slate-100 dark:bg-slate-800/80 text-xs sm:text-sm uppercase tracking-wider text-slate-700 dark:text-slate-300">
              <tr>
                <th scope="col" className="px-4 py-3 text-center w-16">
                  Pos
                </th>
                <th scope="col" className="px-4 py-3 text-left">
                  Jugador
                </th>
                <th scope="col" className="px-4 py-3 text-left">
                  Equipo
                </th>
                <th scope="col" className="px-4 py-3 text-center w-24">
                  Goles
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
              {goleadoresDemo.map((goleador, idx) => {
                const equipo = equiposMap.get(goleador.equipoId);
                return (
                  <tr
                    key={goleador.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="px-4 py-3 text-center font-medium">
                      {idx + 1}
                    </td>
                    <th
                      scope="row"
                      className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-slate-100"
                    >
                      {goleador.nombre}
                    </th>
                    <td className="px-4 py-3 text-left text-slate-600 dark:text-slate-400">
                      <Link
                        href={`/equipos/${goleador.equipoId}`}
                        className="hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded"
                      >
                        {equipo?.nombre ?? goleador.equipoId}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-blue-700 dark:text-blue-400">
                      {goleador.goles}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
