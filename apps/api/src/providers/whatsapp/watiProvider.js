import { WhatsAppProvider } from './WhatsAppProvider.js';
import { config } from '../../config.js';
import { logger } from '../../lib/logger.js';

// Endpoint paths/bodies verified against docs.wati.io on 2026-09-22 —
// re-check before relying on this if it's been a while, WATI ships a v2/beta
// surface alongside v1 and field shapes have moved before.
const STATUS_MAP = {
  SENT: 'sent',
  DELIVERED: 'delivered',
  READ: 'read',
  FAILED: 'failed',
};

/**
 * Current live channel. Kept as-is until Phase 3/5 explicitly cuts over.
 */
export class WatiProvider extends WhatsAppProvider {
  get name() {
    return 'wati';
  }

  async sendTemplateMessage({ to, templateName, params = {} }) {
    this.#assertConfigured();

    const url = `${config.whatsapp.wati.baseUrl}/${config.whatsapp.wati.tenantId}/api/v1/sendTemplateMessage?whatsappNumber=${encodeURIComponent(to)}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: this.#headers(),
      body: JSON.stringify({
        template_name: templateName,
        // Order matters — must match the template's {{1}}, {{2}}, ... placeholders.
        parameters: Object.entries(params).map(([name, value]) => ({ name, value })),
        broadcast_name: `igo-automate-${Date.now()}`,
        channel_number: config.whatsapp.wati.channelNumber,
      }),
    });

    if (!res.ok) {
      throw new Error(`WATI sendTemplateMessage failed: ${res.status} ${await res.text()}`);
    }

    const data = await res.json();
    // 200 only means WATI accepted the request — final status arrives via webhook.
    return { providerMessageId: data.whatsappMessageId ?? data.id ?? '', status: 'sent' };
  }

  async sendTextMessage({ to, text }) {
    this.#assertConfigured();

    const url = `${config.whatsapp.wati.baseUrl}/${config.whatsapp.wati.tenantId}/api/v1/sendSessionMessage/${encodeURIComponent(to)}?messageText=${encodeURIComponent(text)}&channelPhoneNumber=${encodeURIComponent(config.whatsapp.wati.channelNumber)}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: this.#headers(),
    });

    if (!res.ok) {
      throw new Error(`WATI sendSessionMessage failed: ${res.status} ${await res.text()}`);
    }

    const data = await res.json();
    return { providerMessageId: data.whatsappMessageId ?? data.id ?? '', status: 'sent' };
  }

  normalizeWebhookEvent(payload) {
    if (!payload || typeof payload !== 'object') return null;

    const isInboundMessage = payload.eventType === 'message';
    const status = STATUS_MAP[payload.statusString?.toUpperCase()] ?? (isInboundMessage ? 'replied' : 'unknown');

    if (isInboundMessage) {
      // Inbound lead replies don't correlate to one of our own outbound
      // `messages` rows by provider_message_id — logging them into
      // conversation_logs (Aria's transcript) is Phase 3/4 persona-wiring
      // work, not covered by this provider's send/normalize contract.
      logger.debug({ waId: payload.waId }, 'wati inbound message received (not yet routed to conversation_logs)');
    }

    return {
      providerMessageId: payload.whatsappMessageId ?? payload.id ?? '',
      status,
      phone: payload.waId,
      repliedText: isInboundMessage ? payload.text : undefined,
    };
  }

  #headers() {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.whatsapp.wati.apiToken}`,
    };
  }

  #assertConfigured() {
    if (!config.whatsapp.wati.tenantId || !config.whatsapp.wati.apiToken) {
      throw new Error('WATI_TENANT_ID / WATI_API_TOKEN not configured');
    }
  }
}
