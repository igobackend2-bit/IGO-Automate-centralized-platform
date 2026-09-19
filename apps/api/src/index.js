import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { config } from './config.js';
import { healthRouter } from './routes/health.js';
import { webhooksRouter } from './routes/webhooks.js';
import { contactsRouter } from './routes/contacts.js';
import { campaignsRouter } from './routes/campaigns.js';

const app = express();

app.use(cors({ origin: config.frontendOrigin }));
app.use(express.json());
app.use(morgan('dev'));

app.use('/api/health', healthRouter);
app.use('/api/webhooks', webhooksRouter);
app.use('/api/contacts', contactsRouter);
app.use('/api/campaigns', campaignsRouter);

app.listen(config.port, () => {
  console.log(`IGO Automate API listening on :${config.port} (${config.nodeEnv})`);
});
