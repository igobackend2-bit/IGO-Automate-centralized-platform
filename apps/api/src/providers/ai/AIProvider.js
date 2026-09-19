/**
 * Contract every LLM backend (Groq, Gemini, self-hosted Ollama, ...) must
 * implement. Persona logic (Aria, Social Responder) should only ever
 * depend on this interface — never import a concrete provider directly.
 */
export class AIProvider {
  /** @returns {string} */
  get name() {
    throw new Error('not implemented');
  }

  /**
   * @param {{ systemPrompt: string, messages: { role: 'user'|'assistant', content: string }[] }} _args
   * @returns {Promise<{ content: string }>}
   */
  async generateReply(_args) {
    throw new Error('not implemented');
  }
}
