# NOVA Local — WebGPU readiness and session audit (2026-11-13)
Phase 3A. No downloaded models, no inline remote CDN scripts, no model inference and no new server/provider. This page is real read-only device preflight, not 100% NOVA readiness.
Official WebLLM docs v0.2.88: https://webllm.mlc.ai/docs/user/get_started.html and https://webllm.mlc.ai/docs/user/basic_usage.html .
Upstream model catalog and VRAM estimates: https://github.com/mlc-ai/web-llm/blob/main/src/config.ts .
Security: Never load third-party CDN JavaScript into the privileged Owner origin without audited pinned, integrity-locked package dependencies; a tagged CDN import is not a secure supply-chain guarantee.
External WebLLM demo opens separate origin via noopener/noreferrer after user action. It has no access to Hocker One cookies or memory.
Session diagnostics: GET /api/nova/zero-credit/status uses already-existing role-gated endpoint with same-origin cookies, no secrets from user. Owner/internal Memory Mirror endpoints are intentionally not called from client.
Next: install WebLLM exact npm version plus generated real package-lock on a trusted runner, audit dependency graph, deploy in worker after explicit user consent; no silent cloud fallback, tool execution or memory publication.
Only user-device real generated text can certify inference. Browser WebGPU adapter is a candidate, not READY or a heartbeat. The current Owner AAL2 gate and historical AGI certifications remain unchanged.