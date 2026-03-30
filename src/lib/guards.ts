import { getErrorMessage } from "@/lib/errors";

export function isError(e: unknown): e is Error {
  return e instanceof Error;
}

export function safeError(e: unknown): string {
  return getErrorMessage(e);
}
