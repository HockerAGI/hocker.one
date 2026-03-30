import { getErrorMessage } from "@/lib/errors";
export function getErrorMessage(e: unknown): string {
  if (e instanceof Error) return getErrorMessage(e);

  if (typeof e === "object" && e !== null && "message" in e) {
    return String((e as { message?: unknown })getErrorMessage());
  }

  return String(e);
}
