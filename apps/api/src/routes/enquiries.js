import { Router } from 'express';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { getSupabase } from '../lib/supabase.js';
import { normalizePhone, normalizeEmail } from '../lib/normalize.js';
import { sendGreeting } from '../greeting/sendGreeting.js';
import { logger } from '../lib/logger.js';

export const enquiriesRouter = Router();

// This is the one genuinely public, unauthenticated-by-default endpoint in
// the whole API — reachable from any of the 28 brand websites' JS. Rate
// limit per brand key (not per IP) since a legitimate high-traffic brand
// site shouldn't be throttled by visitors sharing a corporate NAT.
const limiter = rateLimit({
  windowMs: 60_000,
  max: 30,
  keyGenerator: (req) => req.body?.public_api_key || ipKeyGenerator(req.ip),
  standardHeaders: true,
  legacyHeaders: false,
});

enquiriesRouter.post('/', limiter, async (req, res) => {
  const { brand_slug, public_api_key, name, phone, email, enquiry_type, message } = req.body || {};

  if (!brand_slug || !public_api_key || !phone) {
    return res.status(400).json({ error: 'brand_slug, public_api_key, and phone are required' });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return res.status(503).json({ error: 'Supabase not configured yet' });
  }

  const { data: brand, error: brandError } = await supabase
    .from('brands')
    .select('*')
    .eq('slug', brand_slug)
    .eq('public_api_key', public_api_key)
    .eq('active', true)
    .maybeSingle();

  if (brandError) {
    logger.error({ err: brandError.message }, 'enquiry brand lookup failed');
    return res.status(500).json({ error: 'internal error' });
  }
  if (!brand) {
    // Deliberately vague — don't reveal whether the slug exists but the key
    // is wrong, vs. the slug not existing at all.
    return res.status(401).json({ error: 'invalid brand credentials' });
  }

  const normalizedPhone = normalizePhone(phone);
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedPhone) {
    return res.status(400).json({ error: 'phone number could not be parsed' });
  }

  const { data: existing } = await supabase
    .from('customers')
    .select('id, name, phone, email')
    .eq('normalized_phone', normalizedPhone)
    .maybeSingle();

  let customer = existing;
  if (!customer) {
    const { data: created, error: createError } = await supabase
      .from('customers')
      .insert({
        name: name || null,
        phone,
        email: email || null,
        sub_brand: brand.slug,
        source: 'website_enquiry',
        normalized_phone: normalizedPhone,
        normalized_email: normalizedEmail,
        metadata: { enquiry_type: enquiry_type || null, message: message || null },
      })
      .select('id, name, phone, email')
      .single();

    if (createError) {
      logger.error({ err: createError.message }, 'enquiry customer insert failed');
      return res.status(500).json({ error: 'internal error' });
    }
    customer = created;
  }

  // Respond immediately — the visitor shouldn't wait on 3 external API
  // calls. The greeting fires in the background; failures are logged to
  // onboarding_events and pino, not surfaced to the website.
  res.status(202).json({ received: true, customer_id: customer.id });

  sendGreeting({ customer, brand }).catch((err) => {
    logger.error({ err: err.message, customerId: customer.id }, 'sendGreeting threw unexpectedly');
  });
});
