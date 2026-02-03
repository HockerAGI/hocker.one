export function normalizeProjectId(raw: any): string {
  const s = String(raw ?? "").trim().toLowerCase();
  const cleaned = s.replace(/[^a-z0-9_-]/g, "");
  return cleaned || "global";
}

export function defaultProjectId(): string {
  return normalizeProjectId(process.env.NEXT_PUBLIC_HOCKER_PROJECT_ID ?? "global");
}