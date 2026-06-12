# HOCKER ONE | Control Plane (Matriz Central)

**Estado:** Operativo | **Fase:** Omni-Sync 2025
**Director:** Armando (Hocker)
**Orquestación:** NOVA Central Intelligence

Centro de mando táctico (Control Plane) multi-proyecto diseñado bajo la arquitectura *Dark Glass*. Este ecosistema supervisa, despliega y administra funciones avanzadas en sincronía con `nova.agi`.

## ⚙️ Arquitectura de Sincronización
- **Enlace Directo:** Comunicación bidireccional con `nova.agi` vía `/api/nova/chat`.
- **Seguridad de Trasmisión:** Autenticación estricta mediante `Authorization: Bearer ${NOVA_ORCHESTRATOR_KEY}`.
- **Telemetría Aislada:** Monitoreo de eventos y ejecución de comandos filtrados y segmentados por `project_id`.
- **Gobernanza Total:** Control absoluto de permisos de escritura (`allow_write`) y detención de emergencia (`kill_switch`) por proyecto.
- **Memoria Eficiente:** **NO** se duplica la memoria. `nova.agi` es la única fuente de verdad y persiste su propia información en `nova_threads` / `nova_messages`.

---

## 🛠️ Requisitos de Infraestructura
Para levantar el escudo y activar la Matriz, el nodo local/servidor debe cumplir con:
- **Motor:** Node.js 18+ (Se recomienda Node 20+ para máxima estabilidad).
- **Base de Datos:** Proyecto activo en Supabase (DB + Auth configurado).
- **Conectividad:** `nova.agi` debe estar desplegado, en línea y accesible públicamente (obligatorio HTTPS).

### Dependencias Tácticas Críticas
- `@supabase/supabase-js` (Gestión de estado y telemetría en tiempo real)
- `@supabase/ssr` (Soberanía de autenticación Server-Side)

---

## 🚀 Despliegue de la Matriz (Setup Rápido)

### 1) Inicialización del Entorno
Clona la estructura y sincroniza las dependencias. El entorno se encargará de instalar los paquetes sin comprometer el Lockfile.

```bash
npm install
