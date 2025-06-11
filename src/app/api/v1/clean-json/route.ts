import { NextRequest, NextResponse } from 'next/server';
import { cleanJsonTool } from '@/tools/clean-json';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = cleanJsonTool.inputSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({
        success: false,
        error: {
          message: 'Invalid input format',
          code: 'INVALID_INPUT',
          details: parsed.error
        },
        metadata: {
          fieldsProcessed: 0,
          fieldsRemoved: 0,
          fieldsNormalized: 0,
          warnings: []
        },
        original: null
      }, { status: 400 });
    }

    const result = await cleanJsonTool.handler(parsed.data);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Internal server error',
        code: 'INTERNAL_ERROR'
      },
      metadata: {
        fieldsProcessed: 0,
        fieldsRemoved: 0,
        fieldsNormalized: 0,
        warnings: []
      },
      original: null
    }, { status: 500 });
  }
} 