import { NextRequest, NextResponse } from 'next/server';
import { tools, ToolName } from '@/app/config/tools';

// Pre-import all route modules
import * as cleanJsonRoute from '@/app/api/v1/clean-json/route';
import * as checkCsvRoute from '@/app/api/v1/check-csv/route';
import * as summarizeRoute from '@/app/api/v1/summarize/route';

// Map tool names to their pre-imported modules
const preImportedModules = {
  'clean-json': cleanJsonRoute,
  'check-csv': checkCsvRoute,
  'summarize': summarizeRoute,
} as const;

// Generate static params for all valid tools
export async function generateStaticParams() {
  return Object.keys(tools).map((tool) => ({
    tool,
  }));
}

export async function GET(
  request: NextRequest,
  { params }: { params: { tool: string } }
) {
  try {
    console.log('Meta route handler called with tool:', params.tool);
    
    // Validate the tool name first
    if (!Object.keys(tools).includes(params.tool)) {
      console.log('Tool not found:', params.tool);
      return NextResponse.json({
        error: 'Tool not found',
      }, { status: 404 });
    }

    const toolName = params.tool as ToolName;
    const tool = tools[toolName];
    console.log('Found tool config:', { name: tool.name, endpoint: tool.endpoint });
    
    // Get the pre-imported module
    const module = preImportedModules[toolName];
    if (!module) {
      console.log('No module found for tool:', toolName);
      return NextResponse.json({
        error: 'OpenAPI schema not available for this tool',
      }, { status: 404 });
    }

    console.log('Module found, checking for openapi export');
    
    if (!module.openapi) {
      console.log('No OpenAPI schema found in module');
      return NextResponse.json({
        error: 'OpenAPI schema not found in tool route',
        availableExports: Object.keys(module)
      }, { status: 404 });
    }

    console.log('OpenAPI schema found, returning response');
    // Ensure the schema is properly stringified
    const schema = JSON.parse(JSON.stringify(module.openapi));
    console.log('Schema being sent:', JSON.stringify(schema, null, 2));
    return NextResponse.json(schema);
  } catch (error) {
    console.error('Error in meta route handler:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      params
    });
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Internal server error',
    }, { status: 500 });
  }
} 