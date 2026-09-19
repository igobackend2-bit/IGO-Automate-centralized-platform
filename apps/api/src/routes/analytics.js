import { Router } from 'express';
import { getSupabase } from '../lib/supabase.js';

export const analyticsRouter = Router();

const STATUSES = ['queued', 'sent', 'delivered', 'read', 'replied', 'failed', 'bounced'];

/**
 * Sent/delivered/read/replied counts per campaign, optionally filtered by
 * sub_brand. Phase 2: read-only against whatever `messages` rows exist
 * (none yet, until Phase 3 starts sending for real).
 */
analyticsRouter.get('/campaigns', async (req, res) => {
  const supabase = getSupabase();
  if (!supabase) {
    return res.status(503).json({ error: 'Supabase not configured yet' });
  }

  const { subBrand } = req.query;

  let campaignsQuery = supabase
    .from('campaigns')
    .select('id, channel, status, scheduled_at, sub_brand')
    .order('scheduled_at', { ascending: false });
  if (subBrand) campaignsQuery = campaignsQuery.eq('sub_brand', subBrand);

  const { data: campaigns, error: campaignsError } = await campaignsQuery;
  if (campaignsError) return res.status(500).json({ error: campaignsError.message });

  const campaignIds = campaigns.map((c) => c.id);
  if (campaignIds.length === 0) return res.json({ data: [] });

  const { data: messages, error: messagesError } = await supabase
    .from('messages')
    .select('campaign_id, status')
    .in('campaign_id', campaignIds);
  if (messagesError) return res.status(500).json({ error: messagesError.message });

  const countsByCampaign = new Map(campaignIds.map((id) => [id, emptyStatusCounts()]));
  for (const message of messages) {
    const counts = countsByCampaign.get(message.campaign_id);
    if (counts && message.status in counts) counts[message.status] += 1;
  }

  const data = campaigns.map((c) => ({ ...c, counts: countsByCampaign.get(c.id) }));
  res.json({ data });
});

/** Platform-wide summary tile: totals across every message, by status. */
analyticsRouter.get('/summary', async (req, res) => {
  const supabase = getSupabase();
  if (!supabase) {
    return res.status(503).json({ error: 'Supabase not configured yet' });
  }

  const { subBrand } = req.query;

  let query = supabase.from('messages').select('status, customer_id, customers!inner(sub_brand)');
  if (subBrand) query = query.eq('customers.sub_brand', subBrand);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });

  const counts = emptyStatusCounts();
  for (const row of data) {
    if (row.status in counts) counts[row.status] += 1;
  }

  res.json({ data: { total: data.length, counts } });
});

function emptyStatusCounts() {
  return Object.fromEntries(STATUSES.map((status) => [status, 0]));
}
