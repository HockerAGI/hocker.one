import { createHash } from "node:crypto";
import { HOCKER_AGI_CANON, HOCKER_AGI_CANON_VERSION, HOCKER_AGI_IDS } from "@/lib/hocker-agi-canon";
import {
  HOCKER_AGI_ALIASES,
  agiToolKeys,
  canonicalAgiId,
  canonicalAgiMeta,
  canonicalAgentRows,
} from "@/lib/hocker-agi-operational";
import { createAdminSupabase } from "@/lib/supabase-admin";

export type RuntimeToolStatusKind =
  | "configured"
  | "connected"
  | "partial"
  | "missing"
  | "blocked"
  | "missing_key"
  | "missing_code";

type JsonObject = Record<string, unknown>;

type RuntimeToolCategory =
  | "core"
  | "code"
  | "data"
  | "cloud"
  | "ads"
  | "payments"
  | "domain"
  | "security"
  | "media"
  | "jobs"
  | "observability"
  | "notifications";

type RuntimeToolImplementation =
  | "executor_ready"
  | "code_only"
  | "partial_env_detected"
  | "missing_credentials"
  | "missing_key"
  | "missing_code"
  | "configured"
  | "connected"
  | "partial"
  | "missing"
  | "blocked";

type EnvGroup = {
  label: string;
  any_of: string[];
  required?: boolean;
};

export type RuntimeTool = {
  tool_key: string;
  name: string;
  provider: string;
  category: RuntimeToolCategory;
  required_env: string[];
  optional_env?: string[];
  env_groups?: EnvGroup[];
  supports_read: boolean;
  supports_write: boolean;
  supports_realtime: boolean;
  implementation_status: RuntimeToolImplementation;
  owner_gate_required: boolean;
  dry_run_first: boolean;
  safe_note: string;
  next_step: string;
};

export type RuntimeToolStatus = RuntimeTool & {
  status: RuntimeToolStatusKind;
  status_label: "Conectado" | "Parcial" | "Falta llave" | "Falta código" | "Bloqueado";
  status_hint: string;
  configured_env_count: number;
  env_present: string[];
  missing_env: string[];
  missing_groups: string[];
  alias_hits: Record<string, string[]>;
  execution_enabled: boolean;
};

const TOOL_CATALOG: RuntimeTool[] = [
  {
    tool_key: "ai_gateway",
    name: "Vercel AI Gateway",
    provider: "Vercel",
    category: "core",
    required_env: [],
    env_groups: [
      {
        label: "AI Gateway credential",
        any_of: ["VERCEL_OIDC_TOKEN", "AI_GATEWAY_API_KEY"],
        required: true,
      },
    ],
    optional_env: ["AI_GATEWAY_MODEL_AUTO", "AI_GATEWAY_MODEL_FAST"],
    supports_read: true,
    supports_write: false,
    supports_realtime: true,
    dry_run_first: false,
    owner_gate_required: false,
    implementation_status: "executor_ready",
    next_step: "Validar una inferencia real y conservar evidencia de proveedor, modelo y hashes.",
    safe_note: "Inferencia serverless real. No habilita acciones externas.",
  },
  {
    tool_key: "nova_orchestrator",
    name: "NOVA Orquestador",
    provider: "NOVA",
    category: "core",
    required_env: ["NOVA_AGI_URL", "NOVA_ORCHESTRATOR_KEY"],
    supports_read: true,
    supports_write: true,
    supports_realtime: true,
    dry_run_first: true,
    owner_gate_required: true,
    implementation_status: "code_only",
    next_step: "Mantener como upstream opcional; el runtime serverless usa AI Gateway como ruta verificada.",
    safe_note: "Chat, criterio, ruteo y decisiones bajo control.",
  },
  {
    tool_key: "supabase",
    name: "Supabase",
    provider: "Supabase",
    category: "data",
    required_env: ["SUPABASE_SERVICE_ROLE_KEY"],
    optional_env: [
      "SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    ],
    supports_read: true,
    supports_write: true,
    supports_realtime: true,
    dry_run_first: true,
    owner_gate_required: true,
    implementation_status: "executor_ready",
    next_step: "Usar únicamente RPCs y escrituras auditadas con RLS, idempotencia y Owner Gate.",
    safe_note: "Datos, memoria, tareas, auditoría y estado.",
  },
  {
    tool_key: "github",
    name: "GitHub",
    provider: "GitHub",
    category: "code",
    required_env: ["HOCKER_GITHUB_TOKEN"],
    optional_env: [
      "GITHUB_TOKEN",
      "GH_TOKEN",
      "GITHUB_APP_ID",
      "GITHUB_INSTALLATION_ID",
      "HOCKER_GITHUB_REPO",
      "GITHUB_REPOSITORY",
    ],
    supports_read: true,
    supports_write: true,
    supports_realtime: false,
    dry_run_first: true,
    owner_gate_required: true,
    implementation_status: "executor_ready",
    next_step: "Usar ramas y PRs; nunca escribir directamente a main.",
    safe_note: "Repositorio, código, issues, PR y evidencia.",
  },
] as RuntimeTool[];
