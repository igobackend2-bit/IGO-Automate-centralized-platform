import { WhatsAppProvider } from './WhatsAppProvider.js';
import { config } from '../../config.js';

/**
 * Current live channel. Kept as-is until Phase 3/5 explicitly cuts over.
 * Endpoint paths follow WATI's REST API — confirm exact paths against
 * WATI's current docs before wiring real sends (they gate by plan/version).
 */
export class WatiProvider extends WhatsAppProvider {
  get name() {
    return 'wati';
  }

  async sendTemplateMessage({ to, templateName, params = {} }) {
    this.#assertConfigured();
    // TODO(Phase 3): implement real call to WATI's send-template endpoint.
    throw new Error('WatiProvider.sendTemplateMessage not yet wired — awaiting WATI credentials');
  }

  async sendTextMessage({ to, text }) {
    this.#assertConfigured();
    throw new Error('WatiProvider.sendTextMessage not yet wired — awaiting WATI credentials');
  }

  normalizeWebhookEvent(payload) {
    if (!payload || typeof payload !== 'object') return null;
    return {
      providerMessageId: payload.id ?? payload.whatsappMessageId ?? '',
      status: payload.eventType ?? payload.status ?? 'unknown',
      phone: payload.waId ?? payload.senderId,
      repliedText: payload.text?.body,
    };
  }

  #assertConfigured() {
    if (!config.whatsapp.wati.apiEndpoint || !config.whatsapp.wati.apiToken) {
      throw new Error('WATI_API_ENDPOINT / WATI_API_TOKEN not configured');
    }
  }
}
