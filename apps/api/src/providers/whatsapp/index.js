import { config } from '../../config.js';
import { WatiProvider } from './watiProvider.js';
import { EvolutionProvider } from './evolutionProvider.js';

let instance = null;

/**
 * Returns the active WhatsAppProvider per WHATSAPP_PROVIDER env var.
 * Swapping WATI -> Evolution API is a config change, never a code change.
 */
export function getWhatsAppProvider() {
  if (instance) return instance;

  switch (config.whatsapp.provider) {
    case 'evolution':
      instance = new EvolutionProvider();
      break;
    case 'wati':
    default:
      instance = new WatiProvider();
      break;
  }
  return instance;
}
