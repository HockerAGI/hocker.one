# HOCKER ONE · 13-2C-A Product Foundation

## Objetivo

Crear la base de producto para Hocker ONE 2C sin romper lo ya estable.

## Decisión

Hocker ONE evoluciona como **AI Command OS conversacional**, no como otro dashboard.

## Se respetó

- `13-FIX-A1` sigue vigente.
- `/app/nova` no se rompe.
- No se cambia ejecución real.
- No se toca Supabase.
- No se modifican rutas productivas.
- No se altera Owner Gate.

## Se agregó

- Catálogo oficial de 16 AGIs.
- Registro separado de sistemas, apps, repos e integraciones.
- Diccionario de textos humanos.
- Navegación por modo: owner, client, user.
- Permisos base.
- Configuración base por servicio.
- Blueprint de producto 2C.

## Regla UX

Owner puede ver AGIs, código, evidencia y modo técnico.

Cliente ve servicios, reportes, aprobaciones y NOVA limitada.

Usuario final ve sólo lo necesario para su app.

## Regla operativa

NOVA propone.  
El owner o cliente aprueba cuando aplica.  
El executor actúa sólo bajo permiso.  
La evidencia queda guardada.

## Próximo paso

13-2C-B — Visual Tokens + Human Copy integration.
