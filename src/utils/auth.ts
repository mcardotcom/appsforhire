import { type NextRequest } from 'next/server';
import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

export async function getApiKeyFromRequest(req: NextRequest) {
  const apiKey = req.headers.get('x-api-key') || req.cookies.get('api_key')?.value;
  if (!apiKey) {
    return null;
  }

  const apiKeyRecord = await prisma.apiKey.findFirst({
    where: {
      key: apiKey,
      is_active: true,
      OR: [
        { expires_at: null },
        { expires_at: { gt: new Date() } },
      ],
    },
  });

  if (!apiKeyRecord) {
    return null;
  }

  return {
    id: apiKeyRecord.id,
    user_id: apiKeyRecord.user_id,
    rate_limit_per_minute: apiKeyRecord.rate_limit_per_minute,
    burst_limit: apiKeyRecord.burst_limit,
    window_seconds: apiKeyRecord.window_seconds,
  };
} 