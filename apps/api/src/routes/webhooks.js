import { Router } from 'express';
import { WatiProvider } from '../providers/whatsapp/watiProvider.js';
import { EvolutionProvider } from '../providers/whatsapp/evolutionProvider.js';
import { getSupabase } from '../lib/supabase.js';
import { logger } from '../lib/logger.js';
import { config } from '../config.js';

export const webhooksRouter = Router();

/**
 * Neither WATI nor Evolution API/listmonk document an HMAC-signed webhook
 * scheme, so each is verified with a shared secret instead:
 *  - WATI: `?secret=` query param on the registered webhook URL (WATI's
 *    createWebhookEndpoint only takes a bare URL, no custom headers).
 *  - Evolution API: `x-webhook-secret` header, set via the `headers` field
 *    on `EvolutionProvider#configureWebhook` at registration time.
 *  - listmonk: `?secret=` query param, same reasoning as WATI.
 * If a secret isn't configured yet (dev), verification is skipped with a
 * warning rather than hard-failing local testing.
 */
function verifySecret({ configured, provided, label }) {
  return (req, res, next) => {
    if (!configured) {
      logger.warn({ label }, 'webhook secret not configured — skipping verification');
      return next();
    }
    if (provided(req) !== configured) {
      logger.warn({ label }, 'webhook rejected: secret mismatch');
      return res.status(401).json({ error: 'invalid webhook secret' });
    }
    next();
  };
}

const verifyWati = verifySecret({
  configured: config.whatsapp.wati.webhookSecret,
  provided: (req) => req.query.secret,
  label: 'wati',
});
const verifyEvolution = verifySecret({
  configured: config.whatsapp.evolution.webhookSecret,
  provided: (req) => req.get('x-webhook-secret'),
  label: 'evolution',
});
const verifyListmonk = verifySecret({
  configured: config.listmonk.webhookSecret,
  provided: (req) => req.query.secret,
  label: 'listmonk',
});

/**
 * One receiver per provider, all normalizing into the `messages` table.
 */
async function handle(provider, req, res) {
  const normalized = provider.normalizeWebhookEvent(req.body);
  logger.info({ provider: provider.name, normalized }, 'webhook received');

  const supabase = getSupabase();
  if (supabase && normalized?.providerMessageId) {
    const { error } = await supabase
      .from('messages')
      .update({ status: normalized.status, replied_at: normalized.repliedText ? new Date().toISOString() : null })
      .eq('provider_message_id', normalized.providerMessageId);
    if (error) {
      logger.error({ provider: provider.name, err: error.message }, 'webhook supabase update failed');
    }
  }

  res.status(200).json({ received: true });
}

webhooksRouter.post('/wati', verifyWati, (req, res) => handle(new WatiProvider(), req, res));
webhooksRouter.post('/evolution', verifyEvolution, (req, res) => handle(new EvolutionProvider(), req, res));

webhooksRouter.post('/listmonk', verifyListmonk, async (req, res) => {
  logger.info({ provider: 'listmonk', body: req.body }, 'webhook received');
  res.status(200).json({ received: true });
});
