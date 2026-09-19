-- Every Aria/Social Responder turn. This is the Phase 4 fine-tuning
-- dataset source — logged from day one, scrubbed of PII only at export
-- time (apps/api/src/lib/normalize.js is NOT used here; scrubbing happens
-- in the Phase 4 export pipeline, not on write, so the raw log stays
-- useful for support/debugging).
create table if not exists public.conversation_logs (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers (id),
  persona text not null check (persona in ('aria', 'social_responder')),
  role text not null check (role in ('lead', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists conversation_logs_customer_id_idx on public.conversation_logs (customer_id);
create index if not exists conversation_logs_created_at_idx on public.conversation_logs (created_at);
