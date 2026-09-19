/**
 * Dedupe normalization for customer records. India-first (IGO's primary
 * market): a bare 10-digit number is assumed +91 unless it already carries
 * a country code. Extend the default-country heuristic if IGO expands.
 */
const DEFAULT_COUNTRY_CODE = '91';

export function normalizePhone(raw) {
  if (!raw) return null;
  const digits = String(raw).replace(/[^\d+]/g, '');
  const stripped = digits.replace(/^\+/, '');

  if (!stripped) return null;

  if (digits.startsWith('+')) {
    return `+${stripped}`;
  }
  if (stripped.length === 10) {
    return `+${DEFAULT_COUNTRY_CODE}${stripped}`;
  }
  if (stripped.length > 10) {
    return `+${stripped}`;
  }
  return null;
}

export function normalizeEmail(raw) {
  if (!raw) return null;
  const trimmed = String(raw).trim().toLowerCase();
  if (!trimmed.includes('@')) return null;
  return trimmed;
}

/**
 * A stable key to group likely-duplicate customer rows by. Phone takes
 * priority over email since WhatsApp identity is phone-based.
 */
export function dedupeKey({ phone, email }) {
  const normalizedPhone = normalizePhone(phone);
  if (normalizedPhone) return `phone:${normalizedPhone}`;

  const normalizedEmail = normalizeEmail(email);
  if (normalizedEmail) return `email:${normalizedEmail}`;

  return null;
}

/**
 * Groups a list of { id, phone, email, ... } records into duplicate sets.
 * Records with no usable phone/email are returned ungrouped (dedupeKey null).
 */
export function findDuplicates(records) {
  const groups = new Map();

  for (const record of records) {
    const key = dedupeKey(record);
    if (!key) continue;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(record);
  }

  return [...groups.entries()]
    .filter(([, group]) => group.length > 1)
    .map(([key, group]) => ({ key, records: group }));
}
