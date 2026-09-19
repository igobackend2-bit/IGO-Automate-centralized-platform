import { Router } from 'express';
import { getSupabase } from '../lib/supabase.js';

export const campaignsRouter = Router();

/** Phase 2: read-only listing. Sending is gated until Phase 3 sign-off. */
campaignsRouter.get('/', async (req, res) => {
  const supabase = getSupabase();
  if (!supabase) {
    return res.status(503).json({ error: 'Supabase not configured yet' });
  }

  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .order('scheduled_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json({ data });
});

/**
 * Send/schedule is intentionally not implemented in Phase 1 — no production
 * WhatsApp/email traffic moves without explicit sign-off (Phase 3+).
 */
campaignsRouter.post('/', async (req, res) => {
  res.status(501).json({
    error: 'Campaign sending is disabled until Phase 3 (controlled cutover) is approved.',
  });
});
