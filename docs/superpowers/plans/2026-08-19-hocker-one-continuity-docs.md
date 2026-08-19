# Plan — Documentación, canon y continuidad

Fecha: 2026-08-19

## Objetivo

Dejar el repositorio autoexplicativo después del rediseño para que un nuevo chat/agente recupere intención, estado, límites, pruebas y siguiente paso sin depender del historial de conversación.

## Fuentes a revisar/actualizar

- `README.md`
- `AGENTS.md`
- `docs/operations/INDEX.md`
- `docs/operations/HANDOFF_2026-08-19.md`
- `docs/operations/LAST_KNOWN_STATE.md`
- `docs/operations/DOC_ALIGNMENT_2026-08-19.md`
- `docs/00-governance/HOCKER_DEVELOPMENT_LEDGER.md` sólo hito resumido
- docs/arquitectura/producto/UX editables que existan en el repo
- registro documental/canonical names si existen y el cambio lo requiere

## Reglas

- Una sola fuente guarda el detalle dinámico; las demás apuntan a ella.
- No copiar el chat crudo.
- No congelar contadores mutables como verdad futura.
- Producción/configuración/DB/logs siguen por encima de narrativa.
- Los PDFs canónicos 2026.08 no se reescriben silenciosamente si no existe pipeline editable aprobado; el drift se registra en `DOC_ALIGNMENT` y en fuentes ejecutables de GitHub.
- README describe arquitectura y uso actuales, no claims históricos como “Omni-Sync 2025”.
- AGENTS contiene reglas durables, no SHAs dinámicos.

## Task 1 — RED continuidad

Actualizar/agregar tests para exigir:

- README apunta a `AGENTS.md` + índice de operaciones para estado real;
- AGENTS incorpora la regla UX aprobada: mostrar sólo lo que ayuda a entender/decidir/actuar y no mezclar salud/readiness/configuración/evidencia;
- INDEX señala una única fuente activa de handoff;
- handoff registra que certificación está pausada hasta Preflight v3 y que el rediseño aprobado está en rama/PR actual;
- LAST_KNOWN_STATE contiene punteros reconsultables, no resultados inventados.

## Task 2 — GREEN docs de arquitectura/producto

Actualizar el mínimo de documentos editables afectados:

- Hocker One = control plane + experiencia privada simplificada;
- navegación aprobada;
- NOVA inmersiva;
- AGIs list-detail + CTA único;
- Preflight v3 y corpus 16/16;
- responsive/WCAG 2.2 AA;
- continuidad y exact-SHA gates.

Si DOC-08 o equivalente fuente editable existe, añadir una sección de alineación. Si sólo existe PDF publicado, registrar la corrección como delta pendiente de próxima publicación canónica, sin fingir reemisión.

## Task 3 — cerrar deuda histórica de PR #213

Una vez que el nuevo PR contenga el reemplazo verificado:

- comentar #213 indicando que queda superseded por el nuevo diseño/PR;
- cerrar #213 sin merge;
- conservarlo como evidencia histórica;
- no borrar sus commits.

## Task 4 — cierre de release

Tras candidate verde y Preview revisado:

- actualizar handoff con PR, exact head, CI, Preview y pendientes reales;
- actualizar LAST_KNOWN_STATE con punteros compactos;
- Ledger recibe sólo el hito, no el relato completo;
- DOC_ALIGNMENT registra qué canon publicado quedó alineado y qué requiere futura reemisión.

## Verificación

- tests de continuidad/documentación verdes;
- enlaces/rutas válidos;
- ningún secret/PII/chat crudo;
- no contradicción entre README, AGENTS, INDEX y handoff;
- todo claim `live/verified/complete` sustentado por evidencia exacta.