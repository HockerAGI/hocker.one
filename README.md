# HOCKER ONE (Control Plane)
HOCKER ONE = Control H unificado. Panel maestro para:
- Login (Supabase)
- Enviar comandos a nodos (tabla commands)
- Ver eventos del ecosistema (tabla events)

## Requisitos
- Node.js 18+ (Vercel lo maneja)
- Proyecto Supabase (URL + ANON KEY)

## Configuración (local)
1) Copia `.env.example` a `.env.local`
2) Llena:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY

3) Instala y corre:
```bash
npm i
npm run dev