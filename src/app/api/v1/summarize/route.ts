import { NextRequest, NextResponse } from 'next/server';
import { summarizeTool } from '@/tools/summarize';

export async function POST(request: NextRequest) {
  try {
    const input = await request.json();
    // Validate input using the tool's schema
    const validatedInput = summarizeTool.inputSchema.parse(input);
    // Process the summarization
    const result = await summarizeTool.handler(validatedInput);
    // Validate output
    summarizeTool.outputSchema.parse(result);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        summary: '',
        metadata: {},
        error: error instanceof Error ? error.message : error
      },
      { status: 500 }
    );
  }
} 