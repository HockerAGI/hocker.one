export function stableStringify(value: any): string {
  return JSON.stringify(sortKeys(value));
}

function sortKeys(obj: any): any {
  if (Array.isArray(obj)) return obj.map(sortKeys);
  if (obj && typeof obj === "object") {
    const out: any = {};
    Object.keys(obj).sort().forEach((k) => (out[k] = sortKeys(obj[k])));
    return out;
  }
  return obj;
}