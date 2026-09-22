import 'dotenv/config';

export const config = {
  port: process.env.PORT || 4000,
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendOrigin: process.env.FRONTEND_ORIGIN || 'http://localhost:3000',

  supabase: {
    url: process.env.SUPABASE_URL || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    anonKey: process.env.SUPABASE_ANON_KEY || '',
  },

  whatsapp: {
    provider: process.env.WHATSAPP_PROVIDER || 'wati',
    wati: {
      // Base host per docs.wati.io — override only if WATI ever migrates you
      // to a different data-center host.
      baseUrl: process.env.WATI_API_BASE_URL || 'https://live-mt-server.wati.io',
      tenantId: process.env.WATI_TENANT_ID || '',
      apiToken: process.env.WATI_API_TOKEN || '',
      channelNumber: process.env.WATI_CHANNEL_NUMBER || '',
      // WATI's docs don't document a signed-webhook (HMAC) scheme, so this
      // is checked as a shared query-param secret on the registered
      // webhook URL instead (?secret=...), not a signature header.
      webhookSecret: process.env.WATI_WEBHOOK_SECRET || '',
    },
    evolution: {
      baseUrl: process.env.EVOLUTION_API_BASE_URL || '',
      apiKey: process.env.EVOLUTION_API_KEY || '',
      instanceName: process.env.EVOLUTION_INSTANCE_NAME || '',
      webhookSecret: process.env.EVOLUTION_WEBHOOK_SECRET || '',
    },
  },

  listmonk: {
    baseUrl: process.env.LISTMONK_BASE_URL || '',
    apiUsername: process.env.LISTMONK_API_USERNAME || '',
    apiToken: process.env.LISTMONK_API_TOKEN || '',
    webhookSecret: process.env.LISTMONK_WEBHOOK_SECRET || '',
  },

  sms: {
    provider: process.env.SMS_PROVIDER || 'msg91',
    msg91: {
      authKey: process.env.MSG91_AUTH_KEY || '',
      senderId: process.env.MSG91_SENDER_ID || '',
    },
  },

  n8n: {
    baseUrl: process.env.N8N_BASE_URL || '',
    webhookToken: process.env.N8N_WEBHOOK_TOKEN || '',
    // For calling n8n's own management API (listing workflows for the
    // Overview KPIs) — generated in n8n's UI under Settings > API, not the
    // same thing as webhookToken (which is for n8n calling *us*).
    apiKey: process.env.N8N_API_KEY || '',
  },

  ai: {
    provider: process.env.AI_PROVIDER || 'groq',
    groq: {
      apiKey: process.env.GROQ_API_KEY || '',
      model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
    },
    gemini: {
      apiKey: process.env.GEMINI_API_KEY || '',
      model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
    },
    ollama: {
      baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
      model: process.env.OLLAMA_MODEL || 'llama3.1-igo-finetuned',
    },
  },
};
