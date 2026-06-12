/**
 * PROTOCOLO DE EXTRACCIÓN DE ANOMALÍAS
 * Convierte cualquier error en un mensaje claro y humano.
 */
export function getErrorMessage(e: unknown): string {
  if (!e) return "Anomalía no identificada.";

  if (e instanceof Error) {
    if (e.cause) return getErrorMessage(e.cause);
    return e.message || "Error sin mensaje.";
  }

  if (typeof e === "object") {
    const obj = e as Record<string, unknown>;
    if (typeof obj.message === "string") return obj.message;
    if (typeof obj.error === "string") return obj.error;
    if (typeof obj.code === "string") return `Error Code: ${obj.code}`;
  }

  if (typeof e === "string") return e;

  return "Error estructural en la matriz de datos.";
}