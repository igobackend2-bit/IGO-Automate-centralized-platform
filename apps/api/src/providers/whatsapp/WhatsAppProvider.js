/**
 * Contract every WhatsApp channel (WATI, Evolution API, ...) must implement.
 * Business logic and routes should only ever depend on this interface —
 * never import a concrete provider directly.
 */
export class WhatsAppProvider {
  /** @returns {string} */
  get name() {
    throw new Error('not implemented');
  }

  /**
   * @param {{ to: string, templateName: string, params?: Record<string, string> }} _args
   * @returns {Promise<{ providerMessageId: string, status: string }>}
   */
  async sendTemplateMessage(_args) {
    throw new Error('not implemented');
  }

  /**
   * @param {{ to: string, text: string }} _args
   * @returns {Promise<{ providerMessageId: string, status: string }>}
   */
  async sendTextMessage(_args) {
    throw new Error('not implemented');
  }

  /**
   * Normalize a provider-specific inbound webhook payload into the shape
   * the platform's `messages` table expects.
   * @param {unknown} _payload
   * @returns {{ providerMessageId: string, status: string, phone?: string, repliedText?: string } | null}
   */
  normalizeWebhookEvent(_payload) {
    throw new Error('not implemented');
  }
}
