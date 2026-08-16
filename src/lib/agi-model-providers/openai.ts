import {
  AgiProviderError,
  envValue,
  timeoutMs,
  type AgiCompletionInput,
  type AgiModelProvider,
  type AgiProviderResult,
} from "@/lib/agi-model-providers/types";

type OpenAIResponse = {
  output?: Array<{
    type?: string;
    content?: Array<{ type?: string; text?: string }>;
  }>;
  output_text?: string;
  usage?: { input_tokens?: number; output_tokens?: number; total_tokens?: number };
  error?: { message?: string; code?: string };
};

function apiKey(): string {
  return envValue("OPENAI_API_KEY");
}

function model(): string {
  return envValue("OPENAI_MODEL", "OPENAI_MODEL_AUTO", "OPENAI_MODEL_FAST");
}

function extractText(payload: OpenAIResponse): string {
  if (typeof payload.output_text === "string" && payload.output_text.trim()) return payload.output_text.trim();
  return (payload.output ?? [])
    .flatMap((item) => item.content ?? [])
    .filter((part) => part.type === "output_text" && typeof part.text === "string")
    .map((part) => part.text?.trim() ?? "")
    .filter(Boolean)
    .join("\n")
    .trim();
}

export const openaiDirectProvider: AgiModelProvider = {
  route: "openai-direct",
  configured() {
    return Boolean(apiKey() && model());
  },
  async complete(input: AgiCompletionInput): Promise<AgiProviderResult> {
    if (!this.configured()) {
      throw new AgiProviderError("OpenAI directo no configurado", { code: "OPENAI_NOT_CONFIGURED" });
    }
    const system = input.messages.filter((m) => m.role === "system").map((m) => m.content).join("\n\n");
    const messages = input.messages
      .filter((m) => m.role !== "system")
      .map((m) => ({ role: m.role, content: m.content }));
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs(input));
    try {
      const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey()}`, "Content-Type": "application/json" },
        signal: controller.signal,
        cache: "no-store",
        body: JSON.stringify({
          model: model(),
          instructions: system || undefined,
          input: messages,
          store: false,
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as OpenAIResponse;
      if (!response.ok) {
        throw new AgiProviderError(payload.error?.message || `OpenAI HTTP ${response.status}`, {
          code: response.status === 429 ? "OPENAI_QUOTA_OR_RATE" : `OPENAI_HTTP_${response.status}`,
          status: response.status,
          fallback_eligible: response.status === 401 || response.status === 403 || response.status === 429 || response.status >= 500 || response.status === 400,
        });
      }
      const text = extractText(payload);
      if (!text) throw new AgiProviderError("OpenAI devolvió respuesta vacía", { code: "OPENAI_EMPTY_RESPONSE" });
      return {
        route: "openai-direct",
        provider: "openai",
        model: model(),
        text,
        usage: {
          tokens_in: payload.usage?.input_tokens ?? null,
          tokens_out: payload.usage?.output_tokens ?? null,
          total_tokens: payload.usage?.total_tokens ?? null,
        },
      };
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new AgiProviderError("OpenAI timeout", { code: "OPENAI_TIMEOUT" });
      }
      if (error instanceof AgiProviderError) throw error;
      throw new AgiProviderError(error instanceof Error ? error.message : "OpenAI failed", { code: "OPENAI_FAILED" });
    } finally {
      clearTimeout(timer);
    }
  },
};
