# IGO Automate

Centralized automation platform for IGO Group — unifies WhatsApp bulk messaging, email bulk
messaging, new-customer onboarding, and an AI persona layer, replacing the paid WATI +
Zoho Campaigns setup with a self-hosted open-source stack.

See [docs/BUILD_PLAN_PHASE_2-5.md](docs/BUILD_PLAN_PHASE_2-5.md) for the full phase-by-phase
build plan with exit criteria. **Status: Phase 2 (Read-only integration) in progress.** WATI,
Zoho Campaigns, and the live n8n W1–W5 workflows are untouched.

## Layout

```
apps/
  web/    Next.js + Tailwind dashboard (the platform UI)
  api/    Node/Express backend — WhatsAppProvider / AIProvider interfaces,
          webhook receivers, Supabase access
supabase/migrations/  Versioned SQL for the new tables + RLS (see below)
docker-compose.yml     Evolution API + listmonk + supporting infra, as NEW services
docker/                Postgres init scripts, listmonk config
docs/                  Build plan and other project docs
```

## Local development

```bash
# backend
cp apps/api/.env.example apps/api/.env   # fill in real values when available
cd apps/api && npm install && npm run dev

# frontend
cp apps/web/.env.local.example apps/web/.env.local
cd apps/web && npm install && npm run dev
```

Visit http://localhost:3000. The Overview page shows live backend/provider status pulled from
`GET /api/health`.

## Provider abstraction

Business logic never calls WATI, Evolution API, or a specific LLM directly — always through:

- `apps/api/src/providers/whatsapp` — `WhatsAppProvider` interface, `WatiProvider` (current,
  live) and `EvolutionProvider` (new). Selected via `WHATSAPP_PROVIDER` env var.
- `apps/api/src/providers/ai` — `AIProvider` interface, `GroqProvider` / `GeminiProvider` (now)
  and `OllamaProvider` (Phase 4, self-hosted fine-tuned model). Selected via `AI_PROVIDER`.

Swapping providers is a config change, not a rewrite.

## Docker Compose (new services only)

`docker-compose.yml` adds Evolution API and listmonk — nothing here modifies WATI or the
existing n8n instance. Copy `.env.example` to `.env` at the repo root, fill in real values,
then:

```bash
docker compose up -d infra-postgres infra-redis evolution-api listmonk
```

Before a real deploy on `srv1791721.hstgr.cloud`: pull each project's current docs
(doc.evolution-api.com, listmonk.app/docs) and pin exact image versions — this compose file
uses `latest` as a scaffolding placeholder only.

## Supabase migrations

`supabase/migrations/` has the versioned SQL for Phase 2's new tables (`segments`,
`templates`, `campaigns`, `messages`, `conversation_logs`, `onboarding_events`), a minimal
`profiles` RBAC table, additive changes to the existing `customers` table, and RLS policies
scoped by sub-brand + role. **Written but not yet applied** — this repo isn't linked to a real
Supabase project yet. Once the real project ref for the Aria/W1–W5 project is available:

```bash
supabase link --project-ref <ref>
supabase db push          # or paste each file into the SQL editor on a branch first
```

Verify the `customers` migration's assumed columns (`name`, `phone`, `email`, `sub_brand`,
`source`) against the real table before applying — it's written defensively
(`add column if not exists`) but hasn't been checked against the live schema.

## Testing

```bash
cd apps/api && npm test     # normalize/dedupe unit tests (node:test)
cd apps/web && npm run lint && npm run build
```

CI (`.github/workflows/ci.yml`) runs both on every push/PR to `main`.

## Build phases

1. **Foundation** — scaffold app, deploy Evolution API + listmonk, no live traffic touched. ✅
2. **Read-only integration** (current) — Unified Contacts + Analytics modules, migrations, and
   RLS are built; pending the real Supabase project ref to apply and verify against live data.
3. **Controlled cutover** — one n8n workflow to Evolution API in parallel with WATI; fix SPF/DKIM/DMARC before any real email.
4. **Fine-tuning** — export `conversation_logs`, LoRA fine-tune via Unsloth, serve via Ollama.
5. **Decommission** — sunset WATI and Zoho Campaigns once validated across all sub-brands.

No production WhatsApp/email traffic moves without explicit sign-off, per phase.
