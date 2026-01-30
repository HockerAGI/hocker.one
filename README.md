# HOCKER ONE (Control Plane)

Panel maestro del ecosistema HOCKER (antes Control H).
MVP: Login Supabase + Dashboard (commands/events) para operar nodos (local/cloud).

## Requisitos
- Node 18+
- Proyecto en Supabase

## Setup
1) Copia `.env.example` a `.env` y llena:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY

2) Instala y corre:
```bash
npm i
npm run dev