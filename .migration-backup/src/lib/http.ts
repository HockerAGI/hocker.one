import type { FastifyReply, FastifyRequest } from "fastify";

export class HttpError extends Error {
  public readonly status: number;
  public readonly payload: Record<string, unknown>;

  constructor(status: number, payload: Record<string, unknown>) {
    super(typeof payload.error === "string" ? payload.error : "HTTP error");
    this.name = "HttpError";
    this.status = status;
    this.payload = payload;
  }
}

const INTERNAL_TOKEN_ENV_VARS = [
  "HOCKER_ONE_INTERNAL_TOKEN",
  "NOVA_ORCHESTRATOR_KEY",
  "HOCKER_COMMAND_HMAC_SECRET",
  "COMMAND_HMAC_SECRET",
] as const;

function getInternalSecret(): string {
  for (const key of INTERNAL_TOKEN_ENV_VARS) {
    const value = String(process.env[key] ?? "").trim();
    if (value) return value;
  }
  return "";
}

export function json(reply: FastifyReply, status: number, payload: unknown): FastifyReply {
  return reply.code(status).header("cache-control", "no-store").send(payload);
}

export async function readJsonBody<T extends Record<string, unknown>>(
  req: FastifyRequest,
): Promise<T> {
  const body = req.body;

  if (body && typeof body === "object" && !Array.isArray(body)) {
    return body as T;
  }

  throw new HttpError(400, { error: "Body inválido." });
}

export function requireAuth(req: FastifyRequest): void {
  const expected = getInternalSecret();
  if (!expected) {
    throw new HttpError(500, {
      error: "No hay secreto interno configurado para autenticar este endpoint.",
    });
  }

  const headerAuth = String(req.headers.authorization ?? "").trim();
  const bearer = headerAuth.replace(/^Bearer\s+/i, "").trim();
  const fallback = String(req.headers["x-hocker-internal-token"] ?? "").trim();
  const provided = bearer || fallback;

  if (!provided || provided !== expected) {
    throw new HttpError(401, { error: "Unauthorized" });
  }
}

export function toHttpError(error: unknown): HttpError {
  if (error instanceof HttpError) return error;

  if (error && typeof error === "object") {
    const maybeStatus = (error as { status?: unknown }).status;
    const maybeMessage =
      typeof (error as { message?: unknown }).message === "string"
        ? String((error as { message?: unknown }).message)
        : "";

    if (typeof maybeStatus === "number" && Number.isFinite(maybeStatus)) {
      return new HttpError(maybeStatus, { error: maybeMessage || "HTTP error" });
    }
  }

  if (error instanceof Error) {
    return new HttpError(500, { error: error.message });
  }

  return new HttpError(500, {
    error: typeof error === "string" ? error : "Error interno en el núcleo de datos.",
  });
}