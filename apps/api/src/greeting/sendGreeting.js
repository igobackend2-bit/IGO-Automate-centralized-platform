import { getWhatsAppProvider } from '../providers/whatsapp/index.js';
import { getEmailProvider } from '../providers/email/index.js';
import { getSmsProvider } from '../providers/sms/index.js';
import { getSupabase } from '../lib/supabase.js';
import { logger } from '../lib/logger.js';

/**
 * Fires the WhatsApp + email + SMS greeting for a new enquiry, in
 * parallel, with each channel's failure isolated from the others — a
 * WhatsApp template rejection must not stop the email or SMS from going
 * out, and vice versa. Every attempt is logged to onboarding_events
 * regardless of outcome.
 *
 * Providers are injectable for testing; production callers omit them and
 * get the real factories.
 */
export async function sendGreeting({
  customer,
  brand,
  whatsappProvider = getWhatsAppProvider(),
  emailProvider = getEmailProvider(),
  smsProvider = getSmsProvider(),
  supabase = getSupabase(),
}) {
  const channels = [
    {
      step: 'whatsapp_greeting',
      enabled: Boolean(customer.phone && brand.whatsapp_template_name),
      send: () =>
        whatsappProvider.sendTemplateMessage({
          to: customer.phone,
          templateName: brand.whatsapp_template_name,
          params: { 1: customer.name ?? 'there', 2: brand.name },
        }),
    },
    {
      step: 'email_greeting',
      enabled: Boolean(customer.email && brand.email_template_id),
      send: () =>
        emailProvider.sendTemplateEmail({
          to: customer.email,
          templateId: brand.email_template_id,
          data: { name: customer.name, brand: brand.name },
        }),
    },
    {
      step: 'sms_greeting',
      enabled: Boolean(customer.phone && brand.sms_template_id),
      send: () =>
        smsProvider.sendTemplateMessage({
          to: customer.phone,
          templateId: brand.sms_template_id,
          params: { VAR1: customer.name ?? 'there', VAR2: brand.name },
        }),
    },
  ];

  const results = await Promise.allSettled(
    channels.map(async (channel) => {
      if (!channel.enabled) return { step: channel.step, status: 'skipped' };
      try {
        await channel.send();
        return { step: channel.step, status: 'sent' };
      } catch (err) {
        logger.error({ step: channel.step, customerId: customer.id, err: err.message }, 'greeting channel failed');
        return { step: channel.step, status: 'failed', error: err.message };
      }
    })
  );

  const outcomes = results.map((r) => r.value);

  if (supabase) {
    const rows = outcomes
      .filter((o) => o.status !== 'skipped')
      .map((o) => ({ customer_id: customer.id, step: o.step, status: o.status }));
    if (rows.length > 0) {
      const { error } = await supabase.from('onboarding_events').insert(rows);
      if (error) logger.error({ err: error.message }, 'failed to log onboarding_events');
    }
  }

  return outcomes;
}
