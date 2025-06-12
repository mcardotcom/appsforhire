"use client";

import { useState } from "react";
import { FiCopy, FiUpload, FiTrash2, FiInfo } from "react-icons/fi";

interface SummarizeToolProps {
  onResult?: (result: any) => void;
}

interface SummarizeOptions {
  summaryLength: 'short' | 'medium' | 'long';
  format: 'paragraph' | 'bullet_points' | 'one_sentence';
  model: 'fast_extractive' | 'quality_abstractive';
  language: string;
  stripHtml: boolean;
  agentContext?: string;
}

export default function SummarizeTool({ onResult }: SummarizeToolProps) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [options, setOptions] = useState<SummarizeOptions>({
    summaryLength: 'medium',
    format: 'paragraph',
    model: 'fast_extractive',
    language: 'en',
    stripHtml: true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/v1/summarize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          options
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to summarize text");
      }

      setResult(data);
      onResult?.(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Text to Summarize
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            rows={6}
            placeholder="Enter text to summarize..."
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Summary Length
            </label>
            <select
              value={options.summaryLength}
              onChange={(e) => setOptions(prev => ({ ...prev, summaryLength: e.target.value as SummarizeOptions['summaryLength'] }))}
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
              value={options.format}
              onChange={(e) => setOptions(prev => ({ ...prev, format: e.target.value as SummarizeOptions['format'] }))}
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
              value={options.model}
              onChange={(e) => setOptions(prev => ({ ...prev, model: e.target.value as SummarizeOptions['model'] }))}
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
              value={options.language}
              onChange={(e) => setOptions(prev => ({ ...prev, language: e.target.value }))}
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
              value={options.agentContext || ''}
              onChange={(e) => setOptions(prev => ({ ...prev, agentContext: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="e.g., Summarize for a technical audience"
            />
          </div>

          <div className="col-span-2">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={options.stripHtml}
                onChange={(e) => setOptions(prev => ({ ...prev, stripHtml: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Strip HTML</span>
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {loading ? "Summarizing..." : "Summarize"}
        </button>
      </form>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      {result && (
        <div className="rounded-md bg-green-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">Summary</h3>
              <div className="mt-2 text-sm text-green-700 whitespace-pre-wrap">
                {result.summary}
              </div>
              {result.metadata && (
                <div className="mt-4 text-xs text-green-600">
                  <p>Original Length: {result.metadata.originalLengthChars} chars</p>
                  <p>Summary Length: {result.metadata.summaryLengthChars} chars</p>
                  <p>Compression Ratio: {result.metadata.compressionRatio}</p>
                  <p>Processing Time: {result.metadata.processingTimeMs}ms</p>
                  {result.metadata.keywords.length > 0 && (
                    <p>Keywords: {result.metadata.keywords.join(', ')}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 