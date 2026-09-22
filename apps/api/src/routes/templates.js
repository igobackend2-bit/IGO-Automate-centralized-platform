import { Router } from 'express';
import { getSupabase } from '../lib/supabase.js';

export const templatesRouter = Router();

const CHANNELS = ['whatsapp', 'email', 'sms'];
const STATUSES = ['draft', 'pending', 'approved', 'rejected'];

/**
 * Manual create/update of WhatsApp, email, and SMS templates. This is a
 * catalog + approval-status tracker, not a live editor — editing a row
 * here never changes what's actually approved with Meta (WhatsApp) or
 * registered on DLT (SMS). `provider_ref` is what you copy onto a brand's
 * whatsapp_template_name / sms_template_id once real approval exists.
 */
templatesRouter.get('/', async (req, res) => {
  const supabase = getSupabase();
  if (!supabase) return res.status(503).json({ error: 'Supabase not configured yet' });

  const { channel, sub_brand: subBrand } = req.query;
  let query = supabase.from('templates').select('*').order('updated_at', { ascending: false });
  if (channel) query = query.eq('channel', channel);
  if (subBrand) query = query.eq('sub_brand', subBrand);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json({ data });
});

templatesRouter.post('/', async (req, res) => {
  const supabase = getSupabase();
  if (!supabase) return res.status(503).json({ error: 'Supabase not configured yet' });

  const { channel, name, body, meta_template_status: status, provider_ref: providerRef, sub_brand: subBrand } = req.body || {};

  if (!channel || !CHANNELS.includes(channel)) {
    return res.status(400).json({ error: `channel is required and must be one of: ${CHANNELS.join(', ')}` });
  }
  if (!name || !body) {
    return res.status(400).json({ error: 'name and body are required' });
  }
  if (channel !== 'email' && status && !STATUSES.includes(status)) {
    return res.status(400).json({ error: `meta_template_status must be one of: ${STATUSES.join(', ')}` });
  }

  const { data, error } = await supabase
    .from('templates')
    .insert({
      channel,
      name,
      body,
      meta_template_status: channel === 'email' ? null : status || 'draft',
      provider_ref: providerRef || null,
      sub_brand: subBrand || null,
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ data });
});

templatesRouter.patch('/:id', async (req, res) => {
  const supabase = getSupabase();
  if (!supabase) return res.status(503).json({ error: 'Supabase not configured yet' });

  const { name, body, meta_template_status: status, provider_ref: providerRef } = req.body || {};
  if (status && !STATUSES.includes(status)) {
    return res.status(400).json({ error: `meta_template_status must be one of: ${STATUSES.join(', ')}` });
  }

  const updates = {};
  if (name !== undefined) updates.name = name;
  if (body !== undefined) updates.body = body;
  if (status !== undefined) updates.meta_template_status = status;
  if (providerRef !== undefined) updates.provider_ref = providerRef;

  const { data, error } = await supabase.from('templates').update(updates).eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'template not found' });
  res.json({ data });
});

templatesRouter.delete('/:id', async (req, res) => {
  const supabase = getSupabase();
  if (!supabase) return res.status(503).json({ error: 'Supabase not configured yet' });

  const { error } = await supabase.from('templates').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.status(204).send();
});
