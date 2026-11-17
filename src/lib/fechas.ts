/**
 * Formatea una fecha ISO 8601 con localización colombiana ("es-CO"),
 * proporcionando respaldo seguro a la cadena ISO si Intl no está disponible.
 *
 * @param fechaIso Fecha en formato ISO 8601
 * @returns Cadena formateada para presentación accesible al usuario
 */
export function formatearFecha(fechaIso: string): string {
  try {
    if (typeof Intl !== "undefined" && typeof Intl.DateTimeFormat === "function") {
      const fecha = new Date(fechaIso);
      if (!isNaN(fecha.getTime())) {
        return new Intl.DateTimeFormat("es-CO", {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(fecha);
      }
    }
  } catch {
    // Si falla o no está soportado, se retorna el respaldo ISO
  }
  return fechaIso;
}
