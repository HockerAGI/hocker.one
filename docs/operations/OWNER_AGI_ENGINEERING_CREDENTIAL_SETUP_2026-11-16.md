# HOCKER ONE — Identidad cloud de ingeniería AGI

## Propósito
Preflight para Hocker One / NOVA, independiente de `hocker-node-agent` físico y del runtime dedicado `nova.agi`. **No equivale a habilitar escrituras autónomas**. Fuentes principales: Hocker One Production y expediente #306.

## Estado vivo observado el 16 de noviembre de 2026 (America/Tijuana)
- `hocker.one/main` al iniciar: `67472ae8a001bf7d9c5230e377f36cbe7539c6bd`; Vercel Production `dpl_9r34WcwYhfc5adHKhnosHpU2GrnT` READY.
- Variables Vercel de Hocker One consultadas con `decrypt:false`: 101 entradas, 0 ocultas en Production. Ningún `HOCKER_GITHUB_TOKEN`, `GITHUB_TOKEN`, `GH_TOKEN`; `VERCEL_TOKEN` disponible en Preview pero no Production.
- Supabase: 16 AGIs registradas, ninguna autorización global de acciones materiales, 0 tareas/acciones activas. Cron autenticado correcto con `fresh_nodes=0`, modelo y tarea 0.
- Haber conectado GitHub y Vercel en ChatGPT NO configura una identidad dentro de las funciones server-side de Hocker One.

## Nuevo endpoint operativo
`GET /api/agi/runtime/integrations/readiness?project_id=hocker-one` (Owner autenticado con MFA AAL2): devuelve únicamente booleanos y códigos de preparación, jamás credenciales, payloads upstream, prompts ni encabezados de autorización. Realiza solo lecturas autenticadas `GET /repos/HockerAGI/{hocker.one,nova.agi,hocker-node-agent}` y `GET /v9/projects/{VERCEL_PROJECT_ID}` cuando existen tokens de runtime. Las pruebas son read-only; la API nunca autoriza ni ejecuta mutaciones. El centro Owner Actions muestra el resultado y jamás retiene un verde anterior si la consulta falla.

**Semántica:** `configured` acredita presencia de variable, `verified_read` lectura autenticada real, `can_prepare_existing_app_proposal` y `can_prepare_new_app_bootstrap` permiten planificar acciones en cola pero NO acreditan `Contents:write`, `Pull requests:write`, `Repository creation:write` ni permisos Vercel. El Owner Gate AAL2 permanece obligatorio para cada ejecución material, siempre con review y CI.

## Activación pendiente del Owner — sin enviar secretos a ChatGPT
1. En GitHub, crear/autorizar preferiblemente una GitHub App HockerAGI de alcance mínimo y emisión rotativa de tokens; **el ejecutor actual solo soporta token Bearer de runtime** (`HOCKER_GITHUB_TOKEN`, `GITHUB_TOKEN` o `GH_TOKEN`), por lo que la instalación y la futura rotación de tokens de App necesitan una implementación adicional. Alternativa controlada temporal: fine-grained PAT restringido a la organización y repos permitidos, caducidad corta y aprobación administrativa explícita. No se inserta ninguna credencial mediante este PR.
2. Para modificar código en repos existentes, GitHub documenta permisos `Contents:write` y `Pull requests:write`; para crear repos en la organización, ahora existe `Repository creation:write` como permiso mínimo alternativo a `Administration:write` (Oct 2026). Evitar permisos de eliminación/transferencia y acceso a más repos del necesario.
3. En Vercel Hocker One > Settings > Environment Variables, crear `HOCKER_GITHUB_TOKEN` como **Secret** SOLO Production (no `NEXT_PUBLIC_`). `VERCEL_PROJECT_ID` y `VERCEL_TEAM_ID` identifican el proyecto y equipo al verificar. La variable ya existente `VERCEL_TEAM_ID` identifica el equipo; `VERCEL_TOKEN` se necesita SOLO si se autoriza explícitamente la creación de proyectos Vercel por NOVA. Es preferible una credencial de servicio/recurso restringida.
4. Cualquier variable nueva aplica solo a deployments futuros: ejecutar una sola liberación siguiendo CI/Review/Owner y verificar SHA/alias. No redeploy duplicado, no copiar tokens a issues/logs/chat.
5. Abrir Owner Actions con sesión AAL2, usar «Verificar conexiones» y exigir `verified_read`. Esta consulta no prueba permisos de escritura; ejecutar un canario no destructivo y reversible con Owner Gate antes de conceder capacidad de producción.

## Controles finales
- El primer experimento autónomo NOVA → HOSTIA → lectura MCP → cambio propuesto → Owner Gate → branch → archivo → PR queda pendiente hasta una identidad server-side real y consentimiento Owner.
- No habilitar `AGI_DELEGATION_DISPATCH_ENABLED`, ni modelos pagados, ni escrituras a `main` por usar este endpoint.
- La ausencia de nodo físico NO bloquea ninguno de estos pasos. Nunca inventar un heartbeat.

Referencias de permisos: https://docs.github.com/en/rest/repos/repos, https://docs.github.com/en/rest/repos/contents, https://docs.github.com/en/rest/pulls/pulls, https://github.blog/changelog/2026-10-13-github-app-improvements-for-least-privilege-and-management/, https://vercel.com/changelog/environment-variables-now-use-config-and-secret-types