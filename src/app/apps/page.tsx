"use client";

import { useState, useEffect } from "react";
import { FiBox, FiGrid, FiClock, FiX, FiCopy } from "react-icons/fi";
import { FaBroom, FaFileCsv, FaRegFileAlt } from "react-icons/fa";
import { Dialog } from '@headlessui/react';

const TOOLS = [
  {
    name: "Clean JSON",
    description: "Clean and format JSON data, remove nulls/empty values, and more.",
    icon: <FaBroom className="w-8 h-8 text-blue-500" />,
    key: "clean-json",
  },
  {
    name: "Check CSV",
    description: "Validate and analyze CSV files for structure and data quality.",
    icon: <FaFileCsv className="w-8 h-8 text-green-500" />,
    key: "check-csv",
  },
  {
    name: "Summarize",
    description: "Summarize long text into concise, readable content.",
    icon: <FaRegFileAlt className="w-8 h-8 text-purple-500" />,
    key: "summarize",
  },
];

export default function AppsPage() {
  const [search, setSearch] = useState("");
  const [modalTool, setModalTool] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [toolMeta, setToolMeta] = useState<any>(null);
  const [loadingMeta, setLoadingMeta] = useState(false);
  const filteredTools = TOOLS.filter((tool) =>
    tool.name.toLowerCase().includes(search.toLowerCase()) ||
    tool.description.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    if (modalTool) {
      setLoadingMeta(true);
      fetch(`/api/v1/meta/${modalTool}`)
        .then((res) => res.json())
        .then((data) => setToolMeta(data))
        .catch(() => setToolMeta(null))
        .finally(() => setLoadingMeta(false));
    } else {
      setToolMeta(null);
    }
  }, [modalTool]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  const renderModal = () => {
    if (!modalTool) return null;
    return (
      <Dialog open={!!modalTool} onClose={() => setModalTool(null)} className="fixed z-50 inset-0 overflow-y-auto">
        <div className="fixed inset-0 bg-black bg-opacity-30" aria-hidden="true" />
        <div className="flex items-center justify-center min-h-screen px-4">
          <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full mx-auto p-6 z-10">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
              onClick={() => setModalTool(null)}
              aria-label="Close"
            >
              <FiX className="w-5 h-5" />
            </button>
            <Dialog.Title className="text-lg font-semibold mb-2">{TOOLS.find(t => t.key === modalTool)?.name} API Details</Dialog.Title>
            {loadingMeta ? (
              <div className="text-gray-500">Loading...</div>
            ) : toolMeta ? (
              <div className="space-y-4">
                <pre className="bg-gray-100 p-4 rounded text-xs overflow-x-auto whitespace-pre">
{`openapi: ${toolMeta.openapi}
info:
  title: ${toolMeta.info.title}
  description: ${toolMeta.info.description}
  version: ${toolMeta.info.version}
servers:
  - url: ${toolMeta.servers[0].url}
    description: ${toolMeta.servers[0].description}
paths:
  ${Object.keys(toolMeta.paths)[0]}:
    post:
      operationId: ${toolMeta.paths[Object.keys(toolMeta.paths)[0]].post.operationId}
      summary: ${toolMeta.paths[Object.keys(toolMeta.paths)[0]].post.summary}
      description: ${toolMeta.paths[Object.keys(toolMeta.paths)[0]].post.description}
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/${toolMeta.info.title.replace(/\s+/g, '')}Request'
      responses:
        '200':
          description: ${toolMeta.paths[Object.keys(toolMeta.paths)[0]].post.responses['200'].description}
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/${toolMeta.info.title.replace(/\s+/g, '')}Response'
        '400':
          description: Bad request - invalid JSON or parameters
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '401':
          description: Unauthorized - invalid or missing API key
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '500':
          description: Internal server error
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
      description: API key for authentication
  schemas:
    ${toolMeta.info.title.replace(/\s+/g, '')}Request:
      type: object
      properties:
        json:
          type: string
          description: The JSON string to clean
          example: '{"name": "John", "age": null, "tags": [], "profile": {}}'
        options:
          type: object
          properties:
            removeNulls:
              type: boolean
              default: true
              description: Remove null values
            removeEmptyArrays:
              type: boolean
              default: true
              description: Remove empty arrays
            removeEmptyObjects:
              type: boolean
              default: true
              description: Remove empty objects
            removeEmptyStrings:
              type: boolean
              default: true
              description: Remove empty strings
            normalizeTypes:
              type: boolean
              default: true
              description: Normalize data types
            includeOriginal:
              type: boolean
              default: false
              description: Include original input in response
          additionalProperties: false
      required:
        - json
      additionalProperties: false
    ${toolMeta.info.title.replace(/\s+/g, '')}Response:
      type: object
      properties:
        success:
          type: boolean
          description: Whether the operation was successful
        data:
          oneOf:
            - type: object
            - type: "null"
          description: The cleaned JSON data
        metadata:
          type: object
          properties:
            fieldsProcessed:
              type: integer
              description: Number of fields processed
              minimum: 0
            fieldsRemoved:
              type: integer
              description: Number of fields removed
              minimum: 0
            fieldsNormalized:
              type: integer
              description: Number of fields normalized
              minimum: 0
            warnings:
              type: array
              items:
                type: string
              description: Any warnings during processing
          required:
            - fieldsProcessed
            - fieldsRemoved
            - fieldsNormalized
            - warnings
          additionalProperties: false
        error:
          oneOf:
            - type: object
            - type: "null"
          description: Error information if operation failed
        original:
          oneOf:
            - type: object
            - type: string
            - type: "null"
          description: Original input if includeOriginal is true
      required:
        - success
        - metadata
        - original
      additionalProperties: false
    ErrorResponse:
      type: object
      properties:
        success:
          type: boolean
          enum: [false]
        error:
          type: object
          properties:
            message:
              type: string
              description: Error message
            code:
              type: string
              description: Error code
          required:
            - message
        metadata:
          type: object
          properties:
            fieldsProcessed:
              type: integer
              default: 0
            fieldsRemoved:
              type: integer
              default: 0
            fieldsNormalized:
              type: integer
              default: 0
            warnings:
              type: array
              items:
                type: string
              default: []
        original:
          type: "null"
      required:
        - success
        - error
        - metadata
        - original`}
                </pre>
              </div>
            ) : (
              <div className="text-red-500">Failed to load tool meta.</div>
            )}
            {copied && <div className="text-green-600 text-xs mt-2">Copied!</div>}
          </div>
        </div>
      </Dialog>
    );
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r flex flex-col py-8 px-4">
        <nav className="flex flex-col gap-2">
          <a href="#" className="flex items-center gap-2 text-gray-700 font-medium px-2 py-2 rounded hover:bg-gray-100">
            <FiBox className="w-5 h-5" /> My Tools
          </a>
          <a href="#" className="flex items-center gap-2 text-blue-600 font-semibold px-2 py-2 rounded bg-blue-50">
            <FiGrid className="w-5 h-5" /> Apps
          </a>
          <a href="#" className="flex items-center gap-2 text-gray-700 font-medium px-2 py-2 rounded hover:bg-gray-100">
            <FiClock className="w-5 h-5" /> History
          </a>
        </nav>
      </aside>
      {/* Main content */}
      <main className="flex-1 p-8">
        <div className="flex items-center mb-6">
          <input
            type="text"
            placeholder="Search apps..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full max-w-xs border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {filteredTools.map(tool => (
            <div key={tool.key} className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
              {tool.icon}
              <h3 className="mt-4 text-lg font-semibold">{tool.name}</h3>
              <p className="text-gray-600 text-sm mt-2 mb-4 text-center">{tool.description}</p>
              <button
                className="mt-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium"
                onClick={() => setModalTool(tool.key)}
              >
                Connect
              </button>
            </div>
          ))}
        </div>
        {renderModal()}
      </main>
    </div>
  );
} 