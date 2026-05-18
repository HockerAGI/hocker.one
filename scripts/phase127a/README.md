# 12.7A — AGI Runtime Core + NOVA realtime

Esta fase agrega la base real para que las 16 AGIs pasen de registro visual a ejecución controlada.

Incluye:
- Tablas nuevas: `agi_agents`, `agi_tools`, `agi_agent_tools`, `agi_tasks`, `agi_runs`, `agi_action_queue`, `agi_feedback`, `agi_chat_threads`, `agi_chat_messages`, `agi_integration_checks`.
- Catálogo de integraciones: GitHub, Supabase, Vercel, Meta Ads, Google Ads, OpenAI, Gemini, Stripe, PayPal, Namecheap, Cloudflare, Hetzner y HeyGen.
- Resumen privado `/api/agi/runtime/summary`.
- Cola segura `/api/agi/runtime/actions`.
- NOVA realtime por SSE `/api/nova/chat/stream`.
- Chat nuevo `NovaRealtimeChat`.

Regla clave:
Nada sensible se ejecuta directo. Todo pasa por Owner Gate, dry-run y auditoría.

Variables esperadas para acceso real:
`NOVA_AGI_URL`, `NOVA_ORCHESTRATOR_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `GITHUB_TOKEN`, `VERCEL_TOKEN`, `META_ACCESS_TOKEN`, `META_AD_ACCOUNT_ID`, `GOOGLE_ADS_DEVELOPER_TOKEN`, `OPENAI_API_KEY`, `GEMINI_API_KEY`, `STRIPE_SECRET_KEY`, `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `NAMECHEAP_API_USER`, `NAMECHEAP_API_KEY`, `CLOUDFLARE_API_TOKEN`, `HETZNER_TOKEN`, `HEYGEN_API_KEY`.
