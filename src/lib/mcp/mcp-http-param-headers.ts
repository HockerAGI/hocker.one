/**
 * MCP 2026-07-28 Streamable HTTP parameter headers.
 *
 * Only x-mcp-header annotations from the tool's advertised inputSchema may
 * become outbound headers. Reject malformed annotations rather than
 * forwarding arbitrary model-provided keys or header names.
 */
export type McpParamHeader = {
  name: string;
  path: string[];
  type: "string" | "integer" | "boolean";
};

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown> : null;
}
const HEADER_TOKEN = /^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/;

export function parseMcpParamAnnotations(schema: Record<string, unknown>): McpParamHeader[] {
  const result: McpParamHeader[] = [];
  const names = new Set<string>();

  function walk(value: unknown, path: string[], reachable: boolean, depth: number) {
    if (depth > 16) throw new Error("MCP_TOOL_HEADER_SCHEMA_TOO_DEEP");
    const node = record(value);
    if (!node) return;

    if (Object.hasOwn(node, "x-mcp-header")) {
      const headerName = node["x-mcp-header"];
      const type = node.type;
      if (!reachable || !path.length || typeof headerName !== "string" ||
          !headerName || !HEADER_TOKEN.test(headerName) ||
          !["string","integer","boolean"].includes(String(type)) ||
          names.has(headerName.toLowerCase()) || result.length >= 24) {
        throw new Error("MCP_INVALID_TOOL_HEADER_ANNOTATION");
      }
      names.add(headerName.toLowerCase());
      result.push({
        name: headerName, path,
        type: type as McpParamHeader["type"],
      });
    }

    for (const [key, child] of Object.entries(node)) {
      if (key === "properties") {
        const props = record(child);
        if (props && reachable) {
          for (const [name, nested] of Object.entries(props)) {
            walk(nested, [...path, name], true, depth + 1);
          }
        } else {
          walk(child, path, false, depth + 1);
        }
      } else if (key !== "x-mcp-header" && key !== "description" && key !== "examples" &&
                 typeof child === "object" && child !== null) {
        if (Array.isArray(child)) {
          for (const item of child) walk(item, path, false, depth + 1);
        } else {
          walk(child, path, false, depth + 1);
        }
      }
    }
  }

  walk(schema, [], true, 0);
  return result;
}

export function encodeMcpHttpHeaderValue(input: string): string {
  // Includes the HTTP field-value grammar and avoids ambiguous sentinels.
  const safe = /^[\x20-\x7E\t]*$/.test(input) &&
    input.trim() === input && !/^=\?base64\?.*\?=$/.test(input);
  return safe ? input : `=?base64?${Buffer.from(input,"utf8").toString("base64")}?=`;
}

export function mcpParamHeaders(
  annotations: McpParamHeader[],
  args: Record<string, unknown>,
): Record<string, string> {
  const headers: Record<string, string> = {};
  for (const annotation of annotations) {
    let value: unknown = args;
    for (const key of annotation.path) {
      const at = record(value);
      if (!at || !Object.hasOwn(at, key)) { value = undefined; break; }
      value = at[key];
    }
    if (value === undefined || value === null) continue;

    if (annotation.type === "string" && typeof value !== "string") {
      throw new Error("MCP_TOOL_HEADER_TYPE_MISMATCH");
    }
    if (annotation.type === "boolean" && typeof value !== "boolean") {
      throw new Error("MCP_TOOL_HEADER_TYPE_MISMATCH");
    }
    if (annotation.type === "integer" &&
        (typeof value !== "number" || !Number.isSafeInteger(value))) {
      throw new Error("MCP_TOOL_HEADER_TYPE_MISMATCH");
    }
    headers[`Mcp-Param-${annotation.name}`] = encodeMcpHttpHeaderValue(String(value));
  }
  return headers;
}
