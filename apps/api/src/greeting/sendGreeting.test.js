import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sendGreeting } from './sendGreeting.js';

const customer = { id: 'cust-1', name: 'Rajesh', phone: '+919876543210', email: 'rajesh@example.com' };
const brand = {
  slug: 'igo-mushroom',
  name: 'IGO Mushroom',
  whatsapp_template_name: 'greeting_v1',
  email_template_id: 5,
  sms_template_id: 'flow-123',
};

function fakeWhatsApp(behavior) {
  return { sendTemplateMessage: behavior };
}
function fakeEmail(behavior) {
  return { sendTemplateEmail: behavior };
}
function fakeSms(behavior) {
  return { sendTemplateMessage: behavior };
}

test('sendGreeting sends all three channels when all succeed', async () => {
  const outcomes = await sendGreeting({
    customer,
    brand,
    supabase: null,
    whatsappProvider: fakeWhatsApp(async () => ({ providerMessageId: 'wa-1', status: 'sent' })),
    emailProvider: fakeEmail(async () => ({ status: 'sent' })),
    smsProvider: fakeSms(async () => ({ providerMessageId: 'sms-1', status: 'sent' })),
  });

  assert.deepEqual(
    outcomes.map((o) => [o.step, o.status]).sort(),
    [
      ['email_greeting', 'sent'],
      ['sms_greeting', 'sent'],
      ['whatsapp_greeting', 'sent'],
    ]
  );
});

test('a failing WhatsApp send does not block email or SMS', async () => {
  const outcomes = await sendGreeting({
    customer,
    brand,
    supabase: null,
    whatsappProvider: fakeWhatsApp(async () => {
      throw new Error('template rejected');
    }),
    emailProvider: fakeEmail(async () => ({ status: 'sent' })),
    smsProvider: fakeSms(async () => ({ providerMessageId: 'sms-1', status: 'sent' })),
  });

  const byStep = Object.fromEntries(outcomes.map((o) => [o.step, o.status]));
  assert.equal(byStep.whatsapp_greeting, 'failed');
  assert.equal(byStep.email_greeting, 'sent');
  assert.equal(byStep.sms_greeting, 'sent');
});

test('all three channels can fail independently without throwing', async () => {
  const outcomes = await sendGreeting({
    customer,
    brand,
    supabase: null,
    whatsappProvider: fakeWhatsApp(async () => {
      throw new Error('wa down');
    }),
    emailProvider: fakeEmail(async () => {
      throw new Error('smtp down');
    }),
    smsProvider: fakeSms(async () => {
      throw new Error('dlt rejected');
    }),
  });

  assert.equal(outcomes.every((o) => o.status === 'failed'), true);
});

test('a channel is skipped (not failed) when the brand has no template configured for it', async () => {
  const brandNoSms = { ...brand, sms_template_id: null };
  const outcomes = await sendGreeting({
    customer,
    brand: brandNoSms,
    supabase: null,
    whatsappProvider: fakeWhatsApp(async () => ({ status: 'sent' })),
    emailProvider: fakeEmail(async () => ({ status: 'sent' })),
    smsProvider: fakeSms(async () => {
      throw new Error('should never be called');
    }),
  });

  const byStep = Object.fromEntries(outcomes.map((o) => [o.step, o.status]));
  assert.equal(byStep.sms_greeting, 'skipped');
});

test('a channel is skipped when the customer has no contact info for it', async () => {
  const customerNoEmail = { ...customer, email: null };
  const outcomes = await sendGreeting({
    customer: customerNoEmail,
    brand,
    supabase: null,
    whatsappProvider: fakeWhatsApp(async () => ({ status: 'sent' })),
    emailProvider: fakeEmail(async () => {
      throw new Error('should never be called');
    }),
    smsProvider: fakeSms(async () => ({ status: 'sent' })),
  });

  const byStep = Object.fromEntries(outcomes.map((o) => [o.step, o.status]));
  assert.equal(byStep.email_greeting, 'skipped');
});
