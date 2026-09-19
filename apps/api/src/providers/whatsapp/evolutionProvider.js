import { WhatsAppProvider } from './WhatsAppProvider.js';
import { config } from '../../config.js';

/**
 * New channel — Evolution API running in official WhatsApp Cloud API mode.
 * Confirm exact endpoint paths against doc.evolution-api.com for the
 * pinned version before wiring real sends; paths move between releases.
 */
export class EvolutionProvider extends WhatsAppProvider {
  get name() {
    return 'evolution';
  }

  async sendTemplateMessage({ to, templateName, params = {} }) {
    this.#assertConfigured();
    throw new Error(
      'EvolutionProvider.sendTemplateMessage not yet wired — awaiting Evolution API deployment + credentials'
    );
  }

  async sendTextMessage({ to, text }) {
    this.#assertConfigured();
    throw new Error(
      'EvolutionProvider.sendTextMessage not yet wired — awaiting Evolution API deployment + credentials'
    );
  }

  normalizeWebhookEvent(payload) {
    if (!payload || typeof payload !== 'object') return null;
    return {
      providerMessageId: payload.key?.id ?? '',
      status: payload.status ?? payload.event ?? 'unknown',
      phone: payload.key?.remoteJid,
      repliedText: payload.message?.conversation,
    };
  }

  #assertConfigured() {
    if (!config.whatsapp.evolution.baseUrl || !config.whatsapp.evolution.apiKey) {
      throw new Error('EVOLUTION_API_BASE_URL / EVOLUTION_API_KEY not configured');
    }
  }
}
