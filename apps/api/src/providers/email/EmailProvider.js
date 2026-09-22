/**
 * Contract for one-off transactional email sends (a new-enquiry greeting,
 * not a bulk campaign — those go through listmonk's campaign UI directly,
 * not this interface).
 */
export class EmailProvider {
  /** @returns {string} */
  get name() {
    throw new Error('not implemented');
  }

  /**
   * @param {{ to: string, templateId: number, data?: Record<string, unknown> }} _args
   * @returns {Promise<{ status: string }>}
   */
  async sendTemplateEmail(_args) {
    throw new Error('not implemented');
  }
}
