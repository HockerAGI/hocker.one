# HOCKER Context Bridge — expediente de revisión Owner (2026-11-15)

**Estado:** PREPARADO PARA REVISIÓN DOCUMENTAL; **NO LISTO PARA ACTIVAR**.
**Proyecto:** `hocker-one`. **Límite:** ChatGPT, Codex, Google Drive, y preflight de seis fuentes.
**Autoridad:** producción/Supabase/versión `main` comprobable > pruebas/contratos > fuentes canónicas > historia, según DOC-00 y `AGENTS.md`.
**No se crea ni renueva ninguna evidencia del proveedor por redactar este expediente.** Ningún token, raw chat o secreto forma parte de él.

## 1. Resultado vivo comprobado (corte 2026-11-15)

| Proveedor | Source ID | Última observación UTC | Capacidad | Resultado |
| --- | --- | --- | --- | --- |
| GitHub | `github.ecosystem` | `2026-11-15T17:58:40.193Z` | `github.repository_inventory=verified` | VIGENTE |
| Supabase | `supabase.agi-evidence` | `2026-11-15T17:58:39.568Z` | `supabase.agi_certification_read=verified` | VIGENTE |
| Vercel | `vercel.hocker-one-runtime` | `2026-11-15T17:58:39.746Z` | `vercel.runtime_metadata=verified` | VIGENTE |
| ChatGPT | `chatgpt-hocker-project-handoff` | `2026-08-17T00:18:00Z` | normalized_handoff en agosto; project_context.read partial | VENCIDO |
| Codex | `codex-release-operator` | `2026-08-16T05:59:04Z` | repo_context_contract de agosto | VENCIDO |
| Google Drive | `google-drive-canon` | `2026-08-17T00:18:00Z` | `google_drive.canon.read=partial` | VENCIDO/INCOMPLETO |

**Cobertura auténtica: 3/6.** No extender artificialmente `max_staleness_hours=168`. Verificado por SQL read-only en `context_bridge_checkpoints` y `context_bridge_capabilities` y captura Owner posterior a PR #431.

Vercel comprobado: `main=e04211370bc1b67ba9f85221e07e341f7ca849a8`, `dpl_FNuGRqqFJRZoANMSJzv9nkMbv1s1`, `READY`, dominio vivo `hockerone.vercel.app`, `verification_method=vercel_rest_and_github_main`. No repetir PRs #427-#431.

Otros repositores observados sin escribirlos: `nova.agi/main=cb8d1a1effad80339df7a3cd921532d3bfad59c0`; `hocker-node-agent/main=c48cc275f7053e9d4238eb2c3e7a1382fabea76b`. Estos SHAs son un corte, **no** una prueba de runtime dedicado.

## 2. ChatGPT — handoff normalizado preparado; publicación pendiente

**Identidad configurada:** `chatgpt-hocker-project-handoff`. No hay interfaz conectada verificable para extraer firma/ID de sesión o publicar un checkpoint de la conversación desde esta conexión, por lo que **NO** se ha renovado en Supabase.

**Resumen propuesto para validación en origen**, sin transcripciones ni PII:
- Alcance de continuidad: Hocker One, NOVA y node-agent; no modificar otros repos.
- Se corrigió la autenticidad de Vercel en #430 y la identificación REST v6 `uid` en #431; producción SHA `e042113...`, checkpoint `2026-11-15T17:58:39.746Z` con capability verificada.
- GitHub y Supabase también tienen observaciones reales de `2026-11-15T17:58Z`. Cobertura 3/6, no 6/6.
- Codex y Drive pendientes. El piloto NOVA de lectura permanece detrás de Owner AAL2 y feature flag Free, no debe declararse autónomo.
- El manifiesto ACTIVE de agosto no tiene aprobación one-time `approval_id`; NO es aprobable por reutilización histórica.

**Prueba requerida para marcar `chatgpt.normalized_handoff=verified`:** handoff emitido desde la sesión/proyecto ChatGPT actual con identificación permitida del origen, fecha real de emisión, vínculos a SHA/PR/checkpoints, esquema normalizado y aceptación del registro por endpoint Owner/Internal Gate autorizado; verificar nueva fila `source_id=chatgpt-hocker-project-handoff` + capability. Una copia de este Markdown no es prueba de ChatGPT por sí sola.

## 3. Codex — contrato durable observado; sesión viva no probada

**Identidad:** `codex-release-operator`. En GitHub existen `AGENTS.md`, `docs/CONTINUITY.md` y revisiones automatizadas de PR, pero **esto no prueba una sesión/workspace Codex actual con trazas de ejecución**. El acceso a pestañas Browser en esta sesión devolvió *originating browser context required*, y no hay acción Codex-workspace conectada.

**Entrega preparada para Codex:** revisar los 3 SHAs actuales anteriores, `AGENTS.md` de cada repo, estado de CI exact-head/producción, PRs #428–#431 y contraste de rollout/rollback. El handoff de Codex real debe aportar workspace/repo/ref, SHA observado, identificador de ejecución/revisión, fecha, pruebas concretas, bloqueos y referencia verificable, **sin claims de runtime físico**. No sustituir por comentario de bot ni reetiquetar GitHub `verified` como Codex `verified`.

**Prueba requerida:** un handoff auténtico de Codex, normalizado y verificado, registrado mediante ruta Owner/Internal Gate y constatación posterior en Supabase para el source ID anterior.

## 4. Google Drive — consulta disponible; publicación y canon pendientes

La búsqueda Drive conectada identifica archivos HOCKER 2025, un documento de diseño actualizado en 2026-07 y una carpeta HOCKER cuya metadata confirma propietario/visibilidad restringida. **No** identifica una única colección editable autoritativa 2026.08 de DOC-00 a DOC-11. Las versiones viejas de `AGIs - unificadas` y `APPS - UNIFICADAS` no sustituyen por nombre el canon 2026.08.

**Bloqueo de escritura realmente observado:** intento de `create_file` para un documento de revisión, `403 PERMISSION_DENIED` emitido por Google Docs API. No hubo Doc creado/verificado. No inferir permiso de edición a partir de permiso de lectura o de ownership de la carpeta. No rotar credenciales; revisar scopes/autorización de la conexión y el destino autorizado antes de reintentar.

### Inventario local de candidatos 2026.08 (huellas SHA-256 reales)

Son **archivos PDF de la sesión del proyecto**, no archivos verificados en el Drive conectado. Los IDs de documento son correspondencias propuestas a revisar, no certificaciones Drive. La fuente primaria editable Markdown/DOCX no está demostrada por un PDF derivado.

| ID propuesto | Archivo disponible | SHA-256 |
| --- | --- | --- |
| `DOC-00` | `HOCKER_Indice_Maestro_y_Gobierno_Documental_2026-08.pdf` | `a34a55ea14642731398f6c92acdbed3ea5abd96f411aa65081c3c95db40b9bad` |
| `DOC-01` | `HOCKER_Vision_Gobierno_y_Mapa_del_Ecosistema_2026-08.pdf` | `ba9e93cdc1ae927c17d02b5db55494fc6694b69cf74aeea63cb9d2d9ba10775f` |
| `DOC-03` | `APPS_Unificadas_Fuente_Canonica_2026-08_CORREGIDA.pdf` | `ff8ab32f02e9f38ad4fc7bd4ad1ba5ecfc0dab115e09dea925ad15882f11b0d2` |
| `DOC-04` | `HOCKER_Modelo_de_Negocio_Monetizacion_y_GTM_2026-08.pdf` | `bde1c257df93eaa03dfa71af9492ad5a96e39020626656365deab4f68cac871f` |
| `DOC-05` | `HOCKER_Arquitectura_Tecnica_y_Plataforma_2026-08.pdf` | `1cf654d38d15da86c05d68279c80444ccd0cb3026be3d1f16cc45662e3e8a1ea` |
| `DOC-06` | `HOCKER_Manual_de_Ingenieria_de_Agentes_y_AGIs_2026-08.pdf` | `5104433cbf7bc1bd517ca0af42951f55b372aeda58b0e54cb2d0a09955a0b27a` |
| `DOC-07` | `HOCKER_Seguridad_Privacidad_Soberania_y_Continuidad_2026-08.pdf` | `7576aeae782474792535fa607956f7c2e3c3ceb9205556e8bb679eb5742a6b34` |
| `DOC-08` | `HOCKER_Sistema_de_Diseno_y_Arquitectura_UX_2026-08.pdf` | `bde55b55be4d8ac73fc3cfbc7221f0b087df967c91285927fb03d20c4e6343a6` |
| `DOC-10` | `HOCKER_Legal_Compliance_y_Contratos_2026-08.pdf` | `cf36a685eff059c25626571761117b315187780c016575e28914a70ee19c8d7c` |
| `DOC-11` | `HOCKER_Operacion_QA_SRE_FinOps_e_Incidentes_2026-08.pdf` | `dffcebfad44369b4800dbf4ddababd7409e48ac7eb5f913e6763f80919f04134` |

**Faltantes por aclarar:** DOC-02 (catálogo/fichas canónicas de AGIs) no está identificado inequívocamente en el inventario; DOC-09 (NOVA Persona) requiere contrastar la publicación de persona/outfit con el índice y su clasificación antes de incorporarla. El DOC-00 exige clasificación y prevalencia explícitas; algunas fuentes del índice pueden describir estado planificado que debe reconciliarse con el estado que declaran los PDFs especializados. No se resuelve esta discrepancia en silencio.

**Prueba para `google_drive.canon.read=verified`:**
1. Owner confirma carpeta autorizada y conjunto DOC IDs/versión/estado/owner. Excluir el documento de **credenciales** localizado en Drive y cualquier RESTRICTED.
2. Drive permite leer metadata y contenido de **cada fuente autorizada** (no solo un search hit), revisar MIME/visibilidad, ID, versión/revisión real, timestamp, clasificación, relación con el SHA de los derivados, y constatar qué es fuente primaria editable.
3. Resolver conflictos de versión y evidencia (PR/ADR/approve); si falta una fuente, mantener `partial`.
4. Si se requiere edición/copia en Drive, reparar primero el 403 mediante autorización legítima, sin duplicación silenciosa. Después registrar un checkpoint `google-drive-canon` sustentado por IDs/revisiones reales, sin texto completo ni secretos.
5. Verificar la capability nueva en Supabase y no activar el manifiesto con solo un documento subido.

## 5. Preparación para Owner Gate

La tabla `context_bridge_manifests` contiene **active** histórico `98b2ed4e-103d-4c8f-8681-7df5549ca507` sin `approval_id`, y **draft** antiguo `5a3dbe9f-138c-41f8-ad79-19426c5fbd29`. No reescribir, activar ni reutilizar como si fueran manifestaciones de evidencia actual.

**PRECHECK exacto (revalidar al momento):**
- Las 6 fuentes tienen checkpoint observado dentro de 168 horas, source identity autentificada y capability `verified` sin `partial/blocked`.
- Ningún checkpoint incluye secretos, chat crudo, credenciales ni documento RESTRICTED.
- El candidato emplea refs exactas SHA/deployment/Drive IDs/revisiones y handoffs Codex/ChatGPT identificables.
- Crear **nuevo draft** vía aplicación y ruta soportada, revisar `coverage_snapshot` 6/6, sin activación desde scheduled/shared key.
- **Solo Owner actual con MFA AAL2** puede crear aprobación one-time, duración 15 minutos, y activar manifiesto nuevo por `/owner/context-bridge`. Debe generarse `approval_id` verificable, no asignado manualmente.
- Si cualquier fuente falla, conservar PREPARADO/PARCIAL. No tocar el active histórico.
- **No crear un manifiesto draft duplicado con evidencia incompleta** solo para cambiar un número de versión: este expediente es el objeto de revisión previo, no un manifiesto activo.

## 6. Decisión solicitada (no ejecutada)

**Revisión Owner:** aprobar el conjunto documental autorizado de Google Drive y el contrato de handoff por proveedor; conectar/otorgar permisos mínimos si procede. **Aprobación de activación Context Bridge: NO ELEGIBLE EN ESTE CORTE** hasta 6/6 verificado.

**Cambios de producción realizados por este expediente:** ninguno. **SQL/DDL:** ninguno. **MFA:** no suplantado. **AGIs:** ninguna tarea/modelo ejecutado. **PRs viejos:** no reabiertos.

Ref de seguimiento: https://github.com/HockerAGI/hocker.one/issues/306
