const FALLBACK_PROJECT = "global";
const CLOUD_NODE_ID = "hocker-agi";

const LEGACY_PROJECT_ALIASES: Record<string, string> = {
  "hocker-one": "global",
};

function cleanId(input: string | null | undefined, fallback: string): string {
  const raw = String(input ?? "").trim().toLowerCase();
  if (!raw) return fallback;

  const cleaned = raw.replace(/\s+/g, "-").replace(/[^a-z0-9._-]/g, "");
  if (!cleaned) return fallback;

  return LEGACY_PROJECT_ALIASES[cleaned] ?? cleaned;
}

export function defaultProjectId(): string {
  return normalizeProjectId(
    process.env.NEXT_PUBLIC_HOCKER_PROJECT_ID ??
      process.env.NEXT_PUBLIC_DEFAULT_PROJECT_ID ??
      FALLBACK_PROJECT,
  );
}

export function defaultNodeId(): string {
  return normalizeNodeId(
    process.env.NEXT_PUBLIC_HOCKER_DEFAULT_NODE_ID ??
      process.env.HOCKER_DEFAULT_NODE_ID ??
      CLOUD_NODE_ID,
  );
}

export function normalizeNodeId(input: string | null | undefined): string {
  return cleanId(input, CLOUD_NODE_ID);
}

export function normalizeProjectId(input: string | null | undefined): string {
  return cleanId(input, FALLBACK_PROJECT);
}