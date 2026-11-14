/**
 * Fail-closed, pure outbound endpoint policy for public Docs and private
 * Supabase hosted MCP. No credentials are accessed from this module.
 */
const PROJECT_REF = /^[a-z0-9]{20}$/;
const SUPABASE_MCP_BASE_URL = "https://mcp.supabase.com/mcp";
const OPENAI_DOCS_MCP_URL = "https://developers.openai.com/mcp";

export function extractSupabaseProjectRef(url: string): string {
  try {
    const parsed = new URL(url);
    const match = /^([a-z0-9]{20})\.supabase\.co$/.exec(parsed.hostname);
    return parsed.protocol === "https:" && parsed.pathname === "/" && !parsed.username &&
      !parsed.password && !parsed.search && !parsed.hash ? (match?.[1] ?? "") : "";
  } catch { return ""; }
}

export function trustedSupabaseMcpUrl(input: {
  supabaseUrl: string;
  projectRef?: string;
  mcpServerUrl?: string;
}): string {
  const fromUrl = extractSupabaseProjectRef(input.supabaseUrl);
  const explicit = String(input.projectRef ?? "").trim();
  if (!fromUrl || (explicit && explicit !== fromUrl) || !PROJECT_REF.test(fromUrl)) {
    throw new Error("SUPABASE_MCP_PROJECT_SCOPE_INVALID");
  }
  const raw = new URL(input.mcpServerUrl || SUPABASE_MCP_BASE_URL);
  if (raw.origin !== "https://mcp.supabase.com" || raw.pathname !== "/mcp" ||
      raw.username || raw.password || raw.search || raw.hash) {
    throw new Error("SUPABASE_MCP_UNTRUSTED_ENDPOINT");
  }
  raw.searchParams.set("project_ref", fromUrl);
  raw.searchParams.set("read_only", "true");
  raw.searchParams.set("features", "database,debugging,docs");
  return raw.toString();
}

export function trustedOpenAIDocsMcpUrl(override?: string): string {
  const url = new URL(override || OPENAI_DOCS_MCP_URL);
  if (url.origin !== "https://developers.openai.com" ||
      url.pathname !== "/mcp" || url.username || url.password ||
      url.search || url.hash) {
    throw new Error("OPENAI_DOCS_MCP_UNTRUSTED_ENDPOINT");
  }
  return url.toString();
}
