import { getErrorMessage } from "@/lib/errors";
export function isError(e: unknown): e is Error {
  return e instanceof Error;
}

export function getErrorMessage(e: unknown): string {
  if (e instanceof Error) return getErrorMessage(e);
  if (typeof e === "object" && e !== null && "message" in e) {
    return String((e as any)?.message || getErrorMessage(e));
  }
  return "Error desconocido";
}
