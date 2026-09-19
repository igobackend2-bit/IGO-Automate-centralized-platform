import { Router } from 'express';
import { WatiProvider } from '../providers/whatsapp/watiProvider.js';
import { EvolutionProvider } from '../providers/whatsapp/evolutionProvider.js';
import { getSupabase } from '../lib/supabase.js';

export const webhooksRouter = Router();

/**
 * One receiver per provider, all normalizing into the `messages` table.
 * Phase 1: log + normalize only, no writes required until Supabase is wired.
 */
async function handle(provider, req, res) {
  const normalized = provider.normalizeWebhookEvent(req.body);
  console.log(`[webhook:${provider.name}]`, normalized);

  const supabase = getSupabase();
  if (supabase && normalized?.providerMessageId) {
    const { error } = await supabase
      .from('messages')
      .update({ status: normalized.status, replied_at: normalized.repliedText ? new Date().toISOString() : null })
      .eq('provider_message_id', normalized.providerMessageId);
    if (error) console.error(`[webhook:${provider.name}] supabase update error`, error.message);
  }

  res.status(200).json({ received: true });
}

webhooksRouter.post('/wati', (req, res) => handle(new WatiProvider(), req, res));
webhooksRouter.post('/evolution', (req, res) => handle(new EvolutionProvider(), req, res));

webhooksRouter.post('/listmonk', async (req, res) => {
  console.log('[webhook:listmonk]', req.body);
  res.status(200).json({ received: true });
});
