import {
  AgiProviderError,
  envValue,
  timeoutMs,
  type AgiCompletionInput,
  type AgiModelProvider,
  type AgiProviderResult,
  type AgiNativeTool,
  type AgiToolCall,
} from "@/lib/agi-model-providers/types";

type GeminiPart = { text?: string; functionCall?: { name?: string; args?: Record<string, unknown> }; functionResponse?: { name?: string; response?: unknown } };
type GeminiResponse = {
  candidates?: Array<{ content?: { parts?: GeminiPart[] } }>;
  usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number; totalTokenCount?: number };
  error?: { message?: string };
};



function wireTools(tools: AgiNativeTool[] | undefined): Array<Record<string, unknown>> | undefined {
  if (!tools?.length) return undefined;
  return [{
    functionDeclarations: tools.slice(0, 32).map((tool) => ({
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    })),
  }];
}

function parseToolCalls(payload: GeminiResponse, tools: AgiNativeTool[] | undefined): AgiToolCall[] {
  const byName = new Map((tools ?? []).map((tool) => [tool.name, tool]));
  return (payload.candidates?.[0]?.content?.parts ?? []).filter((part) => part.functionCall).slice(0, 8).flatMap((part) => {
    const call = part.functionCall!;
    const tool = byName.get(String(call.name ?? ""));
    if (!tool) return [];
    return [{ id: `call_${Date.now()}_${Math.random().toString(36).slice(2,8)}`, name: tool.name, qualified_name: tool.qualified_name, args: call.args ?? {} }];
  });
}

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
    const contents = [
      ...input.messages
        .filter((m) => m.role !== "system")
        .map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] })),
      ...(input.tool_calls?.length ? [{
        role: "model",
        parts: input.tool_calls.map((call) => ({ functionCall: { name: call.name, args: call.args } })),
      }] : []),
      ...(input.tool_results?.length ? [{
        role: "user",
        parts: input.tool_results.map((result) => ({ functionResponse: { name: result.name, response: result.result } })),
      }] : []),
    ];
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs(input));
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model())}:generateContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey(),
          },
          signal: controller.signal,
          cache: "no-store",
          body: JSON.stringify({
            systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
            contents,
            generationConfig: { temperature: 0.2, maxOutputTokens: 8192 },
            tools: wireTools(input.tools),
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
      const toolCalls = parseToolCalls(payload, input.tools);
      const text = (payload.candidates?.[0]?.content?.parts ?? [])
        .map((part) => part.text?.trim() ?? "")
        .filter(Boolean)
        .join("\n")
        .trim();
      if (!text && toolCalls.length === 0) throw new AgiProviderError("Gemini devolvió respuesta vacía", { code: "GEMINI_EMPTY_RESPONSE" });
      return {
        route: "gemini-direct",
        provider: "gemini",
        model: model(),
        text,
        tool_calls: toolCalls,
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
