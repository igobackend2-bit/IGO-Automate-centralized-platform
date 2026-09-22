# Multi-Channel Enquiry Greeting — 28-Brand Rollout Plan

## The requirement, restated

IGO runs 28 brand websites, each with its own enquiry form. The moment someone submits an
enquiry on any of them, the platform should immediately fire a greeting across **WhatsApp,
email, and SMS**, with content that varies by which brand/product the enquiry was for.

This extends the already-planned **New-Customer Onboarding** module (Phase 3 of the main build
plan) in two ways that change the architecture:
1. The trigger is a **public website form submission**, not an internal dashboard action —
   needs its own ingestion endpoint and auth model, reachable from 28 external sites.
2. **SMS is a new third channel.** The original brief only scoped WhatsApp (WATI → Evolution
   API) and email (Zoho → listmonk). SMS needs its own provider, its own abstraction, and — in
   India — its own regulatory registration that neither of the other two channels require.

Nothing below replaces the existing WhatsApp/email plan — it adds an enquiry-triggered,
real-time path alongside the existing bulk-campaign path, and both end up in the same
`customers` / `messages` / `onboarding_events` tables.

---

## Architecture

### 1. Brand registry (new table: `brands`)

Right now `sub_brand` is just a free-text tag on `customers` (as seen with the W1-W5 import).
Formalize the 28 brands as real rows so each one carries its own greeting config:

```sql
create table public.brands (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,           -- e.g. 'igo-mushroom', 'igo-goat-farming'
  name text not null,
  website_url text,
  public_api_key text unique not null, -- what the website's form submission authenticates with
  whatsapp_template_name text,         -- Meta-approved template used for this brand's greeting
  email_template_id uuid references public.templates (id),
  sms_template_id uuid references public.templates (id),
  active boolean not null default true,
  created_at timestamptz not null default now()
);
```

### 2. Enquiry ingestion endpoint

`POST /api/enquiries` — a **public**-facing endpoint, unlike everything else in the API so far
(which is either internal-dashboard-only or provider-webhook-only). New considerations:

- **Auth**: each brand gets a `public_api_key` (from the `brands` table above). The website's
  form submission includes it. This key is intentionally low-privilege — it can only create an
  enquiry for its own brand, nothing else — so it's safe to embed in public site JS.
- **Integration method on the 28 sites**: rather than modifying 28 different codebases (some of
  which may not even be under IGO's direct control), the lowest-friction approach is a small
  JS snippet each site drops into its enquiry form's submit handler, POSTing directly to this
  endpoint. Works regardless of what each site is built on (WordPress, static HTML, custom).
- **Payload**: `{ brand_slug, public_api_key, name, phone, email, enquiry_type?, message?, utm_source? }`
- **Rate limiting** per `public_api_key`, since this endpoint is reachable from the public
  internet and is an obvious spam target.
- On receipt: normalize phone/email (reusing `apps/api/src/lib/normalize.js`, already built),
  upsert into `customers` (dedupe by normalized phone, same logic as the W1-W5 import),
  `sub_brand = brand_slug`, `source = 'website_enquiry'` — then immediately trigger the
  greeting below. Respond to the website fast (don't make the visitor wait on 3 external API
  calls); fire the greeting asynchronously.

### 3. Greeting orchestrator

A new module, `src/greeting/sendGreeting.js`, given a customer + brand:

- **WhatsApp**: `WhatsAppProvider.sendTemplateMessage(...)` — must be a template, not free text.
  Meta's rules don't allow a business to send free-form text as the *first* message to someone
  who hasn't messaged first; every enquiry-triggered greeting has to use a pre-approved
  template. (Already-built `WatiProvider`/`EvolutionProvider` handle this correctly.)
- **Email**: needs a new lightweight `EmailProvider` interface wrapping listmonk's
  **transactional** API (`POST /api/tx`) — a one-off send using a pre-created template, distinct
  from listmonk's bulk campaign feature that the rest of the plan uses. Same
  config-swap-not-rewrite pattern as `WhatsAppProvider`/`AIProvider`.
- **SMS**: needs a brand-new `SmsProvider` interface (see below) — nothing like this exists yet.
- All three fire **in parallel**, each failure caught independently — a WhatsApp send failing
  must not block the email or SMS from going out, and vice versa.
- Every attempt logged to `onboarding_events` (`step`: `whatsapp_greeting` / `email_greeting` /
  `sms_greeting`; `status`: `sent`/`failed`) — this table already exists from Phase 2.

### 4. New provider: `SmsProvider`

Same interface-first pattern as the existing `WhatsAppProvider`/`AIProvider`:

```
apps/api/src/providers/sms/SmsProvider.js   — interface: sendText({ to, text })
apps/api/src/providers/sms/msg91Provider.js — first implementation (see recommendation below)
apps/api/src/providers/sms/index.js         — factory, selected via SMS_PROVIDER env var
```

---

## The part that actually blocks this — compliance, not code

**WhatsApp**: every brand needs at least one Meta-approved greeting template before this can go
live for that brand. Getting 28 separate templates approved is unnecessary overhead —
**recommend one parameterized template** (e.g. *"Hi {{1}}, thanks for your interest in
{{2}}!"*) reused across all 28 brands via template variables (name + brand name), needing only
one approval instead of 28.

**SMS in India is DLT-regulated.** Any promotional or transactional SMS sender ID and message
template must be registered on the telecom-operator DLT (Distributed Ledger Technology)
platform, or carriers silently drop the message — this is true no matter which SMS provider is
picked, it's a regulatory registration step separate from the provider integration itself, and
it takes real time (days, not hours) to get approved. **This should start now if SMS is wanted
soon** — it's the longest lead-time item in this whole plan.

**Email**: same SPF/DKIM/DMARC requirement already documented in the main build plan — still
blocking, not new.

---

## Open decisions (recommendations given, not blocking)

| Decision | Recommendation | Why |
|---|---|---|
| SMS provider | **MSG91** | India-focused, standard DLT-integrated onboarding flow, good docs for transactional sends. (Twilio/Kaleyra are fine alternatives if there's an existing vendor relationship.) |
| Website integration | **JS snippet posting to `/api/enquiries`** | Works across 28 differently-built sites without touching each one's backend individually. |
| Greeting content | **One parameterized template per channel**, not 28 brand-specific ones | Cuts Meta template approval from 28 down to 1; still personalizes via `{{brand name}}`/`{{customer name}}` variables. |

---

## Rollout plan (same "prove it small first" philosophy as the main build plan)

1. **Pilot with 2–3 brands** — wire their enquiry forms to the new endpoint, verify all three
   channels land correctly, watch `onboarding_events` for a week.
2. **Start the SMS DLT registration in parallel with step 1** — it's the longest lead time item,
   no reason to wait for the pilot to finish before starting it.
3. **Roll the JS snippet out to the remaining ~25 sites** once the pilot is clean.
4. Feed into the existing Phase 5 decommission timeline — this is additive to Phase 3, not a
   separate phase.

## What I need from you to start building this for real

- Confirm the JS-snippet integration approach works for how the 28 sites are actually built
  (or tell me if some need a different method)
- SMS provider choice (or confirm MSG91)
- Kick off DLT registration for SMS sender ID + template — this is the one item worth starting
  immediately given the lead time
- The Meta WhatsApp template content you want approved for the greeting

Nothing here needs real credentials to *scaffold* — the `brands` table, `/api/enquiries`
endpoint, `SmsProvider` interface, and greeting orchestrator can all be built and tested locally
first, same as the rest of Phase 3.
