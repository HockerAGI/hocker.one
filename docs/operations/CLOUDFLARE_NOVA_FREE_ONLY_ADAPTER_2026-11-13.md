# Cloudflare Workers AI Free — inactive production adapter (2026-11-13)

## Evidence directly verified through Cloudflare connector
- Account `Hocker AGI` id `e53a864ed398f9d933c88b8a2c68c52b` authenticated. No DNS zones, Workers scripts, Pages; R2 not enabled.
- Existing AI Gateway `hocker-agi`: authenticated, 0 dynamic routes, 0 provider credentials, 0 request logs; Workers AI billing mode is `postpaid`, logs enabled by default, retry_max_attempts=3 and no gateway spend rules.
- Workers account setting `default_usage_model=standard` does NOT attest Workers Free; account subscriptions, billing plan/usage, spend policies all returned 403 missing permission.
- Gateway credit balance zero, no default payment method and auto-topup threshold/amount zero. This does NOT guarantee account Workers AI cannot incur charges.
- Docs: https://developers.cloudflare.com/workers-ai/platform/pricing/ (10,000 free Neurons/day on Workers Free, paid above this on Workers Paid). https://developers.cloudflare.com/ai-gateway/usage/rest-api/ and https://developers.cloudflare.com/workers-ai/models/glm-4.7-flash/ .

## Safe integration contract
- Route `cloudflare-workers-ai` uses only the existing gateway id `hocker-agi` and the fixed Workers Free eligible model `@cf/zai-org/glm-4.7-flash`. No new Cloudflare Worker, gateway, zone, route, SQL migration, paid account or runtime dependency.
- Feature is OFF unless ALL five conditions are explicitly set and verified: `AGI_ZERO_CREDIT_ONLY=true`, `CLOUDFLARE_WORKERS_AI_ENABLED=true`, `CLOUDFLARE_WORKERS_AI_FREE_PLAN_VERIFIED=true`, `CLOUDFLARE_ACCOUNT_ID=e53a864ed398f9d933c88b8a2c68c52b` and a server-only `CLOUDFLARE_WORKERS_AI_API_TOKEN` with least-privilege Workers AI permission.
- When `AGI_ZERO_CREDIT_ONLY=true`, route ordering contains **only** Cloudflare: no unapproved fallback to Vercel/OpenAI/Gemini/Anthropic; provider-native web search is refused, native tool follow-up unsupported until separately certified. Existing Owner Gate and canonical AGI memory boundaries remain unchanged.
- Each model request is capped at 12 recent messages, 8000 input characters, 384 output tokens, 25 second timeout, 1 gateway attempt. Request header `cf-aig-collect-log=false` avoids storing private prompts/responses in gateway, skip-cache=true. The provider never logs raw provider response/errors. This is not a global distributed metered quota.
- This code does not flip any production environment flag, add a Cloudflare token to GitHub, or invoke inference. It is a dormant implementation pending explicit eligibility validation.

## Mandatory preactivation checks
1. Owner verifies Workers Free rather than Paid under Cloudflare dashboard account Worker plan. API read was 403; do not infer plan from account type `standard`.
2. Verify hard $0 spending via Free cap, confirm supported model, confirm gateway stays `postpaid` under Workers Free and no third-party model routing. If Workers Paid, leave route OFF until an actually enforced $0 financial policy is proved.
3. Provision dedicated least-privilege Workers AI token as a Vercel environment secret, preview-only initially; never share its value in chat. Verify exact-head CI/CodeQL/Vercel Preview first.
4. Perform a single genuine tiny prompt on preview, observe real response, usage and account quota, then Owner approves any production enablement.
5. Do not confuse actual inference with fresh autonomous worker heartbeats, model self-training, independent memory mirror failover, or 16 AGI capability E2E. Keep #306 open.

## Not performed
- No new subscription, DNS/Worker/Gateway changes, automated cleanup, model inference, SQL writes, new Owner approvals, memory publication or material AGI action.
