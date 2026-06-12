# HOCKER ONE · 13-2C-H-E-A Rollback Endpoint + Plan Audit

## Objetivo

Auditar si existe rollback real antes de crear cualquier botón de reversión dentro de NOVA Chat.

## Resultado ejecutivo

- Endpoint real de rollback: **CANDIDATO DETECTADO**.
- Siguiente paso seguro: crear preview + confirmación usando el endpoint detectado.

## Candidatos de endpoint

- `/api/agi/runtime/memory/publication-audit`
  - Archivo: `src/app/api/agi/runtime/memory/publication-audit/route.ts`
  - Métodos: `GET, POST`
  - Owner gate: `requireProjectRole(["owner"]) or owner-including role gate`
  - Keywords: `rollback`

## Paquetes históricos revisados

- `/sdcard/Download/HOCKER_FULL_SOURCE_CODE_AUDIT_20260524_213950.tar.gz`
  - Existe localmente: `True`
  - Coincidencias: `37`
- `/sdcard/Download/HOCKER_13_ZERO_REAL_AUDIT_20260524_192900.tar.gz`
  - Existe localmente: `True`
  - Coincidencias: `42`

## Seguridad

- No se ejecutó ninguna acción.
- No se llamó endpoint de ejecución.
- No se escribió en Supabase.
- No se modificaron APIs productivas.
- No se creó botón de rollback falso.

## Decisión

Implementar preview UI sólo si se confirma endpoint real de rollback.
