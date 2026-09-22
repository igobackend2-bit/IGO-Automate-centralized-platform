import express from 'express';
import cors from 'cors';
import { randomUUID } from 'node:crypto';
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

app.use(cors({ origin: config.frontendOrigin }));
app.use(express.json());
app.use(
  pinoHttp({
    logger,
    genReqId: (req) => req.headers['x-request-id'] || randomUUID(),
  })
);

app.use('/api/health', healthRouter);
app.use('/api/webhooks', webhooksRouter);
app.use('/api/contacts', contactsRouter);
app.use('/api/campaigns', campaignsRouter);
app.use('/api/analytics', analyticsRouter);
// Deliberately permissive CORS — this is the one endpoint meant to be
// called from 28 different external brand websites. The public_api_key
// (checked inside the router, not by CORS) is what actually authorizes
// a request, so an open origin policy here doesn't weaken security.
app.use('/api/enquiries', cors(), enquiriesRouter);

app.listen(config.port, () => {
  logger.info(`IGO Automate API listening on :${config.port} (${config.nodeEnv})`);
});
