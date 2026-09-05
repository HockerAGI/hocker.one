import {
  AgiProviderError,
  emptyUsage,
  envValue,
  timeoutMs,
  type AgiCompletionInput,
  type AgiModelProvider,
  type AgiProviderResult,
  type AgiNativeTool,
  type AgiToolCall,
} from "@/lib/agi-model-providers/types";

type GatewayResponse = {
  choices?: Array<{ message?: { content?: string; tool_calls?: Array<{ id?: string; type?: string; function?: { name?: string; arguments?: string } }> } }>;
  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
  error?: { message?: string };
};

type Credential = { source: "oidc" | "api_key"; token: string };



function wireTools(tools: AgiNativeTool[] | undefined): Array<Record<string, unknown>> | undefined {
  if (!tools?.length) return undefined;
  return tools.slice(0, 32).map((tool) => ({
    type: "function",
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    },
  }));
}

function parseToolCalls(payload: GatewayResponse, tools: AgiNativeTool[] | undefined): AgiToolCall[] {
  const byName = new Map((tools ?? []).map((tool) => [tool.name, tool]));
  return (payload.choices?.[0]?.message?.tool_calls ?? []).slice(0, 8).flatMap((call) => {
    const name = String(call.function?.name ?? "");
    const tool = byName.get(name);
    if (!tool) return [];
    let args: Record<string, unknown> = {};
    try { args = JSON.parse(call.function?.arguments ?? "{}") as Record<string, unknown>; } catch { return []; }
    return [{ id: String(call.id ?? `call_${Date.now()}`), name: tool.name, qualified_name: tool.qualified_name, args }];
  });
}

function credentials(runtimeOidc?: string | null): Credential[] {
  const oidc = String(runtimeOidc ?? "").trim() || envValue("VERCEL_OIDC_TOKEN");
  const apiKey = envValue("AI_GATEWAY_API_KEY");
  const out: Credential[] = [];
  if (oidc) out.push({ source: "oidc", token: oidc });
  if (apiKey && apiKey !== oidc) out.push({ source: "api_key", token: apiKey });
  return out;
}

function model(): string {
  return envValue("AI_GATEWAY_MODEL_AUTO", "AI_GATEWAY_MODEL_FAST") || "google/gemini-2.5-flash";
}

export const vercelGatewayProvider: AgiModelProvider = {
  route: "vercel-gateway",
  configured(input) {
    return credentials(input?.oidc_token).length > 0;
  },
  async complete(input: AgiCompletionInput): Promise<AgiProviderResult> {
    const creds = credentials(input.oidc_token);
    if (!creds.length) {
      throw new AgiProviderError("AI Gateway no configurado", { code: "GATEWAY_NOT_CONFIGURED" });
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs(input));
    try {
      let lastError = "GATEWAY_AUTH_FAILED";
      for (const [index, credential] of creds.entries()) {
        const response = await fetch("https://ai-gateway.vercel.sh/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${credential.token}`,
            "Content-Type": "application/json",
            "X-Hocker-Credential-Source": credential.source,
          },
          cache: "no-store",
          signal: controller.signal,
          body: JSON.stringify({
            model: model(),
            messages: [
              ...input.messages,
              ...(input.tool_calls?.length ? [{
                role: "assistant",
                content: null,
                tool_calls: input.tool_calls.map((call) => ({
                  id: call.id,
                  type: "function",
                  function: { name: call.name, arguments: JSON.stringify(call.args) },
                })),
              }] : []),
              ...(input.tool_results ?? []).map((result) => ({
                role: "tool",
                tool_call_id: result.id,
                content: JSON.stringify(result.result),
              })),
            ],
            temperature: 0.2,
            max_tokens: 4096,
            tools: wireTools(input.tools),
            tool_choice: input.tools?.length ? "auto" : undefined,
            stream: false,
          }),
        });
        const payload = (await response.json().catch(() => ({}))) as GatewayResponse;
        if (!response.ok) {
          const message = payload.error?.message || `AI_GATEWAY_HTTP_${response.status}`;
          const authRejected = response.status === 401 || response.status === 403;
          if (authRejected && index < creds.length - 1) {
            lastError = message;
            continue;
          }
          throw new AgiProviderError(message, {
            code: response.status === 429 ? "GATEWAY_QUOTA_OR_RATE" : `GATEWAY_HTTP_${response.status}`,
            status: response.status,
            fallback_eligible: authRejected || response.status === 429 || response.status >= 500,
          });
        }
        const toolCalls = parseToolCalls(payload, input.tools);
        const text = String(payload.choices?.[0]?.message?.content ?? "").trim();
        if (!text && toolCalls.length === 0) {
          throw new AgiProviderError("AI Gateway devolvió respuesta vacía", {
            code: "GATEWAY_EMPTY_RESPONSE",
            fallback_eligible: true,
          });
        }
        return {
          route: "vercel-gateway",
          provider: "vercel-ai-gateway",
          model: model(),
          text,
          tool_calls: toolCalls,
          usage: {
            tokens_in: payload.usage?.prompt_tokens ?? null,
            tokens_out: payload.usage?.completion_tokens ?? null,
            total_tokens: payload.usage?.total_tokens ?? null,
          },
        };
      }
      throw new AgiProviderError(lastError, { code: "GATEWAY_AUTH_FAILED" });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new AgiProviderError("AI Gateway timeout", { code: "GATEWAY_TIMEOUT" });
      }
      if (error instanceof AgiProviderError) throw error;
      throw new AgiProviderError(error instanceof Error ? error.message : "AI Gateway failed", {
        code: "GATEWAY_FAILED",
      });
    } finally {
      clearTimeout(timer);
    }
  },
};

export function gatewayConfigured(oidcToken?: string | null): boolean {
  return vercelGatewayProvider.configured({ oidc_token: oidcToken });
}

export function gatewayModelName(): string {
  return model();
}

export const GATEWAY_EMPTY_USAGE = emptyUsage();
