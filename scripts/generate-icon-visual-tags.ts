/**
 * Generate Visual Tags for Fluent UI Icons
 * 
 * This script analyzes icon names and generates visual/conceptual tags
 * that describe what the icon looks like or represents.
 * 
 * Run with: npx tsx scripts/generate-icon-visual-tags.ts
 * 
 * The output is a compact format using a tag dictionary to minimize file size:
 * - TAG_DICTIONARY: Array of all possible tags
 * - ICON_VISUAL_TAGS: Map of icon base name → array of tag indices
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// VISUAL TAG DEFINITIONS
// ============================================================================

/**
 * Master dictionary of visual/conceptual tags.
 * These describe visual characteristics and conceptual meanings.
 * Order matters - index is used for compact storage.
 */
const TAG_DICTIONARY: string[] = [
  // Shapes (0-9)
  "arrow", "circle", "square", "triangle", "line",
  "curve", "rectangle", "diamond", "star", "cross",
  
  // Objects (10-29)
  "person", "people", "document", "folder", "calendar",
  "clock", "phone", "mail", "camera", "screen",
  "keyboard", "mouse", "speaker", "microphone", "headphones",
  "glasses", "pen", "pencil", "brush", "scissors",
  
  // Actions (30-49)
  "pointing", "moving", "rotating", "expanding", "shrinking",
  "opening", "closing", "connecting", "disconnecting", "stacking",
  "sorting", "filtering", "searching", "editing", "deleting",
  "adding", "removing", "copying", "pasting", "cutting",
  
  // Concepts (50-69)
  "communication", "navigation", "security", "warning", "error",
  "success", "info", "question", "notification", "settings",
  "data", "storage", "cloud", "network", "power",
  "money", "shopping", "health", "food", "drink",
  
  // Visual style (70-79)
  "filled", "outline", "badge", "overlay", "strikethrough",
  "dashed", "dotted", "gradient", "3d", "flat",
  
  // Direction (80-89)
  "up", "down", "left", "right", "horizontal",
  "vertical", "diagonal", "inward", "outward", "bidirectional",
  
  // Containers (90-99)
  "box", "panel", "window", "tab", "card",
  "list", "grid", "table", "tree", "chart",
  
  // Nature (100-109)
  "sun", "moon", "weather", "plant", "animal",
  "water", "fire", "earth", "air", "leaf",
  
  // Tech (110-119)
  "code", "database", "server", "api", "terminal",
  "bug", "git", "robot", "ai", "chip",
  
  // Media (120-129)
  "image", "video", "audio", "music", "play",
  "pause", "stop", "record", "volume", "mute",
];

// ============================================================================
// PATTERN MATCHING RULES
// ============================================================================

/**
 * Rules for extracting visual tags from icon names.
 * Each rule maps a name pattern (regex or substring) to tag indices.
 */
interface TagRule {
  pattern: RegExp | string;
  tags: number[]; // Indices into TAG_DICTIONARY
}

const TAG_RULES: TagRule[] = [
  // Arrows and directions
  { pattern: /Arrow/i, tags: [0, 30] }, // arrow, pointing
  { pattern: /ArrowUp|ArrowTop|ChevronUp/i, tags: [0, 80] }, // arrow, up
  { pattern: /ArrowDown|ArrowBottom|ChevronDown/i, tags: [0, 81] }, // arrow, down
  { pattern: /ArrowLeft|ChevronLeft/i, tags: [0, 82] }, // arrow, left
  { pattern: /ArrowRight|ChevronRight/i, tags: [0, 83] }, // arrow, right
  { pattern: /ArrowSync|ArrowRepeat|Sync/i, tags: [0, 32, 89] }, // arrow, rotating, bidirectional
  { pattern: /ArrowExpand|Expand|Maximize/i, tags: [0, 33] }, // arrow, expanding
  { pattern: /ArrowMinimize|Minimize|Shrink/i, tags: [0, 34] }, // arrow, shrinking
  
  // Shapes
  { pattern: /Circle/i, tags: [1] },
  { pattern: /Square/i, tags: [2] },
  { pattern: /Triangle/i, tags: [3] },
  { pattern: /Rectangle/i, tags: [6] },
  { pattern: /Diamond/i, tags: [7] },
  { pattern: /Star/i, tags: [8] },
  { pattern: /Cross|Plus/i, tags: [9, 45] }, // cross, adding
  
  // People
  { pattern: /Person(?!al)/i, tags: [10] },
  { pattern: /People|Group|Team|Organization/i, tags: [11] },
  { pattern: /Guest|User|Account/i, tags: [10] },
  
  // Documents
  { pattern: /Document|Doc|File|Page/i, tags: [12] },
  { pattern: /Folder/i, tags: [13] },
  { pattern: /Note|Notebook|Notepad/i, tags: [12, 43] }, // document, editing
  
  // Time
  { pattern: /Calendar|Date|Event/i, tags: [14] },
  { pattern: /Clock|Time|Timer|Alarm/i, tags: [15] },
  { pattern: /History/i, tags: [15, 0] }, // clock, arrow
  
  // Communication
  { pattern: /Phone|Call|Dial/i, tags: [16, 50] }, // phone, communication
  { pattern: /Mail|Email|Envelope/i, tags: [17, 50] }, // mail, communication
  { pattern: /Chat|Message|Comment/i, tags: [50] }, // communication
  { pattern: /Send/i, tags: [0, 50] }, // arrow, communication
  
  // Media devices
  { pattern: /Camera/i, tags: [18] },
  { pattern: /Screen|Display|Monitor|Desktop/i, tags: [19] },
  { pattern: /Keyboard/i, tags: [20] },
  { pattern: /Mouse/i, tags: [21] },
  { pattern: /Speaker/i, tags: [22, 128] }, // speaker, volume
  { pattern: /Microphone|Mic/i, tags: [23] },
  { pattern: /Headphone|Headset/i, tags: [24] },
  
  // Tools
  { pattern: /Glasses|Eyeglasses/i, tags: [25] },
  { pattern: /Pen(?!cil)/i, tags: [26] },
  { pattern: /Pencil/i, tags: [27] },
  { pattern: /Brush|Paint/i, tags: [28] },
  { pattern: /Scissors|Cut(?!e)/i, tags: [29, 49] }, // scissors, cutting
  
  // Actions
  { pattern: /Add(?!ress)/i, tags: [45] }, // adding
  { pattern: /Remove|Delete|Trash/i, tags: [44, 46] }, // deleting, removing
  { pattern: /Edit|Modify/i, tags: [43] },
  { pattern: /Copy|Duplicate/i, tags: [47] },
  { pattern: /Paste/i, tags: [48] },
  { pattern: /Search|Find|Magnify/i, tags: [42] },
  { pattern: /Filter/i, tags: [41] },
  { pattern: /Sort/i, tags: [40] },
  { pattern: /Connect|Link|Attach/i, tags: [37] },
  { pattern: /Disconnect|Unlink|Detach/i, tags: [38] },
  
  // Status
  { pattern: /Warning|Caution/i, tags: [53, 3] }, // warning, triangle
  { pattern: /Error|Failed|Problem/i, tags: [54] },
  { pattern: /Success|Check|Complete/i, tags: [55] },
  { pattern: /Info|Information/i, tags: [56] },
  { pattern: /Question|Help/i, tags: [57] },
  { pattern: /Alert|Notification|Bell/i, tags: [58] },
  
  // Settings
  { pattern: /Settings|Gear|Cog|Config/i, tags: [59] },
  { pattern: /Option|Preference/i, tags: [59] },
  
  // Security
  { pattern: /Lock|Secure|Locked/i, tags: [52] },
  { pattern: /Unlock|Unsecure/i, tags: [52, 35] }, // security, opening
  { pattern: /Key/i, tags: [52] },
  { pattern: /Shield|Guard|Protect/i, tags: [52] },
  { pattern: /Eye(?!glasses)/i, tags: [52] }, // visibility/security
  
  // Data & Storage
  { pattern: /Data/i, tags: [60] },
  { pattern: /Storage|Drive|Disk/i, tags: [61] },
  { pattern: /Cloud/i, tags: [62] },
  { pattern: /Server/i, tags: [112] },
  { pattern: /Database/i, tags: [111] },
  { pattern: /Network|Internet|Globe|World/i, tags: [63] },
  
  // Power
  { pattern: /Power|Battery/i, tags: [64] },
  { pattern: /Plugin|Plug/i, tags: [64, 37] }, // power, connecting
  
  // Commerce
  { pattern: /Money|Dollar|Currency|Payment/i, tags: [65] },
  { pattern: /Cart|Shopping|Store|Buy/i, tags: [66] },
  { pattern: /Receipt|Invoice/i, tags: [12, 65] }, // document, money
  
  // Health & Food
  { pattern: /Heart|Health|Medical/i, tags: [67] },
  { pattern: /Food|Eat|Restaurant|Bowl|Pizza|Apple|Egg/i, tags: [68] },
  { pattern: /(?:^|(?<=[A-Z]))(?:Drink|Coffee|Cup|Beer|Wine)(?=[A-Z]|$)/, tags: [69] }, // PascalCase word boundary to avoid matching "cUp" in "Uppercase"
  { pattern: /Beaker/i, tags: [68, 1] }, // food (lab/science), circle
  
  // Nature
  { pattern: /Sun|Bright/i, tags: [100] },
  { pattern: /Moon|Night|Dark/i, tags: [101] },
  { pattern: /Weather|Cloud(?!y)|Rain|Snow/i, tags: [102] },
  { pattern: /Plant|Tree|Garden/i, tags: [103] },
  { pattern: /Animal|Dog|Cat|Bird|Bug(?!Report)/i, tags: [104] },
  { pattern: /Water|Drop|Liquid/i, tags: [105] },
  { pattern: /Fire|Flame|Hot/i, tags: [106] },
  { pattern: /Leaf/i, tags: [109] },
  
  // Tech
  { pattern: /Code|Braces|Script/i, tags: [110] },
  { pattern: /Terminal|Console|Command/i, tags: [114] },
  { pattern: /Bug|Debug/i, tags: [115] },
  { pattern: /Git|Branch|Merge|Commit/i, tags: [116] },
  { pattern: /Bot|Robot/i, tags: [117] },
  { pattern: /Brain|AI|Intelligence|Smart/i, tags: [118] },
  { pattern: /Chip|Processor|CPU/i, tags: [119] },
  
  // Media
  { pattern: /Image|Photo|Picture/i, tags: [120] },
  { pattern: /Video|Movie|Film/i, tags: [121] },
  { pattern: /Audio|Sound/i, tags: [122] },
  { pattern: /Music|Song/i, tags: [123] },
  { pattern: /Play(?!ground)/i, tags: [124] },
  { pattern: /Pause/i, tags: [125] },
  { pattern: /Stop/i, tags: [126] },
  { pattern: /Record/i, tags: [127] },
  { pattern: /Volume/i, tags: [128] },
  { pattern: /Mute|Silent/i, tags: [129] },
  
  // Containers
  { pattern: /Box/i, tags: [90] },
  { pattern: /Panel/i, tags: [91] },
  { pattern: /Window/i, tags: [92] },
  { pattern: /(?:^|(?<=[A-Z]))Tab(?=[A-Z]|$)/, tags: [93] }, // PascalCase word boundary to avoid matching Tab inside Table
  { pattern: /Card/i, tags: [94] },
  { pattern: /List/i, tags: [95] },
  { pattern: /Grid|Gallery/i, tags: [96] },
  { pattern: /Table/i, tags: [97] },
  { pattern: /Tree/i, tags: [98, 103] }, // tree structure, plant
  { pattern: /Chart|Graph|Analytics/i, tags: [99, 60] }, // chart, data
  
  // Style modifiers (check full name for these)
  { pattern: /Filled$/i, tags: [70] },
  { pattern: /Off$|Dismiss|Prohibited/i, tags: [74] }, // strikethrough
  { pattern: /Badge|Count/i, tags: [72] },
];

// ============================================================================
// TAG GENERATION
// ============================================================================

/**
 * Extract tags for a single icon name.
 */
function getTagsForIcon(iconName: string): number[] {
  const tags = new Set<number>();
  
  for (const rule of TAG_RULES) {
    const matches = typeof rule.pattern === "string"
      ? iconName.toLowerCase().includes(rule.pattern.toLowerCase())
      : rule.pattern.test(iconName);
    
    if (matches) {
      for (const tag of rule.tags) {
        tags.add(tag);
      }
    }
  }
  
  return [...tags].sort((a, b) => a - b);
}

/**
 * Extract base name from icon name (remove Regular/Filled/Color suffix).
 */
function getBaseName(iconName: string): string {
  return iconName.replace(/(Regular|Filled|Color)$/, "");
}

// ============================================================================
// MAIN GENERATION
// ============================================================================

async function generateVisualTags() {
  console.log("🏷️  Generating visual tags for Fluent UI icons...\n");
  
  // Read icon names
  const iconNamesPath = path.join(__dirname, "..", "src", "icon-names.ts");
  const iconNamesContent = fs.readFileSync(iconNamesPath, "utf-8");
  
  // Extract icon names from the file
  const iconNamesMatch = iconNamesContent.match(/export const FLUENT_ICON_NAMES: readonly string\[\] = \[([\s\S]*?)\];/);
  if (!iconNamesMatch) {
    throw new Error("Could not parse icon-names.ts");
  }
  
  const iconNames = iconNamesMatch[1]
    .split(",")
    .map(s => s.trim().replace(/['"]/g, ""))
    .filter(s => s.length > 0);
  
  console.log(`Found ${iconNames.length} icons`);
  
  // Generate tags for each unique base name
  const baseNameTags = new Map<string, number[]>();
  const processedBaseNames = new Set<string>();
  
  for (const iconName of iconNames) {
    const baseName = getBaseName(iconName);
    
    if (processedBaseNames.has(baseName)) continue;
    processedBaseNames.add(baseName);
    
    const tags = getTagsForIcon(iconName);
    if (tags.length > 0) {
      baseNameTags.set(baseName, tags);
    }
  }
  
  console.log(`Generated tags for ${baseNameTags.size} unique base names`);
  
  // Calculate statistics
  let totalTags = 0;
  let maxTags = 0;
  for (const tags of baseNameTags.values()) {
    totalTags += tags.length;
    maxTags = Math.max(maxTags, tags.length);
  }
  console.log(`Average tags per icon: ${(totalTags / baseNameTags.size).toFixed(1)}`);
  console.log(`Max tags on single icon: ${maxTags}`);
  
  // Generate output file
  const output = `/**
 * Visual Tags for Fluent UI Icons
 * 
 * Auto-generated by: npx tsx scripts/generate-icon-visual-tags.ts
 * Generated: ${new Date().toISOString()}
 * 
 * This file uses a compact format to minimize size:
 * - TAG_DICTIONARY: Array of all possible tag strings
 * - ICON_VISUAL_TAGS: Map of base icon name → array of tag indices
 * 
 * To get tags for an icon:
 *   const tagIndices = ICON_VISUAL_TAGS["AddCircle"] || [];
 *   const tagStrings = tagIndices.map(i => TAG_DICTIONARY[i]);
 */

/**
 * Dictionary of visual/conceptual tags.
 * Tags describe what icons look like or represent.
 * Index is used for compact storage in ICON_VISUAL_TAGS.
 */
export const TAG_DICTIONARY: readonly string[] = ${JSON.stringify(TAG_DICTIONARY, null, 2)} as const;

/**
 * Visual tags for each icon base name.
 * Key: Base icon name (without Regular/Filled/Color suffix)
 * Value: Array of indices into TAG_DICTIONARY
 */
export const ICON_VISUAL_TAGS: Record<string, readonly number[]> = {
${[...baseNameTags.entries()]
  .sort((a, b) => a[0].localeCompare(b[0]))
  .map(([name, tags]) => `  "${name}": [${tags.join(",")}]`)
  .join(",\n")}
};

/**
 * Helper to get tag strings for an icon.
 */
export function getIconTags(baseName: string): string[] {
  const indices = ICON_VISUAL_TAGS[baseName] || [];
  return indices.map(i => TAG_DICTIONARY[i]);
}

/**
 * Helper to find icons by tag.
 */
export function findIconsByTag(tag: string): string[] {
  const tagIndex = TAG_DICTIONARY.indexOf(tag);
  if (tagIndex === -1) return [];
  
  return Object.entries(ICON_VISUAL_TAGS)
    .filter(([_, tags]) => tags.includes(tagIndex))
    .map(([name]) => name);
}
`;

  // Write output
  const outputPath = path.join(__dirname, "..", "src", "icon-visual-tags.ts");
  fs.writeFileSync(outputPath, output, "utf-8");
  
  // Report size
  const stats = fs.statSync(outputPath);
  console.log(`\n✅ Generated: src/icon-visual-tags.ts (${(stats.size / 1024).toFixed(1)} KB)`);
  
  // Show sample
  console.log("\n📋 Sample tags:");
  const samples = ["AddCircle", "ArrowLeft", "Person", "Document", "Heart", "Beaker", "Bot"];
  for (const sample of samples) {
    const tags = baseNameTags.get(sample);
    if (tags) {
      const tagStrings = tags.map(i => TAG_DICTIONARY[i]);
      console.log(`   ${sample}: [${tagStrings.join(", ")}]`);
    }
  }
}

generateVisualTags().catch(console.error);
