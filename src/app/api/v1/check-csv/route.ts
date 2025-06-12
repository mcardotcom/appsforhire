import { NextRequest, NextResponse } from 'next/server';
import { checkCsvTool } from '@/tools/check-csv';
import { z } from 'zod';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Check if the request body has the correct structure
    if (!body.csv && !body.json) {
      return NextResponse.json(
        {
          error: 'Invalid input',
          detail: 'Request body must contain either a "csv" or "json" field'
        },
        { status: 400 }
      );
    }

    // Transform the input if it's using the json field
    const input = {
      csv: body.csv || body.json,
      options: body.options || {}
    };
    
    // Validate input using the tool's schema
    const validatedInput = checkCsvTool.inputSchema.parse(input);
    
    // Process the CSV data
    const result = await checkCsvTool.handler(validatedInput);
    
    // Validate output using the tool's schema
    const validatedOutput = checkCsvTool.outputSchema.parse(result);
    
    return NextResponse.json(validatedOutput);
  } catch (error) {
    console.error('Error processing CSV:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid input',
          detail: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      {
        error: 'Internal server error',
        detail: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 