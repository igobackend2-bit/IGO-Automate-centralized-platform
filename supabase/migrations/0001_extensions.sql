-- IGO Automate — Phase 2 schema
-- Project: hoeumzjuthbnhlpelbkn ("automation platform own"), a dedicated
-- Supabase project created 2026-09-21. The original brief assumed reuse of
-- the existing Aria/W1-W5/Social CRM project, but that project was never
-- made accessible to this platform — this is the project in actual use.
--
-- Apply with the Supabase CLI:
--   supabase link --project-ref hoeumzjuthbnhlpelbkn
--   supabase db push
-- Or paste each file in order into the SQL editor.

create extension if not exists pgcrypto; -- gen_random_uuid()
