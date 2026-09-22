/**
 * Phase 4, step 1: conversation_logs -> JSONL chat-format training pairs.
 *
 * Groups turns by customer, applies the PII scrub (phone/email regex +
 * known-name redaction) before anything leaves Supabase, and writes one
 * OpenAI-chat-format record per conversation to apps/api/exports/.
 *
 * Usage: npm run export:finetune
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { getSupabase } from '../src/lib/supabase.js';
import { scrubPii } from '../src/lib/piiScrub.js';
import { ariaPersona } from '../src/personas/aria.js';

const MIN_TURNS_RECOMMENDED = 2000;

async function main() {
  const supabase = getSupabase();
  if (!supabase) {
    console.error('Supabase not configured — set SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY first.');
    process.exit(1);
  }

  const { data: logs, error } = await supabase
    .from('conversation_logs')
    .select('customer_id, persona, role, content, created_at, customers(name)')
    .order('customer_id', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Failed to fetch conversation_logs:', error.message);
    process.exit(1);
  }

  const byCustomer = new Map();
  for (const log of logs) {
    if (!byCustomer.has(log.customer_id)) byCustomer.set(log.customer_id, []);
    byCustomer.get(log.customer_id).push(log);
  }

  const records = [];
  for (const [customerId, turns] of byCustomer) {
    const customerName = turns[0]?.customers?.name ?? null;
    const messages = [
      { role: 'system', content: ariaPersona.systemPrompt },
      ...turns.map((t) => ({
        role: t.role === 'assistant' ? 'assistant' : 'user',
        content: scrubPii(t.content, { customerName }),
      })),
    ];
    records.push({ customer_id: customerId, messages });
  }

  mkdirSync(new URL('../exports/', import.meta.url), { recursive: true });
  const outPath = new URL(`../exports/aria_finetune_${new Date().toISOString().slice(0, 10)}.jsonl`, import.meta.url);
  writeFileSync(outPath, records.map((r) => JSON.stringify(r)).join('\n') + '\n');

  const totalTurns = logs.length;
  console.log(`Exported ${records.length} conversations (${totalTurns} turns) to ${outPath.pathname}`);

  if (totalTurns < MIN_TURNS_RECOMMENDED) {
    console.warn(
      `WARNING: ${totalTurns} turns is below the recommended minimum of ${MIN_TURNS_RECOMMENDED} for a` +
        ' first fine-tuning attempt (see docs/BUILD_PLAN_PHASE_2-5.md, Phase 4). This export is safe to' +
        ' use for building/testing the pipeline, but do not treat it as ready for a real training run yet.'
    );
  }
}

main();
