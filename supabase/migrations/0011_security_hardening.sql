-- Fixes flagged by `get_advisors(type: security)` after 0001-0010:
-- 1. set_updated_at had a mutable search_path (WARN: function_search_path_mutable)
-- 2/3. can_access_sub_brand was callable by anon/authenticated via
--      /rest/v1/rpc/can_access_sub_brand — it's only meant to be used as an
--      RLS policy predicate, and only authenticated users have any use for
--      it (anon never passes the auth.uid() check inside it anyway).

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke execute on function public.can_access_sub_brand(text) from public;
revoke execute on function public.can_access_sub_brand(text) from anon;
grant execute on function public.can_access_sub_brand(text) to authenticated;
