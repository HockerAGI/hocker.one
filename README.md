# hocker.one (Control Plane) — multi-project + nova.agi

Este repo es el panel/control plane que:
- Habla con `nova.agi` vía `/api/nova/chat` usando `Authorization: Bearer ${NOVA_ORCHESTRATOR_KEY}`.
- Muestra eventos y comandos filtrados por `project_id`.
- Soporta governance por proyecto (`kill_switch`, `allow_write`).
- NO duplica memoria: `nova.agi` persiste en `nova_threads` / `nova_messages`.

---

## Requisitos
- Node.js 18+ (recomendado 20+)
- Un proyecto Supabase (DB + Auth)
- `nova.agi` desplegado y accesible públicamente (HTTPS)

Dependencias mínimas esperadas:
- `@supabase/supabase-js`
- `@supabase/ssr`

---

## Setup rápido (hocker.one)

### 1) Instala deps
```bash
npm install