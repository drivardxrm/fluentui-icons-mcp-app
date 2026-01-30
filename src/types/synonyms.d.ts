/**
 * Type declarations for the 'synonyms' package
 */
declare module "synonyms" {
  /**
   * Look up synonyms for a word.
   * @param word - The word to look up
   * @param pos - Optional part of speech filter ('n', 'v', 'a', etc.)
   * @returns Object with synonyms grouped by part of speech, or undefined if not found
   */
  function synonyms(
    word: string,
    pos?: "n" | "v" | "a" | "s" | "r"
  ): Record<string, string[]> | undefined;
  
  export = synonyms;
}
