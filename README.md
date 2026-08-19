# Hocker One

Hocker One es el **control plane privado y gobernado** del ecosistema HOCKER. Centraliza NOVA, las 16 AGIs canónicas, aprobaciones Owner, evidencia operativa, integraciones y superficies de administración sin convertir el chat en autoridad de escritura.

## Arquitectura actual

- **NOVA primaria:** `/chat` es la experiencia inmersiva de conversación. Hocker One intenta resolver el flujo ordinario desde su runtime unificado.
- **Fallback dedicado:** `nova.agi` permanece como compatibilidad/supervivencia. No debe tratarse como runtime certificado sin deployment/revision, readiness, logs y E2E verificables.
- **AGIs:** `/agis` muestra estado y decisión primero; una sola acción Owner coordina la certificación resumible. La evidencia técnica vive en detalle progresivo.
- **Persistencia:** Supabase mantiene Auth, estado durable, ejecuciones, feedback, evidencia y contratos RLS/RPC. Compartir proyecto no elimina boundaries de rol/proyecto.
- **Owner Gate:** acciones materiales, relajación de safeguards y certificación crítica permanecen protegidas. `allow_actions=false` es el baseline de las 16 AGIs.
- **Proveedores:** Gateway, modelos y conectores son reemplazables; provider/model son telemetría, no identidad pública ni autorización.

## Navegación privada

La interfaz usa seis destinos conceptuales en escritorio: **Inicio, NOVA, Trabajo, Ecosistema, Operación y Más**. En móvil se compacta a cinco: **Inicio, NOVA, Trabajo, Ecosistema y Más**.

No se deben reintroducir menús técnicos permanentes, tarjetas duplicadas o controles de workspace que no ayuden a decidir. La búsqueda global conserva acceso a rutas secundarias sin saturar el shell.

## Certificación AGI

La versión de scoring vigente en código es **`score-v3`**. La certificación sólo puede derivarse de evidencia del suite/scoring vigente y referencias de ejecución verificables.

- evidencia `score-v1` / `score-v2` = histórica;
- evidencia histórica no se reescribe ni se promociona silenciosamente a `score-v3`;
- snapshot parcial = fail closed;
- ceremonia Owner requiere AAL2 real;
- no insertar filas de eval manualmente;
- ninguna prueba de certificación puede ejecutar writes externos.

## Requisitos

- Node.js **22.x**
- npm con `package-lock.json`
- proyecto Supabase configurado para el entorno correspondiente

## Desarrollo local

```bash
npm ci
npm run dev
```

Antes de proponer un merge funcional:

```bash
npm test
npm run typecheck
npm run lint
npm run build
npm audit
```

CI usa instalación reproducible y ejecuta esos gates de forma secuencial. Los workflows Android se activan sólo para superficies Android/PWA relevantes y Lighthouse Diagnostics es manual.

## Seguridad y evidencia

- No guardar secrets ni shared Owner keys en cliente.
- No usar un Preview histórico como evidencia de un SHA nuevo.
- No confundir adapter/configuración con conexión verificada.
- No ampliar grants/RLS para silenciar Supabase Advisor.
- Un `unused_index` de Advisor es una señal de investigación; no implica `DROP INDEX` automático.
- Leaked Password Protection permanece como provider gate hasta que exista evidencia de configuración activa.

## Continuidad

Orden recomendado para recuperar contexto:

1. `AGENTS.md`
2. `docs/operations/INDEX.md`
3. `docs/operations/HANDOFF_2026-08-19.md`
4. `docs/operations/LAST_KNOWN_STATE.md`
5. `docs/operations/PLATFORM_CLOSURE_2026-08-19.md`
6. reconsultar GitHub, Vercel y Supabase antes de mutar.

La jerarquía de verdad es: **producción/configuración y evidencia conectada > `main`/migraciones > contratos ejecutables > documentación canónica > visión/historia**.

## Regla de depuración

Todo elemento existente se clasifica así: aporta y sigue vigente → conservar; aporta pero quedó viejo → reconstruir/adaptar; se solapa → fusionar; no ayuda a comprender, operar, recuperar o auditar → eliminar/descartar.
