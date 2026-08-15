export type ProviderReadinessKey = "pending" | "configured" | "degraded" | "connected";
export type ProviderReadiness = {
  key: ProviderReadinessKey;
  label: "Pendiente" | "Configurado" | "Con problemas" | "Conectado";
  percent: number;
};
export type GuidedGithubChainOutcome = "in_progress" | "completed" | "cancelled" | "failed";

export function percentComplete(completed: number, total: number): number;
export function evidenceCompletion(gates: boolean[]): number;
export function averageCompletion(values: number[]): number;
export function providerReadiness(input?: { configured?: boolean; connected?: boolean; lastError?: string | null }): ProviderReadiness;
export function guidedGithubChainOutcome(statuses: string[], total: number): GuidedGithubChainOutcome;
export function operationalAgiProgress(input?: {
  profileRegistered?: boolean;
  hasHistoricalEvidence?: boolean;
  hasRecentEvidence?: boolean;
  healthyNow?: boolean;
}): number;
export function operationalAppProgress(input?: {
  exists?: boolean;
  hasProductBoundary?: boolean;
  hasRuntimeEvidence?: boolean;
  verifiedNow?: boolean;
}): number;
