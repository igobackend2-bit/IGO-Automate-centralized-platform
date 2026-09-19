import { createClient } from '@supabase/supabase-js';
import { config } from '../config.js';
import { logger } from './logger.js';

let client = null;

export function getSupabase() {
  if (client) return client;

  if (!config.supabase.url || !config.supabase.serviceRoleKey) {
    logger.warn(
      '[supabase] SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set — running without a database connection.'
    );
    return null;
  }

  client = createClient(config.supabase.url, config.supabase.serviceRoleKey, {
    auth: { persistSession: false },
  });
  return client;
}
