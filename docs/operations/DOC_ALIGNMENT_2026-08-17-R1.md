# HOCKER — DOC-ALIGNMENT / Corrección de semántica de autoridad — 2026-08-17 R1

Status: **ACTIVE ALIGNMENT EVIDENCE — SEMANTIC CORRECTION**  
Effective for continuation: **2026-08-17** / America/Tijuana.  
Supersedes for operational pointer semantics: `DOC_ALIGNMENT_2026-08-17.md`.  
Preserves all factual evidence and historical identifiers from that snapshot unless this correction states otherwise.

## 1. Motivo de la corrección

El snapshot anterior fijó correctamente el último estado funcional verificado después de PR #221, pero utilizó las etiquetas **“Current main”** y **“Current production deployment”** para el commit `f122b15c8136c8885edfd24396115c6bda1b6329` y el deployment `dpl_4ouB2HxXuNBkz3PBu8xDo5EQi7Pf`.

Después, PR #222 cambió únicamente documentación Markdown. Ese merge avanzó Git `main` a `9dfdc688f73f6cad69c40179c1bb3a0a831bbb45` y Vercel creó un deployment productivo nuevo `dpl_Eaa9Gi3XYWa4ZzWLTL9hFuaA9cCR`, aunque el código/runtime funcional no cambió. CodeQL del merge documental terminó **SUCCESS** y el deployment docs-only quedó **READY**.

Por lo tanto, un snapshot operativo no debe intentar incrustar como valor permanente el puntero mutable de `main` o del deployment más reciente: actualizar el propio snapshot puede mover ambos y volverlo aparentemente obsoleto sin que cambie el producto.

## 2. Regla estable de autoridad

A partir de este documento se distinguen dos planos:

### A. Autoridad funcional verificada al corte

Es el último commit que cambió código, runtime, migraciones, configuración funcional o controles de seguridad y que completó sus gates de validación.

Para el corte cubierto por este alineamiento:

- **último commit runtime/security verificado:** `f122b15c8136c8885edfd24396115c6bda1b6329`;
- **CI funcional asociado:** #757 / run `31988067943` — SUCCESS;
- **CodeQL funcional asociado:** run `31988066897` — SUCCESS;
- **deployment funcional verificado al corte:** `dpl_4ouB2HxXuNBkz3PBu8xDo5EQi7Pf` — READY;
- **runtime-error read funcional revisado:** sin errores en la ventana post-deploy de 1 hora revisada;
- **última migración funcional cerrada en ese corte:** `20260817021859_project_members_owner_admin_write_hardening_20260816`.

Estos IDs se conservan como evidencia congelada del cambio funcional. No se actualizan sólo porque exista un commit documental posterior.

### B. Punteros mutables de repositorio y deployment

`main`, el deployment productivo más reciente y cualquier estado de proveedor son **punteros mutables**. Siempre deben reconsultarse inmediatamente antes de actuar.

Al momento de esta corrección se observó:

- Git `main`: `9dfdc688f73f6cad69c40179c1bb3a0a831bbb45`;
- ese SHA corresponde a PR #222, documentación-only;
- Vercel productivo más reciente: `dpl_Eaa9Gi3XYWa4ZzWLTL9hFuaA9cCR` — READY, source SHA `9dfdc688…`;
- CodeQL post-merge para `9dfdc688…`: run `31988626675` — SUCCESS;
- el CI de aplicación no se ejecuta para cambios Markdown porque `.github/workflows/ci.yml` usa `paths-ignore: "**/*.md"`.

**Estos punteros NO deben copiarse a futuros snapshots como si fueran constantes.** El siguiente operador debe reconsultarlos.

## 3. Cómo leer `DOC_ALIGNMENT_2026-08-17.md`

Las expresiones del snapshot original:

- “Current `main`: `f122…`”;
- “Current production deployment: `dpl_4ou…`”;
- “reconcile ... to `main=f122…`”;

deben interpretarse desde ahora como:

- **último commit funcional/runtime verificado al evidence cut: `f122…`**;
- **deployment funcional verificado al evidence cut: `dpl_4ou…`**;
- **reconciliar continuidad contra esa autoridad funcional y, por separado, reconsultar los punteros Git/Vercel actuales antes de cualquier acción**.

Ningún otro dato factual del snapshot anterior se modifica por esta corrección.

## 4. Estado que permanece abierto

La corrección semántica no altera los blockers ya registrados:

- 16/16 AGIs siguen con `allow_actions=false`;
- no existe todavía evidencia durable 16/16 de `agi_eval_result` ni `agi_tool_eval_result`;
- el programa global de Supabase Security Advisor sigue abierto y debe tratarse objeto por objeto;
- Context Bridge y Memory Mirror requieren reconsulta actual antes de cualquier claim de frescura o activación;
- dedicated `nova.agi` sólo es fallback/compatibilidad hasta revalidación actual si se necesita;
- authenticated NOVA E2E/provider-fallback, web/PWA/mobile, accessibility/performance, rollback/runbooks y observability siguen siendo gates de cierre;
- secret rotation permanece para una ventana coordinada posterior;
- no se autoriza declarar HOCKER Core ni el ecosistema completo como 100% terminado.

## 5. Regla de handoff

Cada continuación debe registrar por separado:

1. **current pointers** — Git `main`, deployment productivo, migration ledger, provider/runtime state, consultados en ese momento;
2. **latest functional authority** — último cambio funcional con gates completos;
3. **documentation-only ancestry** — commits que pueden avanzar `main`/Vercel sin modificar runtime;
4. **open evidence gates** — blockers todavía no cerrados.

Así, la documentación puede evolucionar sin producir un ciclo infinito de auto-obsolescencia.
