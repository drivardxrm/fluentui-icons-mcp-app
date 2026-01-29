/**
 * @file Icon type definitions
 */

/**
 * Represents a single icon result from the search.
 * Contains all information needed to use the icon in code.
 */
export interface IconResult {
  /** Full icon component name */
  name: string;
  /** Ready-to-use JSX element string */
  jsxElement: string;
  /** Complete import statement for the icon */
  importStatement: string;
  /** Icon category (variant type) */
  category: string;
  /** List of available sizes for sized variants (e.g., ["16", "20", "24"]) */
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
