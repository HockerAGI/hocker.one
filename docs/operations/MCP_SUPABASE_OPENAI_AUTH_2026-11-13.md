# MCP Supabase 401 / OpenAI 404 — Corrected auth and endpoint policy
Date: 2026-11-13 (Tijuana). Scope: Hocker One only; `nova.agi` and `hocker-node-agent` read-only references.

## Evidence at start
- Hocker One `main` was `88953c3d239105c83b9f6792a5f048945a45b785` with Vercel Production READY. Previous authenticated Owner GitHub MCP `list_commits` was certified with `mcp.executed=1`, `failed=0`, SHA match and no material action.
- In that same production request, the Supabase administrative MCP initialization returned HTTP 401 and OpenAI MCP initialization returned HTTP 404. These did not prevent the GitHub tool read.

## Root cause
- Supabase hosted management MCP `https://mcp.supabase.com/mcp` requires a platform OAuth grant or a purpose-scoped personal access token (PAT) for browserless environments. The previous code used a Supabase Data API publishable or secret key as a hosted MCP credential, a different credential type.
- OpenAI's `https://api.openai.com/v1/mcp` is not a hosted API administration MCP. The official `https://developers.openai.com/mcp` is a public read-only *documentation* server and does not execute models, create assistants or manage conversations.

## Policy implemented
- The hosted Supabase connector is disabled unless a dedicated `SUPABASE_MCP_ACCESS_TOKEN` is provided securely. It is *never* substituted from `SUPABASE_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY` or a publishable/browser key.
- The Supabase endpoint host is pinned to `https://mcp.supabase.com/mcp`. Its project is derived from and checked against `NEXT_PUBLIC_SUPABASE_URL`; URL parameters are always `project_ref`, `read_only=true`, `features=database,debugging,docs`. Arbitrary URL overrides, cross-project IDs, query strings and credentials in URLs are blocked.
- OpenAI documentation MCP is a separately opt-in, no-API-key connector (`OPENAI_DOCS_MCP_ENABLED=true`). It uses only the official developer docs endpoint and permits `search_openai_docs` / `lookup_page` in the NOVA read-only policy. Existing OpenAI model API / Vercel AI Gateway providers stay unchanged.
- Both connectors fail closed and report not configured when authorization or exact trusted origin is missing. This prevents recurring misleading errors while preserving working GitHub MCP, Owner Gate, and existing API-based Supabase operations.

## Gates before claiming live activation
1. Review all changes in PR; exact-head regression, typecheck, lint, build, dependency audit and Vercel Preview must pass; inspect code-review findings.
2. Provision a fresh **project-scoped least-privilege** Supabase platform PAT directly in Vercel Preview if and only if the owner authorizes it. Never paste it into chat, GitHub or logs. A Data API secret key is not a substitute.
3. Make an authenticated, read-only `supabase.list_tables` / `supabase.get_advisors` query; verify trace, project scoping, `read_only=true`, and zero writes. A 401 is not a successful connection.
4. Enable `OPENAI_DOCS_MCP_ENABLED=true` only in approved Preview first. Verify public docs tool discovery and one real read of a documentation page. It is *not* model inference.
5. Change production flags only with acceptance evidence. Keep the global AGI zero-credit switch disabled, maintain Owner Gate and 16 AGIs.
6. This PR does not deploy or certify `nova.agi`, `hocker-node-agent`, or persistent task execution. Refer to Hocker One issue #306 and nova.agi issue #31.

Official sources:
- https://supabase.com/docs/guides/ai-tools/mcp
- https://developers.openai.com/learn/docs-mcp

## Current result
Code-level correction only until fresh real connector traces are observed. No new credentials, subscriptions or Supabase schema changes were performed.