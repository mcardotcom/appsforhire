export const config = {
  isDevelopment: process.env.NODE_ENV === 'development',
  useRedis: process.env.USE_REDIS === 'true',
  useSecureCookies: process.env.USE_SECURE_COOKIES === 'true',
  apiKeyCookieName: 'apiKey',
  rateLimit: {
    default: 100,
    windowSeconds: 60,
    burstLimit: 10
  }
} as const;

// Type for the config object
export type Config = typeof config; 