import { Router } from 'express';
import { WatiProvider } from '../providers/whatsapp/watiProvider.js';
import { EvolutionProvider } from '../providers/whatsapp/evolutionProvider.js';
import { getSupabase } from '../lib/supabase.js';
import { logger } from '../lib/logger.js';

export const webhooksRouter = Router();

/**
 * One receiver per provider, all normalizing into the `messages` table.
 * TODO(Phase 3): verify each provider's webhook signature before trusting
 * the payload — WATI/Evolution API/listmonk each have their own scheme;
 * confirm against current docs once real webhook secrets are configured.
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

webhooksRouter.post('/wati', (req, res) => handle(new WatiProvider(), req, res));
webhooksRouter.post('/evolution', (req, res) => handle(new EvolutionProvider(), req, res));

webhooksRouter.post('/listmonk', async (req, res) => {
  logger.info({ provider: 'listmonk', body: req.body }, 'webhook received');
  res.status(200).json({ received: true });
});
