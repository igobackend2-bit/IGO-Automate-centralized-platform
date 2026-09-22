-- Adds SMS as a third template channel and a provider_ref column: the
-- actual identifier to pass to the provider when sending (WATI/Evolution
-- template name, or MSG91 flow_id) — decoupled from `name`, which is just
-- our own label. Editing a row here never changes what's actually
-- approved on Meta/DLT; it's our own tracking catalog + the reference to
-- use once approval exists, same as brands.whatsapp_template_name /
-- sms_template_id already work.
alter table public.templates
  drop constraint if exists templates_channel_check;

alter table public.templates
  add constraint templates_channel_check check (channel in ('whatsapp', 'email', 'sms'));

alter table public.templates
  drop constraint if exists templates_meta_template_status_check;

alter table public.templates
  add constraint templates_meta_template_status_check check (
    channel = 'email' or meta_template_status in ('draft', 'pending', 'approved', 'rejected')
  );

alter table public.templates
  add column if not exists provider_ref text;

comment on column public.templates.meta_template_status is
  'Approval status with the relevant external registry: Meta for whatsapp, DLT for sms. Not applicable to email.';
comment on column public.templates.provider_ref is
  'The provider-side identifier to use when sending: WATI/Evolution template name for whatsapp, MSG91 flow_id for sms. Null for email (listmonk template_id lives on brands.email_template_id directly since email templates are managed in listmonk itself, not here).';
