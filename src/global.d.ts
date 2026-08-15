/* Hocker ONE — Global Type Declarations */

/* eslint-disable @typescript-eslint/no-unused-vars */

declare namespace NodeJS {
  interface ProcessEnv {
    /* Supabase */
    NEXT_PUBLIC_SUPABASE_URL?: string;
    NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
    SUPABASE_URL?: string;
    SUPABASE_SERVICE_ROLE_KEY?: string;
    SUPABASE_PUBLISHABLE_KEY?: string;
    SUPABASE_SECRET_KEY?: string;
    SUPABASE_JWKS_URL?: string;

    /* NOVA / Orchestration */
    NOVA_AGI_URL?: string;
    NOVA_AGI_HEALTH_URL?: string;
    NOVA_API_KEY?: string;
    NOVA_ORCHESTRATOR_KEY?: string;
    ORCHESTRATOR_BASE_URL?: string;

    /* Hocker Core */
    HOCKER_AUDIT_SECRET?: string;
    HOCKER_COMMAND_HMAC_SECRET?: string;
    HOCKER_ONE_INTERNAL_TOKEN?: string;
    HOCKER_OWNER_ACTION_KEY?: string;
    HOCKER_WORKSPACE_ROOT?: string;
    CRON_SECRET?: string;
    ALLOW_LOCAL_COMMANDS?: string;
    ALLOW_WRITE_COMMANDS?: string;

    /* Client-Side / Public */
    NEXT_PUBLIC_APP_URL?: string;
    NEXT_PUBLIC_SITE_URL?: string;
    NEXT_PUBLIC_HOCKER_ONE_URL?: string;

    /* Vercel */
    VERCEL_TOKEN?: string;
    VERCEL_PROJECT_ID?: string;
    VERCEL_TEAM_ID?: string;
    VERCEL_MCP_URL?: string;
    VERCEL_MCP_AUTH_TOKEN?: string;

    /* GitHub */
    HOCKER_GITHUB_TOKEN?: string;
    GITHUB_TOKEN?: string;
    GH_TOKEN?: string;
    GITHUB_OWNER?: string;
    GITHUB_REPO?: string;
    GITHUB_MCP_URL?: string;

    /* OpenAI */
    OPENAI_API_KEY?: string;
    OPENAI_ORG_ID?: string;
    OPENAI_MCP_URL?: string;
    OPENAI_MCP_AUTH_TOKEN?: string;
    OPENAI_DEFAULT_MODEL?: string;

    /* Supabase MCP */
    SUPABASE_PROJECT_REF?: string;
    SUPABASE_MCP_URL?: string;

    /* Logging & Rate Limiting */
    LOG_LEVEL?: string;
    LOG_FORMAT?: string;
    ALLOWED_ORIGINS?: string;

    /* Langfuse */
    LANGFUSE_PUBLIC_KEY?: string;
    LANGFUSE_SECRET_KEY?: string;
    LANGFUSE_BASE_URL?: string;

    /* Trigger.dev */
    TRIGGER_PROJECT_ID?: string;
    TRIGGER_SECRET_KEY?: string;
  }
}

declare interface Window {
  /* PWA beforeinstallprompt */
  beforeinstallpromptEvent?: BeforeInstallPromptEvent;
}

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export {};