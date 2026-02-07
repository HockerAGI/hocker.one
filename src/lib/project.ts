export function normalizeProjectId(v: string) {
  const s = (v ?? "").trim();
  if (!s) return "global";
  return s.toLowerCase().replace(/[^a-z0-9-_]/g, "-").slice(0, 64);
}

export function defaultProjectId() {
  return process.env.NEXT_PUBLIC_HOCKER_DEFAULT_PROJECT_ID ?? "global";
}

export function defaultNodeId() {
  return process.env.NEXT_PUBLIC_HOCKER_DEFAULT_NODE_ID ?? "node-cloudrun-01";
}