create table if not exists public.segments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  filter_json jsonb not null default '{}',
  sub_brand text,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_segments_updated_at on public.segments;
create trigger set_segments_updated_at
  before update on public.segments
  for each row execute function public.set_updated_at();

create index if not exists segments_sub_brand_idx on public.segments (sub_brand);
