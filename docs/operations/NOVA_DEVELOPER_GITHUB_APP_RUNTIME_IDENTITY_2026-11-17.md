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

**Límite de escritura adicional**: los dos ejecutores NOVA/AGI y el puente MCP de acciones aprobadas exigen coincidencia exacta con `HOCKER_GITHUB_ALLOWED_REPOS` (o `GITHUB_ALLOWED_REPOS`) y el namespace `HOCKER_GITHUB_ORG`. El allowlist del ejecutor preserva los seis repositorios históricos (`hocker.one`, `nova.agi`, `hocker-node-agent`, `chido.casino`, `hocker.agi`, `hocker.ads`) y ya **no admite repositorios adicionales solo por pertenecer a HockerAGI**. La identidad GitHub App continúa solicitando tokens restringidos a los tres repositorios predeterminados del E2E; para extender realmente la escritura a otra aplicación hacen falta la configuración del ejecutor, el scope de la instalación, permisos mínimos y Owner Gate. La lista de seis no equivale a una concesión de acceso ni habilita herramientas por sí sola. Estar en la organización HockerAGI **no autoriza por sí solo** la mutación de otros repos. El veto de escritura de PUNTO.G sigue prevaleciendo incluso si se añade a la lista. Las lecturas autorizadas no cambian. Para crear repositorios nuevos, una identidad de creación distinta a la GitHub App acotada debe comprobar el tipo real del propietario: `HockerAGI` figura actualmente como **GitHub User**, por lo que su ruta de creación es `POST /user/repos` únicamente si el token pertenece a `HockerAGI`; un owner de tipo Organization usa `POST /orgs/{owner}/repos` con comprobación previa de identidad. La autorización Owner Gate y la política de repos siguen siendo obligatorias. Ninguna prueba de esta ruta crea repositorios reales.

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

### Credencial independiente para creación de repositorios (preparación final Owner)

Para activar el ciclo completo de aplicaciones nuevas y existentes sin otorgar a todas las escrituras el permiso de creación, el ejecutor acepta una variable **opcional y exclusiva de creación**: `HOCKER_GITHUB_REPO_CREATE_TOKEN`. Su uso está restringido a la verificación autenticada del titular GitHub y al POST para crear el repositorio bajo el Owner Gate. La GitHub App de tokens temporales sigue atendiendo lecturas, edición y PR en repositorios existentes, y **no** adopta el PAT de creación como identidad general. Si no se configura este token, el PAT heredado de `HOCKER_GITHUB_TOKEN`/`GITHUB_TOKEN`/`GH_TOKEN` conserva la compatibilidad; el App token por sí solo nunca habilita bootstrap de repos nuevos.

`HockerAGI` figura como cuenta GitHub **User**, no Organization: la creación debe usar `POST /user/repos` solo tras verificar coincidencia exacta de `GET /users/HockerAGI` y `GET /user` con la credencial de creación. Para permisos de creación revisar la documentación oficial del endpoint y la capacidad `Administration:write` del token elegido; no instalar credenciales de alcance amplio si no está justificado. La variable se agrega exclusivamente en secretos de Vercel Production por el Owner durante la sesión final, **después de resolver seguridad y liberar el código**, sin enviarla por chat, GitHub ni archivos. Se conserva `requiresStaticGitHubIdentityForRepositoryCreation()`, sin exigir un token nuevo cuando solo se mantiene software existente.
