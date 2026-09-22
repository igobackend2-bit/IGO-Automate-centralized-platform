-- Fixes an inconsistency in 0013: whatsapp_template_name correctly holds
-- the provider's own template identifier directly, but email_template_id
-- / sms_template_id were mistakenly FK'd to our internal `templates`
-- table instead — which EmailProvider/SmsProvider don't use at all; they
-- need listmonk's numeric template ID and MSG91's flow_id directly, same
-- as the WhatsApp column already does it right.
alter table public.brands
  drop constraint if exists brands_email_template_id_fkey,
  drop constraint if exists brands_sms_template_id_fkey;

alter table public.brands
  alter column email_template_id type integer using null,
  alter column sms_template_id type text using null;
