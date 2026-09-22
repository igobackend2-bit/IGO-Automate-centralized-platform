import { Router } from 'express';
import { getSupabase } from '../lib/supabase.js';

export const contactsRouter = Router();

/** Phase 2 (Unified Contacts): read-only listing against the real `customers` table. */
contactsRouter.get('/', async (req, res) => {
  const supabase = getSupabase();
  if (!supabase) {
    return res.status(503).json({ error: 'Supabase not configured yet' });
  }

  const { subBrand, limit = 50, includeLegacy } = req.query;
  let query = supabase.from('customers').select('*').limit(Number(limit));
  if (subBrand) query = query.eq('sub_brand', subBrand);
  // The one-time W1-W5 historical import (265 rows, tagged on write) is
  // hidden from the live contacts view by default — it's kept in the
  // database as the Phase 4 fine-tuning dataset, just not meant to clutter
  // day-to-day contact management. ?includeLegacy=true shows it again.
  if (includeLegacy !== 'true') {
    query = query.or('metadata->>legacy_system.is.null,metadata->>legacy_system.neq.w1_w5_lead_qualifier');
  }

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json({ data });
});
