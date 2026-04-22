# Runtime Alignment Notes · 2026-04-22

## Resumen
La base remota quedó alineada operativamente con los contratos usados por:
- hocker.one
- nova.agi
- hocker-node-agent

## Validaciones manuales realizadas
### Commands
Se validó el flujo:
- queued
- needs_approval
- running
- done

Con soporte para:
- signature
- needs_approval
- approved_at
- started_at
- finished_at

### Memoria NOVA
Se validó inserción en:
- nova_threads
- nova_messages

Con thread real asociado a project_id.

### Events / Nodes
Se confirmó que:
- events exige node_id existente por FK
- nodes contiene al menos:
  - hocker-node-1
  - cloud-core-1

### Observabilidad / auditoría
Se validó presencia operativa de:
- llm_usage
- audit_logs
- node_heartbeats

## Importante
Este directorio documenta el estado **aplicado y validado**.
No debe tratarse como migración automática para reejecutarse a ciegas en producción.
