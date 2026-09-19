import { config } from '../../config.js';
import { GroqProvider } from './groqProvider.js';
import { GeminiProvider } from './geminiProvider.js';
import { OllamaProvider } from './ollamaProvider.js';

let instance = null;

/**
 * Returns the active AIProvider per AI_PROVIDER env var.
 * Swapping Groq/Gemini -> fine-tuned Ollama is a config change, never a code change.
 */
export function getAIProvider() {
  if (instance) return instance;

  switch (config.ai.provider) {
    case 'gemini':
      instance = new GeminiProvider();
      break;
    case 'ollama':
      instance = new OllamaProvider();
      break;
    case 'groq':
    default:
      instance = new GroqProvider();
      break;
  }
  return instance;
}
