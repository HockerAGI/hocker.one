# HOCKER ONE — Control Plane Oficial

HOCKER ONE unifica lo que antes era Control H.

## Rol
- Panel maestro del ecosistema HOCKER
- Emite comandos (tabla `commands`)
- Recibe eventos (tabla `events`)
- Registra nodos (tabla `nodes`)

## Nodo físico
El CPU físico NO corre IA pesada.
Es un ejecutor local:
- Lee `commands`
- Ejecuta acciones
- Escribe `events` + actualiza `nodes.last_seen_at`

## Stack
- Frontend: Next.js (Vercel)
- DB/Auth/Storage: Supabase
- Node agent: repo `hocker-nodes` (después)

## Regla de secretos
- GitHub: solo `.env.example` vacío
- Vercel/Supabase: llaves reales
- Nunca subir `.env` con valores