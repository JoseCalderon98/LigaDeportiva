"use client";

import { useState, useEffect, useCallback } from "react";
import { TablaPosiciones } from "@/components/TablaPosiciones";
import { GraficoPuntos } from "@/components/GraficoPuntos";
import type {
  Torneo,
  Equipo,
  Partido,
  PosicionTabla,
  Goleador,
} from "@/schemas/liga";

interface ApiResponse {
  torneo: Torneo;
  equipos: Equipo[];
  partidos: Partido[];
  posiciones: PosicionTabla[];
  goleadores: Goleador[];
}

export default function HomePage() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [cargando, setCargando] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const cargarDatos = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const res = await fetch("/api/torneos/demo/posiciones");
      if (!res.ok) {
        const errorBody = await res.json().catch(() => null);
        throw new Error(
          errorBody?.error ||
            `Error al cargar datos del torneo (código ${res.status})`
        );
      }
      const json: ApiResponse = await res.json();
      setData(json);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Error inesperado al conectar con el servidor."
      );
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    let ignorar = false;
    fetch("/api/torneos/demo/posiciones")
      .then(async (res) => {
        if (!res.ok) {
          const errorBody = await res.json().catch(() => null);
          throw new Error(
            errorBody?.error ||
              `Error al cargar datos del torneo (código ${res.status})`
          );
        }
        return res.json();
      })
      .then((json: ApiResponse) => {
        if (!ignorar) {
          setData(json);
          setCargando(false);
        }
      })
      .catch((err) => {
        if (!ignorar) {
          setError(
            err instanceof Error
              ? err.message
              : "Error inesperado al conectar con el servidor."
          );
          setCargando(false);
        }
      });

    return () => {
      ignorar = true;
    };
  }, []);

  return (
    <div className="w-full space-y-8">
      {/* Encabezado accesible con el único H1 de la página */}
      <section className="space-y-2">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
          Torneo Interno 2026 — Clasificación
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
          Gestión deportiva en tiempo real con recálculo automático de
          posiciones y criterios de desempate federativos.
        </p>
      </section>

      {/* Estado 1: Carga accesible con esqueleto y anuncio de estado */}
      {cargando && (
        <div
          role="status"
          aria-busy="true"
          aria-label="Cargando información del torneo y tabla de posiciones..."
          className="w-full space-y-6 animate-pulse"
        >
          <span className="sr-only">
            Cargando información del torneo y tabla de posiciones...
          </span>
          <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-1/3"></div>
          <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
          <div className="h-40 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
        </div>
      )}

      {/* Estado 2: Error accesible con mensaje y botón de reintento */}
      {!cargando && error && (
        <div
          role="alert"
          aria-labelledby="titulo-error"
          className="w-full p-6 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-center space-y-4 shadow-sm"
        >
          <h2
            id="titulo-error"
            className="text-lg font-bold text-red-800 dark:text-red-300"
          >
            No se pudo cargar la información del torneo
          </h2>
          <p className="text-sm text-red-700 dark:text-red-400 max-w-md mx-auto">
            {error}
          </p>
          <div>
            <button
              type="button"
              onClick={cargarDatos}
              className="inline-flex items-center justify-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 transition-colors cursor-pointer"
            >
              Reintentar
            </button>
          </div>
        </div>
      )}

      {/* Estado 3: Vacío (sin datos disponibles) */}
      {!cargando && !error && data && data.equipos.length === 0 && (
        <div
          role="region"
          aria-labelledby="titulo-vacio"
          className="w-full p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3 shadow-sm"
        >
          <h2
            id="titulo-vacio"
            className="text-lg font-bold text-slate-800 dark:text-slate-200"
          >
            No hay equipos registrados en el torneo
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Aún no se han configurado equipos para este torneo.
          </p>
          <div>
            <button
              type="button"
              onClick={cargarDatos}
              className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 transition-colors cursor-pointer"
            >
              Reintentar
            </button>
          </div>
        </div>
      )}

      {/* Estado 4: Éxito con contenido cargado */}
      {!cargando && !error && data && data.equipos.length > 0 && (
        <div className="space-y-12">
          {/* Componente interactivo de la tabla de posiciones con formulario */}
          <TablaPosiciones
            equiposIniciales={data.equipos}
            partidosIniciales={data.partidos}
            torneoNombre={data.torneo.nombre}
          />

          {/* Gráfico accesible de evolución de puntos por jornada (Hito 2) */}
          <GraficoPuntos
            equipos={data.equipos}
            partidos={data.partidos}
          />

          {/* Tabla accesible de goleadores */}
          {data.goleadores && data.goleadores.length > 0 && (
            <section
              aria-labelledby="titulo-goleadores"
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden"
            >
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm sm:text-base">
                  <caption className="p-4 text-left font-bold text-lg text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800">
                    Tabla de Goleadores
                  </caption>
                  <thead className="bg-slate-100 dark:bg-slate-800/80 text-xs sm:text-sm uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-center w-16">
                        #
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
                    {data.goleadores.map((g, idx) => {
                      const equipo = data.equipos.find(
                        (eq) => eq.id === g.equipoId
                      );
                      return (
                        <tr
                          key={g.id}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                        >
                          <td className="px-4 py-3 text-center font-medium">
                            {idx + 1}
                          </td>
                          <th
                            scope="row"
                            className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-slate-100"
                          >
                            {g.nombre}
                          </th>
                          <td className="px-4 py-3 text-left text-slate-600 dark:text-slate-400">
                            {equipo?.nombre ?? g.equipoId}
                          </td>
                          <td className="px-4 py-3 text-center font-bold text-blue-700 dark:text-blue-400">
                            {g.goles}
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
      )}
    </div>
  );
}
