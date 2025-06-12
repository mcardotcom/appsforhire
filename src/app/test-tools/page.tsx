'use client';

import { useState } from 'react';
import { trpc } from '@/utils/trpc';
import type { TRPCClientErrorLike } from '@trpc/client';
import type { AppRouter } from '@/server/routers/_app';

interface SummarizeResult {
  success: boolean;
  summary: string | null;
  metadata: {
    originalLengthChars: number;
    summaryLengthChars: number;
    compressionRatio: number;
    modelUsed: string;
    language: string;
    keywords: string[];
    tokenUsage?: {
      inputTokens: number;
      outputTokens: number;
    };
    processingTimeMs: number;
  } | null;
  error: {
    code: string;
    message: string;
    suggestedAction: string;
  } | null;
  auditId: string;
}

export default function TestToolsPage() {
  const [result, setResult] = useState<SummarizeResult | null>(null);
  const [summarizeOptions, setSummarizeOptions] = useState({
    summaryLength: 'medium' as const,
    format: 'paragraph' as const,
    model: 'fast_extractive' as const,
    language: 'en',
    stripHtml: true,
    agentContext: ''
  });

  const summarizeMutation = trpc.tools.summarize.useMutation({
    onSuccess: (data: SummarizeResult) => {
      setResult(data);
    },
    onError: (error: TRPCClientErrorLike<AppRouter>) => {
      console.error('Summarize error:', error);
    }
  });

  const handleSummarize = () => {
    const text = "This is a test text that needs to be summarized. It contains multiple sentences and should be long enough to demonstrate the summarization capabilities. The text should be processed according to the selected options and return a meaningful summary.";
    
    summarizeMutation.mutate({
      text,
      options: summarizeOptions
    });
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Test Tools</h1>

      <div className="space-y-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">Summarize</h2>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Summary Length
              </label>
              <select
                value={summarizeOptions.summaryLength}
                onChange={(e) => setSummarizeOptions((prev) => ({
                  ...prev,
                  summaryLength: e.target.value as typeof summarizeOptions.summaryLength
                }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="short">Short</option>
                <option value="medium">Medium</option>
                <option value="long">Long</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Format
              </label>
              <select
                value={summarizeOptions.format}
                onChange={(e) => setSummarizeOptions((prev) => ({
                  ...prev,
                  format: e.target.value as typeof summarizeOptions.format
                }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="paragraph">Paragraph</option>
                <option value="bullet_points">Bullet Points</option>
                <option value="one_sentence">One Sentence</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Model
              </label>
              <select
                value={summarizeOptions.model}
                onChange={(e) => setSummarizeOptions((prev) => ({
                  ...prev,
                  model: e.target.value as typeof summarizeOptions.model
                }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="fast_extractive">Fast Extractive</option>
                <option value="quality_abstractive">Quality Abstractive</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Language
              </label>
              <input
                type="text"
                value={summarizeOptions.language}
                onChange={(e) => setSummarizeOptions((prev) => ({
                  ...prev,
                  language: e.target.value
                }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="en"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Agent Context (Optional)
              </label>
              <input
                type="text"
                value={summarizeOptions.agentContext}
                onChange={(e) => setSummarizeOptions((prev) => ({
                  ...prev,
                  agentContext: e.target.value
                }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="e.g., Summarize for a technical audience"
              />
            </div>

            <div className="col-span-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={summarizeOptions.stripHtml}
                  onChange={(e) => setSummarizeOptions((prev) => ({
                    ...prev,
                    stripHtml: e.target.checked
                  }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Strip HTML</span>
              </label>
            </div>
          </div>

          <button
            onClick={handleSummarize}
            disabled={summarizeMutation.isPending}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {summarizeMutation.isPending ? "Summarizing..." : "Test Summarize"}
          </button>

          {result && (
            <div className="mt-4 space-y-4">
              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Summary</h3>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{result.summary}</p>
              </div>

              {result.metadata && (
                <div className="bg-gray-50 p-4 rounded-md">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Metadata</h3>
                  <dl className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <dt className="text-gray-500">Original Length</dt>
                      <dd className="font-medium">{result.metadata.originalLengthChars} chars</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Summary Length</dt>
                      <dd className="font-medium">{result.metadata.summaryLengthChars} chars</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Compression Ratio</dt>
                      <dd className="font-medium">{result.metadata.compressionRatio}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Model</dt>
                      <dd className="font-medium">{result.metadata.modelUsed}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Language</dt>
                      <dd className="font-medium">{result.metadata.language}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Processing Time</dt>
                      <dd className="font-medium">{result.metadata.processingTimeMs}ms</dd>
                    </div>
                    {result.metadata.keywords.length > 0 && (
                      <div className="col-span-2">
                        <dt className="text-gray-500">Keywords</dt>
                        <dd className="font-medium">{result.metadata.keywords.join(', ')}</dd>
                      </div>
                    )}
                    {result.metadata.tokenUsage && (
                      <>
                        <div>
                          <dt className="text-gray-500">Input Tokens</dt>
                          <dd className="font-medium">{result.metadata.tokenUsage.inputTokens}</dd>
                        </div>
                        <div>
                          <dt className="text-gray-500">Output Tokens</dt>
                          <dd className="font-medium">{result.metadata.tokenUsage.outputTokens}</dd>
                        </div>
                      </>
                    )}
                  </dl>
                </div>
              )}

              {result.error && (
                <div className="bg-red-50 p-4 rounded-md">
                  <h3 className="text-sm font-medium text-red-700 mb-2">Error</h3>
                  <p className="text-sm text-red-600">{result.error.message}</p>
                  <p className="text-sm text-red-500 mt-1">{result.error.suggestedAction}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 