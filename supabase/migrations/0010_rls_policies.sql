-- RLS policies scoped by sub_brand + role.
--
-- The backend (apps/api) talks to Supabase with the service-role key,
-- which bypasses RLS entirely — these policies protect any future direct
-- client access (e.g. the dashboard querying Supabase with a user's JWT)
-- and are what the Phase 2 exit-criteria test ("a BD-role user cannot read
-- another sub-brand's rows") verifies against.

alter table public.profiles enable row level security;
alter table public.customers enable row level security;
alter table public.segments enable row level security;
alter table public.templates enable row level security;
alter table public.campaigns enable row level security;
alter table public.messages enable row level security;
alter table public.conversation_logs enable row level security;
alter table public.onboarding_events enable row level security;

-- profiles: see your own row; admins see everyone.
create policy profiles_select_self_or_admin on public.profiles
  for select using (
    id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- customers: scoped by sub_brand via the helper function.
create policy customers_select_by_sub_brand on public.customers
  for select using (public.can_access_sub_brand(sub_brand));

create policy customers_write_admin_automation on public.customers
  for insert with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'automation'))
  );

create policy customers_update_admin_automation on public.customers
  for update using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'automation'))
  );

-- segments / templates / campaigns: same sub_brand-scoped read, write
-- restricted to admin/automation (BD can view, not create campaigns).
create policy segments_select_by_sub_brand on public.segments
  for select using (sub_brand is null or public.can_access_sub_brand(sub_brand));
create policy segments_write_admin_automation on public.segments
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'automation'))
  );

create policy templates_select_by_sub_brand on public.templates
  for select using (sub_brand is null or public.can_access_sub_brand(sub_brand));
create policy templates_write_admin_automation on public.templates
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'automation'))
  );

create policy campaigns_select_by_sub_brand on public.campaigns
  for select using (sub_brand is null or public.can_access_sub_brand(sub_brand));
create policy campaigns_write_admin_automation on public.campaigns
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'automation'))
  );

-- messages: scoped through the parent customer's sub_brand.
create policy messages_select_by_customer_sub_brand on public.messages
  for select using (
    exists (
      select 1 from public.customers c
      where c.id = messages.customer_id
        and public.can_access_sub_brand(c.sub_brand)
    )
  );

-- conversation_logs: same customer-scoped read; write is backend-only
-- (service role), so no insert/update policy is granted to authenticated users.
create policy conversation_logs_select_by_customer_sub_brand on public.conversation_logs
  for select using (
    exists (
      select 1 from public.customers c
      where c.id = conversation_logs.customer_id
        and public.can_access_sub_brand(c.sub_brand)
    )
  );

-- onboarding_events: same pattern.
create policy onboarding_events_select_by_customer_sub_brand on public.onboarding_events
  for select using (
    exists (
      select 1 from public.customers c
      where c.id = onboarding_events.customer_id
        and public.can_access_sub_brand(c.sub_brand)
    )
  );
