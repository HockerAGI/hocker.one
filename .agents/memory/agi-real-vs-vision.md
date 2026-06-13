---
name: AGI real vs vision scope
description: What "make the AGIs real" means in this project, and which AGI scope is forbidden
---
- The attached PDFs (AGIs_unificadas, APPS-WEBS) describe a FUTURE VISION, not the system to build: private blockchain, Neo4j+Pinecone, Cloud Run/Hetzner mesh, GPT-5, OS "bypass", invisible surveillance, residential proxies, voice cloning. OUT OF SCOPE and partly crosses legal/ethical lines. Treat PDFs only as domain reference.
- The REAL, legitimate source of truth for AGI behavior = the code canon (`src/lib/hocker-agi-canon.ts`, `hocker-agi-registry-2c.ts`, `nova.agi/src/lib/agis.ts`) + the Proceso Maestro docx. These describe ADVISORY/analytical AGIs that PROPOSE, plus a real approval flow `needs_approval → approved → executed` "sin simular nada".

**Why:** the owner wants AGIs "100% real" yet forbids the vision platforms and any simulation; the only coherent reading is to make each AGI operate on REAL data sources (Supabase tables, real provider metrics) and legitimate read-APIs — NOT build payment/execution/surveillance engines.

**How to apply:** "make AGI X real" = wire it to its real data + a legit API for its domain, and keep it advisory where the canon says blocked (e.g. NUMIA is blocked from processing payments). Most AGIs need an owner-provided access/API per domain (Meta/Google Ads, Stripe read, CRM/WhatsApp); internal-only ones (memory, security/audit, monitoring) need no external keys.

- Deferred correctness (safe to defer ONLY while `real_execution_enabled=false`): `agi_learning_events` has no `UNIQUE(project_id, source_hash)`, so concurrent submits can double-insert pending rows; the chido approval decision can likewise double-insert. Add compare-and-set / unique enforcement (a Supabase migration the owner deploys) BEFORE enabling real execution.
