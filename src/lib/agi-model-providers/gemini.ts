import {
  AgiProviderError,
  envValue,
  timeoutMs,
  type AgiCompletionInput,
  type AgiModelProvider,
  type AgiProviderResult,
} from "@/lib/agi-model-providers/types";

type GeminiPart = { text?: string };
type GeminiResponse = {
  candidates?: Array<{ content?: { parts?: GeminiPart[] } }>;
  usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number; totalTokenCount?: number };
  error?: { message?: string };
};

function apiKey(): string {
  return envValue("GEMINI_API_KEY", "GOOGLE_GENERATIVE_AI_API_KEY");
}

function model(): string {
  return envValue("GEMINI_MODEL", "GEMINI_MODEL_AUTO", "GEMINI_MODEL_FAST");
}

export const geminiDirectProvider: AgiModelProvider = {
  route: "gemini-direct",
  configured() {
    return Boolean(apiKey() && model());
  },
  async complete(input: AgiCompletionInput): Promise<AgiProviderResult> {
    if (!this.configured()) {
      throw new AgiProviderError("Gemini directo no configurado", { code: "GEMINI_NOT_CONFIGURED" });
    }
    const systemInstruction = input.messages.filter((m) => m.role === "system").map((m) => m.content).join("\n\n");
    const contents = input.messages
      .filter((m) => m.role !== "system")
      .map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] }));
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs(input));
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model())}:generateContent?key=${encodeURIComponent(apiKey())}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          cache: "no-store",
          body: JSON.stringify({
            systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
            contents,
            generationConfig: { temperature: 0.2, maxOutputTokens: 8192 },
          }),
        },
      );
      const payload = (await response.json().catch(() => ({}))) as GeminiResponse;
      if (!response.ok) {
        throw new AgiProviderError(payload.error?.message || `Gemini HTTP ${response.status}`, {
          code: response.status === 429 ? "GEMINI_QUOTA_OR_RATE" : `GEMINI_HTTP_${response.status}`,
          status: response.status,
          fallback_eligible: response.status === 400 || response.status === 401 || response.status === 403 || response.status === 429 || response.status >= 500,
        });
      }
      const text = (payload.candidates?.[0]?.content?.parts ?? [])
        .map((part) => part.text?.trim() ?? "")
        .filter(Boolean)
        .join("\n")
        .trim();
      if (!text) throw new AgiProviderError("Gemini devolvió respuesta vacía", { code: "GEMINI_EMPTY_RESPONSE" });
      return {
        route: "gemini-direct",
        provider: "gemini",
        model: model(),
        text,
        usage: {
          tokens_in: payload.usageMetadata?.promptTokenCount ?? null,
          tokens_out: payload.usageMetadata?.candidatesTokenCount ?? null,
          total_tokens: payload.usageMetadata?.totalTokenCount ?? null,
        },
      };
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new AgiProviderError("Gemini timeout", { code: "GEMINI_TIMEOUT" });
      }
      if (error instanceof AgiProviderError) throw error;
      throw new AgiProviderError(error instanceof Error ? error.message : "Gemini failed", { code: "GEMINI_FAILED" });
    } finally {
      clearTimeout(timer);
    }
  },
};
