import { config } from '../../config.js';
import { Msg91Provider } from './msg91Provider.js';

let instance = null;

/** Returns the active SmsProvider per SMS_PROVIDER env var. */
export function getSmsProvider() {
  if (instance) return instance;

  switch (config.sms.provider) {
    case 'msg91':
    default:
      instance = new Msg91Provider();
      break;
  }
  return instance;
}
