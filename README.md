# IGO Automate

Centralized automation platform for IGO Group — unifies WhatsApp bulk messaging, email bulk
messaging, new-customer onboarding, and an AI persona layer, replacing the paid WATI +
Zoho Campaigns setup with a self-hosted open-source stack.

See the full build brief for architecture, phases, and constraints. **Status: Phase 1 (Foundation)
in progress.** WATI, Zoho Campaigns, and the live n8n W1–W5 workflows are untouched.

## Layout

```
apps/
  web/    Next.js + Tailwind dashboard (the platform UI)
  api/    Node/Express backend — WhatsAppProvider / AIProvider interfaces,
          webhook receivers, Supabase access
docker-compose.yml   Evolution API + listmonk + supporting infra, as NEW services
docker/              Postgres init scripts, listmonk config
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

## Build phases

1. **Foundation** (current) — scaffold app, deploy Evolution API + listmonk, no live traffic touched.
2. **Read-only integration** — Unified Contacts + Analytics against real Supabase data, no sends.
3. **Controlled cutover** — one n8n workflow to Evolution API in parallel with WATI; fix SPF/DKIM/DMARC before any real email.
4. **Fine-tuning** — export `conversation_logs`, LoRA fine-tune via Unsloth, serve via Ollama.
5. **Decommission** — sunset WATI and Zoho Campaigns once validated across all sub-brands.

No production WhatsApp/email traffic moves without explicit sign-off, per phase.
