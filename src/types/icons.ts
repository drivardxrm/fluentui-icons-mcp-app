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
  /** Combined relevance score (0-100, higher = more relevant) */
  score?: number;
  /** Primary search layer that contributed most to the score */
  scoreLayer?: 'exact' | 'substring' | 'fuzzy' | 'semantic' | 'visual' | 'wordnet';
  /** Breakdown of score contributions from each layer */
  scoreBreakdown?: {
    substring: number;  // 0-100 (exact: 100, partial: 15)
    fuzzy: number;      // 0-15
    semantic: number;   // 0-25
    visual: number;     // 0-25
    synonym: number;    // 0-20
  };
}

/**
 * Structured content parsed from tool results
 */
export interface StructuredContent {
  query: string;
  icons: IconResult[];
  totalCount: number;
}
