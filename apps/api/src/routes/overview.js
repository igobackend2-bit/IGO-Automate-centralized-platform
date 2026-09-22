import { Router } from 'express';
import { getSupabase } from '../lib/supabase.js';
import { config } from '../config.js';
import { logger } from '../lib/logger.js';

export const overviewRouter = Router();

/** Bounded fetch so one unreachable service can't hang the whole overview request. */
async function pingJson(url, options = {}, timeoutMs = 3000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    if (!res.ok) return { reachable: false };
    const contentType = res.headers.get('content-type') || '';
    return { reachable: true, body: contentType.includes('json') ? await res.json() : null };
  } catch {
    return { reachable: false };
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * n8n's public API has been stable at /api/v1 with an X-N8N-API-KEY header
 * for a long time (general knowledge — n8n's docs site 404'd on every
 * fresh-verification attempt while building this; re-check if this stops
 * working). Generate a key in n8n's UI under Settings > API.
 */
async function getN8nStatus() {
  if (!config.n8n.baseUrl || !config.n8n.apiKey) {
    return { configured: false, reachable: false, workflowCount: null, activeWorkflowCount: null };
  }
  const { reachable, body } = await pingJson(`${config.n8n.baseUrl}/api/v1/workflows?limit=250`, {
    headers: { 'X-N8N-API-KEY': config.n8n.apiKey },
  });
  if (!reachable || !body?.data) {
    return { configured: true, reachable: false, workflowCount: null, activeWorkflowCount: null };
  }
  return {
    configured: true,
    reachable: true,
    workflowCount: body.data.length,
    activeWorkflowCount: body.data.filter((w) => w.active).length,
  };
}

async function getEvolutionStatus() {
  if (!config.whatsapp.evolution.baseUrl) return { configured: false, reachable: false };
  const { reachable } = await pingJson(config.whatsapp.evolution.baseUrl);
  return { configured: true, reachable };
}

async function getListmonkStatus() {
  if (!config.listmonk.baseUrl) return { configured: false, reachable: false };
  const { reachable } = await pingJson(`${config.listmonk.baseUrl}/health`);
  return { configured: true, reachable };
}

overviewRouter.get('/', async (req, res) => {
  const supabase = getSupabase();

  const [n8n, evolutionApi, listmonk] = await Promise.all([
    getN8nStatus(),
    getEvolutionStatus(),
    getListmonkStatus(),
  ]);

  if (!supabase) {
    return res.json({
      data: {
        supabaseConfigured: false,
        brands: null,
        customers: null,
        conversationLogs: null,
        campaigns: null,
        messages: null,
        n8n,
        evolutionApi,
        listmonk,
        // No social account connection tracking exists yet — this is an
        // honest zero, not a placeholder pretending to be real data. See
        // the Social Responder persona in the original brief; nothing
        // currently records which Instagram/Facebook accounts are wired up.
        socialAccounts: { connected: 0, tracked: false },
      },
    });
  }

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { count: brandsTotal },
    { count: brandsActive },
    { count: customersTotal },
    { count: customersThisWeek },
    { count: conversationLogsTotal },
    { count: campaignsTotal },
    { count: messagesTotal },
    { count: messagesSent },
  ] = await Promise.all([
    supabase.from('brands').select('*', { count: 'exact', head: true }),
    supabase.from('brands').select('*', { count: 'exact', head: true }).eq('active', true),
    supabase.from('customers').select('*', { count: 'exact', head: true }),
    supabase.from('customers').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo),
    supabase.from('conversation_logs').select('*', { count: 'exact', head: true }),
    supabase.from('campaigns').select('*', { count: 'exact', head: true }),
    supabase.from('messages').select('*', { count: 'exact', head: true }),
    supabase.from('messages').select('*', { count: 'exact', head: true }).eq('status', 'sent'),
  ]).catch((err) => {
    logger.error({ err: err.message }, 'overview KPI query failed');
    return Array(8).fill({});
  });

  res.json({
    data: {
      supabaseConfigured: true,
      brands: { total: brandsTotal ?? 0, active: brandsActive ?? 0 },
      customers: { total: customersTotal ?? 0, last7Days: customersThisWeek ?? 0 },
      conversationLogs: { total: conversationLogsTotal ?? 0 },
      campaigns: { total: campaignsTotal ?? 0 },
      messages: { total: messagesTotal ?? 0, sent: messagesSent ?? 0 },
      n8n,
      evolutionApi,
      listmonk,
      socialAccounts: { connected: 0, tracked: false },
    },
  });
});
