"use client";

import { useState, useMemo } from "react";
import type { Equipo, Partido } from "@/schemas/liga";

export interface GraficoPuntosProps {
  equipos: Equipo[];
  partidos: Partido[];
}

interface SerieEquipo {
  equipoId: string;
  nombre: string;
  color: string;
  puntosPorJornada: number[]; // Puntos acumulados en [J0, J1, J2, ...]
}

const PALETA_COLORES = [
  "#2563eb", // Azul fuerte (4.5:1+)
  "#dc2626", // Rojo fuerte
  "#16a34a", // Verde fuerte
  "#9333ea", // Morado fuerte
  "#ea580c", // Naranja fuerte
  "#0d9488", // Turquesa fuerte
];

export function GraficoPuntos({ equipos, partidos }: GraficoPuntosProps) {
  const [mostrarTabla, setMostrarTabla] = useState<boolean>(false);

  // Determinamos las jornadas jugadas
  const { jornadas, series, maxPuntos } = useMemo(() => {
    const partidosJugados = partidos.filter((p) => p.jugado);
    const jornadasSet = new Set<number>();

    for (const p of partidosJugados) {
      if (p.jornada !== undefined) {
        jornadasSet.add(p.jornada);
      }
    }

    const listaJornadas =
      jornadasSet.size > 0
        ? Array.from(jornadasSet).sort((a, b) => a - b)
        : [1];

    // Calculamos los puntos acumulados por jornada para cada equipo
    const seriesCalculadas: SerieEquipo[] = equipos.map((eq, idx) => {
      let acumulado = 0;
      const puntos: number[] = [0]; // Jornada 0 (inicio) siempre es 0 puntos

      for (const j of listaJornadas) {
        const partidosDeJornada = partidosJugados.filter(
          (p) =>
            p.jornada === j && (p.localId === eq.id || p.visitanteId === eq.id)
        );

        for (const p of partidosDeJornada) {
          if (p.golesLocal !== null && p.golesVisitante !== null) {
            if (p.localId === eq.id) {
              if (p.golesLocal > p.golesVisitante) acumulado += 3;
              else if (p.golesLocal === p.golesVisitante) acumulado += 1;
            } else {
              if (p.golesVisitante > p.golesLocal) acumulado += 3;
              else if (p.golesVisitante === p.golesLocal) acumulado += 1;
            }
          }
        }
        puntos.push(acumulado);
      }

      return {
        equipoId: eq.id,
        nombre: eq.nombre,
        color: PALETA_COLORES[idx % PALETA_COLORES.length] ?? "#2563eb",
        puntosPorJornada: puntos,
      };
    });

    let maxPts = 0;
    for (const s of seriesCalculadas) {
      for (const p of s.puntosPorJornada) {
        if (p > maxPts) maxPts = p;
      }
    }

    return {
      jornadas: listaJornadas,
      series: seriesCalculadas,
      maxPuntos: Math.max(maxPts, 6), // Mínimo 6 para escala visual
    };
  }, [equipos, partidos]);

  // Dimensiones del gráfico SVG
  const width = 640;
  const height = 300;
  const paddingLeft = 45;
  const paddingRight = 20;
  const paddingTop = 25;
  const paddingBottom = 40;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const totalPuntosX = jornadas.length + 1; // [J0, J1, ...]
  const getX = (stepIndex: number) =>
    paddingLeft + (stepIndex / (totalPuntosX - 1)) * chartWidth;
  const getY = (pts: number) =>
    paddingTop + chartHeight - (pts / maxPuntos) * chartHeight;

  // Marcas en eje Y
  const yTicks = [0, Math.round(maxPuntos / 2), maxPuntos];

  return (
    <section
      aria-labelledby="titulo-grafico-puntos"
      className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-7 shadow-sm space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2
            id="titulo-grafico-puntos"
            className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100"
          >
            Evolución de Puntos por Jornada
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Progreso acumulado de cada club a lo largo de las fechas disputadas.
          </p>
        </div>

        {/* Botón accesible para alternar la tabla de datos alternativa */}
        <button
          type="button"
          onClick={() => setMostrarTabla((prev) => !prev)}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 cursor-pointer"
          aria-expanded={mostrarTabla}
          aria-controls="tabla-datos-grafico"
        >
          <span>{mostrarTabla ? "Ocultar tabla" : "Ver tabla accesible"}</span>
        </button>
      </div>

      {/* Gráfico SVG accesible con contraste >= 3:1 y descripciones */}
      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto min-w-[420px] max-w-full"
          role="img"
          aria-label="Gráfico de líneas que representa la evolución de puntos acumulados por jornada de los equipos"
        >
          <title id="svg-grafico-title">
            Evolución de puntos acumulados por jornada
          </title>
          <desc id="svg-grafico-desc">
            Muestra el progreso de puntos de los equipos participantes desde la
            jornada inicial hasta la fecha actual.
          </desc>

          {/* Líneas de rejilla y valores eje Y */}
          {yTicks.map((tick) => {
            const y = getY(tick);
            return (
              <g key={tick}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="currentColor"
                  strokeDasharray="4 4"
                  className="text-slate-200 dark:text-slate-800"
                  strokeWidth="1"
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="text-[11px] font-medium fill-slate-500 dark:fill-slate-400"
                >
                  {tick}
                </text>
              </g>
            );
          })}

          {/* Etiquetas eje X */}
          <text
            x={getX(0)}
            y={height - paddingBottom + 20}
            textAnchor="middle"
            className="text-[11px] font-medium fill-slate-500 dark:fill-slate-400"
          >
            Inicio
          </text>
          {jornadas.map((j, idx) => (
            <text
              key={j}
              x={getX(idx + 1)}
              y={height - paddingBottom + 20}
              textAnchor="middle"
              className="text-[11px] font-medium fill-slate-500 dark:fill-slate-400"
            >
              J{j}
            </text>
          ))}

          {/* Ejes principales */}
          <line
            x1={paddingLeft}
            y1={paddingTop}
            x2={paddingLeft}
            y2={height - paddingBottom}
            stroke="currentColor"
            className="text-slate-300 dark:text-slate-700"
            strokeWidth="1.5"
          />
          <line
            x1={paddingLeft}
            y1={height - paddingBottom}
            x2={width - paddingRight}
            y2={height - paddingBottom}
            stroke="currentColor"
            className="text-slate-300 dark:text-slate-700"
            strokeWidth="1.5"
          />

          {/* Trazos de línea por cada equipo */}
          {series.map((serie) => {
            const pointsString = serie.puntosPorJornada
              .map((pts, i) => `${getX(i)},${getY(pts)}`)
              .join(" ");

            return (
              <g key={serie.equipoId}>
                <polyline
                  fill="none"
                  stroke={serie.color}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={pointsString}
                />
                {serie.puntosPorJornada.map((pts, i) => (
                  <circle
                    key={i}
                    cx={getX(i)}
                    cy={getY(pts)}
                    r="4"
                    fill={serie.color}
                    className="stroke-white dark:stroke-slate-900"
                    strokeWidth="1.5"
                  >
                    <title>
                      {serie.nombre}: {pts} pts (
                      {i === 0 ? "Inicio" : `Jornada ${jornadas[i - 1]}`})
                    </title>
                  </circle>
                ))}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Leyenda accesible del gráfico */}
      <ul
        aria-label="Leyenda de equipos en el gráfico"
        className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300"
      >
        {series.map((serie) => (
          <li key={serie.equipoId} className="flex items-center gap-2">
            <span
              className="w-3.5 h-3.5 rounded-full shrink-0"
              style={{ backgroundColor: serie.color }}
              aria-hidden="true"
            />
            <span>{serie.nombre}</span>
          </li>
        ))}
      </ul>

      {/* Tabla accesible alternativa (requisito WCAG 2.2 AA) */}
      {mostrarTabla && (
        <div
          id="tabla-datos-grafico"
          className="mt-4 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800"
        >
          <table className="w-full border-collapse text-left text-xs sm:text-sm">
            <caption className="p-3 text-left font-bold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
              Datos tabulares de la evolución de puntos
            </caption>
            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              <tr>
                <th scope="col" className="px-3 py-2 text-left">
                  Equipo
                </th>
                <th scope="col" className="px-3 py-2 text-center">
                  Inicio
                </th>
                {jornadas.map((j) => (
                  <th key={j} scope="col" className="px-3 py-2 text-center">
                    Jornada {j}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {series.map((s) => (
                <tr key={s.equipoId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <th
                    scope="row"
                    className="px-3 py-2 text-left font-semibold text-slate-900 dark:text-slate-100"
                  >
                    {s.nombre}
                  </th>
                  {s.puntosPorJornada.map((pts, idx) => (
                    <td key={idx} className="px-3 py-2 text-center">
                      {pts}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
