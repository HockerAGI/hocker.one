# Hocker ONE — Agent Architecture Recommendation

> **Version**: 1.0  
> **Date**: July 2025  
> **Topology**: 12.7L-2C (Public/Private/Protected)  
> **Status**: Architectural Decision Record

---

## Executive Summary

This document evaluates four candidate architectures for the Hocker ONE autonomous agent system — the layer that enables NOVA and the 16 AGIs to operate, self-correct, and evolve without human intermediaries. After analyzing each option against Hocker ONE's specific requirements — real-time SSE streaming, owner-gated execution, Chido approval chains, Supabase-native data, Vercel-native deployment, and GitHub-native code management — we recommend a **hybrid architecture** centered on **Supabase as the agent identity and state backbone**, with **Vercel as the execution host**, **GitHub as the code mutation surface**, and **OpenAI as the reasoning engine** — all connected through the MCP integration layer already implemented in this repository.

---

## 1. Candidate Architectures

### 1.1 GitHub App Architecture

**Concept**: A GitHub App installed on the HockerAGI/hocker.one repository. The app receives webhook events (push, PR, issue, check_run), processes them via a backend service, and takes autonomous actions through the GitHub API — creating PRs, commenting on issues, merging branches, and triggering deployments.

**Strengths**:
- Native integration with the code lifecycle: the app lives where the code lives, sees every push and PR in real time, and can act on repository events without polling.
- Built-in permission model via GitHub App installations: fine-grained repo scopes (contents, issues, pull_requests, actions, deployments) map cleanly to the owner gate's principle of least privilege.
- Webhook-driven event model eliminates the need for cron-based polling; the agent reacts instantly to repository changes.
- GitHub Actions can serve as the execution sandbox for code mutation tasks — branch creation, file editing, and commit signing happen within GitHub's own CI infrastructure, which is already trusted and auditable.
- No additional hosting cost: GitHub Apps can run their backend on any platform (including Vercel serverless functions).

**Weaknesses**:
- GitHub Apps are fundamentally **code-centric** — they understand repositories, commits, and issues, but they have no native concept of database state, user sessions, or real-time chat. For an agent that needs to query Supabase tables, manage approval queues, or stream responses to a chat UI, the GitHub App alone is insufficient.
- Webhook delivery is asynchronous and at-least-once; ordering is not guaranteed. An agent that must process events in strict sequence (like the Chido approval chain with HMAC signatures) would need its own deduplication and ordering layer.
- The GitHub API rate limit (5,000 requests/hour for installed apps) is generous but can be exhausted by agents that poll or retry aggressively.
- No native real-time communication channel: the agent cannot push SSE streams to a browser client through GitHub. All client-facing communication would require a separate hosting layer (Vercel, Supabase Edge Functions, etc.).
- Security surface: a compromised GitHub App token grants write access to the repository. The agent must be extremely careful with automated commits and merges — the owner gate and Chido approval chain exist precisely because autonomous code mutation is dangerous.

**Fit for Hocker ONE**: **Partial**. GitHub is the right surface for code mutation (creating PRs, merging branches, managing issues), but it cannot serve as the sole agent backbone. It lacks database access, real-time streaming, and session management.

---

### 1.2 OpenAI Agent Architecture

**Concept**: An OpenAI-powered agent that uses the Assistants API or Realtime API as its core reasoning loop. The agent maintains conversation threads, calls tools (functions), and streams responses to the client via SSE or WebSocket. The OpenAI API serves as both the brain and the orchestration layer.

**Strengths**:
- OpenAI's function calling and tool use is the most mature and well-documented in the industry. The Assistants API supports persistent threads, file attachments, and code interpreter — reducing the amount of custom orchestration code Hocker ONE must maintain.
- The Realtime API enables low-latency voice and text streaming, which aligns with NOVA's SSE-based chat interface. The existing `/api/nova/chat/stream` route already implements SSE with `req.signal` for client disconnect handling.
- OpenAI handles the hardest part of agent design — the reasoning loop. Instead of building custom prompt chains, tool selection, and error recovery, Hocker ONE can delegate that complexity to the model.
- Native support for structured outputs (JSON schema mode) ensures that agent responses can be validated and parsed without ambiguity, which is critical for the Chido approval chain and action execution system.

**Weaknesses**:
- OpenAI is a **stateless reasoning engine** — it has no native concept of persistence, authentication, or deployment. Every tool call that touches Supabase, Vercel, or GitHub requires custom client code (which we have built in the MCP layer).
- Vendor lock-in: building the entire agent architecture around OpenAI's API means that model changes, price increases, or API deprecations directly impact the system. The provider fallback chain in `hocker-provider-orchestrator.ts` exists precisely because single-provider dependence is risky.
- Cost: OpenAI API calls are priced per token. An autonomous agent that runs continuously — processing events, maintaining context, and executing actions — can consume millions of tokens per day. At GPT-4o pricing, this becomes expensive quickly.
- The Assistants API stores thread state on OpenAI's servers. For a system that processes owner commands, approval chains, and execution evidence, sending all context to an external service creates a data sovereignty concern.
- No native execution sandbox: when the agent decides to execute a command, modify a file, or deploy a change, it must call back to the Hocker ONE backend. OpenAI cannot run code, access databases, or modify repositories on its own.

**Fit for Hocker ONE**: **Partial**. OpenAI is the right reasoning engine for NOVA's chat and decision-making, but it cannot serve as the identity, state, or execution layer. It must be wrapped by infrastructure that handles authentication, persistence, and deployment.

---

### 1.3 Supabase App Architecture

**Concept**: A Supabase-native agent that uses the database as its primary identity, state, and coordination layer. Agent identities are rows in an `agents` table. Agent actions are rows in an `actions` table. Approval chains, execution evidence, and runtime state are all managed through Supabase's real-time subscriptions, Edge Functions, and Row Level Security (RLS). The MCP server at `mcp.supabase.com/mcp?project_ref=yvuibbcuntqpyqiuqggd` provides the agent with direct database, functions, and branching capabilities.

**Strengths**:
- **Identity as data**: an agent is a first-class entity in the database — with a UUID, configuration, capabilities, and audit trail. This is far more robust than an agent identity derived from a GitHub App ID or an OpenAI thread ID. The agent's entire lifecycle (creation, configuration, activation, deactivation, auditing) can be managed through standard database operations with RLS enforcement.
- **Real-time coordination**: Supabase Realtime (Postgres LISTEN/NOTIFY over WebSocket) allows agents to subscribe to table changes and react instantly. When a Chido approval request is created, the guardian AGI can be notified in real time without polling. When an owner command is issued, the execution queue can update immediately.
- **Row Level Security**: every agent's data access is constrained by Postgres RLS policies. An AGI that manages supply chain operations cannot read owner credentials. An AGI that handles chat cannot modify approval decisions. This is exactly the principle of least privilege that the owner gate enforces — but implemented at the database level, not just the application level.
- **Edge Functions for execution**: Supabase Edge Functions (Deno-based) can serve as the agent's execution sandbox — running approved commands, processing data, and returning results. This avoids the need for a separate compute layer.
- **MCP integration already built**: the `src/lib/mcp/mcp-supabase.ts` connector and the MCP registry in `src/lib/mcp/mcp-registry.ts` already provide the transport layer for Supabase MCP communication. The agent can query schemas, execute SQL, manage migrations, and read logs through MCP tool calls.
- **Audit trail**: every action, approval, and execution is a database row with timestamps, signatures, and evidence. This is the audit chain that the 17 audits demanded — and it's native to Supabase, not bolted on as JSON files or log entries.

**Weaknesses**:
- Supabase is a **data platform**, not a code execution platform. While Edge Functions provide compute, they are Deno-based and cannot run the Next.js application itself. The agent still needs Vercel (or another host) for the main application.
- Supabase Realtime has throughput limits (approximately 100 concurrent connections on the free tier, higher on paid plans). For an agent system with 16 AGIs each subscribing to multiple channels, connection management becomes a concern.
- Edge Functions have a 150MB memory limit and 150-second timeout. Long-running agent tasks (like a full repository scan or complex deployment) may exceed these limits.
- No native code mutation capability: Supabase cannot create Git branches, edit files, or merge PRs. For code-level actions, the agent must still call GitHub through the MCP connector.
- Database-centric design means that every agent operation requires a database round-trip. For high-frequency operations (like SSE streaming of chat tokens), this adds latency compared to direct in-memory processing.

**Fit for Hocker ONE**: **Strong (as backbone)**. Supabase should be the agent identity and state backbone — where agents live, actions are tracked, approvals are managed, and audit trails are stored. But it cannot be the sole layer; it needs Vercel for hosting and GitHub for code mutation.

---

### 1.4 Vercel App Architecture

**Concept**: A Vercel-native agent that uses Vercel's serverless functions, Edge Runtime, and deployment pipeline as its execution environment. The agent runs as Next.js API routes and server actions, with Vercel's infrastructure handling scaling, cold starts, and deployment.

**Strengths**:
- **Already the deployment target**: Hocker ONE is a Next.js application deployed on Vercel. Making the agent architecture Vercel-native means it runs in the same infrastructure, with the same environment variables, the same build pipeline, and the same monitoring. There is zero additional hosting complexity.
- **Serverless scaling**: Vercel automatically scales function instances based on traffic. An agent that receives 1 request or 10,000 requests gets the same response time without capacity planning.
- **Edge Runtime**: Vercel's Edge Runtime (based on V8 isolates, not Node.js) provides sub-millisecond cold starts and global distribution. For agent endpoints that need low latency (like the SSE stream at `/api/nova/chat/stream`), Edge Runtime is ideal.
- **Vercel MCP integration already built**: the `src/lib/mcp/mcp-vercel.ts` connector provides access to deployment status, project configuration, and environment variable management through MCP tool calls. The agent can trigger deployments, check build status, and manage project settings without leaving the Vercel ecosystem.
- **Integrated monitoring**: Vercel provides built-in function logs, runtime metrics, and deployment tracking. Agent actions are automatically observable without additional instrumentation.

**Weaknesses**:
- **Stateless by design**: Vercel serverless functions are ephemeral — they spin up, execute, and spin down. There is no persistent in-memory state between invocations. The in-memory rate limiter in `src/lib/rate-limit.ts` works for single-instance scenarios but cannot coordinate across multiple function instances. Any shared state (agent queues, approval chains, execution locks) must be externalized to Supabase or another persistence layer.
- **Execution time limits**: Vercel Hobby tier has a 10-second function timeout; Pro tier allows 60 seconds (Edge functions: 30 seconds). The agent execution pipeline — which may involve multiple LLM calls, database queries, and MCP tool invocations — can easily exceed these limits for complex operations.
- **No native scheduling**: Vercel does not provide cron-like scheduling. The `CRON_SECRET` / `HOCKER_ONE_INTERNAL_TOKEN` mechanism in the codebase suggests that cron endpoints exist, but they rely on Vercel's Cron Jobs feature (which is limited to 2 cron jobs on Hobby, unlimited on Pro).
- **No native agent identity**: Vercel does not have a concept of "agents" or "AGIs." The agent identity layer must be built entirely in application code, backed by Supabase.
- **Vendor lock-in on infrastructure**: while Next.js is portable, deep Vercel integration (Edge Runtime, Cron Jobs, Fluid Compute) creates migration friction.

**Fit for Hocker ONE**: **Strong (as execution host)**. Vercel should be where the agent code runs — the API routes, the SSE streams, the MCP connectors, and the tool execution endpoints. But it cannot be the state or identity layer; it needs Supabase for persistence.

---

## 2. Comparative Analysis

| Dimension | GitHub App | OpenAI Agent | Supabase App | Vercel App |
|---|---|---|---|---|
| **Agent Identity** | App ID + installation | Thread ID + assistant ID | Database row (agents table) | Function URL (no identity) |
| **State Persistence** | None (webhook events) | Thread state on OpenAI servers | Postgres + Realtime | Ephemeral (serverless) |
| **Real-time Streaming** | None (webhooks only) | SSE via Realtime API | WebSocket via Realtime | SSE via API routes |
| **Code Mutation** | Native (Git API) | None | None | None |
| **Database Access** | None | None | Native (Postgres + MCP) | Via Supabase client |
| **Execution Sandbox** | GitHub Actions | None (tool callbacks) | Edge Functions | Serverless functions |
| **Auth/Permissions** | GitHub App scopes | API key only | RLS + JWT + publishable/secret keys | Environment variables |
| **Audit Trail** | GitHub audit log | OpenAI usage logs | Database rows (native) | Vercel function logs |
| **Cost Model** | Free (within rate limits) | Per-token (expensive at scale) | Tiered (free → paid) | Per-function-invocation |
| **Vendor Lock-in** | GitHub API format | OpenAI API format | Postgres + Supabase SDK | Next.js + Vercel SDK |
| **MCP Integration** | Via mcp-github.ts | Via mcp-openai.ts | Via mcp-supabase.ts + remote MCP | Via mcp-vercel.ts |

---

## 3. Recommended Architecture: Supabase-Vercel Hybrid with MCP Orchestration

### 3.1 Core Principle

**The agent identity and state live in Supabase. The agent code and execution live on Vercel. The agent's reasoning comes from OpenAI. The agent's code mutations go through GitHub.** All four platforms are connected through the MCP integration layer, which serves as the universal transport and protocol bridge.

### 3.2 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     HOCKER ONE AGENT SYSTEM                  │
│                                                               │
│  ┌──────────┐    ┌──────────────┐    ┌──────────────┐        │
│  │  NOVA    │───▶│  MCP Registry │───▶│  Supabase    │        │
│  │  (Chat)  │    │  (Orchestration)│   │  (Identity +  │      │
│  └────┬─────┘    └──────┬───────┘    │   State)      │        │
│       │                 │            └──────┬───────┘        │
│       │         ┌───────┼───────┐           │                │
│       │         ▼       ▼       ▼           │                │
│       │   ┌────────┐ ┌──────┐ ┌──────┐     │                │
│       │   │ GitHub │ │Vercel│ │OpenAI│     │                │
│       │   │ MCP    │ │ MCP  │ │ MCP  │     │                │
│       │   └───┬────┘ └──┬───┘ └──┬───┘     │                │
│       │       │         │        │          │                │
│  ┌────▼───────▼─────────▼────────▼──────────▼─────┐          │
│  │              VERCEL (Execution Host)             │          │
│  │  ┌─────────────────────────────────────────┐    │          │
│  │  │  Next.js App Router                      │    │          │
│  │  │  ├── /api/nova/chat/stream (SSE)         │    │          │
│  │  │  ├── /api/mcp/status (Registry)          │    │          │
│  │  │  ├── /api/mcp/execute (Tool Calls)       │    │          │
│  │  │  ├── /api/execute (Owner Gate)            │    │          │
│  │  │  ├── /api/chido/actions/* (Approval)     │    │          │
│  │  │  └── /api/health (Monitoring)             │    │          │
│  │  └─────────────────────────────────────────┘    │          │
│  └─────────────────────────────────────────────────┘          │
│                                                               │
│  ┌─────────────────────────────────────────────────┐          │
│  │          SUPABASE (Identity + State Backbone)     │          │
│  │  ├── agents (identity, config, capabilities)     │          │
│  │  ├── actions (queue, status, evidence)           │          │
│  │  ├── approval_requests (Chido chain)             │          │
│  │  ├── approval_decisions (guardian AGI votes)     │          │
│  │  ├── execution_logs (audit trail)                │          │
│  │  ├── audit_signatures (HMAC chain)               │          │
│  │  └── Realtime subscriptions (event coordination) │          │
│  └─────────────────────────────────────────────────┘          │
│                                                               │
│  ┌──────────────┐    ┌──────────────┐                         │
│  │  GITHUB       │    │  OPENAI       │                         │
│  │  (Code Surface)│   │  (Reasoning)  │                         │
│  │  ├── PRs      │    │  ├── Chat     │                         │
│  │  ├── Branches │    │  ├── Tool Use │                         │
│  │  ├── Issues   │    │  ├── Structured│                        │
│  │  └── Deploys  │    │    Outputs    │                         │
│  └──────────────┘    └──────────────┘                         │
└─────────────────────────────────────────────────────────────┘
```

### 3.3 Layer Responsibilities

**Layer 1 — Identity & State (Supabase)**

Every AGI is a row in the `agents` table with a UUID, name, capabilities vector, configuration JSON, and status. When NOVA needs to delegate a task to a specific AGI, it queries this table. When a guardian AGI needs to approve a Chido action, the approval request and decision are rows with foreign keys to the agent identity. The audit chain (HMAC signatures, timestamps, evidence) lives in dedicated tables with RLS policies that enforce least privilege. Supabase Realtime subscriptions allow agents to listen for state changes without polling — when a new action enters the queue, when an approval is granted, or when an execution completes, the relevant agents are notified instantly.

The MCP server at `mcp.supabase.com/mcp?project_ref=yvuibbcuntqpyqiuqggd` gives NOVA direct access to database operations — schema queries, SQL execution, migration management, and project configuration. The `@supabase/server` integration (with JWKS validation and publishable/secret key authentication) ensures that every MCP call is authenticated and authorized.

**Layer 2 — Execution & Hosting (Vercel)**

All agent code runs as Next.js API routes on Vercel. The existing routes — `/api/nova/chat/stream`, `/api/execute`, `/api/mcp/execute`, `/api/chido/actions/*` — are the execution surface. When an agent decides to act, it calls one of these endpoints. When a user interacts with NOVA, the SSE stream flows through Vercel's infrastructure. When an MCP tool call needs execution, the `/api/mcp/execute` endpoint dispatches it.

The Vercel MCP connector (`mcp-vercel.ts`) allows NOVA to inspect deployment status, trigger rebuilds, and manage environment variables — all without leaving the chat interface. This is critical for the self-healing capability: if a deployment fails, NOVA can detect it, diagnose the issue, and push a fix through the GitHub MCP connector, all in one conversation.

**Layer 3 — Reasoning (OpenAI + Fallbacks)**

OpenAI provides the reasoning engine for NOVA's chat and decision-making. The existing provider orchestrator (`hocker-provider-orchestrator.ts`) already implements a fallback chain — if OpenAI is unavailable or rate-limited, the system falls back to alternative providers. This resilience is essential for an autonomous system that cannot afford to go silent when a single provider has an outage.

The OpenAI MCP connector (`mcp-openai.ts`) allows NOVA to use OpenAI capabilities through the MCP protocol, enabling tool composition across providers. For example, NOVA can use OpenAI for reasoning, then call the Supabase MCP for data, then call the GitHub MCP for code mutation — all within a single agent turn.

**Layer 4 — Code Mutation (GitHub)**

When an agent needs to modify code — creating a PR, merging a branch, or updating a file — it uses the GitHub MCP connector (`mcp-github.ts`). The owner gate and Chido approval chain ensure that no code mutation happens without explicit owner approval and guardian AGI review. The audit trail in Supabase records every mutation with before/after evidence, HMAC signatures, and the identity of the approving AGI.

GitHub webhooks (configured through the GitHub App installation) provide the event stream that triggers agent reactions — when a PR is created, when a build fails, when an issue is opened. These webhooks are processed by Vercel API routes that parse the event, look up the relevant agent in Supabase, and dispatch the action.

### 3.4 Agent Lifecycle

1. **Boot**: On application startup, the MCP registry initializes all four connectors (Supabase, Vercel, GitHub, OpenAI). Each connector authenticates using the environment variables (`SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `HOCKER_GITHUB_TOKEN`, `OPENAI_API_KEY`). The registry exposes a `/api/mcp/status` endpoint that reports connector health.

2. **Identity Resolution**: When a request arrives at `/api/nova/chat`, the system resolves the agent identity from the Supabase `agents` table. If the agent is active and has the required capability, the request proceeds. If not, it is rejected with a structured error (sanitized via `sanitize-error.ts`).

3. **Reasoning Loop**: NOVA processes the user's message through the OpenAI reasoning engine, which may invoke MCP tool calls. Each tool call is routed through the MCP registry to the appropriate connector. The registry logs the call (via `logger.ts`) and records it in the Supabase audit trail.

4. **Action Queue**: If the reasoning loop produces an action (code mutation, deployment, database change), it is placed in the Supabase action queue with a status of `pending`. The owner gate checks whether the action requires owner approval (all code mutations do, by default).

5. **Approval Chain**: For actions requiring approval, a Chido approval request is created in Supabase. Guardian AGIs are notified via Realtime subscriptions. Each guardian evaluates the action against its safety criteria and records a decision (approved/rejected) with a reason and HMAC signature.

6. **Execution**: Once approved, the action is dispatched to the appropriate MCP connector for execution. The result (success/failure/evidence) is recorded in the Supabase audit trail. If execution fails, the provider fallback chain attempts alternative approaches.

7. **Monitoring**: Throughout the lifecycle, the structured logger (`logger.ts`) records events with trace IDs for correlation. The operational alerts system (`hocker-alerts.ts`) fires notifications for anomalous conditions (high error rate, slow response, unexpected state). The health endpoint (`/api/health`) aggregates system status from all layers.

### 3.5 Security Model

The hybrid architecture enforces security at every layer:

- **Supabase RLS**: Database rows are protected by Row Level Security policies. Each agent can only access data within its authorized scope. The `SUPABASE_PUBLISHABLE_KEY` is used for client-side operations (limited scope); the `SUPABASE_SECRET_KEY` is used for admin operations (full scope, server-side only).

- **Owner Gate**: The `timingSafeEqual` comparison in the owner gate ensures that execution commands are only accepted from authenticated owners. The `HOCKER_COMMAND_HMAC_SECRET` signs all command payloads to prevent tampering.

- **Chido Approval Chain**: Every sensitive action (code mutation, deployment, database migration) requires approval from at least one guardian AGI. The approval decisions are signed with HMAC and stored with timestamps and nonces to prevent replay attacks.

- **MCP Authentication**: Each MCP connector authenticates with its respective platform using dedicated credentials. The Supabase MCP uses the project's publishable/secret keys. The GitHub MCP uses a fine-grained personal access token. The Vercel MCP uses a deployment token. The OpenAI MCP uses an API key.

- **Rate Limiting**: The in-memory sliding window rate limiter (`rate-limit.ts`) protects all public-facing endpoints from abuse. For production deployment with multiple Vercel instances, this should be upgraded to a Supabase-backed or Redis-backed rate limiter for cross-instance coordination.

- **Error Sanitization**: All public API responses are sanitized via `sanitize-error.ts` to prevent internal details (stack traces, database queries, file paths) from leaking to clients.

---

## 4. Migration Path

### Phase 1 — Current State (Complete)

All MCP connectors, structured logging, error sanitization, rate limiting, CORS management, Zod validation, shell sandbox hardening, and the Chido approval chain schemas are implemented. The `@supabase/server` integration with JWKS validation is in place. The NovaRealtimeChat component has been refactored from 1350 to 619 lines. The CSS has been split into 7 focused modules. The route definitions are centralized in the topology module.

### Phase 2 — Agent Tables in Supabase (Next)

Create the database schema that makes the architecture real:

```sql
-- Agent identity
create table agents (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  capabilities jsonb not null default '[]',
  configuration jsonb not null default '{}',
  status text not null default 'active'
    check (status in ('active', 'inactive', 'suspended', 'maintenance')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Action queue
create table actions (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references agents(id),
  type text not null,
  payload jsonb not null default '{}',
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'executing', 'completed', 'failed', 'rolled_back')),
  evidence jsonb,
  created_at timestamptz not null default now(),
  executed_at timestamptz
);

-- Chido approval chain
create table approval_requests (
  id uuid primary key default gen_random_uuid(),
  action_id uuid not null references actions(id),
  action text not null,
  target_id text,
  reason text,
  requested_by text not null default 'hocker-one',
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'expired')),
  created_at timestamptz not null default now()
);

create table approval_decisions (
  id uuid primary key default gen_random_uuid(),
  approval_request_id uuid not null references approval_requests(id),
  decision text not null check (decision in ('approved', 'rejected')),
  guardian_agi text not null,
  reason text not null default '',
  decided_by text not null default 'hocker-one',
  signature text,
  created_at timestamptz not null default now()
);

-- Audit trail with HMAC
create table audit_signatures (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  action text not null,
  timestamp timestamptz not null default now(),
  nonce text not null,
  signature text not null,
  verified boolean not null default false
);

-- Enable RLS on all tables
alter table agents enable row level security;
alter table actions enable row level security;
alter table approval_requests enable row level security;
alter table approval_decisions enable row level security;
alter table audit_signatures enable row level security;
```

### Phase 3 — Agent Runtime Integration

Wire the Supabase agent tables into the existing Next.js routes:

1. Modify `/api/nova/chat` to resolve the agent identity from Supabase before processing.
2. Modify `/api/execute` to create an action row in Supabase before executing, and update it with evidence after.
3. Modify `/api/chido/actions/approval/*` to use the Supabase tables instead of in-memory state.
4. Modify `/api/mcp/execute` to log every MCP tool call in the audit trail.
5. Add Realtime subscriptions so that NOVA's SSE stream can push agent events to the client in real time.

### Phase 4 — GitHub App Installation

1. Create a GitHub App for Hocker ONE with the following permissions:
   - Contents: read/write (for code mutation)
   - Pull requests: read/write (for PR management)
   - Issues: read/write (for issue tracking)
   - Actions: read (for CI status)
   - Deployments: read/write (for deployment management)

2. Install the app on the HockerAGI/hocker.one repository.

3. Create a webhook endpoint at `/api/github/webhook` that processes GitHub events and dispatches them to the appropriate agent.

4. Configure the GitHub MCP connector to use the GitHub App's installation token instead of a personal access token (more secure, auto-rotating).

### Phase 5 — Autonomous Operation

1. Enable NOVA to trigger its own actions through the approval chain (with owner override capability).
2. Implement self-healing: when a deployment fails, NOVA reads the Vercel build logs via MCP, diagnoses the issue, creates a fix branch via GitHub MCP, opens a PR, and requests owner approval.
3. Implement proactive monitoring: NOVA subscribes to Supabase Realtime for system health events and can take preventive action before issues escalate.
4. Implement agent-to-agent communication: AGIs can delegate tasks to each other through the action queue, with full audit trail and approval chain.

---

## 5. Key Design Decisions

### 5.1 Why Supabase as Backbone (Not GitHub or OpenAI)

The fundamental insight is that Hocker ONE's agents need **persistent, queryable, real-time state** with **fine-grained access control**. GitHub provides state (repositories, issues, PRs) but only for code-related entities. OpenAI provides state (threads, assistants) but only within its API. Supabase provides a general-purpose, real-time, RLS-protected database that can model any entity — agents, actions, approvals, audits, configurations, evidence. This generality is essential because Hocker ONE's domain is not just code, not just chat, but the full operational lifecycle of an autonomous system.

### 5.2 Why MCP as the Orchestration Protocol

MCP (Model Context Protocol) is the emerging standard for AI tool integration. By building the agent orchestration layer on MCP, Hocker ONE gains:

- **Protocol compatibility**: any MCP-compatible AI tool (Cursor, Claude, Copilot) can connect to Hocker ONE's Supabase, Vercel, GitHub, and OpenAI connectors without custom integration code.
- **Tool composability**: NOVA can chain MCP tool calls across providers — query Supabase, then push to GitHub, then deploy on Vercel — in a single reasoning turn.
- **Future-proofing**: as new MCP-compatible services emerge (monitoring, payment, communication), they can be added to the registry without architectural changes.
- **Auditability**: every MCP call is logged with trace IDs, enabling full reconstruction of agent behavior for debugging and compliance.

### 5.3 Why Not a Single-Platform Architecture

No single platform provides all four capabilities that Hocker ONE requires:

| Capability | Supabase | Vercel | GitHub | OpenAI |
|---|---|---|---|---|
| Persistent state | ✅ | ❌ | ❌ | ❌ |
| Real-time streaming | ✅ (Realtime) | ✅ (SSE) | ❌ | ✅ (Realtime API) |
| Code mutation | ❌ | ❌ | ✅ | ❌ |
| Database operations | ✅ | ❌ | ❌ | ❌ |
| Reasoning engine | ❌ | ❌ | ❌ | ✅ |
| Deployment pipeline | ❌ | ✅ | ❌ | ❌ |
| Fine-grained access | ✅ (RLS) | ❌ | ✅ (scopes) | ❌ |

Only by combining all four — with MCP as the glue — does Hocker ONE achieve full agent autonomy.

---

## 6. Risk Mitigation

| Risk | Mitigation |
|---|---|
| Single Supabase outage takes down all agent state | Implement Supabase Point-in-Time Recovery (PITR) and read replicas. Cache critical agent state in Vercel Edge Config for degraded-mode operation. |
| OpenAI API outage disables reasoning | Provider fallback chain in `hocker-provider-orchestrator.ts` routes to alternative LLMs (Anthropic, Google, local models). |
| GitHub App token compromise | Use fine-grained tokens with minimal scopes. Rotate tokens via Vercel environment variables. Audit all GitHub API calls in Supabase. |
| MCP tool call injection | Zod validation schemas on all MCP execute endpoints. Shell sandbox hardening blocks dangerous patterns. Rate limiting prevents bulk tool calls. |
| Agent runaway (infinite loop of actions) | Global execution lock (`agi-queue-lock`) prevents concurrent action execution. Action count limits per agent per time window. Owner can suspend any agent via the /owner interface. |
| Data exfiltration through MCP | Error sanitization removes internal details from all responses. RLS policies prevent cross-agent data access. MCP connectors use least-privilege credentials. |

---

## 7. Conclusion

The recommended architecture is a **Supabase-Vercel hybrid with MCP orchestration**, where Supabase provides identity and state, Vercel provides execution and hosting, OpenAI provides reasoning, and GitHub provides code mutation. This architecture aligns with the existing codebase (all four MCP connectors are already implemented), satisfies the 17 audit requirements (structured logging, error sanitization, Zod validation, HMAC audit chains, owner gate, Chido approval), and enables the autonomous operation that Hocker ONE was designed to deliver.

The migration path is incremental — starting with Supabase agent tables, then wiring them into existing routes, then installing the GitHub App, then enabling full autonomous operation. Each phase delivers value independently and can be validated before proceeding to the next.

---

*Document generated as part of the Full Audit Corrections + MCP Integration initiative for Hocker ONE (HockerAGI/hocker.one).*
