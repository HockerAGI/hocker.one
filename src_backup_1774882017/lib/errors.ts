export function getErrorMessage(e: unknown): string {
  if (typeof e === "string") return e;

  if (e instanceof Error) return e.message;

  if (typeof e === "object" && e !== null) {
    const obj = e as Record<string, unknown>;

    if (typeof obj.message === "string") return obj.message;

    if (
      typeof obj.payload === "object" &&
      obj.payload !== null &&
      typeof (obj.payload as any).error === "string"
    ) {
      return (obj.payload as any).error;
    }
  }

  return "Error desconocido";
}
