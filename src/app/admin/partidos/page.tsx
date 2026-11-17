"use client";

import { useState, useEffect, useCallback, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { TorneoRegistro } from "@/repositories/torneos.repo";
import type { Equipo, Partido } from "@/schemas/liga";
import { formatearFecha } from "@/lib/fechas";

export default function AdminPartidosPage() {
  const router = useRouter();

  // Estados de autenticación
  const [usuario, setUsuario] = useState<{ uid: string; correo: string | null; rol: string } | null>(null);
  const [verificandoAuth, setVerificandoAuth] = useState<boolean>(true);

  // Estados de datos
  const [torneos, setTorneos] = useState<TorneoRegistro[]>([]);
  const [torneoSeleccionadoId, setTorneoSeleccionadoId] = useState<string>("");
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [partidos, setPartidos] = useState<Partido[]>([]);

  // Estados de formularios
  const [nuevoTorneoNombre, setNuevoTorneoNombre] = useState<string>("");
  const [nuevoTorneoTemporada, setNuevoTorneoTemporada] = useState<string>("2026");

  const [nuevoEquipoNombre, setNuevoEquipoNombre] = useState<string>("");
  const [nuevoEquipoEscudo, setNuevoEquipoEscudo] = useState<string>("");

  const [partidoEditarId, setPartidoEditarId] = useState<string>("");
  const [golesLocal, setGolesLocal] = useState<string>("");
  const [golesVisitante, setGolesVisitante] = useState<string>("");

  // Estados de feedback y accesibilidad
  const [mensaje, setMensaje] = useState<{ tipo: "exito" | "error"; texto: string } | null>(null);
  const [anuncioLive, setAnuncioLive] = useState<string>("");
  const [procesando, setProcesando] = useState<boolean>(false);

  // 1. Verificar sesión de usuario
  useEffect(() => {
    let ignore = false;
    fetch("/api/auth/yo")
      .then(async (res) => {
        if (!res.ok) {
          throw new Error("No autenticado");
        }
        return res.json();
      })
      .then((data) => {
        if (!ignore) {
          setUsuario(data.usuario);
          setVerificandoAuth(false);
        }
      })
      .catch(() => {
        if (!ignore) {
          router.push("/login?redirect=/admin/partidos");
        }
      });

    return () => {
      ignore = true;
    };
  }, [router]);

  // 2. Cargar torneos
  const cargarTorneos = useCallback(async () => {
    try {
      const res = await fetch("/api/torneos?limite=20");
      if (res.ok) {
        const data = await res.json();
        setTorneos(data.torneos || []);
        if (data.torneos && data.torneos.length > 0 && !torneoSeleccionadoId) {
          setTorneoSeleccionadoId(data.torneos[0].id);
        }
      }
    } catch {
      // Manejo silencioso en carga inicial
    }
  }, [torneoSeleccionadoId]);

  useEffect(() => {
    if (!usuario) return;
    let ignore = false;
    fetch("/api/torneos?limite=20")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!ignore && data?.torneos) {
          setTorneos(data.torneos);
          if (data.torneos.length > 0 && !torneoSeleccionadoId) {
            setTorneoSeleccionadoId(data.torneos[0].id);
          }
        }
      })
      .catch(() => {});

    return () => {
      ignore = true;
    };
  }, [usuario, torneoSeleccionadoId]);

  // 3. Cargar equipos y partidos del torneo seleccionado
  const cargarDetallesTorneo = useCallback(async (id: string) => {
    if (!id) return;
    try {
      const res = await fetch(`/api/torneos/${id}/posiciones`);
      if (res.ok) {
        const data = await res.json();
        setEquipos(data.equipos || []);
        setPartidos(data.partidos || []);
      }
    } catch {
      // Ignorar si falla la carga
    }
  }, []);

  useEffect(() => {
    if (!torneoSeleccionadoId) return;
    let ignore = false;
    fetch(`/api/torneos/${torneoSeleccionadoId}/posiciones`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!ignore && data) {
          setEquipos(data.equipos || []);
          setPartidos(data.partidos || []);
        }
      })
      .catch(() => {});

    return () => {
      ignore = true;
    };
  }, [torneoSeleccionadoId]);

  // Manejador de cierre de sesión
  const handleCerrarSesion = async () => {
    await fetch("/api/auth/sesion", { method: "DELETE" });
    router.push("/login");
    router.refresh();
  };

  // Crear Torneo
  const handleCrearTorneo = async (e: FormEvent) => {
    e.preventDefault();
    if (!nuevoTorneoNombre.trim()) return;
    setProcesando(true);
    setMensaje(null);

    try {
      const res = await fetch("/api/torneos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nuevoTorneoNombre.trim(),
          temporada: nuevoTorneoTemporada.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || "Error al crear torneo");
      }

      const creado = await res.json();
      setNuevoTorneoNombre("");
      setMensaje({ tipo: "exito", texto: `Torneo "${creado.nombre}" creado exitosamente.` });
      setAnuncioLive(`Torneo ${creado.nombre} creado.`);
      await cargarTorneos();
      setTorneoSeleccionadoId(creado.id);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error inesperado";
      setMensaje({ tipo: "error", texto: msg });
      setAnuncioLive(`Error: ${msg}`);
    } finally {
      setProcesando(false);
    }
  };

  // Agregar Equipo
  const handleAgregarEquipo = async (e: FormEvent) => {
    e.preventDefault();
    if (!torneoSeleccionadoId || !nuevoEquipoNombre.trim()) return;
    setProcesando(true);
    setMensaje(null);

    try {
      const res = await fetch(`/api/torneos/${torneoSeleccionadoId}/equipos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nuevoEquipoNombre.trim(),
          escudoUrl: nuevoEquipoEscudo.trim() || null,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || "Error al agregar equipo");
      }

      const equipoCreado = await res.json();
      setNuevoEquipoNombre("");
      setNuevoEquipoEscudo("");
      setMensaje({ tipo: "exito", texto: `Equipo "${equipoCreado.nombre}" agregado con éxito.` });
      setAnuncioLive(`Equipo ${equipoCreado.nombre} registrado.`);
      await cargarDetallesTorneo(torneoSeleccionadoId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al registrar equipo";
      setMensaje({ tipo: "error", texto: msg });
      setAnuncioLive(`Error: ${msg}`);
    } finally {
      setProcesando(false);
    }
  };

  // Generar Calendario
  const handleGenerarCalendario = async () => {
    if (!torneoSeleccionadoId) return;
    if (equipos.length < 2) {
      setMensaje({ tipo: "error", texto: "Se requieren al menos 2 equipos para generar el calendario." });
      return;
    }

    setProcesando(true);
    setMensaje(null);

    try {
      const res = await fetch(`/api/torneos/${torneoSeleccionadoId}/calendario`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fechaInicio: new Date().toISOString(),
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || "Error al generar calendario");
      }

      const data = await res.json();
      setMensaje({
        tipo: "exito",
        texto: `Calendario round-robin generado con ${data.partidos.length} partidos.`,
      });
      setAnuncioLive(`Calendario de ${data.partidos.length} partidos generado.`);
      await cargarDetallesTorneo(torneoSeleccionadoId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al generar calendario";
      setMensaje({ tipo: "error", texto: msg });
      setAnuncioLive(`Error: ${msg}`);
    } finally {
      setProcesando(false);
    }
  };

  // Actualizar Resultado Oficial
  const handleGuardarResultado = async (e: FormEvent) => {
    e.preventDefault();
    if (!torneoSeleccionadoId || !partidoEditarId) return;

    setProcesando(true);
    setMensaje(null);

    try {
      const res = await fetch(
        `/api/torneos/${torneoSeleccionadoId}/partidos/${partidoEditarId}/resultado`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            golesLocal: Number(golesLocal),
            golesVisitante: Number(golesVisitante),
          }),
        }
      );

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || "Error al actualizar resultado");
      }

      setMensaje({ tipo: "exito", texto: "Resultado oficial guardado y tabla de posiciones actualizada." });
      setAnuncioLive("Marcador actualizado con éxito.");
      await cargarDetallesTorneo(torneoSeleccionadoId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al guardar resultado";
      setMensaje({ tipo: "error", texto: msg });
      setAnuncioLive(`Error: ${msg}`);
    } finally {
      setProcesando(false);
    }
  };

  if (verificandoAuth) {
    return (
      <div className="py-20 text-center" role="status" aria-busy="true">
        <span className="sr-only">Verificando sesión...</span>
        <p className="text-slate-500">Cargando credenciales de organizador...</p>
      </div>
    );
  }

  const equiposMap = new Map(equipos.map((eq) => [eq.id, eq]));

  return (
    <div className="w-full space-y-10">
      {/* Región live para accesibilidad */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {anuncioLive}
      </div>

      {/* Encabezado del Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
            Panel de Organización Deportiva
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Conectado como <strong className="text-slate-900 dark:text-slate-200">{usuario?.correo || usuario?.uid}</strong>
          </p>
        </div>
        <button
          type="button"
          onClick={handleCerrarSesion}
          className="px-4 py-2 text-sm font-semibold text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors focus-visible:ring-2 focus-visible:ring-red-500"
        >
          Cerrar sesión
        </button>
      </div>

      {/* Alerta de feedback general */}
      {mensaje && (
        <div
          role={mensaje.tipo === "error" ? "alert" : "status"}
          className={`p-4 rounded-xl text-sm font-medium border ${
            mensaje.tipo === "exito"
              ? "bg-green-50 text-green-800 border-green-200 dark:bg-green-950/40 dark:text-green-300 dark:border-green-800"
              : "bg-red-50 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800"
          }`}
        >
          {mensaje.texto}
        </div>
      )}

      {/* Sección 1: Selección y Creación de Torneos */}
      <section aria-labelledby="titulo-torneos" className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
          <h2 id="titulo-torneos" className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Torneo Activo
          </h2>
          {torneos.length === 0 ? (
            <p className="text-sm text-slate-500">No hay torneos registrados. Crea uno a continuación.</p>
          ) : (
            <div>
              <label htmlFor="select-torneo-admin" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Seleccionar torneo:
              </label>
              <select
                id="select-torneo-admin"
                value={torneoSeleccionadoId}
                onChange={(e) => setTorneoSeleccionadoId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-sm text-slate-900 dark:text-slate-100 focus-visible:ring-2 focus-visible:ring-blue-600"
              >
                {torneos.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nombre} ({t.temporada || "2026"})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <form
          onSubmit={handleCrearTorneo}
          className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4"
        >
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Crear Nuevo Torneo</h2>
          <div>
            <label htmlFor="input-nombre-torneo" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nombre del torneo:
            </label>
            <input
              id="input-nombre-torneo"
              type="text"
              required
              value={nuevoTorneoNombre}
              onChange={(e) => setNuevoTorneoNombre(e.target.value)}
              placeholder="Ej. Torneo Apertura 2026"
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-sm text-slate-900 dark:text-slate-100"
            />
          </div>
          <div>
            <label htmlFor="input-temp-torneo" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Temporada:
            </label>
            <input
              id="input-temp-torneo"
              type="text"
              value={nuevoTorneoTemporada}
              onChange={(e) => setNuevoTorneoTemporada(e.target.value)}
              placeholder="2026"
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-sm text-slate-900 dark:text-slate-100"
            />
          </div>
          <button
            type="submit"
            disabled={procesando}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50"
          >
            {procesando ? "Guardando..." : "Registrar torneo"}
          </button>
        </form>
      </section>

      {/* Sección 2: Gestión de Equipos y Calendario */}
      {torneoSeleccionadoId && (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <form
            onSubmit={handleAgregarEquipo}
            className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4"
          >
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Inscribir Equipo</h2>
            <div>
              <label htmlFor="input-equipo-nombre" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nombre del club:
              </label>
              <input
                id="input-equipo-nombre"
                type="text"
                required
                value={nuevoEquipoNombre}
                onChange={(e) => setNuevoEquipoNombre(e.target.value)}
                placeholder="Ej. Deportivo Central"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-sm text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label htmlFor="input-equipo-escudo" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                URL del escudo (opcional):
              </label>
              <input
                id="input-equipo-escudo"
                type="url"
                value={nuevoEquipoEscudo}
                onChange={(e) => setNuevoEquipoEscudo(e.target.value)}
                placeholder="https://..."
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-sm text-slate-900 dark:text-slate-100"
              />
            </div>
            <button
              type="submit"
              disabled={procesando}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50"
            >
              Agregar equipo
            </button>
          </form>

          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Equipos Inscritos ({equipos.length})
            </h2>
            {equipos.length === 0 ? (
              <p className="text-sm text-slate-500">No hay equipos en este torneo.</p>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800 max-h-48 overflow-y-auto">
                {equipos.map((eq) => (
                  <li key={eq.id} className="py-2 text-sm font-medium text-slate-800 dark:text-slate-200">
                    {eq.nombre}
                  </li>
                ))}
              </ul>
            )}

            <div className="pt-2">
              <button
                type="button"
                onClick={handleGenerarCalendario}
                disabled={procesando || equipos.length < 2}
                className="w-full px-4 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-slate-300 text-white font-semibold text-sm rounded-lg shadow-sm transition-colors"
              >
                Generar Calendario Round-Robin
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Sección 3: Captura de Resultados Oficiales */}
      {torneoSeleccionadoId && partidos.length > 0 && (
        <section className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Registrar o Corregir Marcador Oficial
          </h2>

          <form onSubmit={handleGuardarResultado} className="space-y-4 max-w-xl">
            <div>
              <label htmlFor="select-partido-admin" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Seleccionar partido:
              </label>
              <select
                id="select-partido-admin"
                value={partidoEditarId}
                onChange={(e) => {
                  const id = e.target.value;
                  setPartidoEditarId(id);
                  const p = partidos.find((item) => item.id === id);
                  if (p && p.jugado) {
                    setGolesLocal(p.golesLocal !== null ? String(p.golesLocal) : "");
                    setGolesVisitante(p.golesVisitante !== null ? String(p.golesVisitante) : "");
                  } else {
                    setGolesLocal("");
                    setGolesVisitante("");
                  }
                }}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-sm text-slate-900 dark:text-slate-100"
              >
                <option value="">-- Elige un partido --</option>
                {partidos.map((p) => {
                  const local = equiposMap.get(p.localId)?.nombre ?? p.localId;
                  const visitante = equiposMap.get(p.visitanteId)?.nombre ?? p.visitanteId;
                  const estado = p.jugado ? `[${p.golesLocal} - ${p.golesVisitante}]` : "[Pendiente]";
                  return (
                    <option key={p.id} value={p.id}>
                      J{p.jornada || "?"}: {local} vs {visitante} {estado} ({formatearFecha(p.fecha)})
                    </option>
                  );
                })}
              </select>
            </div>

            {partidoEditarId && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="input-goles-local-admin" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Goles Local:
                  </label>
                  <input
                    id="input-goles-local-admin"
                    type="number"
                    min="0"
                    required
                    value={golesLocal}
                    onChange={(e) => setGolesLocal(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-sm text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label htmlFor="input-goles-visitante-admin" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Goles Visitante:
                  </label>
                  <input
                    id="input-goles-visitante-admin"
                    type="number"
                    min="0"
                    required
                    value={golesVisitante}
                    onChange={(e) => setGolesVisitante(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-sm text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={procesando || !partidoEditarId}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg disabled:opacity-50"
            >
              {procesando ? "Guardando..." : "Guardar resultado oficial"}
            </button>
          </form>
        </section>
      )}
    </div>
  );
}
