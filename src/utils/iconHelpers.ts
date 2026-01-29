/**
 * @file Icon helper utilities
 */

/**
 * Compute sized icon name from unsized icon name
 * e.g., "SendRegular" + "24" => "Send24Regular"
 */
export function getSizedIconName(unsizedName: string, size: string | null): string {
  if (!size) return unsizedName;
  
  // Pattern: BaseName + Variant (Regular/Filled/Color)
  const match = unsizedName.match(/^(.+?)(Regular|Filled|Color)$/);
  if (match) {
    return `${match[1]}${size}${match[2]}`;
  }
  return unsizedName;
}
