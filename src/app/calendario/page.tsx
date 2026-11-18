"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatearFecha } from "@/lib/fechas";
import { BotonImprimir } from "@/components/BotonImprimir";
import type { TorneoRegistro } from "@/repositories/torneos.repo";
import type { Equipo, Partido, Goleador } from "@/schemas/liga";

interface DatosTorneo {
  torneo: TorneoRegistro;
  equipos: Equipo[];
  partidos: Partido[];
  goleadores: Goleador[];
}

export default function CalendarioPage() {
  const [torneos, setTorneos] = useState<TorneoRegistro[]>([]);
  const [torneoSeleccionadoId, setTorneoSeleccionadoId] = useState<string>("");
  const [datosTorneo, setDatosTorneo] = useState<DatosTorneo | null>(null);
  const [cargando, setCargando] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar detalles de un torneo dado
  const cargarDetallesTorneo = useCallback(async (id: string) => {
    if (!id) return;
    setCargando(true);
    setError(null);
    try {
      const res = await fetch(`/api/torneos/${id}/posiciones`);
      if (!res.ok) {
        throw new Error("No se pudo cargar el calendario del torneo.");
      }
      const data: DatosTorneo = await res.json();
      setDatosTorneo(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setCargando(false);
    }
  }, []);

  // 1. Cargar lista de torneos reales desde Firestore y el primero automáticamente
  useEffect(() => {
    let ignorar = false;
    fetch("/api/torneos?limite=20")
      .then(async (res) => {
        if (!res.ok) throw new Error("Error al obtener torneos");
        return res.json();
      })
      .then(async (data) => {
        if (ignorar) return;
        const lista: TorneoRegistro[] = data.torneos || [];
        setTorneos(lista);
        if (lista.length > 0) {
          const primerId = lista[0].id;
          setTorneoSeleccionadoId(primerId);
          try {
            const resDetalle = await fetch(`/api/torneos/${primerId}/posiciones`);
            if (resDetalle.ok) {
              const dataDetalle: DatosTorneo = await resDetalle.json();
              if (!ignorar) {
                setDatosTorneo(dataDetalle);
                setCargando(false);
              }
              return;
            }
          } catch {
            // Error manejado
          }
        }
        if (!ignorar) {
          setCargando(false);
        }
      })
      .catch((err) => {
        if (!ignorar) {
          setError(err instanceof Error ? err.message : "Error al conectar");
          setCargando(false);
        }
      });

    return () => {
      ignorar = true;
    };
  }, []);

  const handleCambiarTorneo = (nuevoId: string) => {
    setTorneoSeleccionadoId(nuevoId);
    cargarDetallesTorneo(nuevoId);
  };

  const equipos = datosTorneo?.equipos;
  const partidos = datosTorneo?.partidos;
  const goleadores = datosTorneo?.goleadores || [];

  const equiposMap = useMemo(() => {
    return new Map((equipos || []).map((eq) => [eq.id, eq]));
  }, [equipos]);

  // Agrupamos los partidos por jornada
  const partidosPorJornada = useMemo(() => {
    const lista = partidos || [];
    return lista.reduce<Record<number, Partido[]>>((acc, partido) => {
      const jornada = partido.jornada ?? 1;
      if (!acc[jornada]) {
        acc[jornada] = [];
      }
      acc[jornada].push(partido);
      return acc;
    }, {});
  }, [partidos]);

  const jornadasOrdenadas = useMemo(
    () =>
      Object.keys(partidosPorJornada)
        .map(Number)
        .sort((a, b) => a - b),
    [partidosPorJornada]
  );

  return (
    <div className="w-full space-y-10">
      {/* Encabezado con título único de página y botón de imprimir */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
            Calendario de Partidos y Goleadores
          </h1>
          <p className="mt-1 text-sm sm:text-base text-slate-600 dark:text-slate-400">
            Programación oficial de jornadas, marcadores finales y tabla de artilleros en tiempo real.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <BotonImprimir />
        </div>
      </div>

      {/* Selector de Torneos si hay más de 1 en Firebase */}
      {torneos.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm no-print">
          <label
            htmlFor="selector-torneo-calendario"
            className="text-sm font-semibold text-slate-700 dark:text-slate-300 shrink-0"
          >
            Seleccionar Torneo:
          </label>
          <select
            id="selector-torneo-calendario"
            value={torneoSeleccionadoId}
            onChange={(e) => handleCambiarTorneo(e.target.value)}
            className="flex-1 max-w-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            {torneos.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nombre} {t.temporada ? `(${t.temporada})` : ""}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Estado: Cargando */}
      {cargando && (
        <div
          role="status"
          aria-live="polite"
          className="w-full space-y-6 animate-pulse"
        >
          <span className="sr-only">Cargando partidos desde Firebase...</span>
          <div className="h-40 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
          <div className="h-40 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
        </div>
      )}

      {/* Estado: Error */}
      {!cargando && error && (
        <div
          role="alert"
          className="w-full p-6 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-center space-y-3"
        >
          <p className="text-sm font-semibold text-red-700 dark:text-red-400">
            {error}
          </p>
          <button
            type="button"
            onClick={() => cargarDetallesTorneo(torneoSeleccionadoId)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Estado: Sin torneos o sin partidos */}
      {!cargando && !error && (!partidos || partidos.length === 0) && (
        <div
          role="region"
          aria-label="Sin partidos"
          className="w-full p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-4 shadow-sm"
        >
          <div className="w-12 h-12 mx-auto rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center text-2xl font-bold">
            📅
          </div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">
            No hay partidos registrados en este torneo
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
            El torneo seleccionado aún no cuenta con un calendario generado o partidos en Firebase.
          </p>
          <div>
            <Link
              href="/admin/partidos"
              className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-colors"
            >
              Ir a administración para generar calendario
            </Link>
          </div>
        </div>
      )}

      {/* Partidos agrupados por jornada */}
      {!cargando && !error && partidos && partidos.length > 0 && (
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
      )}

      {/* Tabla accesible de Goleadores (RF-05) */}
      {!cargando && !error && goleadores.length > 0 && (
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
                {goleadores.map((goleador, idx) => {
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
      )}
    </div>
  );
}
