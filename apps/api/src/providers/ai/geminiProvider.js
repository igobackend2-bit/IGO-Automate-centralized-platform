import { AIProvider } from './AIProvider.js';
import { config } from '../../config.js';

export class GeminiProvider extends AIProvider {
  get name() {
    return 'gemini';
  }

  async generateReply({ systemPrompt, messages }) {
    if (!config.ai.gemini.apiKey) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.ai.gemini.model}:generateContent?key=${config.ai.gemini.apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: messages.map((m) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        })),
      }),
    });

    if (!res.ok) {
      throw new Error(`Gemini API error: ${res.status} ${await res.text()}`);
    }

    const data = await res.json();
    const content = data.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') ?? '';
    return { content };
  }
}
