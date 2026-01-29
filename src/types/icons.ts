/**
 * @file Icon type definitions
 */

/**
 * Represents a single icon result from the search
 */
export interface IconResult {
  name: string;
  jsxElement: string;
  importStatement: string;
  category: string;
  availableSizes?: string[];
}

/**
 * Structured content parsed from tool results
 */
export interface StructuredContent {
  query: string;
  icons: IconResult[];
  totalCount: number;
}
