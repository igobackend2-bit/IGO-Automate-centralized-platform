-- Minimal RBAC scaffold for the Admin & Access module.
-- One row per Supabase auth user, carrying their platform role and which
-- sub-brand(s) they're allowed to see. If the Aria/Social CRM project
-- already has an equivalent table, DROP this migration and point the app
-- at that one instead — never maintain two role tables.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  role text not null default 'automation' check (role in ('admin', 'automation', 'bd')),
  -- null/empty = all sub-brands (admins); otherwise restricts visibility.
  sub_brands text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Helper used by RLS policies below: does the current user have unrestricted
-- (admin, or empty sub_brands array) access, or does their sub_brands list
-- include the row's sub_brand?
create or replace function public.can_access_sub_brand(target_sub_brand text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and (p.sub_brands = '{}' or target_sub_brand = any(p.sub_brands))
  );
$$;
