# HOCKER ONE (Control Plane)
HOCKER ONE = panel maestro (antes Control H).

## Qué hace
- Login (Supabase Auth)
- Protege /dashboard
- Envia comandos (tabla commands)
- Lee/crea eventos (tabla events)
- Base para integrar el nodo físico (hocker-nodes)

## Setup local
1) Copia `.env.example` → `.env.local`
2) Llena:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY

3) Instala y corre:
```bash
npm i
npm run dev