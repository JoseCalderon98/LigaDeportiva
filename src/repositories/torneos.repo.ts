import { getAdminDb } from "@/lib/firebase-admin";
import type { Equipo, Partido, Goleador } from "@/schemas/liga";

export interface TorneoRegistro {
  id: string;
  nombre: string;
  organizadorUid: string;
  temporada?: string;
  activo?: boolean;
  creadoEn: string;
}

/**
 * Repositorio exclusivo para operaciones con Firestore (Admin SDK).
 * Estructura de colecciones:
 * - `torneos/{id}`
 * - `torneos/{id}/equipos/{eid}`
 * - `torneos/{id}/partidos/{pid}`
 * - `torneos/{id}/goleadores/{jid}`
 */
export const TorneosRepository = {
  /**
   * Crea un nuevo torneo en Firestore asignando el organizador autenticado.
   */
  async crearTorneo(
    datos: { nombre: string; temporada?: string },
    organizadorUid: string
  ): Promise<TorneoRegistro> {
    const db = getAdminDb();
    const docRef = db.collection("torneos").doc();

    const torneo: TorneoRegistro = {
      id: docRef.id,
      nombre: datos.nombre,
      organizadorUid,
      temporada: datos.temporada || new Date().getFullYear().toString(),
      activo: true,
      creadoEn: new Date().toISOString(),
    };

    await docRef.set(torneo);
    return torneo;
  },

  /**
   * Obtiene lista paginada de torneos con cursor.
   */
  async listarTorneos(
    limite: number = 10,
    cursor?: string
  ): Promise<{ torneos: TorneoRegistro[]; siguienteCursor: string | null }> {
    const db = getAdminDb();
    let consulta = db
      .collection("torneos")
      .orderBy("creadoEn", "desc")
      .limit(limite + 1);

    if (cursor) {
      const cursorDoc = await db.collection("torneos").doc(cursor).get();
      if (cursorDoc.exists) {
        consulta = consulta.startAfter(cursorDoc);
      }
    }

    const snapshot = await consulta.get();
    const tieneMas = snapshot.docs.length > limite;
    const docs = tieneMas ? snapshot.docs.slice(0, limite) : snapshot.docs;

    const torneos: TorneoRegistro[] = docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        nombre: data.nombre,
        organizadorUid: data.organizadorUid,
        temporada: data.temporada,
        activo: data.activo,
        creadoEn: data.creadoEn,
      };
    });

    const siguienteCursor = tieneMas && docs.length > 0 ? docs[docs.length - 1]!.id : null;

    return { torneos, siguienteCursor };
  },

  /**
   * Obtiene un torneo por su ID.
   */
  async obtenerTorneoPorId(torneoId: string): Promise<TorneoRegistro | null> {
    const db = getAdminDb();
    const doc = await db.collection("torneos").doc(torneoId).get();

    if (!doc.exists) {
      return null;
    }

    const data = doc.data()!;
    return {
      id: doc.id,
      nombre: data.nombre,
      organizadorUid: data.organizadorUid,
      temporada: data.temporada,
      activo: data.activo,
      creadoEn: data.creadoEn,
    };
  },

  /**
   * Registra un equipo en la subcolección `torneos/{id}/equipos/{eid}`.
   */
  async crearEquipo(
    torneoId: string,
    equipoData: { nombre: string; escudoUrl?: string | null }
  ): Promise<Equipo> {
    const db = getAdminDb();
    const docRef = db.collection("torneos").doc(torneoId).collection("equipos").doc();

    const equipo: Equipo = {
      id: docRef.id,
      nombre: equipoData.nombre,
      escudoUrl: equipoData.escudoUrl ?? null,
    };

    await docRef.set(equipo);
    return equipo;
  },

  /**
   * Obtiene todos los equipos de un torneo.
   */
  async obtenerEquipos(torneoId: string): Promise<Equipo[]> {
    const db = getAdminDb();
    const snapshot = await db
      .collection("torneos")
      .doc(torneoId)
      .collection("equipos")
      .get();

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        nombre: data.nombre,
        escudoUrl: data.escudoUrl ?? null,
      };
    });
  },

  /**
   * Guarda múltiples partidos en la subcolección `torneos/{id}/partidos/{pid}`.
   */
  async guardarPartidos(torneoId: string, partidos: Partido[]): Promise<void> {
    const db = getAdminDb();
    const batch = db.batch();

    for (const p of partidos) {
      const ref = db
        .collection("torneos")
        .doc(torneoId)
        .collection("partidos")
        .doc(p.id);
      batch.set(ref, p);
    }

    await batch.commit();
  },

  /**
   * Obtiene todos los partidos de un torneo.
   */
  async obtenerPartidos(torneoId: string): Promise<Partido[]> {
    const db = getAdminDb();
    const snapshot = await db
      .collection("torneos")
      .doc(torneoId)
      .collection("partidos")
      .orderBy("fecha", "asc")
      .get();

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        localId: data.localId,
        visitanteId: data.visitanteId,
        fecha: data.fecha,
        golesLocal: data.golesLocal ?? null,
        golesVisitante: data.golesVisitante ?? null,
        jugado: data.jugado ?? false,
        jornada: data.jornada,
      };
    });
  },

  /**
   * Obtiene un partido específico de un torneo.
   */
  async obtenerPartido(
    torneoId: string,
    partidoId: string
  ): Promise<Partido | null> {
    const db = getAdminDb();
    const doc = await db
      .collection("torneos")
      .doc(torneoId)
      .collection("partidos")
      .doc(partidoId)
      .get();

    if (!doc.exists) {
      return null;
    }

    const data = doc.data()!;
    return {
      id: doc.id,
      localId: data.localId,
      visitanteId: data.visitanteId,
      fecha: data.fecha,
      golesLocal: data.golesLocal ?? null,
      golesVisitante: data.golesVisitante ?? null,
      jugado: data.jugado ?? false,
      jornada: data.jornada,
    };
  },

  /**
   * Actualiza el resultado de un partido en Firestore.
   */
  async actualizarResultado(
    torneoId: string,
    partidoId: string,
    golesLocal: number,
    golesVisitante: number
  ): Promise<Partido> {
    const db = getAdminDb();
    const docRef = db
      .collection("torneos")
      .doc(torneoId)
      .collection("partidos")
      .doc(partidoId);

    const doc = await docRef.get();
    if (!doc.exists) {
      throw new Error("Partido no encontrado");
    }

    const partidoActual = doc.data()!;
    const partidoActualizado: Partido = {
      id: doc.id,
      localId: partidoActual.localId,
      visitanteId: partidoActual.visitanteId,
      fecha: partidoActual.fecha,
      golesLocal,
      golesVisitante,
      jugado: true,
      jornada: partidoActual.jornada,
    };

    await docRef.update({
      golesLocal,
      golesVisitante,
      jugado: true,
    });

    return partidoActualizado;
  },

  /**
   * Obtiene la tabla de goleadores de un torneo.
   */
  async obtenerGoleadores(torneoId: string): Promise<Goleador[]> {
    const db = getAdminDb();
    const snapshot = await db
      .collection("torneos")
      .doc(torneoId)
      .collection("goleadores")
      .orderBy("goles", "desc")
      .get();

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        nombre: data.nombre,
        equipoId: data.equipoId,
        goles: data.goles,
      };
    });
  },
};
