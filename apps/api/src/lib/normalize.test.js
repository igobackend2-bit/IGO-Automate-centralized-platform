import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizePhone, normalizeEmail, dedupeKey, findDuplicates } from './normalize.js';

test('normalizePhone adds +91 to bare 10-digit numbers', () => {
  assert.equal(normalizePhone('9876543210'), '+919876543210');
});

test('normalizePhone strips formatting characters', () => {
  assert.equal(normalizePhone('98765 43210'), '+919876543210');
  assert.equal(normalizePhone('(987) 654-3210'), '+919876543210');
});

test('normalizePhone preserves an explicit country code', () => {
  assert.equal(normalizePhone('+14155551234'), '+14155551234');
  assert.equal(normalizePhone('14155551234'), '+14155551234');
});

test('normalizePhone returns null for junk input', () => {
  assert.equal(normalizePhone(''), null);
  assert.equal(normalizePhone(null), null);
  assert.equal(normalizePhone('123'), null);
});

test('normalizeEmail lowercases and trims', () => {
  assert.equal(normalizeEmail('  Buddy@IGOGroup.com '), 'buddy@igogroup.com');
});

test('normalizeEmail rejects non-emails', () => {
  assert.equal(normalizeEmail('not-an-email'), null);
  assert.equal(normalizeEmail(''), null);
});

test('dedupeKey prefers phone over email', () => {
  assert.equal(
    dedupeKey({ phone: '9876543210', email: 'a@b.com' }),
    'phone:+919876543210'
  );
});

test('dedupeKey falls back to email when phone is missing', () => {
  assert.equal(dedupeKey({ phone: null, email: 'A@B.com' }), 'email:a@b.com');
});

test('dedupeKey returns null when neither is usable', () => {
  assert.equal(dedupeKey({ phone: '', email: '' }), null);
});

test('findDuplicates groups records sharing a normalized phone', () => {
  const records = [
    { id: 1, phone: '9876543210', email: null },
    { id: 2, phone: '+91 98765 43210', email: null },
    { id: 3, phone: '9999999999', email: null },
  ];
  const dupes = findDuplicates(records);
  assert.equal(dupes.length, 1);
  assert.equal(dupes[0].records.length, 2);
  assert.deepEqual(
    dupes[0].records.map((r) => r.id),
    [1, 2]
  );
});

test('findDuplicates ignores records with no usable identifier', () => {
  const records = [{ id: 1, phone: '', email: '' }];
  assert.deepEqual(findDuplicates(records), []);
});
