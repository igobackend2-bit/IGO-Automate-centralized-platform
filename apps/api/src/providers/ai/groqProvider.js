import { AIProvider } from './AIProvider.js';
import { config } from '../../config.js';

export class GroqProvider extends AIProvider {
  get name() {
    return 'groq';
  }

  async generateReply({ systemPrompt, messages }) {
    if (!config.ai.groq.apiKey) {
      throw new Error('GROQ_API_KEY not configured');
    }

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.ai.groq.apiKey}`,
      },
      body: JSON.stringify({
        model: config.ai.groq.model,
        messages: [{ role: 'system', content: systemPrompt }, ...messages],
      }),
    });

    if (!res.ok) {
      throw new Error(`Groq API error: ${res.status} ${await res.text()}`);
    }

    const data = await res.json();
    return { content: data.choices?.[0]?.message?.content ?? '' };
  }
}
