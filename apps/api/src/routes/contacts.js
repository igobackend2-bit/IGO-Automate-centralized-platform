import { Router } from 'express';
import { getSupabase } from '../lib/supabase.js';

export const contactsRouter = Router();

/** Phase 2 (Unified Contacts): read-only listing against the real `customers` table. */
contactsRouter.get('/', async (req, res) => {
  const supabase = getSupabase();
  if (!supabase) {
    return res.status(503).json({ error: 'Supabase not configured yet' });
  }

  const { subBrand, limit = 50 } = req.query;
  let query = supabase.from('customers').select('*').limit(Number(limit));
  if (subBrand) query = query.eq('sub_brand', subBrand);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json({ data });
});
