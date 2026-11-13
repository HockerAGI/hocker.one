import {
  AgiProviderError, timeoutMs,
  type AgiCompletionInput, type AgiModelProvider, type AgiProviderResult,
} from "@/lib/agi-model-providers/types";
import {
  CF_FREE_ACCOUNT, CF_FREE_GATEWAY, CF_FREE_MODEL, CF_MAX_INPUT_CHARS,
  CF_MAX_MESSAGES, CF_MAX_OUTPUT_TOKENS, cloudflareFreeRouteConfigured,
} from "@/lib/cloudflare-zero-credit-policy";

type ResponseBody = {
  choices?: Array<{ message?: { content?: string } }>;
  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
};

/**
 * Fixed Cloudflare Workers AI route through the EXISTING Hocker AI Gateway.
 * Never select dynamic/premium models, call external tools, or retry on error.
 * This adapter is DISABLED until the operator has verified Workers Free.
 */
export const cloudflareWorkersAiProvider: AgiModelProvider = {
  route: "cloudflare-workers-ai",
  configured() { return cloudflareFreeRouteConfigured(); },
  async complete(input: AgiCompletionInput): Promise<AgiProviderResult> {
    if (!cloudflareFreeRouteConfigured()) {
      throw new AgiProviderError("Cloudflare Free plan is not certified", {
        code: "CLOUDFLARE_FREE_GATE_CLOSED", fallback_eligible: false,
      });
    }
    if (input.web_search || input.tool_calls?.length || input.tool_results?.length) {
      throw new AgiProviderError("Cloudflare tools/web search not certified", {
        code: "CLOUDFLARE_UNCERTIFIED_CAPABILITY", fallback_eligible: false,
      });
    }
    // Keep the canonical system instruction; reject rather than truncate it.
    const system = input.messages.filter((m) => m.role === "system");
    const recent = input.messages.filter((m) => m.role !== "system").slice(-Math.max(0, CF_MAX_MESSAGES - system.length));
    const messages = [...system, ...recent];
    const size = messages.reduce((n, m) => n + m.content.length, 0);
    if (messages.length > CF_MAX_MESSAGES || size > CF_MAX_INPUT_CHARS || messages.length === 0) {
      throw new AgiProviderError("Cloudflare request exceeds free-only input budget", {
        code: "CLOUDFLARE_INPUT_LIMIT", fallback_eligible: false,
      });
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), Math.min(timeoutMs(input), 25_000));
    try {
      const response = await fetch(
        "https://api.cloudflare.com/client/v4/accounts/" + CF_FREE_ACCOUNT + "/ai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: "Bearer " + String(process.env.CLOUDFLARE_WORKERS_AI_API_TOKEN ?? "").trim(),
            "Content-Type": "application/json",
            "cf-aig-gateway-id": CF_FREE_GATEWAY,
            "cf-aig-collect-log": "false",
            "cf-aig-skip-cache": "true",
            "cf-aig-max-attempts": "1",
            "cf-aig-request-timeout": "25000",
          },
          signal: controller.signal, cache: "no-store",
          body: JSON.stringify({
            model: CF_FREE_MODEL, messages, temperature: 0.3,
            max_tokens: CF_MAX_OUTPUT_TOKENS, stream: false,
          }),
        },
      );
      // Never persist raw provider errors: they may contain sensitive request data.
      if (!response.ok) {
        throw new AgiProviderError("Cloudflare native Workers AI request rejected", {
          code: response.status === 429 ? "CLOUDFLARE_QUOTA_OR_RATE" :
            response.status === 403 ? "CLOUDFLARE_ACCESS_DENIED" :
            "CLOUDFLARE_HTTP_" + response.status,
          status: response.status, fallback_eligible: false,
        });
      }
      const payload = (await response.json().catch(() => ({}))) as ResponseBody;
      const text = String(payload.choices?.[0]?.message?.content ?? "").trim();
      if (!text) {
        throw new AgiProviderError("Cloudflare model returned no text", {
          code: "CLOUDFLARE_EMPTY_RESPONSE", fallback_eligible: false,
        });
      }
      return {
        route: "cloudflare-workers-ai", provider: "cloudflare-workers-ai",
        model: CF_FREE_MODEL, text, tool_calls: [], web_citations: [],
        usage: {
          tokens_in: payload.usage?.prompt_tokens ?? null,
          tokens_out: payload.usage?.completion_tokens ?? null,
          total_tokens: payload.usage?.total_tokens ?? null,
        },
      };
    } catch (error) {
      if (error instanceof AgiProviderError) throw error;
      throw new AgiProviderError("Cloudflare inference failed or timed out", {
        code: error instanceof Error && error.name === "AbortError"
          ? "CLOUDFLARE_TIMEOUT" : "CLOUDFLARE_REQUEST_FAILED",
        fallback_eligible: false,
      });
    } finally {
      clearTimeout(timer);
    }
  },
};
