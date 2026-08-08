# Security Policy

## Supported version

Security fixes are prepared against the current `main` release line and validated in an isolated hardening branch before production promotion.

## Reporting a vulnerability

Do **not** open a public issue for a suspected vulnerability, leaked credential, authorization bypass, payment issue, personal-data exposure, or infrastructure weakness.

Report privately to **contacto.hocker@gmail.com** with:

- affected component and route/function;
- reproduction steps or evidence;
- impact and required privileges;
- whether secrets or personal data may be exposed;
- any safe remediation suggestion.

Do not include live credentials, full personal data, KYC documents, payment-card data, or destructive proof-of-concept payloads. Redact sensitive values and provide only the minimum evidence needed to reproduce the issue.

If GitHub Private Vulnerability Reporting is enabled for this repository, that channel is preferred for repository vulnerabilities.

## Handling

Reports are triaged by severity. Critical authorization, secrets, payment, destructive-action, or cross-tenant issues block release until remediated and regression-tested. Fixes must preserve evidence, rollback capability, and the HOCKER Owner Gate model.
