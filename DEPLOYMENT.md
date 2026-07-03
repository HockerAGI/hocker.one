# Despliegue y checklist rápido

Recomendaciones para despliegues en Vercel / producción.

1) Node.js version
- Este proyecto requiere Node 22.x (declarado en package.json `engines.node`).
- En Vercel: Project Settings → General → Node.js Version -> seleccionar `22.x` o dejar que Vercel respete `engines` del package.json.

2) Supabase — migraciones y secretos
- Antes de desplegar código que usa nuevas columnas/triggers (p. ej. migraciones de `audit_chain`), APLICA la migración en Supabase _antes_ del despliegue.
- Variables obligatorias (Production, Server-only in Vercel env):
  - SUPABASE_URL
  - SUPABASE_SERVICE_ROLE_KEY (server-only)
  - HOCKER_AUDIT_SECRET (o SUPABASE_SERVICE_ROLE_KEY como respaldo)
  - HOCKER_GITHUB_TOKEN (si se usan operaciones GitHub automatizadas)
  - VERCEL_TOKEN, VERCEL_PROJECT_ID (opcional para integraciones)
- Nunca expongas SUPABASE_SERVICE_ROLE_KEY en variables `NEXT_PUBLIC_*`.

3) Seguridad y buenas prácticas
- Usa Vercel Environment Variables (Secrets) para valores sensibles. No commitear `.env` a git.
- Revisa `SECURITY.md` para reglas de operación y listas de variables seguras vs públicas.

4) Orden de despliegue (MÍNIMO)
- Aplicar migraciones de la base de datos en Supabase.
- Confirmar que las variables server-only estén definidas en Vercel.
- Actualizar Node a 22.x en Vercel si es necesario.
- Ejecutar `npm ci && npm run build` en una Preview/CI.
- Revisar logs de build y run.

5) Comandos útiles
```bash
# Local (recomendado antes de push)
npm ci
npm run typecheck   # tsc --noEmit
npm run build

# Si trabajas con Vercel CLI
vercel env pull .env.local
vercel --prod
```

6) Nota sobre auditoría y despliegues
- La funcionalidad de cadena de auditoría (`audit_chain`) requiere que la migración correspondiente esté aplicada antes de desplegar; de lo contrario el código puede lanzar errores al leer columnas nuevas.

---

Hice cambios mínimos de código previamente para resolver errores de TypeScript que bloqueban la build en Vercel (tipado seguro en acumuladores `reduce`). Si encuentras algún fallo en build, ejecútalos localmente con los comandos arriba y pásame el log; corregiré lo restante y haré push directo a `main`.
