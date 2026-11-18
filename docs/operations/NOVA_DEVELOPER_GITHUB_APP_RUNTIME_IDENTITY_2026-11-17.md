# NOVA Developer E2E — GitHub App runtime identity (2026-11-17)

> Estado: **implementación lista para revisión**, no aprobación ni ejecución material certificada. Este documento no es la fuente canónica de los 16 AGIs, permisos ni secretos.

## Contexto verificado

- `hocker.one/main=f187257873f44e3b8053cc3308471cefa1c8e9ee` al abrir esta intervención; Production `dpl_AcCdDXzD3AdWEHfYjrPf6z74Cvop` READY, 16 AGIs, Queue Lock limpio, cero `allow_actions=true`.
- Vercel `hocker-one` Production no contiene `HOCKER_GITHUB_TOKEN`, `GITHUB_TOKEN`, `GH_TOKEN` ni `HOCKER_GITHUB_APP_*`. Solo `AI_GATEWAY_API_KEY` existe en producción; `VERCEL_TOKEN` aparece para Preview únicamente (metadata, **ningún valor consultado**).
- La instalación de GitHub que opera este chat no transfiere su token/llave privada al runtime Productivo y NO certifica una operación hecha por NOVA.

## Identidad de GitHub para ingeniería de apps existentes

Se añade una alternativa acotada al PAT actual: GitHub App con JWT RS256 de 9 minutos y acceso de instalación de duración máxima aproximada de una hora, cacheada solo dentro del proceso con margen de expiración. La respuesta de GitHub debe confirmar `contents:write` y `pull_requests:write`; errores fallan cerrados y nunca exponen tokens, claves ni payloads.

Configurar exclusivamente en el entorno **Production de Vercel**, desde el gestor seguro de variables del proyecto, sin pegar secretos en issues, chat, logs o código:

| Variable | Contenido seguro |
| --- | --- |
| `HOCKER_GITHUB_APP_ID` | ID de la App GitHub gobernada por HockerAGI |
| `HOCKER_GITHUB_APP_INSTALLATION_ID` | ID de su instalación autorizada en HockerAGI |
| `HOCKER_GITHUB_APP_PRIVATE_KEY` | Clave PEM privada de ESA App (server-side) |
| `HOCKER_GITHUB_APP_REPOSITORIES` | Opcional: nombres de repos aprobados separados por comas; por defecto `hocker.one,nova.agi,hocker-node-agent` |

**La clave privada de la GitHub App conectada a ChatGPT NO está disponible ni debe exportarse o copiarse desde esta conversación.** Usar una App bajo control del Owner con permisos mínimos o aprovechar un PAT de Production ya existente si se encuentra en otro mecanismo validado; NO generar credenciales duplicadas sin necesidad.

Precedencia de credenciales: el PAT `HOCKER_GITHUB_TOKEN` / `GITHUB_TOKEN` / `GH_TOKEN` existente conserva su comportamiento; solo cuando faltan esos tres el ejecutor utiliza las variables GitHub App completas. Ningún cliente puede enviar credenciales en el request.

Alcance App: los tokens se reducen a los repos expresamente aprobados, con `contents:write` y `pull_requests:write`. **No** se solicitan scopes de administración. Por diseño, la creación de repositorios nuevos continúa requiriendo una identidad de organización distinta y aprobación Owner; el acceso a apps existentes no habilita el bootstrap de repos. Para modificar otras aplicaciones existentes, ampliar el allowlist de forma gobernada y comprobar que la instalación tiene esos repos.

## Validación obligatoria, no ejecutar canarias pasadas

1. Confirmar Vercel Production exact commit/alias sin redeploy manual. Solo después de agregar o cambiar credenciales, desplegar por la ruta gobernada de producción.
2. En `https://hockerone.vercel.app/owner/actions`, con la sesión del Owner MFA AAL2, ejecutar **Verificar conexiones**. `GET /api/agi/runtime/integrations/readiness` debe devolver `production_scope_verified=true`, `github_identity_kind=github_app` y `github.state=verified_read`; el token no se muestra.
3. **La lectura no prueba escritura.** NOVA debe crear por sí misma una propuesta trazable, leer SHA del repo existente, elegir cambios autorizados y encolar acciones idempotentes Owner Gate (branch → archivo → PR); ejecutar exclusivamente bajo el control AAL2/aprobación. Un PR escrito desde ChatGPT no es una ejecución AGI.
4. Pasar CI + Codex sin hallazgos + Preview exact HEAD, merge aprobado y Production exact SHA; guardar evidencia en issue #306.
5. Verificar permisos de Vercel y bootstrap de apps nuevas por separado. App scoped read/write a repos existentes no certifica creación de repos ni proyectos Vercel.

## No regresiones

- El coordinador Cloudflare sigue observación sin inferencias, sin solicitudes de modelos ni claims cuando no hay inventario aprobado. El Node Agent físico sigue opcional.
- `allow_actions` global permanece `false`, las evaluaciones 16/16, 48/48, 19/19 y la delegación NOVA→HOSTIA pasada NO se repiten.
- No se transfieren permisos del conector GitHub/ChatGPT a las AGIs, ni se habilita merge automático.

**Fuente de consulta GitHub:** https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-an-installation-access-token-for-a-github-app y https://docs.github.com/en/rest/apps/apps?apiVersion=2026-03-10.

**Registro operativo:** https://github.com/HockerAGI/hocker.one/issues/306.