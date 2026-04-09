export const HOCKER_PROJECT_ID = "hocker-one" as const;
export type ProjectId = typeof HOCKER_PROJECT_ID;

const HOCKER_NODE_ID = "hocker-agi" as const;
export type NodeId = typeof HOCKER_NODE_ID;

const LEGACY_PROJECT_ALIASES: Record<string, ProjectId> = {
  "hocker one": HOCKER_PROJECT_ID,
  "hocker-one": HOCKER_PROJECT_ID,
  "hocker_one": HOCKER_PROJECT_ID,
};

function normalizeKey(input: string): string {
  return input.trim().toLowerCase().replace(/\s+/g, "-");
}

export function normalizeProjectId(input: string | null | undefined): ProjectId {
  const raw = String(input ?? "").trim();

  if (!raw) {
    throw new Error("HOCKER_PROJECT_ID es obligatorio y debe ser 'hocker-one'.");
  }

  const normalized = normalizeKey(raw);
  const alias = LEGACY_PROJECT_ALIASES[normalized];

  if (alias) return alias;

  if (normalized !== HOCKER_PROJECT_ID) {
    throw new Error(`ProjectId inválido: "${raw}". Usa exactamente "hocker-one".`);
  }

  return HOCKER_PROJECT_ID;
}

export function normalizeNodeId(input: string | null | undefined): NodeId {
  const raw = String(input ?? "").trim();

  if (!raw) {
    return HOCKER_NODE_ID;
  }

  const normalized = normalizeKey(raw);

  if (!normalized) {
    return HOCKER_NODE_ID;
  }

  return normalized as NodeId;
}

export function getProjectId(): ProjectId {
  return normalizeProjectId(
    process.env.NEXT_PUBLIC_HOCKER_PROJECT_ID ??
      process.env.HOCKER_PROJECT_ID ??
      HOCKER_PROJECT_ID,
  );
}

export function getNodeId(): NodeId {
  return normalizeNodeId(
    process.env.NEXT_PUBLIC_HOCKER_DEFAULT_NODE_ID ??
      process.env.HOCKER_DEFAULT_NODE_ID ??
      HOCKER_NODE_ID,
  );
}