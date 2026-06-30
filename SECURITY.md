# 🔐 Política de Seguridad - Hocker ONE

**Última actualización:** 30 de junio de 2026

---

## Control de Acceso por Rol

### Owner (Dueño del Proyecto)
- ✅ Acceso a `/api/commands/approve` - Aprueba acciones esperando ejecución
- ✅ Acceso a `/api/commands/reject` - Rechaza acciones permanentemente
- ✅ Acceso a `/api/agi/runtime/actions/decision` - Decide sobre acciones AGI
- ✅ Acceso a `/api/governance/killswitch` - Activa/desactiva ejecución global
- ✅ Acceso a `/api/owner/auth-diagnostics` - Diagnóstico de autenticación
- ✅ Acceso a `/app/*` - Panel privado completo
- 🚫 No puede editar archivos del sistema sin aprobación

### Admin
- ✅ Acceso a `/api/events/manual` POST - Registra eventos
- ✅ Acceso a `/api/commands` - Lista y gestiona comandos
- ✅ Acceso a `/api/governance/killswitch` GET - Solo lectura
- 🚫 No puede aprobar/rechazar acciones (requiere Owner)

### Operator
- ✅ Acceso a `/api/events/manual` GET - Solo lectura de eventos
- ✅ Acceso a `/api/agi/runtime/context` GET - Contexto de ejecución
- ✅ Acceso a `/api/agi/runtime/capabilities` GET - Capacidades disponibles
- 🚫 No puede crear ni gestionar comandos

### Viewer
- ✅ Acceso de solo lectura a `/api/events/manual` GET
- ✅ Acceso de solo lectura a `/api/agi/runtime/capabilities` GET
- ✅ Acceso de solo lectura a `/api/governance/killswitch` GET
- 🚫 Acceso restringido a datos sensibles

---

## Endpoints Críticos - Validaciones Requeridas

### POST /api/commands/approve
- **Requiere**: `Authorization: Bearer` token válido + role `owner`
- **Validaciones obligatorias**:
  - `command_id` es UUID válido
  - `project_id` coincide con proyecto del usuario
  - `approved` es booleano
  - Comando no fue ya aprobado/rechazado
- **Rate limit**: 10 por minuto por usuario
- **Auditoría**: Registra en `audit_logs` con timestamp y usuario

### POST /api/commands/reject
- **Requiere**: `Authorization: Bearer` token válido + role `owner`
- **Validaciones obligatorias**:
  - `command_id` es UUID válido
  - Comando está en estado `needs_approval`
  - Nota (opcional) no excede 2000 caracteres
- **Rate limit**: 10 por minuto por usuario
- **Auditoría**: Registra rechazo y motivo

### GET /api/governance/killswitch
- **Requiere**: `Authorization: Bearer` token válido + rol mínimo `viewer`
- **Response**: `{ ok: true, controls: { kill_switch: boolean, allow_write: boolean } }`
- **Cache**: 5 minutos (safe-to-cache)

### POST /api/governance/killswitch
- **Requiere**: `Authorization: Bearer` token válido + role `owner`
- **Body**: `{ kill_switch: boolean, note: string }`
- **Efecto**: Detiene toda ejecución si `kill_switch=true`
- **Auditoría**: Registra cambio de estado

### POST /api/agi/runtime/actions/decision
- **Requiere**: `Authorization: Bearer` token válido + role `owner`
- **Body**: `{ action_id: UUID, decision: "approve"|"reject", note?: string }`
- **Validaciones**: 
  - Acción existe y está en estado `pending`
  - Decision es enum válido
  - Nota no excede 2000 caracteres
- **Auditoría**: Registra quién aprobó/rechazó y timestamp

### GET /api/agi/runtime/context
- **Requiere**: `Authorization: Bearer` token válido + rol mínimo `viewer`
- **Parámetro**: `?project_id=<id>`
- **Response**: Contexto de continuidad con memoria persistida
- **Cache**: 2 minutos

### GET /api/agi/runtime/capabilities
- **Requiere**: `Authorization: Bearer` token válido + rol mínimo `viewer`
- **Response**: Contrato de capacidades sin ejecutar acciones
- **Importante**: SOLO LECTURA. No ejecuta nada.

---

## Secretos y Variables de Entorno

### ❌ NUNCA HARDCODEAR:
- `SUPABASE_SERVICE_ROLE_KEY` - Solo en servidor
- `HOCKER_COMMAND_HMAC_SECRET` - Protegido en Vercel vault
- `NOVA_ORCHESTRATOR_KEY` - Para comunicación inter-servicio
- `HOCKER_GITHUB_TOKEN` - Token de personal access

### ✅ SEGURO EN CLIENTE (next public):
- `NEXT_PUBLIC_SUPABASE_URL` - URL pública Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Anon key (segura para cliente)
- `NEXT_PUBLIC_HOCKER_PROJECT_ID` - ID del proyecto

### 🔐 USAR VERCEL VAULT:
```bash
vercel env pull
```
**Nunca** comitear `.env` local a git.

---

## Validaciones de Seguridad Implementadas

- ✅ **HMAC Signature Verification** - `verifyCommand()` en agente
- ✅ **Timestamp Validation** - Comandos expiran en 5 minutos
- ✅ **Role-Based Access Control** - Todos los endpoints validan roles
- ✅ **Sandbox Escape Prevention** - Ruta restringida a `/opt/hocker-node-agent/sandbox`
- ✅ **RLS at Database** - Supabase policies por `project_id`
- ✅ **No implicit write** - `allow_write=false` por defecto

---

## Respuesta a Incidentes

### Kill Switch Activado
Si `kill_switch=true`:
1. Todos los comandos en estado `queued` se marcan como `error`
2. Nuevos comandos rechazan automáticamente
3. Notificar a owner inmediatamente
4. Revisar logs de eventos para causa

### Comando Malicioso Detectado
1. Marcar como `error`
2. Registrar en `audit_logs` con nivel `critical`
3. Bloquear usuario temporalmente (si es patrón)
4. Notificar al equipo de seguridad

### Token Comprometido
1. Revocar token en Supabase auth
2. Auditar todos los comandos ejecutados por ese usuario
3. Notificar al usuario
4. Forzar re-login

---

## Reportar Vulnerabilidades

📧 Contactar a: `security@hocker.one` (pendiente de crear)

**NO** abrir issues públicos para vulnerabilidades de seguridad.

---

## Cumplimiento

- ✅ Política actualizada regularmente
- ✅ Auditoría completa de acciones
- ✅ Encriptación en tránsito (HTTPS)
- ✅ Encriptación en reposo (Supabase)
- ✅ Acceso logger y alertas en Langfuse

---
