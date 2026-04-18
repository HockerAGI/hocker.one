import { getErrorMessage } from "./errors";

/**
 * Serialización canónica para firmas y hashes.
 * Ordena llaves de forma determinista y evita colapsos por estructuras cíclicas.
 */
export function stableStringify(obj: unknown): string {
  const seen = new WeakSet<object>();

  const sorter = (v: unknown): unknown => {
    if (v === null || typeof v !== "object") return v;

    if (seen.has(v as object)) return "[Circular]";
    seen.add(v as object);

    if (Array.isArray(v)) return v.map(sorter);

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

export const canonicalJson = stableStringify;