/**
 * @file Tool result parsing utilities
 */
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { IconResult, StructuredContent } from "../types/icons";

/**
 * Parse structured content from MCP tool result
 */
export function parseToolResult(result: CallToolResult): StructuredContent | null {
  // Check for structured content first
  if (result.structuredContent) {
    const sc = result.structuredContent as Record<string, unknown>;
    if (sc.query !== undefined && sc.icons !== undefined && sc.totalCount !== undefined) {
      return sc as unknown as StructuredContent;
    }
  }
  
  // Fallback: Try to parse from text content
  const textContent = result.content?.find((c) => c.type === "text");
  if (!textContent || textContent.type !== "text") return null;
  
  // Parse the text output format
  const lines = textContent.text.split("\n");
  const icons: IconResult[] = [];
  
  let currentIcon: Partial<IconResult> = {};
  for (const line of lines) {
    const nameMatch = line.match(/^\d+\.\s+(\w+)/);
    if (nameMatch) {
      if (currentIcon.name) {
        icons.push(currentIcon as IconResult);
      }
      currentIcon = { name: nameMatch[1], category: "Icon" };
    }
    
    const jsxMatch = line.match(/JSX:\s*(.+)/);
    if (jsxMatch) {
      currentIcon.jsxElement = jsxMatch[1];
    }
    
    const importMatch = line.match(/Import:\s*(.+)/);
    if (importMatch) {
      currentIcon.importStatement = importMatch[1];
    }
  }
  
  if (currentIcon.name) {
    icons.push(currentIcon as IconResult);
  }
  
  const queryMatch = lines[0]?.match(/matching "(.+?)"/);
  
  return {
    query: queryMatch?.[1] || "",
    icons,
    totalCount: icons.length,
  };
}
