# HOCKER — Canon / implementation alignment 2026-08-19

Status: **ACTIVE DELTA REGISTER — POST #243 PRODUCTION CLOSURE**

Este registro describe drift vigente sin reescribir publicaciones canónicas históricas. Producción/configuración y `main` prevalecen para estado técnico live; los SHAs listados aquí son cortes de evidencia y deben reconsultarse antes de mutar.

Current handoff: `HANDOFF_2026-08-19.md`.

## Estado técnico publicado

**Release funcional:**

- PR #243: MERGED.
- Candidate final: `e2cb93834e781e1f03132e767c646043413d8c36`.
- Candidate CI `32276318988` / #836: SUCCESS en tests, typecheck, lint, build y full dependency audit.
- Candidate Preview `dpl_HkouMPbEWHdhfPeSNCH4pj7TYQHD`: READY.
- Merge funcional: `e48edf78ee2ed44d149543fa5680a3d6cb767c7a`.
- Vercel producción funcional: `dpl_81HqevySC8Ziq3KxQA1Gxy4Bw3ta`, READY, exact `e48edf78...`; build/runtime sin error/fatal en la ventana revisada.

**Wrapper documental observado antes de este ajuste:**

- PR #245: MERGED.
- `main` observado: `12dc95e58125d603e12aab25cfd03b3a6c33a030`.
- Vercel `dpl_EuAcyPVvyhcXG6sTykJZHdWoo6DF`: READY, target production, exact `12dc95e5...`, sin `error`/`fatal` en la ventana revisada.

Un commit documental posterior puede mover `main` y el alias productivo sin alterar el release funcional. Reconsultar ambos antes de cualquier acción.

Supabase reconsultado: ACTIVE_HEALTHY, 16 AGIs, 16 agentes, `allow_actions=true = 0`, 3 `agi_eval_result` históricas, 0 `agi_tool_eval_result`. Certificación Owner `score-v3`: pendiente de ceremonia humana AAL2; ningún merge se contabiliza como 16/16.

## Hechos canónicos preservados

- 10 apps; 16 AGIs canónicas.
- 9 repositorios de ingeniería conectados no equivalen a 9 productos.
- Hocker One = control plane / Owner Gate.
- Acciones materiales no se autorizan desde chat por defecto.
- Evidence-first, deny-by-default, least privilege y safe failure permanecen vinculantes.
- Editable source + evidencia ejecutable preceden derivados PDF/DOCX.

## Delta actual de Hocker One

### UX / DOC-08

El release funcional adopta un shell adaptativo limpio:

- seis destinos conceptuales de escritorio: Inicio, NOVA, Trabajo, Ecosistema, Operación, Más;
- cinco destinos móviles: Inicio, NOVA, Trabajo, Ecosistema, Más;
- `/chat` = NOVA inmersiva a viewport completo;
- `/agis` = lista compacta decision-first + una acción global Owner;
- IDs/provider/model/evidencia técnica = detalle progresivo, no chrome permanente;
- acceso Owner simplificado sin cambiar el contrato Auth;
- lenguaje visible corto y preferentemente en español;
- rutas secundarias continúan accesibles por contexto/búsqueda.

Esto concreta, no reemplaza, los principios de navegación por tarea/contexto, 3–5 destinos compactos, list-detail y adaptación por container/window del canon UX.

### Agentes / DOC-06

- `score-v3` es la versión vigente del scorer de certificación;
- corpus offline cubre las 16 AGIs;
- misión, Owner Gate y ausencia de evidencia tienen señales independientes;
- evidencia v1/v2 permanece histórica y no satisface v3;
- snapshot parcial => fail closed;
- cliente no elige arbitrariamente el siguiente target;
- AAL2 real mediante factor verificado; no synthetic AAL2;
- `allow_actions=false` continúa baseline;
- reasoning / aprobación / ejecución / evidencia siguen separados.

### Arquitectura / DOC-05

- Hocker One unified NOVA runtime/control plane es primary;
- `nova.agi` es dedicated fallback/compatibility hasta re-certificación independiente;
- provider/model son telemetría reemplazable;
- Node liveness depende de heartbeat fresco;
- Supabase durable evidence y Owner Gate son parte del boundary de certificación.

### Seguridad / DOC-07

- Supabase Advisor exception register clasifica sólo WARNs intencionales y acotados;
- Leaked Password Protection permanece `OPEN_PROVIDER_GATE`;
- `unused_index` INFO no se convierte en cleanup destructivo automático;
- exact-SHA CI/Preview/producción son evidencias distintas;
- no synthetic AAL2/eval evidence;
- MCP metadata/annotations nunca sustituyen policy/Owner Gate.

## Regla transversal de depuración

Todo elemento existente pasa por cuatro filtros: aporta y sigue vigente → conservar; aporta pero quedó viejo → reconstruir/adaptar; se solapa → fusionar; no ayuda a comprender, operar, recuperar o auditar → eliminar/descartar.

Aplicación demostrada:

- PR #213: login adaptado; workspace/Signal solapado descartado; PR cerrado sin merge.
- PR #244: compactación destructiva del Ledger descartada; hechos recuperables movidos a fuentes activas.
- workflows: conservar porque aportan cobertura y están acotados.
- Supabase indexes: conservar hasta que exista evidencia suficiente para clasificar cada uno.

## Publicación canónica

Este delta vive junto al código de producción, pero **no** implica que los PDFs canónicos históricos hayan sido regenerados. No regenerar DOC-00/05/06/07/08 desde texto improvisado. Primero identificar la fuente editable aprobada y reviewers, actualizarla, validar el paquete documental y publicar derivado versionado. Hasta entonces este delta register + código/tests/evidencia conectada son la capa de reconciliación vigente.
