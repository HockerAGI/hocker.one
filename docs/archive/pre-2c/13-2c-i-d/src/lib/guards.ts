import { getErrorMessage } from "./errors";

/**
 * DETERMINADOR DE INSTANCIA
 * Verifica si el objeto capturado es una instancia de Error legítima.
 */
export function isError(e: unknown): e is Error {
  return e instanceof Error;
}

/**
 * SALIDA DE EMERGENCIA SEGURA
 * Transforma cualquier captura en un string legible para la interfaz visual.
 */
export function safeError(e: unknown): string {
  return getErrorMessage(e);
}
