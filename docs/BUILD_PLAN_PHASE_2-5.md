# IGO Automate — Production Build Plan: Phases 2–5

Phase 1 (scaffold) is done and pushed. This plan carries the project to a production-grade
cutover and decommission, phase by phase. A phase is not "done" when the calendar says so —
it's done when its **exit criteria** are met and Buddy signs off. No production WhatsApp/email
traffic moves without that sign-off, per the original brief.

Each phase below has: prerequisites, deliverables, and an exit-criteria gate (checklist) that
must pass before the next phase starts.

---

## Phase 2 — Read-Only Integration

**Goal:** prove the data model against real Supabase data with zero send/write risk.
**Est. duration:** 2–3 weeks.

### Deliverables

**Data model**
- Versioned SQL migrations (checked into `apps/api/migrations/` or via Supabase CLI) for:
  `segments`, `campaigns`, `messages`, `templates`, `conversation_logs`, `onboarding_events`,
  and any needed columns added to the existing `customers` table — never a new Supabase project.
- Row-Level Security (RLS) policies on every new table, scoped by `sub_brand` and role
  (Admin / Automation / BD), mirroring whatever auth pattern the existing Aria/Social CRM
  tables already use.
- A data-quality report reconciling WATI's lead sheets, the Zoho Campaigns trial list, and
  existing Supabase `customers` rows — dedupe by normalized phone (E.164) and lowercased email.

**Modules**
- **Unified Contacts**: list/filter/search UI over `GET /api/contacts`, paginated, filterable
  by `sub_brand`, source, and dedupe status.
- **Delivery & Reply Analytics**: aggregate sent/delivered/read/replied per campaign and
  sub-brand, `GET /api/analytics/*`, backed by the (still-empty) `messages` table so the
  dashboards are ready before Phase 3 starts producing real rows.
- **Admin & Access** (skeleton): role-based route guards wired to Supabase auth, even if the
  UI is minimal.

**Engineering hygiene**
- Structured logging in the API (e.g. pino), request IDs on every log line.
- Error tracking (Sentry or equivalent) wired to both `apps/api` and `apps/web`.
- Unit tests for phone/email normalization and dedupe logic.
- Integration tests for `/api/contacts` and `/api/analytics` against a Supabase branch/preview
  database — never against the production project directly in CI.
- GitHub Actions CI: lint → typecheck → test → build, required to pass before merge to `main`;
  auto-deploy to a staging environment on the VPS (separate docker-compose project/network
  from anything touching real WATI/Zoho traffic).

### Exit Criteria (Phase 2 Gate)

- [ ] Migrations applied to the existing Supabase project via a branch/preview first, then
      promoted — without altering any table the Aria/W1–W5 pipelines depend on.
- [ ] RLS verified with a concrete test: a BD-role user cannot read another sub-brand's rows.
- [ ] Contacts and Analytics pages render real data; list view stays responsive (<2s) at
      10k+ rows (pagination, not full table scans).
- [ ] Every send/write path still returns `501`/`503` by design — covered by an automated
      test, not just manual inspection.
- [ ] Data-quality/dedupe report reviewed and signed off by Buddy.
- [ ] CI green on `main`; staging auto-deploys and matches what's in the repo.

---

## Phase 3 — Controlled Cutover

**Goal:** prove Evolution API + listmonk work in production, one workflow and one domain at a
time, with a fast rollback path.
**Est. duration:** 4–6 weeks (gated by DNS propagation and a mandatory parallel-run week).

### Blocking prerequisites (must complete before any real send)

1. **SPF/DKIM/DMARC configured and verified** for the sending domain — this blocks *all*
   outbound email regardless of tool. Verify with a deliverability checker before the first
   real listmonk campaign, not after.
2. **Meta WhatsApp Business Platform** app approved, phone number verified, at least one
   message template approved — Evolution API in Cloud API mode is worthless without this.
3. Evolution API and listmonk deployed behind the existing reverse proxy with TLS on
   `wa-api.igogroups.com` / `mail.igogroups.com`, both reachable and their webhooks registered.

### Deliverables

**Provider implementations (replace the Phase 1 stubs with real calls)**
- `WatiProvider`: implement real send + status calls — it's the control group for comparison,
  not just the incumbent to be replaced.
- `EvolutionProvider`: implement real send (template + text) and webhook normalization against
  the pinned Evolution API version's actual docs.
- A parallel `EmailProvider` interface (mirroring `WhatsAppProvider`) wrapping listmonk's API —
  even though there's no long-term second email backend to swap to, this keeps listmonk's
  API-version churn from leaking into route handlers.

**Campaign Builder** (real, but gated)
- Compose a WhatsApp template + matching email, target a segment, schedule or send now.
- The actual send path stays gated to **one pilot n8n workflow** first (e.g. a single welcome
  message), not opened to arbitrary campaigns yet.

**n8n integration**
- Backend exposes webhook endpoints n8n calls to trigger sends and report results back.
- Migrate exactly one existing n8n workflow to call Evolution API through IGO Automate's
  backend instead of WATI directly. Every other W1–W5 workflow stays untouched.

**Parallel-run validation**
- Run the pilot workflow against both WATI (control) and Evolution API (test) for **7
  consecutive days** — either a shadow send to a held-out test audience, or a feature-flagged
  subset of real recipients (decide with Buddy which is acceptable).
- Compare delivered/read rates side by side in the Analytics module before expanding scope.

**Email migration**
- Export the Zoho Campaigns trial contact list, import into listmonk, and confirm existing
  unsubscribes/bounces are honored on import — don't re-email anyone who already opted out.

**Compliance panel**
- Template & Compliance Panel: Meta template approval status, SPF/DKIM/DMARC health (automated
  DNS lookups, not a manual checklist), and a live WATI/Zoho decommission checklist.

**Security & ops for real sends**
- HMAC (or provider-native) signature verification on all three inbound webhook receivers
  (WATI, Evolution API, listmonk) — reject unsigned/forged webhook payloads.
- Rate limiting on `/api/campaigns` send endpoints to prevent a runaway or duplicate-triggered
  campaign.
- All secrets (Evolution API key, listmonk token, SMTP creds, WATI token) moved out of plain
  `.env` files on the VPS into whatever secret-storage pattern the VPS/Portainer setup already
  uses for other services.
- Alerting (Slack/email to Buddy + Automation team) if: Evolution API's delivery rate for the
  pilot workflow drops >10% below WATI's historical baseline, or webhook receivers start
  erroring.
- **Rollback plan**: the pilot workflow's provider is switched with a single per-workflow flag
  (not a global env var) so it can revert to WATI within minutes without touching any other
  workflow.

### Exit Criteria (Phase 3 Gate)

- [ ] SPF/DKIM/DMARC pass a deliverability check (score ≥9/10 on a tool like mail-tester.com)
      before the first real listmonk send.
- [ ] Pilot n8n workflow has run on Evolution API for ≥7 consecutive days.
- [ ] Evolution API delivery rate is within 5% of WATI's baseline for that same workflow.
- [ ] Zero incidents requiring rollback during the parallel-run week — or, if one occurred,
      the rollback flag was exercised successfully and the incident is documented.
- [ ] listmonk sending to the migrated Zoho trial list with <2% bounce rate and unsubscribes
      correctly honored.
- [ ] Buddy sign-off to expand Evolution API / listmonk beyond the single pilot workflow.

---

## Phase 4 — Fine-Tuning

**Goal:** replace the prompt-based Groq/Gemini Aria persona with a self-hosted fine-tuned model,
without degrading lead-qualification quality. **Starts only after Phase 3 has been logging
real conversations long enough to hit the data bar below** — not on a fixed calendar date.

### Deliverables

- **Data bar**: don't start training on fewer than ~2,000–5,000 real, role-tagged Aria/lead
  conversation turns. Fine-tuning on too little data produces a worse model than the prompt
  baseline — quality gate, not a vanity metric.
- **Export pipeline**: `conversation_logs` → JSONL chat-format training pairs, with a PII
  scrubbing/anonymization pass (phone numbers, names) before the data leaves Supabase — this
  is a compliance requirement, not optional cleanup.
- **Training**: Unsloth + LoRA fine-tune of Llama 3.1 8B (or Qwen2.5 7B) on a rented GPU
  (no permanent GPU infra needed). Training script and dataset version are checked into the
  repo/artifact store so a re-run is reproducible.
- **Evaluation harness**: a held-out test set comparing the fine-tuned model against the
  current Groq/Gemini prompt on lead-qualification accuracy, tone, and hallucination rate —
  reviewed by a human (BD team), not scored purely by an automated metric.
- **Serving**: export to GGUF, serve via Ollama on the VPS, wire the already-stubbed
  `OllamaProvider` to the real endpoint.
- **Aria Persona Console**: a model toggle / A-B split — route a configurable percentage of
  conversations to the fine-tuned model and log outcomes separately for comparison.
- **Fallback**: if Ollama is unreachable or p95 latency exceeds an agreed threshold, the
  `AIProvider` layer auto-falls back to Groq/Gemini (circuit-breaker pattern) — a lead should
  never go unanswered because the self-hosted model is down.
- **Retraining cadence**: documented quarterly re-run runbook using the same export → train →
  evaluate → deploy pipeline.

### Exit Criteria (Phase 4 Gate)

- [ ] Fine-tuned model matches or beats the current prompt-based persona on the human-reviewed
      eval harness.
- [ ] p95 response latency on VPS CPU inference is acceptable for WhatsApp UX (agree the exact
      threshold with Buddy, e.g. <8s) — re-evaluate GPU serving if it isn't.
- [ ] Circuit-breaker fallback tested directly: kill Ollama, confirm the next message auto-routes
      to Groq/Gemini within one message cycle.
- [ ] A/B test run for ≥2 weeks with no regression in lead-to-BD-handoff rate.
- [ ] Buddy + BD team sign-off to make the fine-tuned model the default.

---

## Phase 5 — Decommission

**Goal:** sunset WATI and Zoho Campaigns cleanly, with an audit trail and no orphaned data.
**Est. duration:** 4+ weeks, mostly stabilization time, not build time.

### Deliverables

- Expand from the Phase 3 pilot to all 27 sub-brands, phased by risk tier (lowest-volume/
  lowest-risk sub-brands first) rather than a single flag flip.
- Full export/archive of WATI's lead sheets and Zoho's contact/campaign history before either
  account is closed — required for audit and historical reporting, not just nice-to-have.
- Billing cancellation checklist for WATI and Zoho Campaigns: confirm final invoice, export any
  usage data the vendor won't retain post-cancellation.
- Update every remaining n8n workflow (not just the Phase 3 pilot) to call Evolution API /
  listmonk.
- Remove `WatiProvider` from the active runtime path; keep it in git history (and optionally
  behind a disabled flag for one release cycle) before deleting it outright.
- Confirm the WhatsApp template library is fully migrated and Meta-approved in Evolution API,
  and listmonk's sending domain reputation is stable (not blacklisted, healthy open rates).
- A 2–4 week heightened-monitoring window post-cutover before declaring the migration complete.

### Exit Criteria (Phase 5 Gate)

- [ ] 100% of sub-brands sending via Evolution API/listmonk for ≥30 days at or above the
      WATI/Zoho delivery-rate baseline.
- [ ] WATI and Zoho contracts formally cancelled; data exported and archived.
- [ ] Zero P1/P2 incidents during the 30-day stabilization window.
- [ ] Runbooks updated to remove WATI/Zoho-specific steps.
- [ ] Buddy's final sign-off.

---

## Cross-cutting production requirements (apply across Phases 2–5)

Scoped to what actually matters for an internal ops platform moving real WhatsApp/email
traffic for real customers — not a generic public-SaaS checklist.

**Security**
- Secrets live in the VPS's existing secret-storage pattern, never in the repo (already
  `.gitignore`d).
- Supabase service-role key stays backend-only; RLS enforced for every other role.
- Signed/verified webhooks on all three inbound providers.
- Rate limiting on every send endpoint.
- Audit log: who sent, scheduled, or approved every campaign — accountability matters once
  real customers are being messaged.

**Reliability**
- `/api/health` plus dependency checks (Supabase, Evolution API, listmonk reachability).
- Docker Compose restart policies + healthchecks on every service.
- Backup cadence for the new `infra-postgres` (Evolution API + listmonk data) — Supabase's own
  backups already cover the platform's core data, this is the one gap to close.
- A documented, tested rollback plan for each phase (see Phase 3's per-workflow flag above).

**Observability**
- Structured JSON logs from `apps/api`, persisted via Docker's log driver at minimum.
- Alerting to Buddy + the Automation team on: send-failure spikes, webhook errors, delivery-rate
  drops, domain reputation issues.
- A system-health tile in the Admin module rather than standing up a full Grafana stack —
  revisit if the team outgrows it.

**Compliance**
- WhatsApp: only Meta-approved templates for outbound marketing; opt-outs honored; respects
  Meta's 24-hour customer-service session window.
- Email: unsubscribe link on every campaign (listmonk handles this natively); consent tracking
  recorded on the `campaigns` table.
- `conversation_logs` PII handling documented and reviewed before any Phase 4 training-data
  export.

**Operations**
- Runbooks for: "Evolution API is down", "listmonk send is stuck", "roll a workflow back to
  WATI", "rotate a leaked API key".
- Clear on-call ownership for send failures (Buddy + one Automation engineer, to start).
- Every phase gate above requires Buddy's explicit sign-off before the next phase starts — this
  is already the rule in the original brief; this document just makes each gate's checklist
  concrete.

---

## Indicative timeline

| Phase | Duration | Notes |
|---|---|---|
| 2 — Read-only integration | 2–3 weeks | Gated by data-quality sign-off |
| 3 — Controlled cutover | 4–6 weeks | Gated by DNS propagation + mandatory 7-day parallel run |
| 4 — Fine-tuning | Starts only once the data bar is hit (likely 8–12+ weeks after Phase 3 begins logging); the fine-tune itself takes ~2–3 weeks once data is ready |
| 5 — Decommission | 4+ weeks | Mostly stabilization time, phased by sub-brand risk |

Adjust all of the above with Buddy once Phase 2 is underway — these are planning estimates,
not commitments.
