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

app.listen(config.port, () => {
  logger.info(`IGO Automate API listening on :${config.port} (${config.nodeEnv})`);
});
