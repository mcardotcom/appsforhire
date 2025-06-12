"use client";

import { useState } from "react";
import { FiCopy, FiUpload, FiTrash2 } from "react-icons/fi";

interface CleanJsonToolProps {
  onResult?: (result: any) => void;
}

export default function CleanJsonTool({ onResult }: CleanJsonToolProps) {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [options, setOptions] = useState({
    removeNulls: true,
    removeEmptyArrays: true,
    removeEmptyObjects: true,
    removeEmptyStrings: true,
    normalizeTypes: true,
    includeOriginal: false,
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

      const response = await fetch("/api/v1/tools/clean-json", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          json: input,
          options,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to clean JSON");
      }

      setOutput(JSON.stringify(data.data, null, 2));
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
  };

  return (
    <div className="space-y-6">
      {/* Options */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {Object.entries(options).map(([key, value]) => (
          <label key={key} className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={value}
              onChange={(e) =>
                setOptions((prev) => ({ ...prev, [key]: e.target.checked }))
              }
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">
              {key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
            </span>
          </label>
        ))}
      </div>

      {/* Input */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="block text-sm font-medium text-gray-700">Input JSON</label>
          <div className="flex space-x-2">
            <label className="cursor-pointer inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
              <FiUpload className="w-4 h-4 mr-2" />
              Upload
              <input
                type="file"
                accept=".json"
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
          placeholder="Paste your JSON here..."
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={loading || !input}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {loading ? "Cleaning..." : "Clean JSON"}
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
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="block text-sm font-medium text-gray-700">Cleaned JSON</label>
            <button
              onClick={() => handleCopy(output)}
              className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <FiCopy className="w-4 h-4 mr-2" />
              Copy
            </button>
          </div>
          <pre className="w-full h-48 font-mono text-sm bg-gray-50 p-4 rounded-md overflow-auto">
            {output}
          </pre>
        </div>
      )}
    </div>
  );
} 