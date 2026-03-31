import { getErrorMessage } from "./errors";

/**
 * MOTOR DE SERIALIZACIÓN CANÓNICA HOCKER
 * Garantiza que la estructura de datos sea inmutable y predecible para firmas HMAC.
 */
export function stableStringify(obj: unknown): string {
  const seen = new WeakSet();

  const sorter = (v: unknown): unknown => {
    if (v === null || typeof v !== "object") return v;
    
    // Protección contra bucles infinitos en la memoria
    if (seen.has(v)) return "[Circular]";
    seen.add(v);

    if (Array.isArray(v)) return v.map(sorter);

    // Ordenamiento alfabético de llaves de grado militar
    const out: Record<string, unknown> = {};
    const keys = Object.keys(v as Record<string, unknown>).sort();
    
    for (const k of keys) {
      out[k] = sorter((v as Record<string, unknown>)[k]);
    }
    return out;
  };

  try {
    return JSON.stringify(sorter(obj));
  } catch (err: unknown) {
    throw new Error(`Colapso en la serialización: ${getErrorMessage(err)}`);
  }
}
