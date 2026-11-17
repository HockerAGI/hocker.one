/**
 * Health of Hocker One's serverless control plane, not of every optional
 * capability. Missing core evidence never becomes "healthy".
 */
export type RuntimeHealthCheck = {
  active?: boolean;
  required?: boolean;
  label?: string;
};

export type CoreHealthSummary = {
  overall: "healthy" | "down" | "unknown";
  coreActive: number;
  coreTotal: number;
  optionalUnavailable: number;
};

const EXPECTED_CORE = ["web", "vercel", "supabase", "api"] as const;

export function evaluateServerlessCoreHealth(
  checks: Record<string, RuntimeHealthCheck> | null | undefined,
): CoreHealthSummary {
  if (!checks || typeof checks !== "object" || Array.isArray(checks)) {
    return { overall: "unknown", coreActive: 0, coreTotal: 0, optionalUnavailable: 0 };
  }
  const entries = Object.entries(checks);
  const requiredEntries = entries.filter(([, c]) => c && c.required === true);
  const coreActive = requiredEntries.filter(([, c]) => c.active === true).length;
  const optionalUnavailable = entries.filter(([, c]) => !c || c.required !== true)
    .filter(([, c]) => !c || c.active !== true).length;
  // Fail closed on a legacy or incomplete API response. A single true Web
  // check cannot accidentally certify the entire serverless runtime.
  const completeCore = EXPECTED_CORE.every((key) => {
    const check = checks[key];
    return check && check.required === true && typeof check.active === "boolean";
  });
  const validRequired = requiredEntries.every(([, c]) => typeof c.active === "boolean");
  return {
    overall: !completeCore || !validRequired ? "unknown"
      : coreActive === requiredEntries.length ? "healthy" : "down",
    coreActive,
    coreTotal: requiredEntries.length,
    optionalUnavailable,
  };
}
