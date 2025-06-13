import { randomBytes } from 'crypto';

/**
 * Generates a secure random API key
 * @returns A 32-character hexadecimal API key
 */
export function generateApiKey(): string {
  return randomBytes(16).toString('hex');
}

/**
 * Validates an API key format
 * @param key The API key to validate
 * @returns Whether the API key is valid
 */
export function isValidApiKey(key: string): boolean {
  // API keys should be 32 characters long and contain only hexadecimal characters
  return /^[0-9a-f]{32}$/.test(key);
} 