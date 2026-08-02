export type IntegrationLike = {
  tool_key: string;
  name: string;
  provider?: string;
  category?: string;
  status: string;
  status_label?: string;
  status_hint?: string;
  supports_read?: boolean;
  supports_write?: boolean;
  supports_realtime?: boolean;
  configured_env_count?: number;
  env_present?: string[];
  missing_env?: string[];
  missing_groups?: string[];
  safe_note?: string;
  next_step?: string;
  execution_enabled?: boolean;
  verified?: boolean;
  last_verified_at?: string | null;
  latency_ms?: number | null;
  check_message?: string | null;
};

export type VerifiedServiceLike = {
  status: "online" | "configured" | "offline" | "unknown";
  checked_at: string;
  last_verified_at: string | null;
  detail: string;
};

export type AgiRuntimeSummaryLike = {
  ok?: boolean;
  project_id?: string;
  checked_at?: string;
  schema_ready?: boolean;
  catalog_synced?: boolean;
  sync_error?: string | null;
  counts?: {
    agents?: number;
    tasks?: number;
    runs?: number;
    actions?: number;
    feedback?: number;
    threads?: number;
    tools_total?: number;
    tools_configured?: number;
    tools_connected?: number;
    tools_partial?: number;
    tools_missing_key?: number;
    tools_missing_code?: number;
    tools_blocked?: number;
    tools_missing?: number;
  };
  service_status?: {
    nova?: VerifiedServiceLike;
    supabase?: VerifiedServiceLike;
  };
  integrations?: IntegrationLike[];
  recent_actions?: unknown[];
  message?: string;
  error?: string;
};
