import { cleanJsonTool } from '../tools/clean-json';
import { checkCsvTool } from '../tools/check-csv';
import { summarizeTool } from '../tools/summarize';

export const tools = {
  'clean-json': cleanJsonTool,
  'check-csv': checkCsvTool,
  'summarize': summarizeTool,
};

export type ToolName = keyof typeof tools; 