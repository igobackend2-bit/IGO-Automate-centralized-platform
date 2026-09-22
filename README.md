# IGO Automate

Centralized automation platform for IGO Group — unifies WhatsApp bulk messaging, email bulk
messaging, new-customer onboarding, and an AI persona layer, replacing the paid WATI +
Zoho Campaigns setup with a self-hosted open-source stack.

See [docs/BUILD_PLAN_PHASE_2-5.md](docs/BUILD_PLAN_PHASE_2-5.md) for the full phase-by-phase
build plan with exit criteria. **Status: Phase 2 (Read-only integration) complete, Phase 3
(Controlled cutover) in progress** — real provider code and a locally-verified Evolution
API/listmonk deployment are done; no real WhatsApp/email sending yet since that needs Meta
Business approval, a real sending domain, and VPS access. WATI, Zoho Campaigns, and the live
n8n W1–W5 workflows are untouched.

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
existing n8n instance. Copy `.env.example` to `.env` at the repo root (local dev values are
fine — see the file for what a real deploy additionally needs), then:

```bash
docker compose up -d infra-postgres infra-redis evolution-api listmonk
```

**Verified working locally** (2026-09-22): all four containers boot cleanly — Evolution API
runs its Prisma migrations against `infra-postgres` and serves its manager UI at
`http://localhost:8080/manager` (log in with `EVOLUTION_API_KEY`; "WhatsApp Cloud API" is a
selectable channel type, confirming the ToS-safe mode the brief requires is available), and
listmonk auto-installs and serves a full dashboard at `http://localhost:9000/admin` (log in
with `LISTMONK_ADMIN_USER` / `LISTMONK_ADMIN_PASSWORD`). Neither has a real WhatsApp number or
sending domain connected yet — that's real Meta/DNS credentials, not something local Docker
can provide.

**Found and fixed along the way:** the Evolution API project rebranded — its image moved from
`atendai/evolution-api` (no longer exists) to `evoapicloud/evolution-api`, and its docs moved
from doc.evolution-api.com to docs.evolutionfoundation.com.br. `docker-compose.yml` and the
provider code comments now reference the current names; re-verify both before a real deploy in
case they've moved again.

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

`apps/api/.env` has the real `SUPABASE_URL`, anon key, and `service_role` key —
`/api/contacts` and `/api/analytics` are live against this project. RLS was behaviorally
verified (not just enabled): a real `bd`-role auth user scoped to `brand-a` was created,
customers seeded in `brand-a` and `brand-b`, and queried through that user's actual JWT —
confirmed they see only their own sub-brand's row. Test data was fully cleaned up afterward.

**Historical data imported:** the W1-W5 lead_qualifier project (a separate legacy Supabase
project, never made directly accessible to this platform) was recovered via a downloaded
Postgres backup and imported — 265 leads and 672 real Aria conversation turns, now live in
`customers` / `conversation_logs`. `sub_brand` was derived from the legacy `project_interest`
field (goat-farming, mushroom, garden, container-farming, microgreens, polyhouse). This is the
real seed data behind the Unified Contacts and Analytics modules, and the actual start of the
Phase 4 fine-tuning dataset.

## Testing

```bash
cd apps/api && npm test     # normalize/dedupe unit tests (node:test)
cd apps/web && npm run lint && npm run build
```

CI (`.github/workflows/ci.yml`) runs both on every push/PR to `main`.

## Build phases

1. **Foundation** — scaffold app, deploy Evolution API + listmonk, no live traffic touched. ✅
2. **Read-only integration** — Unified Contacts + Analytics modules, migrations, and RLS are
   applied and verified against the live database. ✅
3. **Controlled cutover** (in progress) — real WATI/Evolution API provider code done; Evolution
   API + listmonk verified running locally via Docker; still needed: real Meta WhatsApp
   Business approval, SPF/DKIM/DMARC on a real sending domain, VPS deployment, WATI token, and
   the one n8n workflow cutover + 7-day parallel run itself.
4. **Fine-tuning** — export `conversation_logs`, LoRA fine-tune via Unsloth, serve via Ollama.
5. **Decommission** — sunset WATI and Zoho Campaigns once validated across all sub-brands.

No production WhatsApp/email traffic moves without explicit sign-off, per phase.
