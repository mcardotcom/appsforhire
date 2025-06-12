import { FaBroom, FaFileCsv, FaRegFileAlt } from "react-icons/fa";
import { IconType } from "react-icons";
import CleanJsonTool from "../components/tools/CleanJsonTool";
import CheckCsvTool from "../components/tools/CheckCsvTool";
import SummarizeTool from "../components/tools/SummarizeTool";

export type ToolName = "clean-json" | "check-csv" | "summarize";

export interface ToolConfig {
  name: string;
  slug: ToolName;
  description: string;
  version: string;
  endpoint: string;
  component: React.ComponentType<any>;
  icon: IconType;
  tags: string[];
  examples: {
    input: string;
    output: string;
  }[];
}

export const tools: Record<ToolName, ToolConfig> = {
  "clean-json": {
    name: "Clean JSON",
    slug: "clean-json",
    description: "Clean and format JSON data, remove nulls/empty values, and more.",
    version: "1.0.0",
    endpoint: "/api/v1/clean-json",
    component: CleanJsonTool,
    icon: FaBroom,
    tags: ["formatting", "validation", "json"],
    examples: [
      {
        input: '{"name": "John", "age": null, "tags": [], "profile": {}}',
        output: '{"name": "John"}',
      },
    ],
  },
  "check-csv": {
    name: "Check CSV",
    slug: "check-csv",
    description: "Validate and analyze CSV files for structure and data quality.",
    version: "1.0.0",
    endpoint: "/api/v1/check-csv",
    component: CheckCsvTool,
    icon: FaFileCsv,
    tags: ["validation", "csv", "data-quality"],
    examples: [
      {
        input: "name,age,email\nJohn,30,john@example.com\nJane,25,jane@example.com",
        output: '{"valid": true, "stats": {"rows": 2, "columns": 3}}',
      },
    ],
  },
  summarize: {
    name: "Summarize",
    slug: "summarize",
    description: "Summarize long text into concise, readable content.",
    version: "1.0.0",
    endpoint: "/api/v1/summarize",
    component: SummarizeTool,
    icon: FaRegFileAlt,
    tags: ["text", "summarization", "ai"],
    examples: [
      {
        input: "This is a long text that needs to be summarized...",
        output: "This is a concise summary of the text...",
      },
    ],
  },
};

export const getTool = (slug: ToolName) => tools[slug];

export const getAllTools = () => Object.values(tools);

export const getToolsByTag = (tag: string) =>
  getAllTools().filter((tool) => tool.tags.includes(tag));
