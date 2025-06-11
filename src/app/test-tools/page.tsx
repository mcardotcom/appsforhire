'use client';

import { useState, useEffect } from 'react';
import { trpc } from '@/utils/trpc';

export default function TestTools() {
  const [apiKey, setApiKey] = useState('');
  const [jsonInput, setJsonInput] = useState('');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [textInput, setTextInput] = useState('');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

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
    onSuccess: (data) => {
      setResult(data);
      setError(null);
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const checkCsvMutation = trpc.tools.checkCsv.useMutation({
    onSuccess: (data) => {
      setResult(data);
      setError(null);
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const summarizeMutation = trpc.tools.summarize.useMutation({
    onSuccess: (data) => {
      setResult(data);
      setError(null);
    },
    onError: (err) => {
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
    summarizeMutation.mutate({ text: textInput });
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
        </div>
      )}
    </div>
  );
} 