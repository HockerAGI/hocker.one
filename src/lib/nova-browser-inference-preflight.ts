/** Read-only candidate detection; WebGPU != proven inference. */
export const NOVA_BROWSER_PREFLIGHT_VERSION = "2026.11.13-1";
export const NOVA_BROWSER_MODEL_CANDIDATES = [
  { id: "SmolLM2-360M-Instruct-q4f32_1-MLC", label: "SmolLM2 360M", vramMB: 579.61 },
  { id: "Llama-3.2-1B-Instruct-q4f16_1-MLC", label: "Llama 3.2 1B", vramMB: 879.04 },
] as const;
export function describeWebGpuPreflight(input: {
  secureContext: boolean;
  gpuApi: boolean;
  adapter: boolean;
}) {
  if (!input.secureContext) return { canAttempt: false, reason: "HTTPS_REQUIRED" as const };
  if (!input.gpuApi) return { canAttempt: false, reason: "WEBGPU_API_MISSING" as const };
  if (!input.adapter) return { canAttempt: false, reason: "WEBGPU_ADAPTER_MISSING" as const };
  return { canAttempt: true, reason: "HARDWARE_CANDIDATE_ONLY" as const };
}
