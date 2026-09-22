import express from 'express';
import cors from 'cors';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import pinoHttp from 'pino-http';
import { config } from './config.js';
import { logger } from './lib/logger.js';
import { healthRouter } from './routes/health.js';
import { webhooksRouter } from './routes/webhooks.js';
import { contactsRouter } from './routes/contacts.js';
import { campaignsRouter } from './routes/campaigns.js';
import { analyticsRouter } from './routes/analytics.js';
import { enquiriesRouter } from './routes/enquiries.js';

const app = express();

app.use(express.json());
app.use(
  pinoHttp({
    logger,
    genReqId: (req) => req.headers['x-request-id'] || randomUUID(),
  })
);

// These two are mounted BEFORE the internal-dashboard-only CORS policy
// below. The `cors` package auto-terminates OPTIONS preflight requests —
// if the restrictive policy were registered first, it would intercept and
// answer every preflight (including these paths') before this permissive
// one ever ran, since Express dispatches middleware in registration order.
// Deliberately open CORS here: reachable from any of the 28 brand
// websites, and the public_api_key (checked inside the router, not by
// CORS) is what actually authorizes a request.
const __dirname = dirname(fileURLToPath(import.meta.url));
app.use('/api/enquiries', cors(), enquiriesRouter);
app.use('/widget', cors(), express.static(join(__dirname, '../../../docs/snippets')));

// Internal dashboard routes — restricted to the platform's own frontend origin.
app.use(cors({ origin: config.frontendOrigin }));

app.use('/api/health', healthRouter);
app.use('/api/webhooks', webhooksRouter);
app.use('/api/contacts', contactsRouter);
app.use('/api/campaigns', campaignsRouter);
app.use('/api/analytics', analyticsRouter);

app.listen(config.port, () => {
  logger.info(`IGO Automate API listening on :${config.port} (${config.nodeEnv})`);
});
