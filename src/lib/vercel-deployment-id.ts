/**
 * Vercel REST GET /v6/deployments uses "uid"; detail endpoints /v13 use
 * "id" (some versions may expose both). The connected MCP normalizes uid
 * into id; runtime REST does not. This helper accepts either real field but
 * refuses disagreement, an absent ID, or unexpected ID shape.
 *
 * ID parsing alone never certifies a deployment: project, production target,
 * READY state, exact main SHA, and live alias are checked separately.
 */
export function deploymentIdFromRestRow(row: Readonly<Record<string, unknown>>): string | null {
  const id = typeof row.id === "string" ? row.id : null;
  const uid = typeof row.uid === "string" ? row.uid : null;
  if (id !== null && uid !== null && id !== uid) return null;
  const candidate = id ?? uid;
  return candidate !== null && /^dpl_[A-Za-z0-9]+$/.test(candidate)
    ? candidate
    : null;
}
