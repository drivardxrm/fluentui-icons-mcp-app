/**
 * MCP Server for Fluent UI Icons
 * 
 * This module creates and configures the MCP (Model Context Protocol) server
 * that exposes the icon search tool and UI resource.
 * 
 * The server provides:
 * - search-fluentui-icons: Tool for searching Fluent UI React icons
 * - ui://fluentui-icons/mcp-app.html: Resource serving the bundled visual UI
 * 
 * The actual search logic is delegated to the iconSearchService module.
 */

import { registerAppResource, registerAppTool, RESOURCE_MIME_TYPE } from "@modelcontextprotocol/ext-apps/server";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult, ReadResourceResult } from "@modelcontextprotocol/sdk/types.js";
import fs from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { searchIcons } from "./src/services/iconSearchService.js";

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Determine the dist directory path.
 * Works both from source (server.ts) and compiled (dist/server.js).
 * 
 * When running from source with tsx, import.meta.filename ends with ".ts"
 * When running compiled, it ends with ".js"
 */
const DIST_DIR = import.meta.filename.endsWith(".ts")
  ? path.join(import.meta.dirname, "dist")
  : import.meta.dirname;

// ============================================================================
// SERVER FACTORY
// ============================================================================

/**
 * Creates a new MCP server instance with tools and resources registered.
 * 
 * This function is the main entry point for server creation. It:
 * 1. Creates a new McpServer instance
 * 2. Registers the icon search tool
 * 3. Registers the UI resource
 * 
 * @returns Configured McpServer instance ready to handle connections
 */
export function createServer(): McpServer {
  const server = new McpServer({
    name: "Fluent UI Icons MCP App",
    version: "1.0.0",
  });

  // Resource URI for the icon explorer UI
  const resourceUri = "ui://fluentui-icons/mcp-app.html";

  // -------------------------------------------------------------------------
  // TOOL: search-fluentui-icons
  // -------------------------------------------------------------------------
  /**
   * Registers the icon search tool with the MCP server.
   * 
   * This tool accepts a search query and returns matching icons with their
   * JSX code, import statements, and available sizes.
   * 
   * The tool supports:
   * - Natural language queries ("save", "add button", "arrow left")
   * - Typo-tolerant fuzzy matching ("calender" → "Calendar")
   * - Semantic intent matching ("favorite" → Star, Heart, Bookmark)
   * - Adjustable fuzzy threshold for strictness control
   */
  registerAppTool(
    server,
    "search-fluentui-icons",
    {
      title: "Search Fluent UI Icons",
      description: 
        "Search for Fluent UI React icons by name or description. " +
        "Returns matching icons with their JSX code and import statements. " +
        "Use natural language like 'add', 'arrow', 'calendar', 'save', 'delete', etc.",
      inputSchema: {
        query: z.string().max(500).describe(
          "Search query - describe the icon you're looking for (e.g., 'add', 'calendar', 'arrow left', 'save document')"
        ),
        maxResults: z.number().optional().default(20).describe(
          "Maximum number of results to return (default: 20)"
        ),
        threshold: z.number().optional().default(0.1).describe(
          "Fuzzy matching threshold (0 = exact match, 1 = match anything, default: 0.1)"
        ),
      },
      _meta: { ui: { resourceUri } },
    },
    async (args): Promise<CallToolResult> => {
      const { query, maxResults = 20, threshold = 0.1 } = args;
      
      try {
        // Delegate to the search service
        const results = await searchIcons(query, maxResults, threshold);
        
        // Handle empty results
        if (results.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: `No icons found matching "${query}". Try a different search term.`,
              },
            ],
          };
        }
        
        // Format text output for non-UI hosts (CLI, terminal, etc.)
        // This provides a fallback when the visual UI isn't available
        const textOutput = results
          .map((icon, i) => 
            `${i + 1}. ${icon.name}\n   JSX: ${icon.jsxElement}\n   Import: ${icon.importStatement}`
          )
          .join("\n\n");
        
        return {
          content: [
            {
              type: "text",
              text: `Found ${results.length} icons matching "${query}":\n\n${textOutput}`,
            },
          ],
          // Pass structured data for the UI to render
          // The UI uses this to display the icon grid with interactive features
          structuredContent: {
            query,
            icons: results,
            totalCount: results.length,
          },
        };
      } catch (error) {
        // Return error in MCP-compatible format
        return {
          content: [
            {
              type: "text",
              text: `Error searching icons: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // -------------------------------------------------------------------------
  // RESOURCE: Icon Explorer UI
  // -------------------------------------------------------------------------
  /**
   * Registers the bundled HTML UI as an MCP resource.
   * 
   * The UI is a single HTML file (generated by Vite with vite-plugin-singlefile)
   * that contains all React code, Fluent UI components, and styles inline.
   * 
   * This allows MCP hosts (like VS Code) to display a visual icon explorer
   * where users can:
   * - Browse search results in a grid
   * - Preview icons at different sizes
   * - Copy JSX/import statements
   * - Add imports directly to their code
   */
  registerAppResource(
    server,
    resourceUri,
    resourceUri,
    { mimeType: RESOURCE_MIME_TYPE },
    async (): Promise<ReadResourceResult> => {
      const html = await fs.readFile(path.join(DIST_DIR, "mcp-app.html"), "utf-8");
      return {
        contents: [{ uri: resourceUri, mimeType: RESOURCE_MIME_TYPE, text: html }],
      };
    }
  );

  return server;
}
