// src/lib/errors.ts
export function getErrorMessage(e: unknown): string {
  if (e instanceof Error) return getErrorMessage(e);

  if (typeof e === "object" && e !== null && "message" in e) {
    return String((e as { message?: unknown }).message);
  }

  return String(e);
}
