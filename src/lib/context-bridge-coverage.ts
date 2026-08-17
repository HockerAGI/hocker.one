export type ContextBridgeCoverageStatus = "complete" | "partial" | "missing" | "stale" | "blocked";

export type ContextBridgeCoverageCapability = {
  status?: unknown;
  last_verified_at?: unknown;
};

type ProviderCoverageInput = {
  checkpointObservedAt?: unknown;
  staleBefore: number;
  capabilities: ContextBridgeCoverageCapability[];
};

function parsedTime(value: unknown): number {
  if (typeof value !== "string" || value.trim().length === 0) return Number.NaN;
  return Date.parse(value);
}

export function deriveProviderCoverageStatus({
  checkpointObservedAt,
  staleBefore,
  capabilities,
}: ProviderCoverageInput): ContextBridgeCoverageStatus {
  const checkpointTime = parsedTime(checkpointObservedAt);
  if (!Number.isFinite(checkpointTime)) return "missing";
  if (checkpointTime < staleBefore) return "stale";

  const freshCapabilities = capabilities.filter((capability) => {
    const verifiedAt = parsedTime(capability.last_verified_at);
    return Number.isFinite(verifiedAt) && verifiedAt >= staleBefore;
  });

  if (freshCapabilities.some((capability) => capability.status === "blocked")) {
    return "blocked";
  }
  if (!freshCapabilities.some((capability) => capability.status === "verified")) {
    return "partial";
  }
  return "complete";
}
