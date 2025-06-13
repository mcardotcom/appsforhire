// Simple browser-compatible logger
const logger = {
  info: (...args: any[]) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[INFO]', ...args);
    }
  },
  error: (...args: any[]) => {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[ERROR]', ...args);
    }
  },
  warn: (...args: any[]) => {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[WARN]', ...args);
    }
  },
  debug: (...args: any[]) => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug('[DEBUG]', ...args);
    }
  }
};

export { logger }; 