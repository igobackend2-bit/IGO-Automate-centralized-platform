import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scrubPhoneNumbers, scrubEmails, scrubKnownName, scrubPii } from './piiScrub.js';

test('scrubPhoneNumbers redacts a plain 10-digit number', () => {
  assert.equal(
    scrubPhoneNumbers('call me on 9876543210 anytime'),
    'call me on [phone redacted] anytime'
  );
});

test('scrubPhoneNumbers redacts a number with country code and formatting', () => {
  assert.equal(
    scrubPhoneNumbers('my whatsapp is +91 98765-43210 ok'),
    'my whatsapp is [phone redacted] ok'
  );
});

test('scrubEmails redacts an email address', () => {
  assert.equal(
    scrubEmails('reach me at rajesh.k@example.com please'),
    'reach me at [email redacted] please'
  );
});

test('scrubKnownName redacts exact, case-insensitive matches of the given name', () => {
  assert.equal(scrubKnownName('Hi Rajesh, thanks for reaching out', 'Rajesh'), 'Hi [name redacted], thanks for reaching out');
  assert.equal(scrubKnownName('hi rajesh!', 'Rajesh'), 'hi [name redacted]!');
});

test('scrubKnownName does not touch unrelated substrings', () => {
  assert.equal(scrubKnownName('Rajeshwari called', 'Rajesh'), 'Rajeshwari called');
});

test('scrubKnownName is a no-op when name is missing', () => {
  assert.equal(scrubKnownName('hello there', null), 'hello there');
  assert.equal(scrubKnownName('hello there', ''), 'hello there');
});

test('scrubPii applies all three passes together', () => {
  const input = 'Hi Rajesh, call 9876543210 or email rajesh@example.com';
  const result = scrubPii(input, { customerName: 'Rajesh' });
  assert.equal(result, 'Hi [name redacted], call [phone redacted] or email [email redacted]');
});

test('scrubPii handles null/empty text safely', () => {
  assert.equal(scrubPii(null, { customerName: 'X' }), null);
  assert.equal(scrubPii('', { customerName: 'X' }), '');
});
