"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { FiArrowLeft, FiCopy } from "react-icons/fi";
import Link from "next/link";

export default function ToolPage() {
  const params = useParams();
  const toolKey = params.tool as string;
  const [openApiYaml, setOpenApiYaml] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function fetchOpenApi() {
      setLoading(true);
      setError(null);
      setCopied(false);
      try {
        console.log('Fetching OpenAPI schema for tool:', toolKey);
        const res = await fetch(`/api/v1/meta/${toolKey}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache'
          }
        });
        if (!res.ok) throw new Error("Failed to fetch OpenAPI schema");
        const data = await res.json();
        console.log('Received OpenAPI schema:', data);
        // Convert JSON OpenAPI to YAML
        const yaml = jsonToYaml(data);
        setOpenApiYaml(yaml);
      } catch (err: any) {
        console.error('Error fetching OpenAPI schema:', err);
        setError(err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    fetchOpenApi();
  }, [toolKey]);

  function handleCopy() {
    if (!openApiYaml) return;
    navigator.clipboard.writeText(openApiYaml);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  // Simple JSON to YAML converter for OpenAPI (for display only)
  function jsonToYaml(obj: any, indent = 0): string {
    if (typeof obj !== "object" || obj === null) return JSON.stringify(obj);
    if (Array.isArray(obj)) {
      return obj
        .map((item) => `${"  ".repeat(indent)}- ${jsonToYaml(item, indent + 1).trim()}`)
        .join("\n");
    }
    return Object.entries(obj)
      .map(([key, value]) => {
        // Quote numeric keys and string values
        const formattedKey = !isNaN(Number(key)) ? `"${key}"` : key;
        if (typeof value === "object" && value !== null) {
          if (Array.isArray(value) && value.length === 0) {
            return `${"  ".repeat(indent)}${formattedKey}: []`;
          }
          return `${"  ".repeat(indent)}${formattedKey}:\n${jsonToYaml(value, indent + 1)}`;
        } else {
          const formattedValue = typeof value === "string" ? `"${value}"` : value;
          return `${"  ".repeat(indent)}${formattedKey}: ${formattedValue}`;
        }
      })
      .join("\n");
  }

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <Link href="/apps" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-6">
        <FiArrowLeft className="mr-2" /> Back to Apps
      </Link>
      <h1 className="text-2xl font-bold mb-4 capitalize">{toolKey} OpenAPI Schema</h1>
      {loading ? (
        <div className="text-gray-500">Loading OpenAPI schema...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : (
        <div className="relative">
          <button
            onClick={handleCopy}
            className="absolute right-2 top-2 bg-gray-100 hover:bg-gray-200 border rounded px-2 py-1 text-xs flex items-center"
            title="Copy YAML"
          >
            <FiCopy className="mr-1" />
            {copied ? "Copied!" : "Copy"}
          </button>
          <pre className="bg-gray-900 text-gray-100 rounded p-4 overflow-x-auto text-sm mt-2" style={{ minHeight: 300 }}>
            {openApiYaml}
          </pre>
        </div>
      )}
    </div>
  );
} 