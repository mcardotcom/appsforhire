import { config } from './config';

const API_KEY_COOKIE = 'api_key';

export const clientCookies = {
  get: (name: string): string | undefined => {
    if (typeof document === 'undefined') return undefined;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      return parts.pop()?.split(';').shift();
    }
    return undefined;
  },

  set: (name: string, value: string, options?: { expires?: Date; path?: string; secure?: boolean }) => {
    if (typeof document === 'undefined') return;
    let cookie = `${name}=${value}`;
    if (options?.expires) {
      cookie += `; expires=${options.expires.toUTCString()}`;
    }
    if (options?.path) {
      cookie += `; path=${options.path}`;
    }
    if (options?.secure) {
      cookie += '; secure';
    }
    document.cookie = cookie;
  },

  delete: (name: string, path?: string) => {
    if (typeof document === 'undefined') return;
    let cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    if (path) {
      cookie += `; path=${path}`;
    }
    document.cookie = cookie;
  },

  getApiKey: (): string | undefined => {
    return clientCookies.get(API_KEY_COOKIE);
  },

  setApiKey: (apiKey: string) => {
    clientCookies.set(API_KEY_COOKIE, apiKey, {
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      path: '/',
      secure: !config.isDevelopment,
    });
  },

  deleteApiKey: () => {
    clientCookies.delete(API_KEY_COOKIE, '/');
  },
}; 