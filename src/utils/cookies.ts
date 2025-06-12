import { cookies } from 'next/headers';
import { config } from './config';

const API_KEY_COOKIE = 'api_key';

export const cookieUtils = {
  setApiKey: async (apiKey: string) => {
    const cookieStore = await cookies();
    cookieStore.set(API_KEY_COOKIE, apiKey, {
      httpOnly: true,
      secure: !config.isDevelopment,
      sameSite: 'strict',
      path: '/',
      maxAge: 30 * 24 * 60 * 60 // 30 days
    });
  },

  getApiKey: async (): Promise<string | undefined> => {
    const cookieStore = await cookies();
    return cookieStore.get(API_KEY_COOKIE)?.value;
  },

  removeApiKey: async () => {
    const cookieStore = await cookies();
    cookieStore.delete(API_KEY_COOKIE);
  }
}; 