"use client";

import { useState, useMemo, type FormEvent } from "react";
import Image from "next/image";
import type { Equipo, Partido } from "@/schemas/liga";
import { ResultadoInputSchema } from "@/schemas/liga";
import { calcularTablaPosiciones } from "@/services/posiciones";

export interface TablaPosicionesProps {
  equiposIniciales: Equipo[];
  partidosIniciales: Partido[];
  torneoNombre?: string;
  torneoId?: string;
  onResultadoGuardado?: () => void;
}

type CampoOrden = "posicion" | "pts" | "dg" | "gf";
type DireccionOrden = "asc" | "desc";

export function TablaPosiciones({
  equiposIniciales,
  partidosIniciales,
  torneoNombre = "Torneo",
  torneoId,
  onResultadoGuardado,
}: TablaPosicionesProps) {
  // Estado local para los partidos que permite simular la actualización en vivo
  const [partidos, setPartidos] = useState<Partido[]>(partidosIniciales);

  // Estado para el ordenamiento de columnas
  const [campoOrden, setCampoOrden] = useState<CampoOrden>("posicion");
  const [direccionOrden, setDireccionOrden] = useState<DireccionOrden>("asc");

  // Estado del formulario controlado para ingresar resultados
  const [partidoSeleccionadoId, setPartidoSeleccionadoId] = useState<string>(
    () => {
      // Priorizar un partido pendiente o el primero disponible
      const pendiente = partidosIniciales.find((p) => !p.jugado);
      return pendiente?.id ?? partidosIniciales[0]?.id ?? "";
    }
  );
  const [golesLocal, setGolesLocal] = useState<string>("");
  const [golesVisitante, setGolesVisitante] = useState<string>("");
  const [errores, setErrores] = useState<{
    golesLocal?: string;
    golesVisitante?: string;
  }>({});
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [anuncioLive, setAnuncioLive] = useState<string>("");

  // Mapa rápido de equipos por id para nombres y escudos
  const equiposMap = useMemo(() => {
    return new Map(equiposIniciales.map((eq) => [eq.id, eq]));
  }, [equiposIniciales]);

  // Recálculo automático de la tabla de posiciones a partir del estado de partidos
  const posicionesCalculadas = useMemo(() => {
    return calcularTablaPosiciones(equiposIniciales, partidos);
  }, [equiposIniciales, partidos]);

  // Ordenamiento interactivo de la tabla según la columna elegida
  const posicionesOrdenadas = useMemo(() => {
    const copia = [...posicionesCalculadas];
    copia.sort((a, b) => {
      let diff = 0;
      if (campoOrden === "posicion") {
        diff = a.posicion - b.posicion;
      } else if (campoOrden === "pts") {
        diff = a.pts - b.pts;
      } else if (campoOrden === "dg") {
        diff = a.dg - b.dg;
      } else if (campoOrden === "gf") {
        diff = a.gf - b.gf;
      }
      return direccionOrden === "asc" ? diff : -diff;
    });
    return copia;
  }, [posicionesCalculadas, campoOrden, direccionOrden]);

  // Manejo de cambio de orden en columnas
  const handleOrdenar = (campo: CampoOrden) => {
    if (campoOrden === campo) {
      const nuevaDireccion = direccionOrden === "asc" ? "desc" : "asc";
      setDireccionOrden(nuevaDireccion);
      setAnuncioLive(
        `Tabla ordenada por ${campo} de manera ${
          nuevaDireccion === "asc" ? "ascendente" : "descendente"
        }.`
      );
    } else {
      setCampoOrden(campo);
      // 'posicion' inicia asc, métricas competitivas inician desc
      const dirInicial: DireccionOrden = campo === "posicion" ? "asc" : "desc";
      setDireccionOrden(dirInicial);
      setAnuncioLive(
        `Tabla ordenada por ${campo} de manera ${
          dirInicial === "asc" ? "ascendente" : "descendente"
        }.`
      );
    }
  };

  const obtenerAriaSort = (
    campo: CampoOrden
  ): "ascending" | "descending" | "none" => {
    if (campoOrden !== campo) return "none";
    return direccionOrden === "asc" ? "ascending" : "descending";
  };

  // Partido actualmente seleccionado en el formulario
  const partidoSeleccionado = useMemo(() => {
    return partidos.find((p) => p.id === partidoSeleccionadoId);
  }, [partidos, partidoSeleccionadoId]);

  const nombreLocal = partidoSeleccionado
    ? equiposMap.get(partidoSeleccionado.localId)?.nombre ?? "Local"
    : "Local";
  const nombreVisitante = partidoSeleccionado
    ? equiposMap.get(partidoSeleccionado.visitanteId)?.nombre ?? "Visitante"
    : "Visitante";

  const handleCambiarPartido = (id: string) => {
    setPartidoSeleccionadoId(id);
    const seleccionado = partidos.find((p) => p.id === id);
    if (seleccionado && seleccionado.jugado) {
      setGolesLocal(
        seleccionado.golesLocal !== null ? String(seleccionado.golesLocal) : ""
      );
      setGolesVisitante(
        seleccionado.golesVisitante !== null
          ? String(seleccionado.golesVisitante)
          : ""
      );
    } else {
      setGolesLocal("");
      setGolesVisitante("");
    }
    setErrores({});
    setMensajeExito(null);
  };

  // Validación y registro de marcador simulado con Zod
  const handleGuardarMarcador = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!partidoSeleccionadoId) {
      setAnuncioLive("Error: Debe seleccionar un partido");
      return;
    }

    const numLocal = golesLocal.trim() === "" ? NaN : Number(golesLocal);
    const numVisitante =
      golesVisitante.trim() === "" ? NaN : Number(golesVisitante);

    const validacion = ResultadoInputSchema.safeParse({
      golesLocal: numLocal,
      golesVisitante: numVisitante,
    });

    if (!validacion.success) {
      const nuevosErrores: { golesLocal?: string; golesVisitante?: string } =
        {};
      for (const issue of validacion.error.issues) {
        if (issue.path[0] === "golesLocal") {
          nuevosErrores.golesLocal = issue.message;
        } else if (issue.path[0] === "golesVisitante") {
          nuevosErrores.golesVisitante = issue.message;
        }
      }
      setErrores(nuevosErrores);
      setMensajeExito(null);
      const detalle = Object.values(nuevosErrores).join(". ");
      setAnuncioLive(`Error de validación: ${detalle}`);
      return;
    }

    // Si existe torneoId, persistimos el resultado directamente a Firebase Firestore
    if (torneoId) {
      fetch(
        `/api/torneos/${torneoId}/partidos/${partidoSeleccionadoId}/resultado`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            golesLocal: validacion.data.golesLocal,
            golesVisitante: validacion.data.golesVisitante,
          }),
        }
      )
        .then(async (res) => {
          if (!res.ok) {
            const errData = await res.json().catch(() => null);
            const errorMsg =
              res.status === 401 || res.status === 403
                ? "Inicia sesión como organizador para guardar el resultado oficial en Firebase."
                : errData?.error || "Error al guardar resultado en Firebase";
            setMensajeExito(null);
            setErrores({ golesLocal: errorMsg });
            setAnuncioLive(`Aviso: ${errorMsg}`);
            return;
          }
          if (onResultadoGuardado) {
            onResultadoGuardado();
          }
        })
        .catch((err) => {
          const msg =
            err instanceof Error
              ? err.message
              : "No se pudo conectar con el servidor.";
          setErrores({ golesLocal: msg });
          setAnuncioLive(`Error: ${msg}`);
        });
    }

    // Actualizamos el partido en el estado y recalculamos la tabla en vivo
    setErrores({});
    setPartidos((prev) =>
      prev.map((p) =>
        p.id === partidoSeleccionadoId
          ? {
              ...p,
              golesLocal: validacion.data.golesLocal,
              golesVisitante: validacion.data.golesVisitante,
              jugado: true,
            }
          : p
      )
    );

    const textoExito = `Marcador registrado exitosamente: ${nombreLocal} ${validacion.data.golesLocal} - ${validacion.data.golesVisitante} ${nombreVisitante}. La tabla de posiciones se ha actualizado en vivo.`;
    setMensajeExito(textoExito);
    setAnuncioLive(textoExito);
  };

  return (
    <div className="w-full space-y-8">
      {/* Región viva para anuncios a lectores de pantalla */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {anuncioLive}
      </div>

      {/* Contenedor de la tabla con scroll horizontal accesible en móviles */}
      <div className="w-full overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <table className="w-full border-collapse text-left text-sm sm:text-base">
          <caption className="p-4 text-left font-bold text-lg text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800">
            Tabla de posiciones — {torneoNombre}
          </caption>
          <thead className="bg-slate-100 dark:bg-slate-800/80 text-xs sm:text-sm uppercase tracking-wider text-slate-700 dark:text-slate-300">
            <tr>
              <th
                scope="col"
                aria-sort={obtenerAriaSort("posicion")}
                className="px-3 py-3 text-center"
              >
                <button
                  type="button"
                  onClick={() => handleOrdenar("posicion")}
                  className="font-semibold hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded px-1 cursor-pointer"
                  aria-label={`Ordenar por Posición, actualmente ${obtenerAriaSort(
                    "posicion"
                  )}`}
                >
                  Pos
                  {campoOrden === "posicion" && (
                    <span aria-hidden="true" className="ml-1">
                      {direccionOrden === "asc" ? "▲" : "▼"}
                    </span>
                  )}
                </button>
              </th>
              <th scope="col" className="px-4 py-3 text-left">
                Equipo
              </th>
              <th scope="col" className="px-3 py-3 text-center">
                PJ
              </th>
              <th scope="col" className="px-3 py-3 text-center">
                PG
              </th>
              <th scope="col" className="px-3 py-3 text-center">
                PE
              </th>
              <th scope="col" className="px-3 py-3 text-center">
                PP
              </th>
              <th
                scope="col"
                aria-sort={obtenerAriaSort("gf")}
                className="px-3 py-3 text-center"
              >
                <button
                  type="button"
                  onClick={() => handleOrdenar("gf")}
                  className="font-semibold hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded px-1 cursor-pointer"
                  aria-label={`Ordenar por Goles a Favor, actualmente ${obtenerAriaSort(
                    "gf"
                  )}`}
                >
                  GF
                  {campoOrden === "gf" && (
                    <span aria-hidden="true" className="ml-1">
                      {direccionOrden === "asc" ? "▲" : "▼"}
                    </span>
                  )}
                </button>
              </th>
              <th scope="col" className="px-3 py-3 text-center">
                GC
              </th>
              <th
                scope="col"
                aria-sort={obtenerAriaSort("dg")}
                className="px-3 py-3 text-center"
              >
                <button
                  type="button"
                  onClick={() => handleOrdenar("dg")}
                  className="font-semibold hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded px-1 cursor-pointer"
                  aria-label={`Ordenar por Diferencia de Goles, actualmente ${obtenerAriaSort(
                    "dg"
                  )}`}
                >
                  DG
                  {campoOrden === "dg" && (
                    <span aria-hidden="true" className="ml-1">
                      {direccionOrden === "asc" ? "▲" : "▼"}
                    </span>
                  )}
                </button>
              </th>
              <th
                scope="col"
                aria-sort={obtenerAriaSort("pts")}
                className="px-3 py-3 text-center"
              >
                <button
                  type="button"
                  onClick={() => handleOrdenar("pts")}
                  className="font-bold hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded px-1 text-blue-700 dark:text-blue-400 cursor-pointer"
                  aria-label={`Ordenar por Puntos, actualmente ${obtenerAriaSort(
                    "pts"
                  )}`}
                >
                  Pts
                  {campoOrden === "pts" && (
                    <span aria-hidden="true" className="ml-1">
                      {direccionOrden === "asc" ? "▲" : "▼"}
                    </span>
                  )}
                </button>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
            {posicionesOrdenadas.length === 0 ? (
              <tr>
                <td
                  colSpan={10}
                  className="px-4 py-8 text-center text-slate-500 dark:text-slate-400"
                >
                  No hay equipos registrados en el torneo.
                </td>
              </tr>
            ) : (
              posicionesOrdenadas.map((fila) => (
                <tr
                  key={fila.equipoId}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <td className="px-3 py-3 text-center font-medium">
                    {fila.posicion}
                  </td>
                  <th
                    scope="row"
                    className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-slate-100"
                  >
                    <div className="flex items-center gap-2.5">
                      {fila.escudoUrl ? (
                        <Image
                          src={fila.escudoUrl}
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
                          className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold shrink-0 text-slate-700 dark:text-slate-300"
                        >
                          {fila.nombre.charAt(0)}
                        </span>
                      )}
                      <span>{fila.nombre}</span>
                    </div>
                  </th>
                  <td className="px-3 py-3 text-center">{fila.pj}</td>
                  <td className="px-3 py-3 text-center">{fila.pg}</td>
                  <td className="px-3 py-3 text-center">{fila.pe}</td>
                  <td className="px-3 py-3 text-center">{fila.pp}</td>
                  <td className="px-3 py-3 text-center">{fila.gf}</td>
                  <td className="px-3 py-3 text-center">{fila.gc}</td>
                  <td className="px-3 py-3 text-center">
                    {fila.dg > 0 ? `+${fila.dg}` : fila.dg}
                  </td>
                  <td className="px-3 py-3 text-center font-bold text-blue-700 dark:text-blue-400">
                    {fila.pts}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Formulario controlado accesible para registrar/actualizar marcadores */}
      <section
        aria-labelledby="titulo-simulador"
        className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-4 sm:p-6 shadow-sm"
      >
        <h2
          id="titulo-simulador"
          className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 mb-2"
        >
          Registrar resultado en vivo
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
          Actualiza o registra el marcador de un partido para comprobar el
          recálculo automático y los criterios de desempate en la tabla de
          posiciones.
        </p>

        <form onSubmit={handleGuardarMarcador} noValidate className="space-y-5">
          {/* Selector de partido */}
          <div>
            <label
              htmlFor="selector-partido"
              className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1"
            >
              Seleccionar partido:
            </label>
            <select
              id="selector-partido"
              value={partidoSeleccionadoId}
              onChange={(e) => handleCambiarPartido(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              {partidos.map((p) => {
                const local = equiposMap.get(p.localId)?.nombre ?? p.localId;
                const visitante =
                  equiposMap.get(p.visitanteId)?.nombre ?? p.visitanteId;
                const estado = p.jugado
                  ? `(Finalizado: ${p.golesLocal} - ${p.golesVisitante})`
                  : "(Pendiente)";
                return (
                  <option key={p.id} value={p.id}>
                    {local} vs {visitante} {estado}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Entradas numéricas de goles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="input-goles-local"
                className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1"
              >
                Goles de {nombreLocal}:
              </label>
              <input
                id="input-goles-local"
                type="number"
                min="0"
                step="1"
                value={golesLocal}
                onChange={(e) => setGolesLocal(e.target.value)}
                aria-describedby={
                  errores.golesLocal ? "error-goles-local" : undefined
                }
                aria-invalid={!!errores.golesLocal}
                className={`w-full rounded-lg border px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 shadow-sm focus-visible:outline-none focus-visible:ring-2 ${
                  errores.golesLocal
                    ? "border-red-500 focus-visible:ring-red-500"
                    : "border-slate-300 dark:border-slate-700 focus-visible:ring-blue-600"
                }`}
                placeholder="Ej. 2"
              />
              {errores.golesLocal && (
                <p
                  id="error-goles-local"
                  role="alert"
                  className="mt-1 text-sm font-medium text-red-600 dark:text-red-400"
                >
                  {errores.golesLocal}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="input-goles-visitante"
                className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1"
              >
                Goles de {nombreVisitante}:
              </label>
              <input
                id="input-goles-visitante"
                type="number"
                min="0"
                step="1"
                value={golesVisitante}
                onChange={(e) => setGolesVisitante(e.target.value)}
                aria-describedby={
                  errores.golesVisitante ? "error-goles-visitante" : undefined
                }
                aria-invalid={!!errores.golesVisitante}
                className={`w-full rounded-lg border px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 shadow-sm focus-visible:outline-none focus-visible:ring-2 ${
                  errores.golesVisitante
                    ? "border-red-500 focus-visible:ring-red-500"
                    : "border-slate-300 dark:border-slate-700 focus-visible:ring-blue-600"
                }`}
                placeholder="Ej. 1"
              />
              {errores.golesVisitante && (
                <p
                  id="error-goles-visitante"
                  role="alert"
                  className="mt-1 text-sm font-medium text-red-600 dark:text-red-400"
                >
                  {errores.golesVisitante}
                </p>
              )}
            </div>
          </div>

          {/* Botón de acción */}
          <div>
            <button
              type="submit"
              className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 cursor-pointer"
            >
              Guardar resultado
            </button>
          </div>

          {/* Mensaje visual de éxito */}
          {mensajeExito && (
            <div
              role="status"
              className="p-3.5 rounded-lg bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-300 text-sm font-medium"
            >
              {mensajeExito}
            </div>
          )}
        </form>
      </section>
    </div>
  );
}
