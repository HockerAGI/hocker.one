import {
  AgiProviderError,
  envValue,
  timeoutMs,
  type AgiCompletionInput,
  type AgiModelProvider,
  type AgiProviderResult,
  type AgiToolCall,
  type AgiToolResult,
  type AgiNativeTool,
  type AgiWebCitation,
} from "@/lib/agi-model-providers/types";

type OpenAIResponse = {
  output?: Array<{
    type?: string;
    id?: string;
    call_id?: string;
    name?: string;
    arguments?: string | Record<string, unknown>;
    content?: Array<{ type?: string; text?: string }>;
  }>;
  output_text?: string;
  usage?: { input_tokens?: number; output_tokens?: number; total_tokens?: number };
  error?: { message?: string; code?: string };
};



function wireTools(tools: AgiNativeTool[] | undefined): Array<Record<string, unknown>> | undefined {
  if (!tools?.length) return undefined;
  return tools.slice(0, 32).map((tool) => ({
    type: "function",
    name: tool.name,
    description: tool.description,
    parameters: tool.parameters,
    strict: false,
  }));
}

function parseToolCalls(payload: OpenAIResponse, tools: AgiNativeTool[] | undefined): AgiToolCall[] {
  const byName = new Map((tools ?? []).map((tool) => [tool.name, tool]));
  return (payload.output ?? []).filter((item) => item.type === "function_call").slice(0, 8).flatMap((item) => {
    const tool = byName.get(String(item.name ?? ""));
    if (!tool) return [];
    let args: Record<string, unknown> = {};
    try {
      args = typeof item.arguments === "string" ? JSON.parse(item.arguments) as Record<string, unknown> : (item.arguments ?? {});
    } catch {
      return [];
    }
    return [{
      id: String(item.call_id ?? item.id ?? `call_${Date.now()}`),
      name: tool.name,
      qualified_name: tool.qualified_name,
      args,
    }];
  });
}


function wireWebSearch(input: AgiCompletionInput): Record<string, unknown> | null {
  if (!input.web_search) return null;
  const tool: Record<string, unknown> = { type: "web_search" };
  if (input.web_allowed_domains?.length) tool.filters = { allowed_domains: input.web_allowed_domains.slice(0, 100) };
  else if (input.web_blocked_domains?.length) tool.filters = { blocked_domains: input.web_blocked_domains.slice(0, 100) };
  return tool;
}

function extractWebCitations(payload: OpenAIResponse): AgiWebCitation[] {
  const out: AgiWebCitation[] = [];
  for (const item of payload.output ?? []) {
    for (const part of item.content ?? []) {
      const annotations = (part as any).annotations;
      if (!Array.isArray(annotations)) continue;
      for (const annotation of annotations) {
        if (annotation?.type !== "url_citation" || typeof annotation.url !== "string") continue;
        out.push({
          url: annotation.url,
          title: typeof annotation.title === "string" ? annotation.title : undefined,
          start_index: typeof annotation.start_index === "number" ? annotation.start_index : undefined,
          end_index: typeof annotation.end_index === "number" ? annotation.end_index : undefined,
          provider: "openai",
        });
      }
    }
  }
  return out.filter((item,index,self)=>self.findIndex((x)=>x.url===item.url&&x.start_index===item.start_index&&x.end_index===item.end_index)===index).slice(0,100);
}

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
          input: [
            ...messages,
            ...(input.tool_calls ?? []).map((call) => ({
              type: "function_call",
              call_id: call.id,
              name: call.name,
              arguments: JSON.stringify(call.args),
            })),
            ...(input.tool_results ?? []).map((result) => ({
              type: "function_call_output",
              call_id: result.id,
              output: JSON.stringify(result.result),
            })),
          ],
          tools: [
            ...(wireTools(input.tools) ?? []),
            ...(wireWebSearch(input) ? [wireWebSearch(input)!] : []),
          ],

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
      const toolCalls = parseToolCalls(payload, input.tools);
      const webCitations = extractWebCitations(payload);
      const text = extractText(payload);
      if (!text && toolCalls.length === 0) throw new AgiProviderError("OpenAI devolvió respuesta vacía", { code: "OPENAI_EMPTY_RESPONSE" });
      return {
        route: "openai-direct",
        provider: "openai",
        model: model(),
        text,
        tool_calls: toolCalls,
        web_citations: webCitations,
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
