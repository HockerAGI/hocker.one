# Checklist de despliegue y migración — hocker.one + nova.agi

Orden **crítico** de despliegue para evitar fallos en producción.

## 1. Preparación (antes de cualquier deploy)

- [ ] Confirmar Node.js 22.x disponible en plataforma (Vercel, Railway, Cloud Run)
- [ ] Tener acceso a Supabase (credenciales de administrador)
- [ ] Backup de base de datos en Supabase (snapshot recomendado)
- [ ] Tener credenciales de Vercel, Railway o plataforma de deploy

## 2. Aplicar migraciones en Supabase (PRIMERO, antes de desplegar código)

**Orden de ejecución:**

### Migración 1: Schema core (audit_logs, llm_usage, nova_threads, nova_messages)
```bash
# Archivo: supabase/migrations/20260612_103000_hocker_core_schema.sql
# En Supabase dashboard: SQL Editor → copiar y ejecutar el script
# O vía CLI:
supabase db push
```

**Qué hace:**
- Crea tabla `audit_logs` con triggers append-only (immutable history)
- Crea tabla `llm_usage` para rastreo de tokens
- Crea tablas `nova_threads` y `nova_messages` para persistencia de chat

**Idempotencia:** ✅ Seguro ejecutar múltiples veces (usa IF NOT EXISTS)

### Verificación post-migración
```sql
-- Ejecutar en Supabase SQL Editor para confirmar tablas
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name IN (
  'audit_logs', 'llm_usage', 'nova_threads', 'nova_messages'
);
-- Esperado: 4 filas (una por tabla)
```

## 3. Configurar variables de entorno en plataforma

### Vercel (hocker.one)
- Ir a: Project Settings → Environment Variables → Production
- Añadir o confirmar:
  - `SUPABASE_URL` = tu_url_supabase
  - `SUPABASE_SERVICE_ROLE_KEY` = tu_service_role_key (server-only)
  - `HOCKER_AUDIT_SECRET` = secreto_auditoria (o usar SUPABASE_SERVICE_ROLE_KEY como respaldo)
  - `HOCKER_GITHUB_TOKEN` = (si usas GitHub automation)
  - `HOCKER_ONE_INTERNAL_TOKEN` = (si usas orquestación interna)
  - Otros según DEPLOYMENT.md

**Nota importante:** `SUPABASE_SERVICE_ROLE_KEY` **NUNCA** debe ser una variable `NEXT_PUBLIC_*`

### Railway (nova.agi)
- Ir a: Variables → Production
- Añadir:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `NOVA_ORCHESTRATOR_KEY`
  - `HOCKER_COMMAND_HMAC_SECRET`
  - `NODE_ENV=production`
  - `PORT=8080`
  - Otros según env.example

## 4. Actualizar Node.js en plataforma a 22.x

### Vercel (hocker.one)
```
1. Ir a: Project Settings → General → Node.js Version
2. Seleccionar: 22.x (o dejar que use engines del package.json)
3. Guardar
```

### Railway (nova.agi)
```
1. En Railway dashboard, ir al proyecto nova-agi
2. Settings → Deploy → Node version → seleccionar 22.x
3. Guardar
```

### Cloud Run futuro
```bash
# Si usas Cloud Run, especificar en Dockerfile o build config
FROM node:22-alpine
```

## 5. Build y test locales (ANTES de hacer push a main)

**Tanto en hocker.one como en nova.agi:**

```bash
# Instalar dependencias
npm ci

# Type-check
npm run typecheck

# Build
npm run build

# Si todo OK:
npm start  # para test local (opcional)
```

## 6. Deploy a producción

### Vercel (hocker.one)
```
1. Git push a main
2. Vercel automáticamente detecta y deploya
3. Esperar a que termine el build
4. Verificar logs: https://vercel.com/HockerAGI/hocker.one/logs
5. Probar: https://hocker-one.vercel.app/ (o tu dominio)
```

### Railway (nova.agi)
```
1. Git push a main
2. Railway detecta cambios en GitHub
3. Esperar a que build y deploy terminen
4. Verificar en Railway dashboard → Logs
5. Probar: https://nova-agi.railway.app/ (o endpoint de Railway)
```

## 7. Post-deploy verification

### Health checks
```bash
# hocker.one
curl https://hocker-one.vercel.app/api/health

# nova.agi
curl https://nova-agi.railway.app/health
```

### Logs
- **Vercel:** Vercel dashboard → Logs (real-time)
- **Railway:** Railway dashboard → Logs
- **Supabase:** Supabase dashboard → Logs (SQL, auth, realtime)

### Confirmación de funcionalidad
```bash
# Probar rutas críticas:
# hocker.one
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://hocker-one.vercel.app/api/agi/runtime/tools

# nova.agi
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://nova-agi.railway.app/providers/status
```

## 8. Rollback en caso de error

Si algo falla tras desplegar:

### Opción A: Git rollback (rápido)
```bash
git revert HEAD  # Revierte el último commit
git push origin main
# Vercel/Railway automáticamente redeploya versión anterior
```

### Opción B: Rollback de Supabase (si migraciones causaron error)
```sql
-- Si migraciones SQL causaron problemas:
-- 1. Eliminar triggers/funciones (si es seguro)
DROP TRIGGER IF EXISTS audit_logs_prevent_update_trigger ON public.audit_logs;
DROP FUNCTION IF EXISTS public.audit_logs_prevent_update();
-- 2. O restaurar desde backup si falló algo grave
```

## 9. Monitoreo post-deploy (primeras 2 horas)

- [ ] Revisar logs de Vercel / Railway cada 5-10 minutos
- [ ] Probar flujos críticos (chat en hocker.one, providers en nova.agi)
- [ ] Monitorear errores en Sentry / observabilidad (si disponible)
- [ ] Revisar métricas de Supabase (queries, replication, errors)

## Variables de entorno críticas (resumen)

| Variable | Repo | Scope | Requerida | Ejemplo |
|----------|------|-------|-----------|---------|
| `SUPABASE_URL` | both | server | ✅ | https://xxx.supabase.co |
| `SUPABASE_SERVICE_ROLE_KEY` | both | server-only | ✅ | eyJxxx... (NUNCA NEXT_PUBLIC_*) |
| `NOVA_ORCHESTRATOR_KEY` | nova.agi | server | ✅ (prod) | secreto_token |
| `HOCKER_GITHUB_TOKEN` | hocker.one | server | ⚠️ | ghp_xxx... |
| `NODE_ENV` | both | any | ✅ | production |
| `PORT` | nova.agi | any | ✅ | 8080 |

## Contacto / Soporte

Si algo falla:
1. Revisar logs (Vercel / Railway / Supabase)
2. Ejecutar verificación post-deploy (punto 7)
3. Si error persiste → rollback (punto 8)

---

**Generado:** 2026-07-03  
**Node.js target:** 22.x  
**Migraciones:** idempotentes (seguro ejecutar múltiples veces)
