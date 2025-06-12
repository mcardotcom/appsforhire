import { router, publicProcedure } from '../trpc';
import { z } from 'zod';
import { cleanJsonTool } from '@/tools/clean-json';
import { checkCsvTool } from '@/tools/check-csv';
import { summarizeTool } from '@/tools/summarize';

export const toolsRouter = router({
  cleanJson: publicProcedure
    .input(cleanJsonTool.inputSchema)
    .mutation(async ({ input }) => {
      return cleanJsonTool.handler(input);
    }),

  checkCsv: publicProcedure
    .input(checkCsvTool.inputSchema)
    .mutation(async ({ input }) => {
      return checkCsvTool.handler(input);
    }),

  summarize: publicProcedure
    .input(summarizeTool.inputSchema)
    .mutation(async ({ input }) => {
      return summarizeTool.handler(input);
    }),
}); 