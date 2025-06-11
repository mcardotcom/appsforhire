import { cleanJsonTool } from '../tools/clean-json';
// Temporarily removed summarizeTool import until summarize.ts is restored
// import { summarizeTool } from '../tools/summarize';
// Temporarily removed checkCsvTool import until check-csv.ts is restored
// import { checkCsvTool } from '../tools/check-csv';

export const tools = {
  'clean-json': cleanJsonTool,
  // Temporarily removed Summarize tool from registry
  // 'summarize': summarizeTool,
  // Temporarily removed CSV tool from registry
  // 'check-csv': checkCsvTool,
};

export type ToolName = keyof typeof tools; 