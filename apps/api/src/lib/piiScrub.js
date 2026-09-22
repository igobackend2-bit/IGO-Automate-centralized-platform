/**
 * Scrubbing pass for conversation_logs before it leaves Supabase for
 * fine-tuning (Phase 4). Regex-based for phone/email (high precision);
 * name scrubbing is a targeted find-replace of the *known* customer name
 * from the `customers` row, not generic NER — far fewer false positives
 * than a heuristic name detector on free-text chat.
 */

const PHONE_RE = /(?:\+?\d[\d\-\s()]{7,}\d)/g;
const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

export function scrubPhoneNumbers(text) {
  if (!text) return text;
  return text.replace(PHONE_RE, '[phone redacted]');
}

export function scrubEmails(text) {
  if (!text) return text;
  return text.replace(EMAIL_RE, '[email redacted]');
}

/** Case-insensitive whole-word replace of a known name, e.g. from customers.name. */
export function scrubKnownName(text, name) {
  if (!text || !name || name.trim().length === 0) return text;
  const escaped = name.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`\\b${escaped}\\b`, 'gi');
  return text.replace(re, '[name redacted]');
}

export function scrubPii(text, { customerName } = {}) {
  let scrubbed = scrubPhoneNumbers(text);
  scrubbed = scrubEmails(scrubbed);
  scrubbed = scrubKnownName(scrubbed, customerName);
  return scrubbed;
}
