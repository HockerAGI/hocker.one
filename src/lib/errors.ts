/**
 * PROTOCOLO DE EXTRACCIÓN DE ANOMALÍAS
 * Decodifica cualquier objeto de error para presentarlo de forma concreta y humana.
 */
export function getErrorMessage(e: unknown): string {
  if (!e) return "Anomalía no identificada.";

  if (e instanceof Error) {
    // Si el error tiene una causa anidada, la exploramos
    if (e.cause) return getErrorMessage(e.cause);
    return e.message;
  }

  if (typeof e === "object") {
    const obj = e as Record<string, unknown>;
    
    // Prioridad de campos tácticos
    if (typeof obj.message === "string") return obj.message;
    if (typeof obj.error === "string") return obj.error;
    if (typeof obj.code === "string") return `Error Code: ${obj.code}`;
  }

  if (typeof e === "string") return e;

  return "Error estructural en la matriz de datos.";
}
