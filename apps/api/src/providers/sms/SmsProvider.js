/**
 * Contract every SMS backend must implement. Only template-based sends —
 * unlike WhatsApp/email, India's DLT (Distributed Ledger Technology)
 * regulation requires every SMS template to be pre-registered with the
 * telecom operator; there is no compliant "send arbitrary free text" path,
 * so this interface doesn't offer one.
 */
export class SmsProvider {
  /** @returns {string} */
  get name() {
    throw new Error('not implemented');
  }

  /**
   * @param {{ to: string, templateId: string, params?: Record<string, string> }} _args
   * @returns {Promise<{ providerMessageId: string, status: string }>}
   */
  async sendTemplateMessage(_args) {
    throw new Error('not implemented');
  }
}
