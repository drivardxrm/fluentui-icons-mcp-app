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
  /** Relevance score (higher = more relevant) */
  score?: number;
  /** Which search layer produced the score */
  scoreLayer?: 'substring' | 'fuzzy' | 'semantic' | 'visual' | 'wordnet';
}

/**
 * Structured content parsed from tool results
 */
export interface StructuredContent {
  query: string;
  icons: IconResult[];
  totalCount: number;
}
