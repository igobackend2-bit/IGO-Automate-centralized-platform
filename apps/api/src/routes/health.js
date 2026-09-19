import { Router } from 'express';
import { config } from '../config.js';
import { getSupabase } from '../lib/supabase.js';

export const healthRouter = Router();

healthRouter.get('/', (req, res) => {
  res.json({
    ok: true,
    env: config.nodeEnv,
    supabaseConfigured: Boolean(getSupabase()),
    whatsappProvider: config.whatsapp.provider,
    aiProvider: config.ai.provider,
  });
});
