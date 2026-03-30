/**
 * Motor de Serialización Canónica Hocker
 * Garantiza que {a:1, b:2} y {b:2, a:1} generen el mismo string exacto.
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
    const out: unknown = {};
    const keys = Object.keys(v).sort();
    for (const k of keys) {
      out[k] = sorter(v[k]);
    }
    return out;
  };

  return JSON.stringify(sorter(obj));
}
