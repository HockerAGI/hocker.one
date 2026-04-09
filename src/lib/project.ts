export const HOCKER_PROJECT_ID = "hocker-one" as const;
export type ProjectId = typeof HOCKER_PROJECT_ID;

export const HOCKER_NODE_ID = "hocker-agi" as const;
export type NodeId = typeof HOCKER_NODE_ID;

// 👇 FIX: exports que tu app espera
export const defaultProjectId: ProjectId = HOCKER_PROJECT_ID;
export const defaultNodeId: NodeId = HOCKER_NODE_ID;

function normalizeKey(input: string): string {
  return input.trim().toLowerCase().replace(/\s+/g, "-");
}

export function normalizeProjectId(input?: string | null): ProjectId {
  const value = normalizeKey(input ?? "");

  if (!value || value === "hocker-one") return HOCKER_PROJECT_ID;

  throw new Error(`ProjectId inválido: ${input}`);
}

export function normalizeNodeId(input?: string | null): NodeId {
  const value = normalizeKey(input ?? "");

  if (!value) return HOCKER_NODE_ID;

  return value as NodeId;
}