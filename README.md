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

**Project: `hoeumzjuthbnhlpelbkn`** ("automation platform own", https://hoeumzjuthbnhlpelbkn.supabase.co).
This is a dedicated project created 2026-09-21 for this platform — **not** the existing
Aria/W1–W5/Social CRM project the original brief assumed would be reused; that project was
never made accessible, so `customers` and the rest of the schema were created fresh here.
If the Aria data needs merging in later, treat it as a one-time data import into this
project, not a schema/project swap.

`supabase/migrations/` (0001–0011) is applied and live: `customers`, `segments`, `templates`,
`campaigns`, `messages`, `conversation_logs`, `onboarding_events`, a `profiles` RBAC table, RLS
on every table, and a security-hardening pass (pinned `search_path`, locked down the
`can_access_sub_brand` RLS helper to `authenticated` only — see the Supabase security advisor).

```bash
supabase link --project-ref hoeumzjuthbnhlpelbkn
supabase db push   # re-applies are safe; every migration uses IF NOT EXISTS / OR REPLACE
```

**Still needed to finish Phase 2:**
- The `service_role` key (Project Settings → API → service_role) — set
  `SUPABASE_SERVICE_ROLE_KEY` in `apps/api/.env` (currently the URL + anon key are set, service
  role is blank, so `/api/contacts` and `/api/analytics` still report "not configured").
- A behavioral RLS test (a real BD-role user vs. another sub-brand) — the connected Supabase
  MCP tool this was built with runs in read-only mode for arbitrary SQL, so this needs either a
  manual test in the Supabase SQL editor or write access granted to that tool.

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
