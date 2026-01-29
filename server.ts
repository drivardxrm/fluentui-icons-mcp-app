import { registerAppResource, registerAppTool, RESOURCE_MIME_TYPE } from "@modelcontextprotocol/ext-apps/server";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult, ReadResourceResult } from "@modelcontextprotocol/sdk/types.js";
import Fuse from "fuse.js";
import natural from "natural";
import fs from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { FLUENT_ICON_NAMES } from "./src/icon-names.js";
import { getIconSizes } from "./src/icon-sizes.js";

// Initialize WordNet for synonym lookup
const wordnet = new natural.WordNet();

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
  glow: ["Sparkle", "Flash", "Lightbulb", "Star"],
  bright: ["Sparkle", "Star", "Sun", "Lightbulb", "Brightness"],
  
  // Actions - Add/Create
  add: ["Add", "Plus", "New", "Create"],
  create: ["Add", "New", "Document", "Compose"],
  new: ["Add", "New", "Document", "Plus"],
  plus: ["Add", "Plus"],
  insert: ["Add", "Insert", "Plus"],
  
  // Actions - Remove/Delete
  delete: ["Delete", "Trash", "Remove", "Dismiss", "Clear"],
  remove: ["Delete", "Remove", "Dismiss", "Subtract", "Minus"],
  trash: ["Delete", "Trash"],
  clear: ["Clear", "Dismiss", "Eraser", "Backspace"],
  erase: ["Eraser", "Clear", "Delete", "Backspace"],
  destroy: ["Delete", "Trash", "Dismiss"],
  
  // Actions - Edit/Modify
  edit: ["Edit", "Pen", "Pencil", "Compose", "Rename"],
  modify: ["Edit", "Settings", "Options", "Wrench"],
  write: ["Edit", "Pen", "Compose", "TextEdit"],
  compose: ["Compose", "Edit", "Mail", "New"],
  change: ["Edit", "ArrowSync", "Rename", "Settings"],
  update: ["ArrowSync", "Update", "Download", "Edit"],
  
  // Actions - Save/Download/Upload
  save: ["Save", "Checkmark", "ArrowDownload", "Disk"],
  download: ["ArrowDownload", "Download", "CloudDownload", "Save", "ArrowDown"],
  upload: ["ArrowUpload", "Upload", "CloudUpload", "Send", "ArrowUp"],
  export: ["ArrowExport", "Share", "Send", "Save"],
  import: ["ArrowImport", "Folder", "Open"],
  
  // Actions - Copy/Paste/Cut
  copy: ["Copy", "Clipboard", "Duplicate"],
  paste: ["ClipboardPaste", "Paste", "Clipboard"],
  cut: ["Cut", "Scissors"],
  duplicate: ["Copy", "Duplicate", "Clone"],
  clone: ["Copy", "Duplicate"],
  
  // Actions - Undo/Redo
  undo: ["ArrowUndo", "Undo", "ArrowHook"],
  redo: ["ArrowRedo", "Redo", "ArrowHook"],
  revert: ["ArrowUndo", "Undo", "History"],
  restore: ["ArrowUndo", "History", "Restore"],
  
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
  direction: ["Arrow", "Navigation", "Compass"],
  
  // Navigation - Home/Menu
  home: ["Home", "House"],
  house: ["Home", "House", "Building"],
  menu: ["Navigation", "Hamburger", "LineHorizontal", "MoreVertical", "MoreHorizontal"],
  hamburger: ["Navigation", "LineHorizontal"],
  sidebar: ["Panel", "Navigation", "Sidebar"],
  panel: ["Panel", "Sidebar", "Window"],
  
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
  talk: ["Chat", "Comment", "Mic", "Call"],
  speak: ["Mic", "Speaker", "Chat", "Comment"],
  conversation: ["Chat", "Comment", "Message", "Bubble"],
  
  // People & Users
  user: ["Person", "People", "Contact", "Guest", "Account"],
  person: ["Person", "People", "Contact", "Account"],
  people: ["People", "Person", "Group", "Team"],
  team: ["People", "Group", "Organization"],
  group: ["People", "Group", "Folder"],
  profile: ["Person", "Contact", "Account", "Info"],
  account: ["Person", "Account", "Key", "Lock"],
  customer: ["Person", "People", "Contact"],
  employee: ["Person", "People", "Contact", "Badge"],
  member: ["Person", "People", "Contact"],
  friend: ["Person", "People", "Heart"],
  
  // Time & Calendar
  calendar: ["Calendar", "Date", "Event", "Clock"],
  date: ["Calendar", "Date", "Clock"],
  time: ["Clock", "Timer", "History", "Calendar"],
  clock: ["Clock", "Timer", "Time"],
  schedule: ["Calendar", "Clock", "Timer", "Event"],
  event: ["Calendar", "Event", "Star"],
  reminder: ["Alert", "Bell", "Clock", "Calendar"],
  appointment: ["Calendar", "Clock", "Person"],
  meeting: ["People", "Calendar", "Video", "Call"],
  
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
  text: ["Text", "Document", "Font", "Type"],
  page: ["Document", "Page", "File"],
  paper: ["Document", "Page", "File"],
  
  // Media
  play: ["Play", "Video", "Media", "Triangle"],
  pause: ["Pause", "Stop"],
  stop: ["Stop", "Pause", "Square"],
  music: ["Music", "Note", "Speaker", "Headphones"],
  audio: ["Speaker", "Volume", "Microphone", "Music"],
  sound: ["Speaker", "Volume", "Music"],
  mute: ["SpeakerMute", "MicOff", "Volume"],
  microphone: ["Mic", "Microphone", "Record"],
  record: ["Record", "Microphone", "Circle"],
  volume: ["Speaker", "Volume", "Sound"],
  speaker: ["Speaker", "Volume", "Sound"],
  headphones: ["Headphones", "Music", "Audio"],
  
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
  button: ["Button", "Square", "Click"],
  toggle: ["Toggle", "Switch", "Slider"],
  switch: ["Toggle", "Switch", "ArrowSwap"],
  slider: ["Slider", "Settings", "Options"],
  dropdown: ["ChevronDown", "CaretDown", "Dropdown"],
  
  // Status & Feedback
  check: ["Checkmark", "Check", "Done", "Accept"],
  checkmark: ["Checkmark", "Done", "Accept"],
  done: ["Checkmark", "Done", "Complete"],
  complete: ["Checkmark", "Done", "Complete"],
  success: ["Checkmark", "CheckCircle", "Done"],
  error: ["Error", "Dismiss", "Warning", "XCircle"],
  fail: ["Error", "Dismiss", "Warning"],
  failure: ["Error", "Dismiss", "Warning"],
  warning: ["Warning", "Alert", "Exclamation"],
  alert: ["Alert", "Warning", "Bell", "Notification"],
  info: ["Info", "Question", "Help"],
  information: ["Info", "Question", "Help"],
  help: ["Question", "Help", "Info", "Support"],
  question: ["Question", "Help", "Info"],
  notification: ["Alert", "Bell", "Notification", "Ring"],
  badge: ["Badge", "Certificate", "Award", "Circle"],
  
  // Security
  lock: ["Lock", "Locked", "Key", "Shield", "Secure"],
  unlock: ["LockOpen", "Unlock", "Key"],
  key: ["Key", "Lock", "Password"],
  password: ["Key", "Lock", "Eye", "Password"],
  security: ["Shield", "Lock", "Key", "Secure"],
  shield: ["Shield", "Security", "Protected"],
  protect: ["Shield", "Lock", "Security"],
  safe: ["Shield", "Lock", "Security"],
  private: ["Lock", "Eye", "Shield", "Incognito"],
  
  // Cloud & Sync
  cloud: ["Cloud", "Weather", "Sync"],
  sync: ["Sync", "ArrowSync", "Refresh", "Update"],
  refresh: ["ArrowSync", "Refresh", "Reload"],
  reload: ["ArrowSync", "Refresh", "Reload"],
  loading: ["Spinner", "Hourglass", "ArrowSync"],
  wait: ["Spinner", "Hourglass", "Clock"],
  
  // Favorites & Rating
  favorite: ["Star", "Heart", "Bookmark", "Pin"],
  star: ["Star", "Sparkle", "Rating"],
  heart: ["Heart", "Like", "Love", "Favorite"],
  like: ["ThumbLike", "Heart", "Star"],
  love: ["Heart", "Like", "Star"],
  dislike: ["ThumbDislike"],
  bookmark: ["Bookmark", "Flag", "Star", "Pin"],
  pin: ["Pin", "Bookmark", "Tack", "Location"],
  flag: ["Flag", "Bookmark", "Alert"],
  rating: ["Star", "ThumbLike", "Heart"],
  
  // Layout & View
  grid: ["Grid", "Apps", "Table", "Layout"],
  list: ["List", "TextBullet", "Queue"],
  table: ["Table", "Grid", "Data"],
  expand: ["ChevronDown", "Expand", "Maximize", "FullScreen"],
  collapse: ["ChevronUp", "Collapse", "Minimize"],
  maximize: ["Maximize", "FullScreen", "Expand"],
  minimize: ["Minimize", "Collapse", "WindowMinimize"],
  fullscreen: ["FullScreen", "Maximize", "Expand"],
  layout: ["Layout", "Grid", "Column", "Row"],
  column: ["Column", "Layout", "TextColumn"],
  row: ["Row", "Layout", "Table"],
  view: ["Eye", "View", "Preview", "Visibility"],
  hide: ["EyeOff", "Hide", "Visibility"],
  show: ["Eye", "View", "Visibility"],
  visible: ["Eye", "View", "Visibility"],
  invisible: ["EyeOff", "Hide"],
  
  // Connectivity
  wifi: ["Wifi", "Signal", "Network"],
  bluetooth: ["Bluetooth"],
  network: ["Globe", "Network", "Wifi", "Signal"],
  internet: ["Globe", "Earth", "Network", "World"],
  globe: ["Globe", "Earth", "World", "International"],
  web: ["Globe", "World", "Browser"],
  online: ["Globe", "Wifi", "Signal", "Cloud"],
  offline: ["CloudOff", "WifiOff", "Signal"],
  connect: ["Link", "PlugConnected", "Wifi"],
  disconnect: ["Unlink", "PlugDisconnected", "WifiOff"],
  
  // Devices
  computer: ["Desktop", "Monitor", "Computer", "Laptop"],
  laptop: ["Laptop", "Device"],
  desktop: ["Desktop", "Monitor", "Computer"],
  monitor: ["Desktop", "Monitor", "Screen"],
  screen: ["Desktop", "Monitor", "Screen"],
  smartphone: ["Phone", "Mobile", "Device"],
  mobile: ["Phone", "Mobile", "Device"],
  tablet: ["Tablet", "Device"],
  printer: ["Print", "Printer"],
  print: ["Print", "Printer", "Document"],
  keyboard: ["Keyboard", "Type"],
  mouse: ["Cursor", "Mouse"],
  
  // Shopping & Money
  cart: ["Cart", "Shopping", "Basket"],
  shopping: ["Cart", "Shopping", "Bag"],
  basket: ["Cart", "Shopping", "Basket"],
  money: ["Money", "Currency", "Payment", "Wallet"],
  payment: ["Payment", "CreditCard", "Money", "Wallet"],
  credit: ["CreditCard", "Payment", "Money"],
  wallet: ["Wallet", "Money", "Payment"],
  dollar: ["Money", "Currency", "CurrencyDollar"],
  bank: ["Building", "Money", "Wallet"],
  receipt: ["Receipt", "Document", "Money"],
  
  // Weather
  weather: ["Weather", "Cloud", "Sun", "Rain"],
  sun: ["Sun", "Brightness", "Weather", "Light"],
  sunny: ["Sun", "Brightness", "Weather"],
  moon: ["Moon", "Dark", "Night", "Sleep"],
  rain: ["Rain", "Weather", "Cloud", "Drop"],
  snow: ["Snow", "Weather", "Cold"],
  temperature: ["Temperature", "Thermometer", "Weather"],
  
  // Code & Development
  code: ["Code", "Braces", "Terminal", "Developer"],
  developer: ["Code", "Braces", "Terminal", "Bug"],
  terminal: ["Terminal", "Code", "Console"],
  console: ["Terminal", "Code", "Console"],
  bug: ["Bug", "Error", "Debug"],
  debug: ["Bug", "Code", "Wrench"],
  api: ["Code", "Braces", "PlugConnected"],
  database: ["Database", "Server", "Storage"],
  server: ["Server", "Database", "Cloud"],
  
  // AI & Intelligence
  ai: ["Bot", "Brain", "Lightbulb", "Sparkle", "Magic", "Wand"],
  bot: ["Bot", "Chat", "Robot"],
  robot: ["Bot", "BotAdd", "BotSparkle"],
  brain: ["Brain", "Lightbulb", "Book"],
  idea: ["Lightbulb", "Brain", "Sparkle"],
  lightbulb: ["Lightbulb", "Idea", "Tip"],
  smart: ["Lightbulb", "Brain", "Sparkle", "Bot"],
  intelligence: ["Brain", "Bot", "Lightbulb"],
  machine: ["Bot", "Cog", "Settings"],
  learning: ["Book", "Brain", "HatGraduation"],
  wand: ["Wand", "Magic", "Sparkle"],
  
  // Location
  location: ["Location", "Map", "Pin", "Navigation"],
  map: ["Map", "Location", "Globe", "Navigation"],
  gps: ["Location", "Navigation", "Target"],
  navigation: ["Navigation", "Compass", "Map", "Arrow"],
  place: ["Location", "Pin", "Map"],
  address: ["Location", "Home", "Building"],
  compass: ["Compass", "Navigation", "Direction"],
  
  // Nature & Animals
  animal: ["Bug", "Cat", "Dog", "Fish"],
  tree: ["TreeDeciduous", "TreeEvergreen", "Leaf"],
  leaf: ["Leaf", "Tree", "Plant"],
  plant: ["Plant", "Leaf", "Tree"],
  flower: ["Flower", "Plant", "Leaf"],
  earth: ["Globe", "Earth", "World"],
  fire: ["Fire", "Flame", "Hot"],
  water: ["Drop", "Water", "Rain"],
  
  // Food & Drink
  food: ["Food", "Restaurant", "Bowl", "Pizza", "Apple", "Egg"],
  fruit: ["Apple", "Food", "Leaf"],
  apple: ["Apple", "Food"],
  egg: ["Egg", "Food"],
  pizza: ["Pizza", "Food"],
  drink: ["Drink", "Coffee", "Cup"],
  coffee: ["Coffee", "Drink", "Cup"],
  tea: ["Coffee", "Drink", "Cup"],
  restaurant: ["Food", "Restaurant", "Fork"],
  eat: ["Food", "Restaurant", "Bowl"],
  meal: ["Food", "Restaurant", "Bowl"],
  
  // Transportation
  car: ["Vehicle", "Car", "Automobile"],
  vehicle: ["Vehicle", "Car", "Truck"],
  plane: ["Airplane", "Flight"],
  airplane: ["Airplane", "Flight"],
  flight: ["Airplane", "Flight"],
  train: ["Vehicle", "Subway"],
  bus: ["Vehicle", "Bus"],
  bike: ["Bicycle", "Vehicle"],
  bicycle: ["Bicycle", "Vehicle"],
  
  // Misc
  tag: ["Tag", "Label", "Hashtag"],
  label: ["Tag", "Label"],
  hashtag: ["Hashtag", "Number", "Tag"],
  gift: ["Gift", "Present", "Box"],
  present: ["Gift", "Present", "Box"],
  box: ["Box", "Package", "Archive", "Cube"],
  package: ["Box", "Package", "Archive"],
  cube: ["Cube", "Box", "3D"],
  clipboard: ["Clipboard", "Paste", "Copy"],
  window: ["Window", "App", "Square"],
  close: ["Dismiss", "Close", "X", "Cancel"],
  cancel: ["Dismiss", "Cancel", "X", "Close"],
  exit: ["SignOut", "Leave", "Dismiss", "Door"],
  logout: ["SignOut", "Leave", "Person"],
  login: ["SignIn", "Enter", "Person"],
  signin: ["SignIn", "Enter", "Person"],
  signout: ["SignOut", "Leave", "Person"],
  share: ["Share", "Send", "Forward", "ArrowExport"],
  open: ["Open", "Launch", "ArrowTopRight", "External"],
  external: ["Open", "Launch", "ArrowTopRight", "LinkSquare"],
  launch: ["Open", "Launch", "Rocket"],
  rocket: ["Rocket", "Launch", "Send"],
  accept: ["Checkmark", "Accept", "Done"],
  reject: ["Dismiss", "Cancel", "X"],
  confirm: ["Checkmark", "Accept", "Done"],
  approve: ["Checkmark", "Accept", "ThumbLike"],
  deny: ["Dismiss", "Cancel", "ThumbDislike"],
  attach: ["Attach", "Paperclip", "Link"],
  detach: ["Unlink", "Dismiss"],
  empty: ["Empty", "Box", "Folder"],
  full: ["Full", "Battery", "Circle"],
  half: ["Half", "Circle"],
  crop: ["Crop", "Image", "Cut"],
  rotate: ["Rotate", "Arrow", "Sync"],
  flip: ["Flip", "Arrow", "Mirror"],
  drag: ["Drag", "Move", "ReOrder"],
  drop: ["Drop", "Drag", "Download"],
  move: ["Move", "Drag", "Arrow"],
  resize: ["Resize", "Expand", "Arrow"],
  more: ["MoreHorizontal", "MoreVertical", "Menu", "Ellipsis"],
  ellipsis: ["MoreHorizontal", "MoreVertical"],
  dots: ["MoreHorizontal", "MoreVertical", "Ellipsis"],
  organization: ["Organization", "Building", "People", "Team"],
  company: ["Building", "Organization", "Briefcase"],
  business: ["Briefcase", "Building", "Money"],
  work: ["Briefcase", "Building", "Document"],
  job: ["Briefcase", "Building", "Document"],
  task: ["Task", "Checkmark", "List", "Clipboard"],
  todo: ["Task", "Checkmark", "List", "Clipboard"],
  checklist: ["Task", "Checkmark", "List"],
  form: ["Form", "Document", "TextBullet"],
  survey: ["Form", "Document", "Checkmark"],
  vote: ["ThumbLike", "Checkmark", "Poll"],
  poll: ["Poll", "Chart", "Data"],
  chart: ["Chart", "Data", "Graph"],
  graph: ["Chart", "Data", "Graph"],
  analytics: ["Chart", "Data", "Graph"],
  report: ["Document", "Chart", "Data"],
  dashboard: ["Grid", "Chart", "Data"],
  widget: ["Square", "App", "Grid"],
  app: ["Apps", "Grid", "Square"],
  application: ["Apps", "Grid", "Window"],
  tool: ["Wrench", "Tool", "Settings"],
  tools: ["Wrench", "Tool", "Toolbox"],
  toolbox: ["Toolbox", "Wrench", "Tool"],
  wrench: ["Wrench", "Tool", "Settings"],
  repair: ["Wrench", "Tool", "Settings"],
  fix: ["Wrench", "Tool", "Bug"],
  build: ["Hammer", "Wrench", "Build"],
  construct: ["Hammer", "Wrench", "Building"],
};

// Prepare icon data for Fuse.js search
interface IconSearchItem {
  name: string;
  baseName: string;
  variant: string;
}

const iconSearchItems: IconSearchItem[] = (FLUENT_ICON_NAMES as unknown as string[]).map((name) => {
  const { baseName, variant } = parseIconName(name);
  return { name, baseName, variant };
});

// Initialize Fuse.js for fuzzy search on icon names
const iconFuse = new Fuse(iconSearchItems, {
  keys: ["baseName", "name"],
  threshold: 0.3, // 0 = exact match, 1 = match anything (0.3 is a good balance)
  distance: 100,
  includeScore: true,
  minMatchCharLength: 2,
  ignoreLocation: true, // Search anywhere in the string
});

// Initialize Fuse.js for semantic key matching
const semanticKeys = Object.keys(semanticIconMapping);
const semanticFuse = new Fuse(semanticKeys, {
  threshold: 0.3,
  distance: 50,
  includeScore: true,
  minMatchCharLength: 2,
});

// Cache for WordNet synonyms to avoid repeated lookups
const synonymCache = new Map<string, string[]>();

/**
 * Get synonyms for a word using WordNet (async with caching)
 */
function getSynonyms(word: string): Promise<string[]> {
  const cached = synonymCache.get(word);
  if (cached !== undefined) {
    return Promise.resolve(cached);
  }
  
  return new Promise((resolve) => {
    const synonyms: string[] = [];
    wordnet.lookup(word, (results) => {
      for (const result of results) {
        // Get synonyms from the synset
        for (const synonym of result.synonyms) {
          const clean = synonym.toLowerCase().replace(/_/g, '');
          if (clean !== word && clean.length >= 3 && !synonyms.includes(clean)) {
            synonyms.push(clean);
          }
        }
      }
      // Limit to top 10 synonyms
      const limited = synonyms.slice(0, 10);
      synonymCache.set(word, limited);
      resolve(limited);
    });
  });
}

/**
 * Search for icons matching a query - supports both name matching and semantic/intent-based search
 */
async function searchIcons(query: string, maxResults: number = 20): Promise<IconResult[]> {
  const queryLower = query.toLowerCase().trim();
  const queryWords = queryLower.split(/\s+/).filter(w => w.length > 0);
  
  // Collect all matching icons with scores
  const iconScores = new Map<string, number>();
  
  // 1. Direct fuzzy search on icon names
  const directResults = iconFuse.search(queryLower, { limit: maxResults * 2 });
  for (const result of directResults) {
    const score = 100 - (result.score || 0) * 100; // Convert to 0-100 scale (higher is better)
    iconScores.set(result.item.name, Math.max(iconScores.get(result.item.name) || 0, score));
  }
  
  // 2. Semantic/intent-based search (custom mappings first)
  for (const word of queryWords) {
    // Direct semantic key match
    if (semanticIconMapping[word]) {
      for (const pattern of semanticIconMapping[word]) {
        // Search for icons matching this semantic pattern
        const semanticResults = iconFuse.search(pattern, { limit: 10 });
        for (const result of semanticResults) {
          const score = 70 - (result.score || 0) * 50; // Semantic matches score slightly lower
          iconScores.set(result.item.name, Math.max(iconScores.get(result.item.name) || 0, score));
        }
      }
    }
    
    // Fuzzy match on semantic keys
    const fuzzySemanticMatches = semanticFuse.search(word, { limit: 5 });
    for (const semanticMatch of fuzzySemanticMatches) {
      const semanticKey = semanticMatch.item;
      const patterns = semanticIconMapping[semanticKey];
      if (patterns) {
        for (const pattern of patterns) {
          const semanticResults = iconFuse.search(pattern, { limit: 8 });
          for (const result of semanticResults) {
            // Lower score for fuzzy semantic matches
            const score = 50 - (result.score || 0) * 30 - (semanticMatch.score || 0) * 20;
            iconScores.set(result.item.name, Math.max(iconScores.get(result.item.name) || 0, score));
          }
        }
      }
    }
  }
  
  // 3. WordNet synonyms as fallback (only if we have few results)
  if (iconScores.size < maxResults) {
    for (const word of queryWords) {
      // Skip if we already have custom mapping for this word
      if (semanticIconMapping[word]) continue;
      
      const synonyms = await getSynonyms(word);
      for (const synonym of synonyms) {
        // Search icons directly with the synonym
        const synonymResults = iconFuse.search(synonym, { limit: 5 });
        for (const result of synonymResults) {
          const score = 40 - (result.score || 0) * 30; // WordNet matches score lower
          iconScores.set(result.item.name, Math.max(iconScores.get(result.item.name) || 0, score));
        }
        
        // Also check if synonym matches a custom semantic key
        if (semanticIconMapping[synonym]) {
          for (const pattern of semanticIconMapping[synonym]) {
            const semanticResults = iconFuse.search(pattern, { limit: 5 });
            for (const result of semanticResults) {
              const score = 45 - (result.score || 0) * 30;
              iconScores.set(result.item.name, Math.max(iconScores.get(result.item.name) || 0, score));
            }
          }
        }
      }
    }
  }
  
  // Sort by score and take top results
  const sortedIcons = [...iconScores.entries()]
    .sort((a, b) => {
      // First by score
      if (b[1] !== a[1]) return b[1] - a[1];
      // Prefer Regular variant
      const aRegular = a[0].endsWith("Regular") ? 1 : 0;
      const bRegular = b[0].endsWith("Regular") ? 1 : 0;
      return bRegular - aRegular;
    })
    .slice(0, maxResults);
  
  return sortedIcons.map(([name]) => {
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
    async (args): Promise<CallToolResult> => {
      const { query, maxResults = 20 } = args;
      
      try {
        const results = await searchIcons(query, maxResults);
        
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
