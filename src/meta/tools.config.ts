import { cleanJsonTool } from '../tools/clean-json';
import { checkCsvTool } from '../tools/check-csv';
// Temporarily removed summarizeTool import until summarize.ts is restored
// import { summarizeTool } from '../tools/summarize';

export const tools = {
  'clean-json': cleanJsonTool,
  'check-csv': checkCsvTool,
  // Temporarily removed Summarize tool from registry
  // 'summarize': summarizeTool,
};

export type ToolName = keyof typeof tools; 