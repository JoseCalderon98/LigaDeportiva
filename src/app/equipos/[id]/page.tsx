import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { equiposDemo, partidosDemo } from "@/lib/datos-demo";
import { calcularTablaPosiciones } from "@/services/posiciones";
import { formatearFecha } from "@/lib/fechas";

interface EquipoPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: EquipoPageProps): Promise<Metadata> {
  const { id } = await params;
  const equipo = equiposDemo.find((eq) => eq.id === id);

  if (!equipo) {
    return {
      title: "Equipo no encontrado — Liga Deportiva",
    };
  }

  return {
    title: `${equipo.nombre} — Estadísticas y Partidos`,
    description: `Estadísticas, posición actual en la tabla e historial de partidos de ${equipo.nombre}.`,
  };
}

export default async function EquipoPage({ params }: EquipoPageProps) {
  const { id } = await params;
  const equipo = equiposDemo.find((eq) => eq.id === id);

  if (!equipo) {
    notFound();
  }

  // Calculamos la tabla para obtener la posición y estadísticas actuales
  const tablaPosiciones = calcularTablaPosiciones(equiposDemo, partidosDemo);
  const estadisticas = tablaPosiciones.find((f) => f.equipoId === id);

  const equiposMap = new Map(equiposDemo.map((eq) => [eq.id, eq]));

  // Historial de partidos en los que participa este equipo
  const partidosEquipo = partidosDemo.filter(
    (p) => p.localId === id || p.visitanteId === id
  );

  const partidosJugados = partidosEquipo.filter((p) => p.jugado);
  const partidosProximos = partidosEquipo.filter((p) => !p.jugado);

  return (
    <div className="w-full space-y-10">
      {/* Navegación de migas de pan accesible */}
      <nav aria-label="Migas de pan" className="text-sm text-slate-500 dark:text-slate-400">
        <ol className="flex items-center gap-2">
          <li>
            <Link
              href="/"
              className="hover:text-blue-600 dark:hover:text-blue-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded px-1"
            >
              Tabla general
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="font-semibold text-slate-900 dark:text-slate-100">
            {equipo.nombre}
          </li>
        </ol>
      </nav>

      {/* Cabecera del equipo con escudo e información principal */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-6 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        {equipo.escudoUrl ? (
          <Image
            src={equipo.escudoUrl}
            alt=""
            width={80}
            height={80}
            unoptimized
            aria-hidden="true"
            className="w-20 h-20 rounded-full object-cover shrink-0 border-2 border-slate-200 dark:border-slate-700 shadow"
          />
        ) : (
          <div
            aria-hidden="true"
            className="w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 font-extrabold text-3xl flex items-center justify-center shrink-0 border-2 border-blue-200 dark:border-blue-800"
          >
            {equipo.nombre.charAt(0)}
          </div>
        )}

        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-50">
              {equipo.nombre}
            </h1>
            {estadisticas && (
              <span className="px-3 py-1 bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 font-bold text-sm rounded-full">
                Posición #{estadisticas.posicion}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Participante del Torneo Interno 2026
          </p>
        </div>
      </div>

      {/* Métricas y Estadísticas en la tabla de posiciones */}
      {estadisticas && (
        <section aria-labelledby="titulo-estadisticas" className="space-y-4">
          <h2
            id="titulo-estadisticas"
            className="text-xl font-bold text-slate-900 dark:text-slate-100"
          >
            Estadísticas en el Torneo
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center shadow-xs">
              <span className="block text-xs uppercase font-semibold text-slate-500 dark:text-slate-400">
                Puntos
              </span>
              <span className="block text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
                {estadisticas.pts}
              </span>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center shadow-xs">
              <span className="block text-xs uppercase font-semibold text-slate-500 dark:text-slate-400">
                PJ
              </span>
              <span className="block text-2xl font-bold text-slate-800 dark:text-slate-200 mt-1">
                {estadisticas.pj}
              </span>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center shadow-xs">
              <span className="block text-xs uppercase font-semibold text-slate-500 dark:text-slate-400">
                PG
              </span>
              <span className="block text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                {estadisticas.pg}
              </span>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center shadow-xs">
              <span className="block text-xs uppercase font-semibold text-slate-500 dark:text-slate-400">
                PE
              </span>
              <span className="block text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                {estadisticas.pe}
              </span>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center shadow-xs">
              <span className="block text-xs uppercase font-semibold text-slate-500 dark:text-slate-400">
                PP
              </span>
              <span className="block text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
                {estadisticas.pp}
              </span>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center shadow-xs">
              <span className="block text-xs uppercase font-semibold text-slate-500 dark:text-slate-400">
                GF
              </span>
              <span className="block text-2xl font-bold text-slate-800 dark:text-slate-200 mt-1">
                {estadisticas.gf}
              </span>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center shadow-xs">
              <span className="block text-xs uppercase font-semibold text-slate-500 dark:text-slate-400">
                GC
              </span>
              <span className="block text-2xl font-bold text-slate-800 dark:text-slate-200 mt-1">
                {estadisticas.gc}
              </span>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center shadow-xs">
              <span className="block text-xs uppercase font-semibold text-slate-500 dark:text-slate-400">
                DG
              </span>
              <span className="block text-2xl font-bold text-slate-800 dark:text-slate-200 mt-1">
                {estadisticas.dg > 0 ? `+${estadisticas.dg}` : estadisticas.dg}
              </span>
            </div>
          </div>
        </section>
      )}

      {/* Partidos Jugados */}
      <section aria-labelledby="titulo-jugados" className="space-y-4">
        <h2
          id="titulo-jugados"
          className="text-xl font-bold text-slate-900 dark:text-slate-100"
        >
          Resultados Recientes
        </h2>
        {partidosJugados.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Aún no ha disputado partidos en este torneo.
          </p>
        ) : (
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {partidosJugados.map((p) => {
                const rivalId = p.localId === id ? p.visitanteId : p.localId;
                const rival = equiposMap.get(rivalId);
                const esLocal = p.localId === id;
                const golesPropio = esLocal ? p.golesLocal : p.golesVisitante;
                const golesRival = esLocal ? p.golesVisitante : p.golesLocal;

                let estadoResultado = "Empate";
                let badgeColor =
                  "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300";

                if (
                  golesPropio !== null &&
                  golesRival !== null &&
                  golesPropio > golesRival
                ) {
                  estadoResultado = "Victoria";
                  badgeColor =
                    "bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300";
                } else if (
                  golesPropio !== null &&
                  golesRival !== null &&
                  golesPropio < golesRival
                ) {
                  estadoResultado = "Derrota";
                  badgeColor =
                    "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300";
                }

                return (
                  <li
                    key={p.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-2.5 py-1 text-xs font-bold rounded-md ${badgeColor}`}
                      >
                        {estadoResultado}
                      </span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {esLocal ? "Local vs " : "Visitante ante "}
                        <Link
                          href={`/equipos/${rivalId}`}
                          className="hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded"
                        >
                          {rival?.nombre ?? rivalId}
                        </Link>
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-sm">
                      <span className="font-mono font-bold text-base text-slate-900 dark:text-slate-100">
                        {p.golesLocal} - {p.golesVisitante}
                      </span>
                      <time dateTime={p.fecha} className="text-slate-500 dark:text-slate-400 text-xs">
                        {formatearFecha(p.fecha)}
                      </time>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </section>

      {/* Partidos Próximos */}
      <section aria-labelledby="titulo-proximos" className="space-y-4">
        <h2
          id="titulo-proximos"
          className="text-xl font-bold text-slate-900 dark:text-slate-100"
        >
          Próximos Encuentros
        </h2>
        {partidosProximos.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            No tiene partidos pendientes programados.
          </p>
        ) : (
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {partidosProximos.map((p) => {
                const rivalId = p.localId === id ? p.visitanteId : p.localId;
                const rival = equiposMap.get(rivalId);
                const esLocal = p.localId === id;

                return (
                  <li
                    key={p.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {esLocal ? "Local" : "Visitante"}
                      </span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        vs{" "}
                        <Link
                          href={`/equipos/${rivalId}`}
                          className="hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded"
                        >
                          {rival?.nombre ?? rivalId}
                        </Link>
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                      <span>Jornada {p.jornada ?? "?"}</span>
                      <span>•</span>
                      <time dateTime={p.fecha}>{formatearFecha(p.fecha)}</time>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}
