import { SmsProvider } from './SmsProvider.js';
import { config } from '../../config.js';

/**
 * CAVEAT: docs.msg91.com is a client-rendered app that couldn't be scraped
 * for this build — this follows MSG91's long-stable Flow API v5 shape from
 * general knowledge, NOT a freshly fetched/verified spec like the WATI and
 * Evolution API providers. Confirm against a live MSG91 account (or their
 * docs, read directly in a browser) before relying on this for a real send.
 *
 * DLT compliance: `templateId` here must be an MSG91 "flow_id" pointing at
 * a template already approved on the telecom DLT platform — there is no
 * free-text fallback (see SmsProvider's class comment).
 */
export class Msg91Provider extends SmsProvider {
  get name() {
    return 'msg91';
  }

  async sendTemplateMessage({ to, templateId, params = {} }) {
    this.#assertConfigured();

    const res = await fetch('https://control.msg91.com/api/v5/flow/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        authkey: config.sms.msg91.authKey,
      },
      body: JSON.stringify({
        flow_id: templateId,
        sender: config.sms.msg91.senderId,
        recipients: [{ mobiles: to, ...params }],
      }),
    });

    if (!res.ok) {
      throw new Error(`MSG91 sendTemplateMessage failed: ${res.status} ${await res.text()}`);
    }

    const data = await res.json();
    return { providerMessageId: data.request_id ?? '', status: data.type === 'success' ? 'sent' : 'failed' };
  }

  #assertConfigured() {
    if (!config.sms.msg91.authKey || !config.sms.msg91.senderId) {
      throw new Error('MSG91_AUTH_KEY / MSG91_SENDER_ID not configured');
    }
  }
}
