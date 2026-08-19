# HOCKER ONE — Instrucciones operativas para Codex y agentes de ingeniería

Guía durable del repositorio. **No es una fuente de estado dinámico.** El estado actual se recupera desde `docs/operations/INDEX.md` y el handoff activo que ese índice señale.

## 1. Jerarquía de verdad

1. producción/configuración, DB, logs y evidencia reproducible;
2. `main`, migraciones, workflows y contratos ejecutables;
3. ADR, runbooks, policies, tests y evidence packs aprobados;
4. fuentes canónicas vigentes;
5. visión, investigación e historia.

Si divergen, registrar drift y reconciliar. Nunca elegir silenciosamente la versión más conveniente.

## 2. Límites no negociables

- Branch + PR; no escribir directo a `main`.
- No fusionar un cambio funcional sin candidate gates aplicables verdes.
- Exact SHA importa: un Preview histórico no prueba un head nuevo.
- 16 AGIs canónicas; `allow_actions=false` es baseline hasta decisión explícita/versionada.
- NOVA coordina/razona; Hocker One / Owner Gate gobierna efectos materiales.
- No fabricar integraciones, salud, porcentaje, certificación, AAL2 o evidencia.
- No almacenar secrets, auth headers, TOTP, KYC, PII restringida o raw chats en memoria compartida.
- No habilitar pagos reales, casino/wallet, KYC, vigilancia/ubicación o destrucción por conveniencia técnica.
- Incertidumbre en evidencia => fail closed.

## 3. Continuidad obligatoria

Al iniciar:

1. leer este archivo;
2. leer `docs/operations/INDEX.md`;
3. leer el handoff activo señalado por el índice;
4. leer `LAST_KNOWN_STATE.md` / closure gate actual;
5. reconsultar GitHub, Vercel, Supabase y cualquier provider mutable antes de actuar;
6. confirmar PR, branch y exact head SHA.

Al cerrar un hito material: actualizar una sola fuente de detalle y hacer que las demás apunten a ella. No copiar el mismo relato en Ledger, handoff, closure y alignment. No guardar el chat crudo.

Context Bridge = continuidad/evidencia operacional. Memory Mirror/SYNTIA = conocimiento reutilizable revisado. Ninguno sustituye auth, Owner Gate o evidencia conectada.

El protocolo durable base permanece en `docs/operations/CONTINUITY_PROTOCOL.md`; el índice y el handoff activo gobiernan la recuperación operativa actual y evitan duplicar estado dinámico.

## 4. Arquitectura vigente como regla durable

- Hocker One es control plane y **primary NOVA runtime path**.
- `nova.agi` se conserva como dedicated fallback/compatibility; verificar live revision/readiness/logs/E2E antes de depender de él.
- `hocker-node-agent` es executor local allowlisted/firmado; no recibe credenciales cloud maestras.
- Supabase compartido no significa autorización compartida: tenant/project, grants y RLS siguen siendo boundaries.
- MCP/provider connectors son reemplazables; adapter presente != provider ready.
- Tool metadata/annotations son hints, no autorización. Policies + Owner Gate mandan.

## 5. Desarrollo

Para feature/bugfix:

1. identificar outcome, riesgo y consumidor;
2. escribir/ajustar test que falle por el problema real;
3. demostrar RED cuando corresponda;
4. cambio mínimo GREEN;
5. regression tests, typecheck, lint, build y dependency/security gates aplicables;
6. preview exact-head + logs/smoke para cambios funcionales;
7. merge con head esperado;
8. producción + logs + rollback evidence;
9. handoff actualizado.

No silenciar Supabase Advisors con policies/grants amplios; revisar objeto, consumidor e invariant. No cambiar framework/provider/model en un cierre sólo por novedad: ADR + regression eval + rollback.

## 6. AGI / approvals

- Batch de certificación debe ser resumible y ejecutar sólo targets pendientes.
- Snapshot parcial/incompleto => bloquear batch; nunca sintetizar full rerun.
- Mantener ejecución secuencial mientras coste/timeouts/evidence boundaries dependan de ello.
- MFA: si existe factor TOTP verificado, usar challenge/verify para alcanzar AAL2; no reenrolar otro factor por defecto.
- Nunca insertar `agi_eval_result` / `agi_tool_eval_result` manualmente para certificar.
- Approval/resume futuros deben probar approve, reject, retry, idempotency, timeout, abort, replay y persistencia antes de producción.

## 7. CI / Actions / Vercel FinOps

- No crear commits dummy para polling, rate-limit retry o únicamente para provocar un provider build si existe `Redeploy`.
- Agrupar cambios documentales relacionados en un solo commit.
- Markdown-only puede omitir CI general cuando el workflow/path/ruleset lo permitan sin dejar un required check Pending.
- Standard GitHub-hosted runners en repos públicos son gratuitos bajo la política vigente de GitHub; los repos privados consumen el allowance del owner/org y los larger runners son billables. Conservar especialmente los runs de repos privados.
- No usar `[skip ci]` si puede dejar un required check Pending.
- `concurrency.cancel-in-progress`, dependency cache y path filters son optimizaciones válidas cuando su cambio está justificado/testeado.
- Vercel Hobby tiene límites de deployment/build; ante rate limit, distinguir provider quota de code failure y preferir reintento/redeploy del mismo candidate.

## 8. UI operativa

Toda UI de estado debe distinguir salud/frescura, readiness, configuración, conexión verificada y evidencia histórica. No mezclar esas dimensiones en un solo badge/porcentaje.

## 9. Release

El closure gate activo vive en el documento que `docs/operations/INDEX.md` marque como current. No declarar `HOCKER Core — VERIFIED / INTEGRATION READY` hasta que cada gate nombrado tenga evidencia trazable del mismo candidate/configuración.

Rotaciones coordinadas de credenciales pertenecen al gate final salvo incidente que exija revocación inmediata.
