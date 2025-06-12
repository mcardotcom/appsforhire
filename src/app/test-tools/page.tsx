'use client';

import { useState, useEffect } from 'react';
import { trpc } from '@/utils/trpc';
import { z } from 'zod';

interface SummaryMetadata {
  originalLength: number;
  summaryLength: number;
  model: string;
  language: string;
  confidence: number;
  processingTimeMs: number;
}

interface SummarizeResult {
  success: boolean;
  summary: string;
  metadata: SummaryMetadata;
  error: string | null;
}

export default function TestTools() {
  const [apiKey, setApiKey] = useState('');
  const [jsonInput, setJsonInput] = useState('');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [textInput, setTextInput] = useState('');
  const [result, setResult] = useState<SummarizeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [summarizeOptions, setSummarizeOptions] = useState({
    maxLength: 200,
    language: "en" as "en" | "es" | "fr" | "de" | "it" | "pt",
    model: "basic" as "basic" | "advanced" | "gpt-3.5" | "gpt-4"
  });

  // Load API key from localStorage on mount
  useEffect(() => {
    const savedApiKey = localStorage.getItem('apiKey');
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
  }, []);

  // Save API key to localStorage when it changes
  useEffect(() => {
    if (apiKey) {
      localStorage.setItem('apiKey', apiKey);
    } else {
      localStorage.removeItem('apiKey');
    }
  }, [apiKey]);

  const cleanJsonMutation = trpc.tools.cleanJson.useMutation({
    onSuccess: (data: any) => {
      setResult(data);
      setError(null);
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const checkCsvMutation = trpc.tools.checkCsv.useMutation({
    onSuccess: (data: any) => {
      setResult(data);
      setError(null);
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const summarizeMutation = trpc.tools.summarize.useMutation({
    onSuccess: (data: SummarizeResult) => {
      setResult(data);
      setError(null);
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const handleCleanJson = () => {
    if (!apiKey) {
      setError('Please enter an API key');
      return;
    }
    cleanJsonMutation.mutate({ json: jsonInput });
  };

  const handleCheckCsv = async () => {
    if (!apiKey) {
      setError('Please enter an API key');
      return;
    }
    if (!csvFile) {
      setError('Please select a CSV file');
      return;
    }

    try {
      const csvContent = await csvFile.text();
      checkCsvMutation.mutate({ csv: csvContent });
    } catch (err) {
      setError('Error reading CSV file');
    }
  };

  const handleSummarize = () => {
    if (!apiKey) {
      setError('Please enter an API key');
      return;
    }
    summarizeMutation.mutate({ 
      text: textInput,
      ...summarizeOptions
    });
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Test Tools</h1>
      <div className="mb-4">
        <label className="block mb-2">API Key:</label>
        <input
          type="text"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          className="border p-2 w-full"
          placeholder="Enter your API key"
        />
      </div>
      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">Clean JSON</h2>
        <textarea
          value={jsonInput}
          onChange={(e) => setJsonInput(e.target.value)}
          className="border p-2 w-full h-32"
          placeholder="Enter JSON here..."
        />
        <button onClick={handleCleanJson} className="mt-2 bg-blue-500 text-white p-2 rounded">
          Clean JSON
        </button>
      </div>
      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">Check CSV</h2>
        <input
          type="file"
          accept=".csv"
          onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
        />
        <button onClick={handleCheckCsv} className="mt-2 bg-blue-500 text-white p-2 rounded">
          Check CSV
        </button>
      </div>
      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">Summarize</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Max Length</label>
            <input
              type="number"
              min={10}
              max={1000}
              value={summarizeOptions.maxLength}
              onChange={(e) =>
                setSummarizeOptions((prev) => ({
                  ...prev,
                  maxLength: Math.min(1000, Math.max(10, parseInt(e.target.value) || 200)),
                }))
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Language</label>
            <select
              value={summarizeOptions.language}
              onChange={(e) =>
                setSummarizeOptions((prev) => ({
                  ...prev,
                  language: e.target.value as typeof summarizeOptions.language,
                }))
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="it">Italian</option>
              <option value="pt">Portuguese</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Model</label>
            <select
              value={summarizeOptions.model}
              onChange={(e) =>
                setSummarizeOptions((prev) => ({
                  ...prev,
                  model: e.target.value as typeof summarizeOptions.model,
                }))
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="basic">Basic</option>
              <option value="advanced">Advanced</option>
              <option value="gpt-3.5">GPT-3.5</option>
              <option value="gpt-4">GPT-4</option>
            </select>
          </div>
        </div>
        <textarea
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          className="border p-2 w-full h-32"
          placeholder="Enter text to summarize..."
        />
        <button onClick={handleSummarize} className="mt-2 bg-blue-500 text-white p-2 rounded">
          Summarize
        </button>
      </div>
      {error && (
        <div className="text-red-500 mb-4">
          Error: {error}
        </div>
      )}
      {result && (
        <div className="bg-gray-100 p-4 rounded">
          <h3 className="font-semibold mb-2">Result:</h3>
          <pre className="whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
          {result.metadata && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h4 className="font-semibold mb-2">Metadata:</h4>
              <dl className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <dt className="text-gray-500">Original Length</dt>
                  <dd className="font-medium">{result.metadata.originalLength} characters</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Summary Length</dt>
                  <dd className="font-medium">{result.metadata.summaryLength} characters</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Compression Ratio</dt>
                  <dd className="font-medium">
                    {((result.metadata.summaryLength / result.metadata.originalLength) * 100).toFixed(1)}%
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500">Model</dt>
                  <dd className="font-medium capitalize">{result.metadata.model}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Language</dt>
                  <dd className="font-medium uppercase">{result.metadata.language}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Processing Time</dt>
                  <dd className="font-medium">{result.metadata.processingTimeMs}ms</dd>
                </div>
              </dl>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 