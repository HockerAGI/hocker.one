# HOCKER ONE — Instrucciones operativas para Codex y agentes de ingeniería

Guía durable del repositorio. **No es una fuente de estado dinámico.** El estado actual se recupera desde `docs/operations/INDEX.md` y el handoff activo que ese índice señale.

## 1. Jerarquía de verdad

1. producción/configuración, DB, logs y evidencia reproducible;
2. `main`, migraciones, workflows y contratos ejecutables;
3. ADR, runbooks, policies, tests y evidence packs aprobados;
4. fuentes canónicas vigentes;
5. visión, investigación e historia.

Si divergen, registrar drift y reconciliar. Nunca elegir silenciosamente la versión más conveniente.

## 2. Regla de rescate y depuración

Todo elemento existente pasa por cuatro filtros:

1. **Aporta y sigue vigente → conservar.**
2. **Aporta pero quedó viejo → reconstruir/adaptar.**
3. **Se solapa → fusionar.**
4. **No ayuda a comprender, operar, recuperar o auditar → eliminar/descartar.**

La regla aplica a código, documentación, UI, tests, workflows, integraciones, Supabase, Vercel y `nova.agi`. Antigüedad no es motivo de conservación y novedad no es motivo de reemplazo. Evidencia histórica válida no se borra para limpiar una interfaz o un árbol documental.

## 3. Límites no negociables

- Branch + PR; no escribir directo a `main`.
- No fusionar un cambio funcional sin candidate gates aplicables verdes.
- Exact SHA importa: un Preview histórico no prueba un head nuevo.
- 16 AGIs canónicas; `allow_actions=false` es baseline hasta decisión explícita/versionada.
- NOVA coordina/razona; Hocker One / Owner Gate gobierna efectos materiales.
- No fabricar integraciones, salud, porcentaje, certificación, AAL2 o evidencia.
- No almacenar secrets, auth headers, TOTP, KYC, PII restringida o raw chats en memoria compartida.
- No habilitar pagos reales, casino/wallet, KYC, vigilancia/ubicación o destrucción por conveniencia técnica.
- Incertidumbre en evidencia => fail closed.

## 4. Continuidad obligatoria

Al iniciar:

1. leer este archivo;
2. leer `docs/operations/INDEX.md`;
3. leer el handoff activo señalado por el índice;
4. leer `LAST_KNOWN_STATE.md` / closure gate actual;
5. reconsultar GitHub, Vercel, Supabase y cualquier provider mutable antes de actuar;
6. confirmar PR, branch y exact head SHA.

Al cerrar un hito material: actualizar una sola fuente de detalle y hacer que las demás apunten a ella. No copiar el mismo relato en Ledger, handoff, closure y alignment. No guardar el chat crudo.

Context Bridge = continuidad/evidencia operacional. Memory Mirror/SYNTIA = conocimiento reutilizable revisado. Ninguno sustituye auth, Owner Gate o evidencia conectada.

El protocolo durable base permanece en `docs/operations/CONTINUITY_PROTOCOL.md`; el índice y el handoff activo gobiernan la recuperación operativa actual.

## 5. Arquitectura vigente

- Hocker One es control plane y **primary NOVA runtime path**.
- `nova.agi` se conserva como dedicated fallback/compatibility; verificar deployment/revision, readiness, logs y E2E antes de depender de él.
- `hocker-node-agent` es executor local allowlisted/firmado; no recibe credenciales cloud maestras.
- Supabase compartido no significa autorización compartida: tenant/project, grants y RLS siguen siendo boundaries.
- MCP/provider connectors son reemplazables; adapter presente != provider ready.
- Tool metadata/annotations son hints, no autorización. Policies + Owner Gate mandan.

### UX privada actual

Navegación conceptual de escritorio: **Inicio → NOVA → Trabajo → Ecosistema → Operación → Más**. En móvil, máximo cinco destinos: **Inicio → NOVA → Trabajo → Ecosistema → Más**; Operación permanece accesible dentro de Más/búsqueda.

- `/chat` es una superficie NOVA inmersiva; no envolverla otra vez en dashboard cards, sidebar/topbar permanentes o contadores operativos.
- `/agis` es decision-first: lista compacta, una acción global de certificación y detalle técnico progresivo. No reintroducir 16 botones de evaluación individuales en la vista normal.
- Provider/model/IDs, hashes y evidencia técnica son detalle bajo demanda salvo que sean imprescindibles para resolver un incidente.
- Usar nombres visibles cortos, entendibles y preferentemente en español.
- Adaptar por viewport/container; conservar reflow equivalente a 320 px, teclado/foco, safe areas y reduced motion.

## 6. Desarrollo y verificación

Para feature/bugfix:

1. identificar outcome, riesgo y consumidor;
2. escribir/ajustar test que falle por el problema real cuando corresponda;
3. demostrar RED;
4. cambio mínimo GREEN;
5. regression tests, typecheck, lint, build y dependency/security gates aplicables;
6. Preview exact-head + build/runtime logs para cambios funcionales;
7. merge con head esperado;
8. producción + logs + rollback evidence;
9. handoff actualizado.

No silenciar Supabase Advisors con policies/grants amplios. `unused_index` en Advisor es señal INFO, no autorización de borrado: exigir ventana de observación, workload/query plans, dependencias/FK y validación reversible antes de eliminar un índice.

## 7. AGI / approvals

- Scoring vigente de certificación: `score-v3`.
- Evidencia `score-v1`/`score-v2` se conserva como historia pero **no satisface** certificación `score-v3`.
- Batch de certificación debe ser resumible y ejecutar sólo targets pendientes.
- Snapshot parcial/incompleto => bloquear batch; nunca sintetizar full rerun.
- Mantener ejecución secuencial mientras coste/timeouts/evidence boundaries dependan de ello.
- MFA: si existe factor TOTP verificado, usar challenge/verify para alcanzar AAL2; no reenrolar otro factor por defecto.
- Nunca insertar `agi_eval_result` / `agi_tool_eval_result` manualmente para certificar.
- Approval/resume futuros deben probar approve, reject, retry, idempotency, timeout, abort, replay y persistencia antes de producción.

## 8. CI / Actions / Vercel FinOps

- No crear commits dummy para polling, rate-limit retry o únicamente para provocar un provider build.
- Agrupar cambios documentales relacionados en un solo commit.
- Markdown-only puede omitir CI general cuando workflow/ruleset lo permitan sin dejar un required check Pending.
- Conservar workflows que aporten cobertura real y estén correctamente acotados por paths, dispatch o `concurrency`; no eliminarlos sólo para reducir conteo.
- No usar `[skip ci]` si puede dejar un required check Pending.
- `concurrency.cancel-in-progress`, dependency cache y path filters son optimizaciones válidas cuando su cambio está justificado/testeado.
- Ante rate limit de Vercel, distinguir provider quota de code failure y reutilizar/reintentar el mismo candidate cuando sea seguro.

## 9. Release

El closure gate activo vive en el documento que `docs/operations/INDEX.md` marque como current. No declarar `HOCKER Core — VERIFIED / INTEGRATION READY` hasta que cada gate nombrado tenga evidencia trazable del mismo candidate/configuración.

Rotaciones coordinadas de credenciales pertenecen al gate final salvo incidente que exija revocación inmediata.
