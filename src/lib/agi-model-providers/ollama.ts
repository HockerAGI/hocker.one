import {
  AgiProviderError,
  envValue,
  timeoutMs,
  type AgiCompletionInput,
  type AgiModelProvider,
  type AgiProviderResult,
} from "@/lib/agi-model-providers/types";

type OllamaResponse = {
  message?: { content?: string };
  prompt_eval_count?: number;
  eval_count?: number;
  error?: string;
};

function baseUrl(): string {
  return envValue("OLLAMA_BASE_URL").replace(/\/$/, "");
}

function model(): string {
  return envValue("OLLAMA_MODEL", "OLLAMA_MODEL_AUTO", "OLLAMA_MODEL_FAST");
}

export const ollamaProvider: AgiModelProvider = {
  route: "ollama",
  configured() {
    return Boolean(baseUrl() && model());
  },
  async complete(input: AgiCompletionInput): Promise<AgiProviderResult> {
    if (!this.configured()) {
      throw new AgiProviderError("Ollama no configurado", { code: "OLLAMA_NOT_CONFIGURED" });
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs(input));
    try {
      const response = await fetch(`${baseUrl()}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        cache: "no-store",
        body: JSON.stringify({ model: model(), messages: input.messages, stream: false }),
      });
      const payload = (await response.json().catch(() => ({}))) as OllamaResponse;
      if (!response.ok) {
        throw new AgiProviderError(payload.error || `Ollama HTTP ${response.status}`, {
          code: `OLLAMA_HTTP_${response.status}`,
          status: response.status,
          fallback_eligible: true,
        });
      }
      const text = String(payload.message?.content ?? "").trim();
      if (!text) throw new AgiProviderError("Ollama devolvió respuesta vacía", { code: "OLLAMA_EMPTY_RESPONSE" });
      const tokensIn = payload.prompt_eval_count ?? null;
      const tokensOut = payload.eval_count ?? null;
      return {
        route: "ollama",
        provider: "ollama",
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
        throw new AgiProviderError("Ollama timeout", { code: "OLLAMA_TIMEOUT" });
      }
      if (error instanceof AgiProviderError) throw error;
      throw new AgiProviderError(error instanceof Error ? error.message : "Ollama failed", { code: "OLLAMA_FAILED" });
    } finally {
      clearTimeout(timer);
    }
  },
};
