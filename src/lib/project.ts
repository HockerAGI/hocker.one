export const HOCKER_PROJECT_ID = "hocker-one" as const;
export type ProjectId = typeof HOCKER_PROJECT_ID;

export const HOCKER_DEFAULT_NODE_ID = "hocker-node-1" as const;
export type NodeId = string;

export const defaultProjectId: ProjectId = HOCKER_PROJECT_ID;
export const defaultNodeId: NodeId = HOCKER_DEFAULT_NODE_ID;

const PROJECT_ALIASES: Record<string, ProjectId> = {
  "hocker one": HOCKER_PROJECT_ID,
  "hocker-one": HOCKER_PROJECT_ID,
  "hocker_one": HOCKER_PROJECT_ID,
  global: HOCKER_PROJECT_ID,
};

function normalizeKey(input: string): string {
  return input.trim().toLowerCase().replace(/\s+/g, "-");
}

export function normalizeProjectId(input: string | null | undefined): ProjectId {
  const raw = String(input ?? "").trim();

  if (!raw) {
    return HOCKER_PROJECT_ID;
  }

  const normalized = normalizeKey(raw);
  const alias = PROJECT_ALIASES[normalized];

  if (alias) return alias;

  if (normalized !== HOCKER_PROJECT_ID) {
    throw new Error(`ProjectId inválido: "${raw}". Usa "hocker-one" o un alias permitido.`);
  }

  return HOCKER_PROJECT_ID;
}

export function normalizeNodeId(input: string | null | undefined): NodeId {
  const raw = String(input ?? "").trim();
  if (!raw) return HOCKER_DEFAULT_NODE_ID;

  const normalized = normalizeKey(raw);
  return normalized || HOCKER_DEFAULT_NODE_ID;
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
      HOCKER_DEFAULT_NODE_ID,
  );
}