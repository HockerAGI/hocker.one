import {
  AgiProviderError,
  envValue,
  timeoutMs,
  type AgiCompletionInput,
  type AgiModelProvider,
  type AgiProviderResult,
} from "@/lib/agi-model-providers/types";

type AnthropicResponse = {
  content?: Array<{ type?: string; text?: string }>;
  usage?: { input_tokens?: number; output_tokens?: number };
  error?: { message?: string };
};

function apiKey(): string {
  return envValue("ANTHROPIC_API_KEY");
}

function model(): string {
  return envValue("ANTHROPIC_MODEL", "ANTHROPIC_MODEL_AUTO", "ANTHROPIC_MODEL_FAST");
}

export const anthropicDirectProvider: AgiModelProvider = {
  route: "anthropic-direct",
  configured() {
    return Boolean(apiKey() && model());
  },
  async complete(input: AgiCompletionInput): Promise<AgiProviderResult> {
    if (!this.configured()) {
      throw new AgiProviderError("Anthropic directo no configurado", { code: "ANTHROPIC_NOT_CONFIGURED" });
    }
    const system = input.messages.filter((m) => m.role === "system").map((m) => m.content).join("\n\n");
    const messages = input.messages
      .filter((m) => m.role !== "system")
      .map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content }));
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs(input));
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": apiKey(),
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        signal: controller.signal,
        cache: "no-store",
        body: JSON.stringify({ model: model(), max_tokens: 4096, system, messages }),
      });
      const payload = (await response.json().catch(() => ({}))) as AnthropicResponse;
      if (!response.ok) {
        throw new AgiProviderError(payload.error?.message || `Anthropic HTTP ${response.status}`, {
          code: response.status === 429 ? "ANTHROPIC_QUOTA_OR_RATE" : `ANTHROPIC_HTTP_${response.status}`,
          status: response.status,
          fallback_eligible: response.status === 400 || response.status === 401 || response.status === 403 || response.status === 429 || response.status >= 500,
        });
      }
      const text = (payload.content ?? [])
        .filter((block) => block.type === "text" && typeof block.text === "string")
        .map((block) => block.text?.trim() ?? "")
        .filter(Boolean)
        .join("\n")
        .trim();
      if (!text) throw new AgiProviderError("Anthropic devolvió respuesta vacía", { code: "ANTHROPIC_EMPTY_RESPONSE" });
      const tokensIn = payload.usage?.input_tokens ?? null;
      const tokensOut = payload.usage?.output_tokens ?? null;
      return {
        route: "anthropic-direct",
        provider: "anthropic",
        model: model(),
        text,
        usage: {
          tokens_in: tokensIn,
          tokens_out: tokensOut,
          total_tokens: tokensIn !== null && tokensOut !== null ? tokensIn + tokensOut : null,
        },
      };
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new AgiProviderError("Anthropic timeout", { code: "ANTHROPIC_TIMEOUT" });
      }
      if (error instanceof AgiProviderError) throw error;
      throw new AgiProviderError(error instanceof Error ? error.message : "Anthropic failed", { code: "ANTHROPIC_FAILED" });
    } finally {
      clearTimeout(timer);
    }
  },
};
