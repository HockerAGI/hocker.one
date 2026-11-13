# MCP Provider Endpoint Reconciliation — HOCKER ONE

Date: 2026-11-13 (America/Tijuana). Scope: hocker.one; other repositories read-only.

## Incident evidence and design
- Previous GitHub MCP default https://api.github.com/mcp produced HTTP 404 in Preview. Official hosted GitHub MCP: https://api.githubcopilot.com/mcp/ . Candidate uses https://api.githubcopilot.com/mcp/readonly with X-MCP-Readonly: true; a GitHub token is never sent to a non-GitHub-owned URL.
- MCP streamable HTTP may reply as SSE. Client now reads bounded JSON-RPC frames matching the request ID and negotiates modern/legacy protocol on explicit incompatibility. Authentication errors must not be silently retried as another protocol era.
- Previous Vercel MCP default https://api.vercel.com/v1/mcp produced HTTP 404. Official https://mcp.vercel.com requires OAuth and approved clients. VERCEL_TOKEN remains a REST API token and is never used as Vercel MCP OAuth credentials. A separate authorized VERCEL_MCP_OAUTH_TOKEN is needed; none was created here.
- OpenAI's generic REST API does not expose model-management MCP at https://api.openai.com/v1/mcp. Its official documentation MCP is https://developers.openai.com/mcp and documentation-only. OpenAI model calls should use their REST/SDK adapter and the current generic MCP must not be claimed operational.

## Evidence required for certification
1. Exact-head GitHub CI, typecheck, lint, build, dependency audit, code review, Vercel Preview READY.
2. Real authenticated GitHub read-only tool call scoped to HockerAGI/hocker.one, with persisted trace and zero external writes.
3. Explicit OAuth authorization before Vercel MCP connectivity can be declared READY; existing Vercel REST tools are separate.
4. Never bypass Hocker One Owner Gate for write operations; fixed read-only GitHub endpoint cannot execute writes.
5. Dedicated NOVA health/ready, fresh nodes, worker tick and rollback are tracked independently in issue #306 / nova.agi issue #31.

Code readiness is not production/AGI runtime E2E certification. No credentials are stored in this document.
