import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    message: 'Static test route is working',
    timestamp: new Date().toISOString()
  });
} 