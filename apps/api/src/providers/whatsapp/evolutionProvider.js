import { WhatsAppProvider } from './WhatsAppProvider.js';
import { config } from '../../config.js';

// Endpoint paths/bodies verified against docs.evolutionfoundation.com.br
// (the project's docs moved off doc.evolution-api.com) on 2026-09-22.
//
// CAVEAT: the fetched docs confirm send-text's body shape and the send/
// webhook-config endpoint *paths*, but do not fully document (a) the
// Cloud-API-specific template body (name/language/components a la Meta's
// own template format) or (b) the shape of inbound webhook event payloads.
// Both are marked below — verify against a live instance before Phase 3
// go-live rather than trusting this as final.
export class EvolutionProvider extends WhatsAppProvider {
  get name() {
    return 'evolution';
  }

  async sendTemplateMessage({ to, templateName, params = {} }) {
    this.#assertConfigured();

    const url = `${config.whatsapp.evolution.baseUrl}/message/sendTemplate/${config.whatsapp.evolution.instanceName}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: this.#headers(),
      // TODO(Phase 3): confirm this body shape against a live instance —
      // docs.evolutionfoundation.com.br doesn't fully specify Cloud-API
      // template parameter substitution. This follows Meta's own
      // WhatsApp Cloud API template format as the best-effort default.
      body: JSON.stringify({
        number: to,
        template: {
          name: templateName,
          language: { code: 'en' },
          components: Object.entries(params).map(([, value]) => ({
            type: 'body',
            parameters: [{ type: 'text', text: value }],
          })),
        },
      }),
    });

    if (!res.ok) {
      throw new Error(`Evolution API sendTemplate failed: ${res.status} ${await res.text()}`);
    }

    const data = await res.json();
    return { providerMessageId: data.key?.id ?? '', status: data.status ?? 'sent' };
  }

  async sendTextMessage({ to, text }) {
    this.#assertConfigured();

    const url = `${config.whatsapp.evolution.baseUrl}/message/sendText/${config.whatsapp.evolution.instanceName}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: this.#headers(),
      body: JSON.stringify({ number: to, textMessage: { text } }),
    });

    if (!res.ok) {
      throw new Error(`Evolution API sendText failed: ${res.status} ${await res.text()}`);
    }

    const data = await res.json();
    return { providerMessageId: data.key?.id ?? '', status: data.status ?? 'sent' };
  }

  /**
   * Registers this backend's webhook receiver with the Evolution API
   * instance. Not part of the WhatsAppProvider send interface — this is
   * one-time setup, called manually/via a setup script, not per message.
   */
  async configureWebhook(webhookUrl, events = ['MESSAGES_UPSERT', 'MESSAGES_UPDATE']) {
    this.#assertConfigured();

    const url = `${config.whatsapp.evolution.baseUrl}/webhook/set/${config.whatsapp.evolution.instanceName}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: this.#headers(),
      body: JSON.stringify({ enabled: true, url: webhookUrl, events, base64: false }),
    });

    if (!res.ok) {
      throw new Error(`Evolution API configureWebhook failed: ${res.status} ${await res.text()}`);
    }
    return res.json();
  }

  normalizeWebhookEvent(payload) {
    if (!payload || typeof payload !== 'object') return null;
    // TODO(Phase 3): confirm against a live instance's actual webhook
    // payloads — undocumented on docs.evolutionfoundation.com.br. This
    // follows the well-established Baileys message-object shape
    // (messages.upsert/messages.update events), which Evolution API wraps.
    return {
      providerMessageId: payload.key?.id ?? '',
      status: payload.status ?? payload.event ?? 'unknown',
      phone: payload.key?.remoteJid,
      repliedText: payload.message?.conversation,
    };
  }

  #headers() {
    return {
      'Content-Type': 'application/json',
      apikey: config.whatsapp.evolution.apiKey,
    };
  }

  #assertConfigured() {
    if (!config.whatsapp.evolution.baseUrl || !config.whatsapp.evolution.apiKey) {
      throw new Error('EVOLUTION_API_BASE_URL / EVOLUTION_API_KEY not configured');
    }
  }
}
