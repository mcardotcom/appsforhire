"use client";

import { useState } from "react";
import { FiBox, FiGrid, FiClock } from "react-icons/fi";
import Link from "next/link";
import { getAllTools, getToolsByTag } from "../config/tools";

export default function AppsPage() {
  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const tools = selectedTag ? getToolsByTag(selectedTag) : getAllTools();
  const filteredTools = tools.filter(
    (tool) =>
      tool.name.toLowerCase().includes(search.toLowerCase()) ||
      tool.description.toLowerCase().includes(search.toLowerCase())
  );

  const allTags = Array.from(
    new Set(getAllTools().flatMap((tool) => tool.tags))
  ).sort();

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
        <div className="space-y-6">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search apps..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2">
              <button
                onClick={() => setSelectedTag(null)}
                className={`px-3 py-1 text-sm font-medium rounded-full ${
                  !selectedTag
                    ? "bg-blue-100 text-blue-800"
                    : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                }`}
              >
                All
              </button>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`px-3 py-1 text-sm font-medium rounded-full ${
                    selectedTag === tag
                      ? "bg-blue-100 text-blue-800"
                      : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Tool Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {filteredTools.map((tool) => (
              <Link
                key={tool.slug}
                href={`/apps/${tool.slug}`}
                className="bg-white rounded-lg shadow p-6 flex flex-col items-center hover:shadow-md transition-shadow"
              >
                <tool.icon className="w-8 h-8 text-blue-500" />
                <h3 className="mt-4 text-lg font-semibold">{tool.name}</h3>
                <p className="text-gray-600 text-sm mt-2 mb-4 text-center">
                  {tool.description}
                </p>
                <div className="flex flex-wrap gap-2 justify-center mb-4">
                  {tool.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="mt-auto text-xs text-gray-500">
                  Version {tool.version}
                </div>
                <button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium">
                  View Details
                </button>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
} 