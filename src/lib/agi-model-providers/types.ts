export type AgiModelRoute =
  | "vercel-gateway"
  | "openai-direct"
  | "gemini-direct"
  | "anthropic-direct"
  | "ollama";

export type AgiModelMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type AgiCompletionInput = {
  messages: AgiModelMessage[];
  timeout_ms?: number;
  oidc_token?: string | null;
  exclude_routes?: AgiModelRoute[];
};

export type AgiUsage = {
  tokens_in: number | null;
  tokens_out: number | null;
  total_tokens: number | null;
};

export type AgiProviderAttempt = {
  route: AgiModelRoute;
  configured: boolean;
  ok: boolean;
  error_code?: string;
  latency_ms?: number;
};

export type AgiCompletionResult = {
  route: AgiModelRoute;
  provider: string;
  model: string;
  text: string;
  usage: AgiUsage;
  attempts: AgiProviderAttempt[];
};

export type AgiProviderResult = Omit<AgiCompletionResult, "attempts">;

export interface AgiModelProvider {
  route: AgiModelRoute;
  configured(input?: { oidc_token?: string | null }): boolean;
  complete(input: AgiCompletionInput): Promise<AgiProviderResult>;
}

export class AgiProviderError extends Error {
  readonly code: string;
  readonly status: number | null;
  readonly fallback_eligible: boolean;

  constructor(message: string, options: { code: string; status?: number | null; fallback_eligible?: boolean }) {
    super(message);
    this.name = "AgiProviderError";
    this.code = options.code;
    this.status = options.status ?? null;
    this.fallback_eligible = options.fallback_eligible ?? true;
  }
}

export function envValue(...names: string[]): string {
  for (const name of names) {
    const value = String(process.env[name] ?? "").trim();
    if (value) return value;
  }
  return "";
}

export function emptyUsage(): AgiUsage {
  return { tokens_in: null, tokens_out: null, total_tokens: null };
}

export function timeoutMs(input: AgiCompletionInput, fallback = 40_000): number {
  return Math.max(5_000, Math.min(input.timeout_ms ?? fallback, 45_000));
}