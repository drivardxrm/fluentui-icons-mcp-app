import { registerAppResource, registerAppTool, RESOURCE_MIME_TYPE } from "@modelcontextprotocol/ext-apps/server";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult, ReadResourceResult } from "@modelcontextprotocol/sdk/types.js";
import fs from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { FLUENT_ICON_NAMES } from "./src/icon-names.js";
import { getIconSizes } from "./src/icon-sizes.js";

// Works both from source (server.ts) and compiled (dist/server.js)
const DIST_DIR = import.meta.filename.endsWith(".ts")
  ? path.join(import.meta.dirname, "dist")
  : import.meta.dirname;

/**
 * Icon data structure returned by the search tool
 */
interface IconResult {
  name: string;
  displayName?: string;
  jsxElement: string;
  importStatement: string;
  category: string;
  availableSizes?: string[];
}

/**
 * Get all available icon names from the pre-generated static list
 * Icons follow the pattern: {Name}{Variant}
 * e.g., AddRegular, AddFilled, ArrowLeftRegular
 */
function getFluentIconNames(): string[] {
  return FLUENT_ICON_NAMES as unknown as string[];
}

/**
 * Parse icon name to extract components (unsized icons)
 */
function parseIconName(name: string): { baseName: string; variant: string } {
  // Pattern: BaseName + Variant (Regular/Filled/Color)
  const match = name.match(/^(.+?)(Regular|Filled|Color)$/);
  if (match) {
    return {
      baseName: match[1],
      variant: match[2],
    };
  }
  return { baseName: name, variant: "" };
}

/**
 * Semantic mapping: maps user intents/concepts to Fluent UI icon name patterns
 * This allows searching by meaning rather than just icon names
 */
const semanticIconMapping: Record<string, string[]> = {
  // Visual effects & decoration
  sparkle: ["Sparkle", "Star", "Wand", "Magic", "Glitter", "Shine", "Flash"],
  magic: ["Wand", "Sparkle", "Star", "Magic"],
  shine: ["Sparkle", "Star", "Sun", "Lightbulb", "Flash"],
  glitter: ["Sparkle", "Star"],
  
  // Actions - Add/Create
  add: ["Add", "Plus", "New", "Create"],
  create: ["Add", "New", "Document", "Compose"],
  new: ["Add", "New", "Document", "Plus"],
  plus: ["Add", "Plus"],
  
  // Actions - Remove/Delete
  delete: ["Delete", "Trash", "Remove", "Dismiss", "Clear"],
  remove: ["Delete", "Remove", "Dismiss", "Subtract", "Minus"],
  trash: ["Delete", "Trash"],
  clear: ["Clear", "Dismiss", "Eraser", "Backspace"],
  erase: ["Eraser", "Clear", "Delete", "Backspace"],
  
  // Actions - Edit/Modify
  edit: ["Edit", "Pen", "Pencil", "Compose", "Rename"],
  modify: ["Edit", "Settings", "Options", "Wrench"],
  write: ["Edit", "Pen", "Compose", "TextEdit"],
  compose: ["Compose", "Edit", "Mail", "New"],
  
  // Actions - Save/Download/Upload
  save: ["Save", "Checkmark", "ArrowDownload", "Disk"],
  download: ["ArrowDownload", "Download", "CloudDownload", "Save"],
  upload: ["ArrowUpload", "Upload", "CloudUpload", "Send"],
  export: ["ArrowExport", "Share", "Send", "Save"],
  import: ["ArrowImport", "Folder", "Open"],
  
  // Actions - Copy/Paste/Cut
  copy: ["Copy", "Clipboard", "Duplicate"],
  paste: ["ClipboardPaste", "Paste", "Clipboard"],
  cut: ["Cut", "Scissors"],
  duplicate: ["Copy", "Duplicate", "Clone"],
  
  // Actions - Undo/Redo
  undo: ["ArrowUndo", "Undo", "ArrowHook"],
  redo: ["ArrowRedo", "Redo", "ArrowHook"],
  
  // Navigation - Arrows
  arrow: ["Arrow", "Chevron", "Caret", "Triangle"],
  left: ["ArrowLeft", "ChevronLeft", "Previous", "Back"],
  right: ["ArrowRight", "ChevronRight", "Next", "Forward"],
  up: ["ArrowUp", "ChevronUp", "CaretUp"],
  down: ["ArrowDown", "ChevronDown", "CaretDown"],
  back: ["ArrowLeft", "Back", "Previous", "ChevronLeft"],
  forward: ["ArrowRight", "Forward", "Next", "ChevronRight"],
  next: ["ArrowRight", "ChevronRight", "Next", "Forward"],
  previous: ["ArrowLeft", "ChevronLeft", "Previous", "Back"],
  
  // Navigation - Home/Menu
  home: ["Home", "House"],
  menu: ["Navigation", "Hamburger", "LineHorizontal", "MoreVertical", "MoreHorizontal"],
  hamburger: ["Navigation", "LineHorizontal"],
  
  // Communication
  email: ["Mail", "Envelope", "Send", "Read"],
  mail: ["Mail", "Envelope", "Send"],
  message: ["Chat", "Comment", "Message", "Bubble"],
  chat: ["Chat", "Comment", "Message", "Bubble", "People"],
  comment: ["Comment", "Chat", "Bubble"],
  send: ["Send", "Mail", "ArrowRight", "Paper"],
  call: ["Call", "Phone", "Video"],
  phone: ["Call", "Phone", "Contact"],
  video: ["Video", "Camera", "Call", "Film", "Play"],
  
  // People & Users
  user: ["Person", "People", "Contact", "Guest", "Account"],
  person: ["Person", "People", "Contact", "Account"],
  people: ["People", "Person", "Group", "Team"],
  team: ["People", "Group", "Organization"],
  group: ["People", "Group", "Folder"],
  profile: ["Person", "Contact", "Account", "Info"],
  account: ["Person", "Account", "Key", "Lock"],
  
  // Time & Calendar
  calendar: ["Calendar", "Date", "Event", "Clock"],
  date: ["Calendar", "Date", "Clock"],
  time: ["Clock", "Timer", "History", "Calendar"],
  clock: ["Clock", "Timer", "Time"],
  schedule: ["Calendar", "Clock", "Timer", "Event"],
  event: ["Calendar", "Event", "Star"],
  reminder: ["Alert", "Bell", "Clock", "Calendar"],
  
  // Files & Documents
  file: ["Document", "File", "Page", "Text"],
  document: ["Document", "Page", "Text", "File"],
  folder: ["Folder", "Archive", "Directory"],
  attachment: ["Attach", "Paperclip", "Link"],
  link: ["Link", "Chain", "Share", "Globe"],
  pdf: ["Document", "DocumentPdf", "File"],
  image: ["Image", "Photo", "Picture", "Camera"],
  photo: ["Image", "Photo", "Camera", "Picture"],
  picture: ["Image", "Photo", "Picture"],
  
  // Media
  play: ["Play", "Video", "Media"],
  pause: ["Pause", "Stop"],
  stop: ["Stop", "Pause", "Square"],
  music: ["Music", "Note", "Speaker", "Headphones"],
  audio: ["Speaker", "Volume", "Microphone", "Music"],
  sound: ["Speaker", "Volume", "Music"],
  mute: ["SpeakerMute", "MicOff", "Volume"],
  microphone: ["Mic", "Microphone", "Record"],
  record: ["Record", "Microphone", "Circle"],
  
  // UI Elements
  settings: ["Settings", "Gear", "Cog", "Options", "Wrench"],
  options: ["Settings", "Options", "MoreVertical", "MoreHorizontal"],
  config: ["Settings", "Gear", "Options", "Wrench"],
  preferences: ["Settings", "Options", "Slider"],
  filter: ["Filter", "Funnel", "Sort"],
  sort: ["ArrowSort", "Sort", "Filter", "Reorder"],
  search: ["Search", "Magnify", "Find", "Zoom"],
  find: ["Search", "Find", "Magnify"],
  zoom: ["ZoomIn", "ZoomOut", "Search", "Magnify"],
  
  // Status & Feedback
  check: ["Checkmark", "Check", "Done", "Accept"],
  checkmark: ["Checkmark", "Done", "Accept"],
  done: ["Checkmark", "Done", "Complete"],
  success: ["Checkmark", "CheckCircle", "Done"],
  error: ["Error", "Dismiss", "Warning", "XCircle"],
  warning: ["Warning", "Alert", "Exclamation"],
  alert: ["Alert", "Warning", "Bell", "Notification"],
  info: ["Info", "Question", "Help"],
  help: ["Question", "Help", "Info", "Support"],
  question: ["Question", "Help", "Info"],
  notification: ["Alert", "Bell", "Notification", "Ring"],
  
  // Security
  lock: ["Lock", "Locked", "Key", "Shield", "Secure"],
  unlock: ["LockOpen", "Unlock", "Key"],
  key: ["Key", "Lock", "Password"],
  password: ["Key", "Lock", "Eye", "Password"],
  security: ["Shield", "Lock", "Key", "Secure"],
  shield: ["Shield", "Security", "Protected"],
  
  // Cloud & Sync
  cloud: ["Cloud", "Weather", "Sync"],
  sync: ["Sync", "ArrowSync", "Refresh", "Update"],
  refresh: ["ArrowSync", "Refresh", "Reload"],
  update: ["ArrowSync", "Update", "Download"],
  
  // Favorites & Rating
  favorite: ["Star", "Heart", "Bookmark", "Pin"],
  star: ["Star", "Sparkle", "Rating"],
  heart: ["Heart", "Like", "Love", "Favorite"],
  like: ["ThumbLike", "Heart", "Star"],
  dislike: ["ThumbDislike"],
  bookmark: ["Bookmark", "Flag", "Star", "Pin"],
  pin: ["Pin", "Bookmark", "Tack"],
  flag: ["Flag", "Bookmark", "Alert"],
  
  // Layout & View
  grid: ["Grid", "Apps", "Table", "Layout"],
  list: ["List", "TextBullet", "Queue"],
  table: ["Table", "Grid", "Data"],
  expand: ["ChevronDown", "Expand", "Maximize", "FullScreen"],
  collapse: ["ChevronUp", "Collapse", "Minimize"],
  maximize: ["Maximize", "FullScreen", "Expand"],
  minimize: ["Minimize", "Collapse", "WindowMinimize"],
  fullscreen: ["FullScreen", "Maximize", "Expand"],
  
  // Connectivity
  wifi: ["Wifi", "Signal", "Network"],
  bluetooth: ["Bluetooth"],
  network: ["Globe", "Network", "Wifi", "Signal"],
  internet: ["Globe", "Earth", "Network", "World"],
  globe: ["Globe", "Earth", "World", "International"],
  
  // Devices
  computer: ["Desktop", "Monitor", "Computer", "Laptop"],
  laptop: ["Laptop", "Device"],
  smartphone: ["Phone", "Mobile", "Device"],
  mobile: ["Phone", "Mobile", "Device"],
  tablet: ["Tablet", "Device"],
  printer: ["Print", "Printer"],
  print: ["Print", "Printer", "Document"],
  
  // Shopping & Money
  cart: ["Cart", "Shopping", "Basket"],
  shopping: ["Cart", "Shopping", "Bag"],
  money: ["Money", "Currency", "Payment", "Wallet"],
  payment: ["Payment", "CreditCard", "Money", "Wallet"],
  credit: ["CreditCard", "Payment", "Money"],
  wallet: ["Wallet", "Money", "Payment"],
  
  // Weather
  weather: ["Weather", "Cloud", "Sun", "Rain"],
  sun: ["Sun", "Brightness", "Weather", "Light"],
  moon: ["Moon", "Dark", "Night", "Sleep"],
  rain: ["Rain", "Weather", "Cloud", "Drop"],
  
  // Code & Development
  code: ["Code", "Braces", "Terminal", "Developer"],
  developer: ["Code", "Braces", "Terminal", "Bug"],
  terminal: ["Terminal", "Code", "Console"],
  bug: ["Bug", "Error", "Debug"],
  debug: ["Bug", "Code", "Wrench"],
  
  // AI & Intelligence
  ai: ["Bot", "Brain", "Lightbulb", "Sparkle", "Magic"],
  bot: ["Bot", "Chat"],
  robot: ["Bot", "BotAdd", "BotSparkle"],
  brain: ["Brain", "Lightbulb", "Book"],
  idea: ["Lightbulb", "Brain", "Sparkle"],
  lightbulb: ["Lightbulb", "Idea", "Tip"],
  
  // Location
  location: ["Location", "Map", "Pin", "Navigation"],
  map: ["Map", "Location", "Globe", "Navigation"],
  gps: ["Location", "Navigation", "Target"],
  navigation: ["Navigation", "Compass", "Map", "Arrow"],
  
  // Misc
  tag: ["Tag", "Label", "Hashtag"],
  label: ["Tag", "Label"],
  hashtag: ["Hashtag", "Number", "Tag"],
  gift: ["Gift", "Present", "Box"],
  box: ["Box", "Package", "Archive", "Cube"],
  clipboard: ["Clipboard", "Paste", "Copy"],
  window: ["Window", "App", "Square"],
  close: ["Dismiss", "Close", "X", "Cancel"],
  cancel: ["Dismiss", "Cancel", "X", "Close"],
  exit: ["SignOut", "Leave", "Dismiss", "Door"],
  logout: ["SignOut", "Leave", "Person"],
  login: ["SignIn", "Enter", "Person"],
  share: ["Share", "Send", "Forward", "ArrowExport"],
  open: ["Open", "Launch", "ArrowTopRight", "External"],
  external: ["Open", "Launch", "ArrowTopRight", "LinkSquare"],
};

/**
 * Search for icons matching a query - supports both name matching and semantic/intent-based search
 */
function searchIcons(query: string, maxResults: number = 20): IconResult[] {
  const allIcons = getFluentIconNames();
  const queryLower = query.toLowerCase().trim();
  const queryWords = queryLower.split(/\s+/);
  
  // Build a set of semantic patterns to search for based on the query
  const semanticPatterns: Set<string> = new Set();
  
  // Check each query word against semantic mappings
  for (const word of queryWords) {
    // Direct semantic mapping lookup
    if (semanticIconMapping[word]) {
      for (const pattern of semanticIconMapping[word]) {
        semanticPatterns.add(pattern.toLowerCase());
      }
    }
    // Also check partial matches in semantic keys
    for (const [key, patterns] of Object.entries(semanticIconMapping)) {
      if (key.includes(word) || word.includes(key)) {
        for (const pattern of patterns) {
          semanticPatterns.add(pattern.toLowerCase());
        }
      }
    }
  }
  
  // Score-based search
  const scored = allIcons
    .map((name) => {
      const nameLower = name.toLowerCase();
      const { baseName } = parseIconName(name);
      const baseNameLower = baseName.toLowerCase();
      
      let score = 0;
      
      // Exact base name match (highest priority)
      if (baseNameLower === queryLower) {
        score = 100;
      }
      // Base name starts with query
      else if (baseNameLower.startsWith(queryLower)) {
        score = 80;
      }
      // Base name contains query
      else if (baseNameLower.includes(queryLower)) {
        score = 60;
      }
      // Full name contains query
      else if (nameLower.includes(queryLower)) {
        score = 40;
      }
      // Individual words match
      else {
        const matchCount = queryWords.filter((w) => baseNameLower.includes(w)).length;
        if (matchCount > 0) {
          score = 20 * matchCount;
        }
      }
      
      // Semantic/Intent-based matching
      if (score === 0 && semanticPatterns.size > 0) {
        for (const pattern of semanticPatterns) {
          if (baseNameLower === pattern) {
            score = Math.max(score, 70); // Exact semantic match
          } else if (baseNameLower.startsWith(pattern)) {
            score = Math.max(score, 55); // Semantic starts with
          } else if (baseNameLower.includes(pattern)) {
            score = Math.max(score, 45); // Semantic contains
          }
        }
      }
      
      // Prefer Regular variant
      if (score > 0) {
        if (name.endsWith("Regular")) score += 1;
      }
      
      return { name, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);
  
  return scored.map(({ name }) => {
    const { baseName, variant } = parseIconName(name);
    const availableSizes = getIconSizes(name);
    return {
      name,
      jsxElement: `<${name} />`,
      importStatement: `import { ${name} } from "@fluentui/react-icons";`,
      category: variant || "Icon",
      availableSizes,
    };
  });
}

/**
 * Creates a new MCP server instance with tools and resources registered.
 */
export function createServer(): McpServer {
  const server = new McpServer({
    name: "Fluent UI Icons MCP App",
    version: "1.0.0",
  });

  // Resource URI for the icon explorer UI
  const resourceUri = "ui://fluentui-icons/mcp-app.html";

  // Register the icon search tool
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
        query: z.string().describe(
          "Search query - describe the icon you're looking for (e.g., 'add', 'calendar', 'arrow left', 'save document')"
        ),
        maxResults: z.number().optional().default(20).describe(
          "Maximum number of results to return (default: 20)"
        ),
      },
      _meta: { ui: { resourceUri } },
    },
    (args): CallToolResult => {
      const { query, maxResults = 20 } = args;
      
      try {
        const results = searchIcons(query, maxResults);
        
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
        
        // Format text output for non-UI hosts
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
          // Pass structured data for the UI
          structuredContent: {
            query,
            icons: results,
            totalCount: results.length,
          },
        };
      } catch (error) {
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

  // Register the resource serving the bundled HTML UI
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
