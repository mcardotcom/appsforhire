"use client";

import { useState } from "react";
import { FiCopy, FiUpload, FiTrash2, FiInfo } from "react-icons/fi";

interface SummarizeToolProps {
  onResult?: (result: any) => void;
}

interface SummaryMetadata {
  originalLength: number;
  summaryLength: number;
  model: string;
  language: string;
  confidence: number;
  processingTimeMs: number;
}

export default function SummarizeTool({ onResult }: SummarizeToolProps) {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<SummaryMetadata | null>(null);
  const [options, setOptions] = useState({
    maxLength: 200,
    language: "en" as "en" | "es" | "fr" | "de" | "it" | "pt",
    model: "basic" as "basic" | "advanced" | "gpt-3.5" | "gpt-4"
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    setError(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setInput(event.target?.result as string);
      };
      reader.readAsText(file);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);
      setMetadata(null);

      const response = await fetch("/api/v1/tools/summarize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": localStorage.getItem("apiKey") || ""
        },
        body: JSON.stringify({
          text: input,
          ...options
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to summarize text");
      }

      setOutput(data.summary);
      setMetadata(data.metadata);
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

  const handleClear = () => {
    setInput("");
    setOutput("");
    setError(null);
    setMetadata(null);
  };

  return (
    <div className="space-y-6">
      {/* Options */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Max Length</label>
          <input
            type="number"
            min={10}
            max={1000}
            value={options.maxLength}
            onChange={(e) =>
              setOptions((prev) => ({
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
            value={options.language}
            onChange={(e) =>
              setOptions((prev) => ({
                ...prev,
                language: e.target.value as typeof options.language,
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
            value={options.model}
            onChange={(e) =>
              setOptions((prev) => ({
                ...prev,
                model: e.target.value as typeof options.model,
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

      {/* Input */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="block text-sm font-medium text-gray-700">Input Text</label>
          <div className="flex space-x-2">
            <label className="cursor-pointer inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
              <FiUpload className="w-4 h-4 mr-2" />
              Upload
              <input
                type="file"
                accept=".txt,.md"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
            <button
              onClick={handleClear}
              className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <FiTrash2 className="w-4 h-4 mr-2" />
              Clear
            </button>
          </div>
        </div>
        <textarea
          value={input}
          onChange={handleInputChange}
          className="w-full h-48 font-mono text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          placeholder="Paste your text here..."
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={loading || !input}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {loading ? "Summarizing..." : "Summarize"}
        </button>
      </div>

      {/* Error */}
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

      {/* Output */}
      {output && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <label className="block text-sm font-medium text-gray-700">Summary</label>
            <button
              onClick={() => handleCopy(output)}
              className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <FiCopy className="w-4 h-4 mr-2" />
              Copy
            </button>
          </div>
          <div className="w-full min-h-[12rem] font-mono text-sm bg-gray-50 p-4 rounded-md whitespace-pre-wrap">
            {output}
          </div>

          {/* Metadata */}
          {metadata && (
            <div className="bg-gray-50 p-4 rounded-md">
              <div className="flex items-center space-x-2 mb-2">
                <FiInfo className="w-4 h-4 text-gray-500" />
                <h3 className="text-sm font-medium text-gray-700">Summary Details</h3>
              </div>
              <dl className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <dt className="text-gray-500">Original Length</dt>
                  <dd className="font-medium">{metadata.originalLength} characters</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Summary Length</dt>
                  <dd className="font-medium">{metadata.summaryLength} characters</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Compression Ratio</dt>
                  <dd className="font-medium">
                    {((metadata.summaryLength / metadata.originalLength) * 100).toFixed(1)}%
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500">Model</dt>
                  <dd className="font-medium capitalize">{metadata.model}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Language</dt>
                  <dd className="font-medium uppercase">{metadata.language}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Processing Time</dt>
                  <dd className="font-medium">{metadata.processingTimeMs}ms</dd>
                </div>
              </dl>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 