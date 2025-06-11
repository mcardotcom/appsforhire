import { NextRequest, NextResponse } from 'next/server';
import { tools, ToolName } from '../../../meta/tools.config';

export async function POST(request: NextRequest, { params }: { params: { tool: string } }) {
  const tool = tools[params.tool as ToolName];
  if (!tool) return new NextResponse('Tool not found', { status: 404 });

  const body = await request.json();
  const parsed = tool.inputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error }, { status: 400 });
  }

  const result = await tool.handler(parsed.data);
  return NextResponse.json(result);
} 