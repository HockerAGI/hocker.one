# Cloudflare provider retirement decision — 2026-11-12

## Scope and source-of-truth evidence

- The operational Hocker One application was linked to Vercel; its production domain is `hockerone.vercel.app`. The Cloudflare MCP/Workers API was not implemented or deployed in Hocker One.
- The canonical Supabase `agi_tools` entry for `cloudflare` was reported `missing_code` and `implementation_status=code_only`. The existing HOSTIA and NOVA assignments were both `enabled=false`, with default writes blocked.
- No executable Cloudflare adapter or active Cloudflare API key was observed in the audited Hocker One source or the inspected Vercel environment-variable names. This does **not** establish the absence of Cloudflare zones or DNS usage in other systems.
- The requested MCP Portal-only/Workers authorization hardening is **not applicable to this dormant application integration**. To reduce provider sprawl, the code-only runtime and dashboard catalog entries and active-source claims are retired. The immutable SQL migration history and existing disabled database records remain preserved as audit evidence.

## Safety boundary

- No Cloudflare DNS zone, nameserver, WAF, Zero Trust, R2 bucket, Worker, or API token has been deleted, disabled, rotated, or modified.
- Public DNS/domain delegation for Hocker Ads and other external ecosystem sites is **not** proven unnecessary by this review. Do not change registrar DNS/nameservers or delete a provider account without inventorying live zone ownership, MX/TXT/CAA records, proxies, origin certificates and rollback.
- Any future Cloudflare MCP/Workers activation must be a new gated requirement, with provider access, observed evidence, CI/Preview, AAL2 Owner Gate, rollback and security review; do not reactivate legacy assignments just because historical rows exist.

## Related quality gate

- Android Emulator QA now runs automatically on `main` when Android-related paths or the QA workflow itself change. This supplies exact-main-SHA API 36 install/launch evidence without dummy commits or bypassing protected release.

## Traceability

- GitHub issue #210: MCP Portal/Workers provider hardening retired as non-applicable while the integration remains unused.
- GitHub issue #203: pending successful automatic Android Emulator QA on the **final merge commit SHA** in `main`.
- Main remains protected; changes must be PR-reviewed and must pass CI, Vercel Preview and Android candidate checks before merge.
