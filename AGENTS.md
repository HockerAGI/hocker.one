# HOCKER ONE — Instrucciones operativas para Codex y agentes de ingeniería

Este archivo es una guía durable del repositorio. No es una fuente de estado dinámico ni sustituye evidencia conectada.

## 1. Jerarquía de verdad

Antes de afirmar estado, usa este orden:

1. producción/configuración, base de datos, logs y evidencia reproducible;
2. `main`, migraciones, workflows y contratos ejecutables;
3. ADR, runbooks, policies, tests y evidence packs aprobados;
4. fuentes canónicas vigentes;
5. visión, investigación y conversación histórica.

Si dos fuentes difieren, documenta el drift y reconcilia; no elijas silenciosamente la versión conveniente.

## 2. Límites no negociables

- No escribir directamente a `main`; usar branch + PR.
- No fusionar mientras CI, tests, revisión de regresiones y gates aplicables no estén verdes.
- Las 16 AGIs canónicas permanecen `allow_actions=false` salvo una autorización explícita, versionada y con alcance mínimo.
- NOVA razona, enruta, prepara y coordina; las acciones materiales pasan por Hocker One / Owner Gate.
- No habilitar dinero real, movimientos de fondos, KYC productivo, vigilancia, ubicación o acciones destructivas por conveniencia técnica.
- No usar secretos, tokens, cookies, TOTP, documentos KYC, PII restringida o conversaciones privadas como memoria compartida.
- No inventar integraciones, salud, certificación, cumplimiento ni porcentajes. La ausencia de evidencia se muestra como pendiente/no verificado.
- Un porcentaje sólo es válido si existe un denominador explícito de gates observables y cada gate tiene evidencia trazable.

## 3. Catálogo y repositorios

El catálogo de producto sigue gobernado por **10 apps canónicas** y **16 AGIs canónicas**. Un repositorio nuevo no se convierte automáticamente en una app o AGI nueva.

Snapshot observado el 2026-08-15: 9 repositorios accesibles (`hocker.one`, `nova.agi`, `hocker-node-agent`, `hocker.agi`, `chido.casino`, `hocker.ads`, `chido.lab`, `chido.games`, `punto.g`). Este número es evidencia fechada, no una constante: vuelve a consultar GitHub antes de usarlo para decisiones.

`punto.g`, Chido, Wallet, NEXPA, Trackhok y otros dominios sensibles mantienen aislamiento de datos. Compartir sólo hechos operativos autorizados, agregados o explícitamente aprobados.

## 4. Contexto y memoria compartida

- **Context Bridge** (`docs/operations/CONTEXT_BRIDGE_V1.md`, `src/lib/context-bridge.ts`) es el registro de continuidad operativa entre ChatGPT, Codex, GitHub, Google Drive, Supabase y Vercel.
- **Context Pack** (`src/lib/hocker-context-pack.ts`) debe derivarse de registries/estado observable. No debe contener fases o porcentajes manuales que aparenten estado vivo.
- **SYNTIA / Memory Mirror** conserva conocimiento reutilizable revisado; no es un volcado de chats ni un sustituto de Context Bridge.
- Un nuevo manifiesto de Context Bridge se genera desde checkpoints actuales y sólo se activa mediante Owner + MFA AAL2. No reescribas manifiestos activos históricos.

## 5. Arquitectura

- Hocker One es el control plane web/PWA/mobile y la única superficie de aprobación/ejecución cloud gobernada.
- `nova.agi` es el runtime/orquestador dedicado de NOVA. No dupliques routers, memoria o registros de tools sin una migración de compatibilidad explícita.
- `hocker-node-agent` sólo ejecuta capacidades locales firmadas/allowlisted; no recibe credenciales cloud maestras.
- Supabase es estado persistente compartido por dominios con grants/RLS/tenant boundaries; no asumas que compartir proyecto equivale a compartir autorización.
- Vercel Functions son efímeras; persistir estado durable en la capa autorizada correspondiente.
- MCP/proveedores son conectores reemplazables. Autenticación, scopes, health y evidencia se verifican por proveedor; configuración no equivale a conexión.

## 6. Desarrollo y seguridad

Antes de implementar:

1. lee `SECURITY.md` y los documentos/ADRs del dominio afectado;
2. revisa PRs abiertos y versiones anteriores para evitar eliminar capacidades existentes;
3. escribe o ajusta el test que demuestre el comportamiento esperado;
4. implementa el cambio mínimo compatible;
5. ejecuta lint, typecheck, unit/contract/integration tests y build aplicables;
6. para cambios sensibles, revisa diff de seguridad y autorización/RLS;
7. usa preview/staging para E2E; no uses producción como entorno de prueba.

No silencies Advisors de Supabase con políticas amplias. RLS, grants, exposición GraphQL y `SECURITY DEFINER` se revisan objeto por objeto.

## 7. Hocker One UI

La navegación primaria móvil es `NOVA · Pulso · Recursos · Más`; las rutas secundarias siguen siendo funciones reales y no deben eliminarse sólo por simplificar navegación. Antes de retirar un componente antiguo, comprueba si contiene controles funcionales además de presentación.

Toda UI operativa debe distinguir al menos:
- salud/frescura actual;
- readiness o avance verificable;
- configuración presente;
- conexión verificada;
- evidencia histórica.

No mezclar estas dimensiones en un único badge o porcentaje.

## 8. Release

La definición de cierre global vive en el evidence pack de plataforma (`docs/operations/PLATFORM_CLOSURE_GATE_2026-08-14.md` mientras siga vigente). No declares Hocker One/AGIs “100%” hasta que sus gates estén respaldados por evidencia del mismo candidate SHA/configuración.

Las rotaciones coordinadas de credenciales pertenecen al gate final de lanzamiento salvo incidente de seguridad que exija revocación inmediata.
