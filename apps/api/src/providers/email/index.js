import { ListmonkProvider } from './listmonkProvider.js';

let instance = null;

/**
 * Only one EmailProvider today, but kept as a factory (not a direct
 * import) for the same reason as WhatsAppProvider/AIProvider/SmsProvider —
 * so a future swap is a config change, not a rewrite.
 */
export function getEmailProvider() {
  if (instance) return instance;
  instance = new ListmonkProvider();
  return instance;
}
