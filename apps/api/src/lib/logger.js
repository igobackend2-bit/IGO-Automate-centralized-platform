import pino from 'pino';
import { config } from '../config.js';

// Structured JSON logs always — this is an ops tool whose logs matter for
// debugging real send failures, not a human-facing dev console.
export const logger = pino({
  level: config.nodeEnv === 'production' ? 'info' : 'debug',
});
