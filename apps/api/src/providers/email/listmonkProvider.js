import { EmailProvider } from './EmailProvider.js';
import { config } from '../../config.js';

// Verified against listmonk.app/docs/apis/transactional on 2026-09-22 —
// including against a real local instance, which caught a real bug: the
// default subscriber_email mode 400s ("Subscriber not found") unless the
// recipient already exists as a listmonk subscriber. Enquiry-greeting
// recipients are frequently brand-new, so this uses `external` mode
// (subscriber_emails array, no subscriber lookup/creation) instead.
export class ListmonkProvider extends EmailProvider {
  get name() {
    return 'listmonk';
  }

  async sendTemplateEmail({ to, templateId, data = {} }) {
    this.#assertConfigured();

    const auth = Buffer.from(`${config.listmonk.apiUsername}:${config.listmonk.apiToken}`).toString('base64');
    const res = await fetch(`${config.listmonk.baseUrl}/api/tx`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify({
        subscriber_mode: 'external',
        subscriber_emails: [to],
        template_id: templateId,
        data,
      }),
    });

    if (!res.ok) {
      throw new Error(`listmonk sendTemplateEmail failed: ${res.status} ${await res.text()}`);
    }

    return { status: 'sent' };
  }

  #assertConfigured() {
    if (!config.listmonk.baseUrl || !config.listmonk.apiUsername || !config.listmonk.apiToken) {
      throw new Error('LISTMONK_BASE_URL / LISTMONK_API_USERNAME / LISTMONK_API_TOKEN not configured');
    }
  }
}
