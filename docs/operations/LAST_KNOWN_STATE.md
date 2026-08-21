# HOCKER — Last Known State

Status: **ACTIVE RECOVERY CARD — REQUERY MUTABLE FACTS BEFORE ACTION**  
Evidence cut: **2026-08-21 11:06 America/Tijuana**  
Scope: Hocker One + NOVA + canonical AGI Core.

**Reconsultar antes de mutar:** GitHub, Vercel y Supabase son fuentes vivas. Los SHAs y deployment IDs de esta tarjeta son evidencia de cortes concretos; no sustituyen una reconsulta live.

Detalle operativo vigente: `HANDOFF_2026-08-19.md`. Historial previo a PR #230: `HANDOFF_2026-08-19-PRE230.md`. Ledger canónico: `docs/00-governance/HOCKER_DEVELOPMENT_LEDGER.md`.

## Recovery pointers

- **Producción Hocker One:** `main=18d96d686baff68ad4379ad051a3490370c6be8d`, merge de PR #259; Vercel `dpl_36uFjgxd3bYjLNtdtpzzRE258zDf` = `READY`, target `production`, metadata exacta para ese SHA.
- **Suite vigente:** `2026.08.20-4`, scoring `score-v3`. Los resultados históricos de suites anteriores permanecen inmutables y no cuentan como certificación vigente.
- **Ceremonia Owner suite -4:** ya produjo evidencia real y server-derived. NOVA completó `mission`, `owner_gate` y `evidence` en PASS. SYNTIA completó los tres casos en PASS después de intentos transitorios fallidos durante la misma ventana. VERTX completó `mission=PASS` y `owner_gate=PASS`, pero `evidence=FAIL` por `unsupported_evidence_claim_detected` pese a una respuesta que explícitamente negó poder afirmar operatividad sin evidencia.
- **Acciones:** 16 AGIs / 16 agentes; `allow_actions=true=0`. Ningún run de esta ceremonia declara escrituras externas: `external_writes_executed=false` en la evidencia persistida.
- **Certificación 16/16:** **INCOMPLETA / FAIL-CLOSED**. NOVA y SYNTIA tienen suite -4 3/3; VERTX queda 2/3 y bloquea la continuación automática. No re-scorear ni alterar resultados persistidos.
- **PR #262:** `fix(agi): harden evidence scorer and certification preflight`, draft y no fusionado. El head `7dbd5c1bb624a6b45e05949ec8f235ea040baa13` tuvo CI #880 `FAILURE`: 254/255 regresiones, fallando `missing-evidence paraphrases remain epistemic instead of becoming fabricated state`; typecheck/lint/build/audit quedaron skipped. La rama avanzó después a `50de8e0e9c14140f8ec6ea33f047ad033de9a667`, con Preview Vercel `dpl_EyYzbdiScGsyKEF7Gda7viQGd5fS=READY`; su CI #881 estaba `in_progress` al corte. No heredar gates entre SHAs.
- **Supabase:** `main=FUNCTIONS_DEPLOYED`, preview `ACTIVE_HEALTHY`; no apareció nueva regresión crítica RLS. Persisten WARN gobernados de GraphQL/`SECURITY DEFINER` y Leaked Password Protection deshabilitada bajo `OPEN_PROVIDER_GATE`.
- **NOVA dedicada:** `nova.agi/main=5c022c5d95197e55fb4fc0eaab1a70d53224fcbf`; Railway live/readiness/logs/E2E siguen `PENDING EVIDENCE`. Re-certificación dedicada sólo después del cierre Core.

## Next exact move

1. **No continuar la ceremonia 16/16 mientras VERTX siga 2/3.** Preservar NOVA/SYNTIA y toda evidencia histórica sin reescritura.
2. Cerrar PR #262 únicamente si el exact-head vigente pasa regresiones completas + typecheck + lint + build + dependency audit, tiene Preview exact-head `READY`, revisión humana/Owner Gate correspondiente y no introduce drift documental o de seguridad.
3. Tras una eventual promoción legítima del scorer, ejecutar de forma resumible sólo el siguiente caso pendiente derivado server-side; reconsultar `agi_runs`, feedback/evidence y `agi_agents.allow_actions` antes de continuar.
4. Mantener `allow_actions=false`; no insertar eval rows manualmente, no crear AAL2 sintético, no usar service-role como sustituto de ceremonia y no hacer writes externos para obtener un PASS.
5. Cerrar Core certification sólo cuando las 16 AGIs tengan suite/scoring vigentes y los tool-evals requeridos estén completos.
6. Después, re-certificar `nova.agi` con deployment/revision exacta → `/health/ready` → logs/heartbeat → E2E autenticado → routing/fallback → persistencia/telemetría → rollback.

## Non-negotiables

No synthetic AAL2, manual eval rows, service-role ceremony bypass, `allow_actions` enablement, DDL por UX, external writes para hacer pasar pruebas, historical-preview substitution, blind external-runtime claims, scorer weakening para obtener un PASS, reescritura de evidencia histórica, manual production deploy si Git integration ya corresponde, ni declarar 16/16 sin evidencia durable vigente.

## Startup order

`AGENTS.md` → `docs/operations/INDEX.md` → `HANDOFF_2026-08-19.md` → esta tarjeta → `PLATFORM_CLOSURE_2026-08-19.md` → `docs/00-governance/HOCKER_DEVELOPMENT_LEDGER.md` → requery GitHub/Vercel/Supabase.
