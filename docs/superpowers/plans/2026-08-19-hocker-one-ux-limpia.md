# Plan maestro — Hocker One limpio y adaptativo

Fecha: 2026-08-19
Especificación aprobada: `docs/superpowers/specs/2026-08-19-hocker-one-ux-limpia-design.md`
Base funcional protegida: `5ec9de77cbe38ec869b15b30f10ea455c11436f9`
Rama: `feat/hocker-one-ux-limpia-20260819`

## Objetivo

Implementar la Opción A aprobada sin romper contratos existentes: Hocker One debe simplificar navegación y superficies, convertir NOVA en experiencia inmersiva, simplificar AGIs y fortalecer la evaluación 16/16 antes de reanudar la certificación Owner.

## Invariantes globales

- No tocar `main` directamente.
- `allow_actions=false` permanece baseline.
- Owner Gate, AAL2, RLS, auth, APIs y evidencia durable no se debilitan.
- No borrar historial/evidencia; sólo reducir su protagonismo visual.
- No introducir provider/model/SDK nuevo en esta entrega.
- No incorporar en bloque PR #213 ni sus cambios de auth/MCP; sólo patrones compatibles demostrados por tests.
- Cada cambio funcional sigue RED → GREEN → regresión.
- Un Preview sólo prueba su SHA exacto.
- No reanudar la ceremonia 16/16 hasta que Preflight v3 esté verde.

## Secuencia

1. `2026-08-19-agi-certification-preflight-v3.md`
2. `2026-08-19-hocker-one-adaptive-shell.md`
3. `2026-08-19-nova-agis-clean-ui.md`
4. `2026-08-19-hocker-one-continuity-docs.md`

La UI depende de estados confiables, por eso evaluación precede al polish final. La documentación se actualiza al final con evidencia exacta, pero sus contratos de continuidad se protegen con tests desde el inicio.

## Verificación final

En un único candidate final:

- `npm test`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- dependency/security audit requerido por CI
- Vercel Preview exact-head READY
- sin nuevo cluster de errores runtime atribuible al cambio
- revisión responsive: 320 px, móvil alto/bajo, tableta, escritorio, ultrawide
- teclado, foco, reduced motion y reflow
- NOVA sin capas redundantes
- `/agis` con una sola acción contextual y sin controles individuales en vista normal
- Preflight 16/16 verde con corpus de regresión
- AAL2/Owner Gate intactos
- documentación y handoff actualizados al mismo SHA candidato

No fusionar mientras cualquier gate aplicable esté rojo.