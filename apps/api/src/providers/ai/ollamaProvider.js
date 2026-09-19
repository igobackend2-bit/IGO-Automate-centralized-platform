import { AIProvider } from './AIProvider.js';
import { config } from '../../config.js';

/**
 * Phase 4 target: self-hosted fine-tuned Llama served via Ollama on the VPS.
 * Same interface as Groq/Gemini so the Aria Persona Console can A/B them
 * without any code change.
 */
export class OllamaProvider extends AIProvider {
  get name() {
    return 'ollama';
  }

  async generateReply({ systemPrompt, messages }) {
    const res = await fetch(`${config.ai.ollama.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: config.ai.ollama.model,
        messages: [{ role: 'system', content: systemPrompt }, ...messages],
        stream: false,
      }),
    });

    if (!res.ok) {
      throw new Error(`Ollama API error: ${res.status} ${await res.text()}`);
    }

    const data = await res.json();
    return { content: data.message?.content ?? '' };
  }
}
