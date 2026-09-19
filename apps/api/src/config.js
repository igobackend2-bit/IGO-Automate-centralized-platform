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
      apiEndpoint: process.env.WATI_API_ENDPOINT || '',
      apiToken: process.env.WATI_API_TOKEN || '',
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

  n8n: {
    baseUrl: process.env.N8N_BASE_URL || '',
    webhookToken: process.env.N8N_WEBHOOK_TOKEN || '',
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
