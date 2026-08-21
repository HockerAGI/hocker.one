# HOCKER — Last Known State

Status: **ACTIVE RECOVERY CARD — REQUERY MUTABLE FACTS BEFORE ACTION**  
Evidence cut: **2026-08-20 19:05 America/Tijuana**  
Scope: Hocker One + NOVA + canonical AGI Core.

**Reconsultar antes de mutar:** GitHub, Vercel y Supabase son fuentes vivas. Los SHAs y deployment IDs de esta tarjeta son evidencia histórica de cortes concretos; no son punteros live.

Detalle operativo vigente: `HANDOFF_2026-08-19.md`. Historial previo a #230: `HANDOFF_2026-08-19-PRE230.md`. El Ledger canónico de desarrollo queda en `docs/00-governance/HOCKER_DEVELOPMENT_LEDGER.md`.

## Recovery pointers

- **Baseline funcional de Hocker One:** merge de PR #243 `e48edf78ee2ed44d149543fa5680a3d6cb767c7a`; shell adaptativo limpio + NOVA inmersiva + AGIs decision-first + `score-v3`.
- **Framework promovido:** PR #250 exact-head `2426bc7454322d730ea656214b9c076dede17786`, merge `f5e200973de637d243b2c83e8d079ff46a8eab80`; Next `16.3.1`, CI/Android/Emulator/Preview verificados antes de merge.
- **Saneamiento Next 16:** PR #252 exact-head `74c512b5b382e20f212e5db7c2c269e3261cd642`, merge `6905117dc5a6fd8c7925169755097f9d84ddf32f`; `/api/health/ping` y `/api/supply/orders` migrados de Edge deprecado a Node sin cambiar auth, roles, kill switch, idempotencia ni `allow_write`. CI #856 = `SUCCESS`; Preview `dpl_H1vCm8NLPNFhfCP1mkpFQ64csgUZ` = `READY`.
- **Cierre canónico de continuidad:** PR #253 head `3714350df5263a9f9595874fcfaa554fa542e48f`, merge `269363d8b94db779277a1950c0649a33cee6b8c7`; actualizó únicamente el Ledger append-only, preservando historia previa como evidencia y separándola de la autoridad operativa actual.
- **Correcciones Owner/score-v3 anteriores:** #256 merge `4757d7ff50b33047fcea3ffaf156f167b178b097`, #257 merge `ae399b4e7440cbd0079b57d7172ac99301e09127`, #258 merge `6299080f73d4499936ef14776fd2761ae1ade361`; los FAIL históricos de suites anteriores se conservan.
- **Corrección reported-claim #259:** exact-head `5c3f03a2baa111234da9d5167771814343af3ff3`, merge/current live cut `18d96d686baff68ad4379ad051a3490370c6be8d`; CI #876 / run `32435389263` = `SUCCESS`; Preview exacto `dpl_EuAUcN8ebfo3JyfMckUw4ZddQ1qh` = `READY`. Corrige el falso positivo donde una afirmación citada para rechazarla podía interpretarse como afirmación factual activa, sin aceptar contradicciones como `no tengo evidencia, pero está operativa`.
- **Suite vigente de código:** `2026.08.20-4`. El roll de suite preserva toda evidencia histórica de `-1/-2/-3`; no reutilizar resultados anteriores como certificación de `-4`.
- **Corte live observado 2026-08-20 19:05:** `main=18d96d686baff68ad4379ad051a3490370c6be8d`.
- **Producción observada para ese corte:** Vercel `dpl_36uFjgxd3bYjLNtdtpzzRE258zDf` = `READY`, target `production`, metadata exacta `githubCommitSha=18d96d686baff68ad4379ad051a3490370c6be8d`; consulta `error`/`fatal` del deployment en la ventana revisada devolvió 0 entradas.
- **Protección:** `main` de Hocker One sigue protegido y exige `Verify Hocker ONE`.
- **Continuidad semántica:** PR #249 sustituyó assertions acopladas a copy/encabezados por evidencia semántica sin debilitar SHA, CI, Preview, producción, Supabase ni Owner Gate.
- **Mantenimiento aceptado:** #236 `@next/eslint-plugin-next 16.3.1`, #235 `sonner 2.0.8`, #250 `next 16.3.1` y #252 migración Node runtime.
- **Mantenimiento descartado para este ciclo:** #234 Zod 4 y #237 Capacitor Android 8.5, cerrados sin merge.
- PR #213: cerrado sin merge como supersedido; valor útil adaptado/fusionado en #243 y arquitectura Signal/workspace vieja descartada.
- PR #244: cerrado sin merge; compactación destructiva del Ledger append-only descartada.
- PR #255: cerrado sin merge como supersedido por el estado posterior #256/#257/#258; no usarlo como recovery authority.
- PR #260: cerrado sin merge como supersedido por #259; su branch conserva punteros pre-#259 y no debe promoverse.
- Supabase `yvuibbcuntqpyqiuqggd`: permanece sin una nueva regresión crítica RLS en el Security Advisor reconsultado.
- Supabase Core AGI: el último bloque de runs Owner observado antes de #259 sigue concentrado en NOVA. Consulta directa posterior al merge #259 devuelve **0 `agi_runs` posteriores a `2026-08-21T01:13:37Z`**; por tanto no existe todavía evidencia de ceremonia `2026.08.20-4`.
- **FAIL histórico preservado:** suite `2026.08.20-3` ejecutó NOVA y dejó `nova.mission=PASS`, `nova.owner_gate=PASS`, `nova.evidence=FAIL` (`unsupported_evidence_claim_detected`). Ese resultado no se reescribe ni se convierte retroactivamente en PASS por #259.
- Certificación 16/16: **PENDIENTE**. El merge de #259 corrige el scorer y rueda la suite, pero no ejecuta una ceremonia Owner ni crea evidencia de las 16 AGIs.
- Leaked Password Protection: continúa físicamente deshabilitada; mantener bajo su contrato/provider gate y no simular cierre por SQL.
- Los warnings de GraphQL/`SECURITY DEFINER` continúan bajo `docs/security/SUPABASE_ADVISOR_EXCEPTION_REGISTER_2026-08-17.md`; no apareció una regresión crítica nueva de RLS en el Advisor reconsultado.
- `nova.agi/main`: último corte conocido `5c022c5d95197e55fb4fc0eaab1a70d53224fcbf`, merge de PR #38. No equivale a evidencia de Railway live; revisión exacta, `/health/ready`, logs/heartbeat y E2E autenticado continúan `PENDING EVIDENCE`.

## Next exact move

1. **No interpretar #259 como certificación.** Requerir una nueva ceremonia humana Owner AAL2 sobre suite `2026.08.20-4`; no insertar eval rows manualmente ni usar service-role como sustituto.
2. Ejecutar primero NOVA en la suite vigente y reconsultar `agi_runs`/evidencia server-derived. Sólo si NOVA completa legítimamente mission + owner_gate + evidence en PASS, continuar con las AGIs faltantes.
3. Preservar todos los runs `2026.08.20-3` como evidencia histórica; no re-scorearlos ni mutarlos para que coincidan con #259.
4. Exigir exact-head CI completo + Preview READY + revisión de seguridad antes de cualquier nueva modificación de scoring/prompt.
5. Reconsultar evidencia durable después de cada avance y cerrar Core certification sólo cuando las 16 AGIs tengan suite/scoring vigente y los tool-evals requeridos estén completos.
6. Después, re-certificar `nova.agi` con evidencia runtime exacta: deployment/revision → readiness → logs/heartbeat → E2E autenticado → routing/fallback → persistencia/telemetría → rollback.

## Regla de depuración

Todo elemento existente: aporta y sigue vigente → conservar; aporta pero quedó viejo → reconstruir/adaptar; se solapa → fusionar; no ayuda a comprender, operar, recuperar o auditar → eliminar/descartar.

## Non-negotiables

No synthetic AAL2, manual eval rows, service-role ceremony bypass, `allow_actions` enablement, DDL por UX, external writes para hacer pasar pruebas, historical-preview substitution, blind external-runtime claims, scorer weakening para obtener un PASS, reescritura de evidencia histórica, manual production deploy si Git integration ya corresponde, ni declarar 16/16 sin evidencia durable vigente.

## Startup order

`AGENTS.md` → `docs/operations/INDEX.md` → `HANDOFF_2026-08-19.md` → esta tarjeta → `PLATFORM_CLOSURE_2026-08-19.md` → `docs/00-governance/HOCKER_DEVELOPMENT_LEDGER.md` → spec UX aprobada → requery GitHub/Vercel/Supabase.
