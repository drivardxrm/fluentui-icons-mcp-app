/**
 * Icon Search Service
 * 
 * This service provides intelligent icon search capabilities for Fluent UI React icons.
 * It uses a multi-layered search strategy to find icons based on user queries:
 * 
 * SEARCH LAYERS (in priority order):
 * 1. Direct substring matching - Finds icons containing the exact search term
 * 2. Fuzzy name matching - Uses Fuse.js for typo-tolerant name matching
 * 3. Semantic mapping - Maps concepts/intents to icon patterns (e.g., "save" → Save, Download, Disk)
 * 4. Visual tags - Matches icons by visual/conceptual characteristics
 * 5. WordNet synonyms - Expands search using dictionary synonyms
 * 
 * SCORING SYSTEM:
 * - Word-boundary substring match: 250 points (highest priority)
 * - Embedded substring match: 150 points
 * - Direct fuzzy match: 0-100 points (based on Fuse.js score)
 * - Semantic mapping match: 50-70 points
 * - Visual tag match: 45-60 points
 * - WordNet synonym match: 40-55 points (lowest priority)
 * 
 * The scoring ensures that icons with direct name matches always appear first,
 * while still surfacing related icons through semantic understanding.
 */

import Fuse from "fuse.js";
import natural from "natural";
import synonymsLib from "synonyms";
import { FLUENT_ICON_NAMES } from "../icon-names.js";
import { getIconSizes } from "../icon-sizes.js";
import { TAG_DICTIONARY, ICON_VISUAL_TAGS } from "../icon-visual-tags.js";

// ============================================================================
// TYPES
// ============================================================================

/**
 * Represents a searchable icon item with parsed name components.
 * Icons follow the pattern: {BaseName}{Variant} (e.g., "AddRegular", "AddFilled")
 */
interface IconSearchItem {
  /** Full icon name (e.g., "AddCircleRegular") */
  name: string;
  /** Base name without variant suffix (e.g., "AddCircle") */
  baseName: string;
  /** Variant type: "Regular", "Filled", or "Color" */
  variant: string;
}

/**
 * Icon data structure returned by the search service.
 * Contains all information needed to use the icon in code.
 */
export interface IconResult {
  /** Full icon component name */
  name: string;
  /** Optional display-friendly name */
  displayName?: string;
  /** Ready-to-use JSX element string */
  jsxElement: string;
  /** Complete import statement for the icon */
  importStatement: string;
  /** Icon category (variant type) */
  category: string;
  /** List of available sizes for sized variants (e.g., ["16", "20", "24"]) */
  availableSizes?: string[];
}

// ============================================================================
// WORDNET INITIALIZATION
// ============================================================================

/**
 * WordNet instance for synonym lookups.
 * WordNet is a lexical database that groups words into synonym sets (synsets).
 * We use it as a fallback to expand search terms when custom mappings don't match.
 */
const wordnet = new natural.WordNet();

/**
 * Cache for WordNet synonym lookups.
 * WordNet lookups are async and relatively slow, so we cache results
 * to avoid repeated lookups for the same word.
 */
const synonymCache = new Map<string, string[]>();

// ============================================================================
// SEMANTIC ICON MAPPING
// ============================================================================

/**
 * Semantic mapping: Maps user intents/concepts to Fluent UI icon name patterns.
 * 
 * This is the core of our intent-based search. When a user searches for a concept
 * like "save", they might want icons named "Save", "Download", "Disk", etc.
 * 
 * The mapping is organized by categories for maintainability:
 * - Visual effects & decoration (sparkle, magic, shine)
 * - Actions (add, delete, edit, save, copy, undo)
 * - Navigation (arrows, home, menu)
 * - Communication (email, chat, call)
 * - People & Users
 * - Time & Calendar
 * - Files & Documents
 * - Media (play, music, audio)
 * - UI Elements (settings, filter, search)
 * - Status & Feedback (check, error, warning)
 * - Security (lock, key, shield)
 * - And many more...
 * 
 * Each key maps to an array of icon name patterns to search for.
 * The patterns are searched using fuzzy matching, so "Add" will match
 * "AddCircle", "AddSquare", "AddDocument", etc.
 */
const semanticIconMapping: Record<string, string[]> = {
  // -------------------------------------------------------------------------
  // VISUAL EFFECTS & DECORATION
  // -------------------------------------------------------------------------
  sparkle: ["Sparkle", "Star", "Wand", "Magic", "Glitter", "Shine", "Flash"],
  magic: ["Wand", "Sparkle", "Star", "Magic"],
  shine: ["Sparkle", "Star", "Sun", "Lightbulb", "Flash"],
  glitter: ["Sparkle", "Star"],
  glow: ["Sparkle", "Flash", "Lightbulb", "Star"],
  bright: ["Sparkle", "Star", "Sun", "Lightbulb", "Brightness"],
  
  // -------------------------------------------------------------------------
  // ACTIONS - ADD/CREATE
  // -------------------------------------------------------------------------
  add: ["Add", "Plus", "New", "Create"],
  create: ["Add", "New", "Document", "Compose"],
  new: ["Add", "New", "Document", "Plus"],
  plus: ["Add", "Plus"],
  insert: ["Add", "Insert", "Plus"],
  
  // -------------------------------------------------------------------------
  // ACTIONS - REMOVE/DELETE
  // -------------------------------------------------------------------------
  delete: ["Delete", "Trash", "Remove", "Dismiss", "Clear"],
  remove: ["Delete", "Remove", "Dismiss", "Subtract", "Minus"],
  trash: ["Delete", "Trash"],
  clear: ["Clear", "Dismiss", "Eraser", "Backspace"],
  erase: ["Eraser", "Clear", "Delete", "Backspace"],
  destroy: ["Delete", "Trash", "Dismiss"],
  
  // -------------------------------------------------------------------------
  // ACTIONS - EDIT/MODIFY
  // -------------------------------------------------------------------------
  edit: ["Edit", "Pen", "Compose", "Rename"],
  pencil: ["Edit", "Pen", "Compose", "Rename", "Draw"], // No "Pencil" icons exist, use Edit
  modify: ["Edit", "Settings", "Options", "Wrench"],
  write: ["Edit", "Pen", "Compose", "TextEdit"],
  compose: ["Compose", "Edit", "Mail", "New"],
  change: ["Edit", "ArrowSync", "Rename", "Settings"],
  update: ["ArrowSync", "Update", "Download", "Edit"],
  draw: ["Edit", "Pen", "Ink", "Draw", "Brush"],
  sketch: ["Edit", "Pen", "Draw", "Ink"],
  
  // -------------------------------------------------------------------------
  // ACTIONS - SAVE/DOWNLOAD/UPLOAD
  // -------------------------------------------------------------------------
  save: ["Save", "Checkmark", "ArrowDownload", "Disk"],
  download: ["ArrowDownload", "Download", "CloudDownload", "Save", "ArrowDown"],
  upload: ["ArrowUpload", "Upload", "CloudUpload", "Send", "ArrowUp"],
  export: ["ArrowExport", "Share", "Send", "Save"],
  import: ["ArrowImport", "Folder", "Open"],
  
  // -------------------------------------------------------------------------
  // ACTIONS - COPY/PASTE/CUT
  // -------------------------------------------------------------------------
  copy: ["Copy", "Clipboard", "Duplicate"],
  paste: ["ClipboardPaste", "Paste", "Clipboard"],
  cut: ["Cut", "Scissors"],
  duplicate: ["Copy", "Duplicate", "Clone"],
  clone: ["Copy", "Duplicate"],
  
  // -------------------------------------------------------------------------
  // ACTIONS - UNDO/REDO
  // -------------------------------------------------------------------------
  undo: ["ArrowUndo", "Undo", "ArrowHook"],
  redo: ["ArrowRedo", "Redo", "ArrowHook"],
  revert: ["ArrowUndo", "Undo", "History"],
  restore: ["ArrowUndo", "History", "Restore"],
  
  // -------------------------------------------------------------------------
  // NAVIGATION - ARROWS
  // -------------------------------------------------------------------------
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
  
  // -------------------------------------------------------------------------
  // NAVIGATION - HOME/MENU
  // -------------------------------------------------------------------------
  home: ["Home", "House"],
  house: ["Home", "House", "Building"],
  menu: ["Navigation", "Hamburger", "LineHorizontal", "MoreVertical", "MoreHorizontal"],
  hamburger: ["Navigation", "LineHorizontal"],
  sidebar: ["Panel", "Navigation", "Sidebar"],
  panel: ["Panel", "Sidebar", "Window"],
  
  // -------------------------------------------------------------------------
  // COMMUNICATION
  // -------------------------------------------------------------------------
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
  
  // -------------------------------------------------------------------------
  // PEOPLE & USERS
  // -------------------------------------------------------------------------
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
  
  // -------------------------------------------------------------------------
  // TIME & CALENDAR
  // -------------------------------------------------------------------------
  calendar: ["Calendar", "Date", "Event", "Clock"],
  date: ["Calendar", "Date", "Clock"],
  time: ["Clock", "Timer", "History", "Calendar"],
  clock: ["Clock", "Timer", "Time"],
  schedule: ["Calendar", "Clock", "Timer", "Event"],
  event: ["Calendar", "Event", "Star"],
  reminder: ["Alert", "Bell", "Clock", "Calendar"],
  appointment: ["Calendar", "Clock", "Person"],
  meeting: ["People", "Calendar", "Video", "Call"],
  
  // -------------------------------------------------------------------------
  // FILES & DOCUMENTS
  // -------------------------------------------------------------------------
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
  
  // -------------------------------------------------------------------------
  // MEDIA
  // -------------------------------------------------------------------------
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
  
  // -------------------------------------------------------------------------
  // UI ELEMENTS
  // -------------------------------------------------------------------------
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
  
  // -------------------------------------------------------------------------
  // STATUS & FEEDBACK
  // -------------------------------------------------------------------------
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
  
  // -------------------------------------------------------------------------
  // SECURITY
  // -------------------------------------------------------------------------
  lock: ["Lock", "Locked", "Key", "Shield", "Secure"],
  unlock: ["LockOpen", "Unlock", "Key"],
  key: ["Key", "Lock", "Password"],
  password: ["Key", "Lock", "Eye", "Password"],
  security: ["Shield", "Lock", "Key", "Secure"],
  shield: ["Shield", "Security", "Protected"],
  protect: ["Shield", "Lock", "Security"],
  safe: ["Shield", "Lock", "Security"],
  private: ["Lock", "Eye", "Shield", "Incognito"],
  
  // -------------------------------------------------------------------------
  // CLOUD & SYNC
  // -------------------------------------------------------------------------
  cloud: ["Cloud", "Weather", "Sync"],
  sync: ["Sync", "ArrowSync", "Refresh", "Update"],
  refresh: ["ArrowSync", "Refresh", "Reload"],
  reload: ["ArrowSync", "Refresh", "Reload"],
  loading: ["Spinner", "Hourglass", "ArrowSync"],
  wait: ["Spinner", "Hourglass", "Clock"],
  
  // -------------------------------------------------------------------------
  // FAVORITES & RATING
  // -------------------------------------------------------------------------
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
  
  // -------------------------------------------------------------------------
  // LAYOUT & VIEW
  // -------------------------------------------------------------------------
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
  
  // -------------------------------------------------------------------------
  // CONNECTIVITY
  // -------------------------------------------------------------------------
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
  
  // -------------------------------------------------------------------------
  // DEVICES
  // -------------------------------------------------------------------------
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
  
  // -------------------------------------------------------------------------
  // SHOPPING & MONEY
  // -------------------------------------------------------------------------
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
  
  // -------------------------------------------------------------------------
  // WEATHER
  // -------------------------------------------------------------------------
  weather: ["Weather", "Cloud", "Sun", "Rain"],
  sun: ["Sun", "Brightness", "Weather", "Light"],
  sunny: ["Sun", "Brightness", "Weather"],
  moon: ["Moon", "Dark", "Night", "Sleep"],
  rain: ["Rain", "Weather", "Cloud", "Drop"],
  snow: ["Snow", "Weather", "Cold"],
  temperature: ["Temperature", "Thermometer", "Weather"],
  
  // -------------------------------------------------------------------------
  // CODE & DEVELOPMENT
  // -------------------------------------------------------------------------
  code: ["Code", "Braces", "Terminal", "Developer"],
  developer: ["Code", "Braces", "Terminal", "Bug"],
  terminal: ["Terminal", "Code", "Console"],
  console: ["Terminal", "Code", "Console"],
  bug: ["Bug", "Error", "Debug"],
  debug: ["Bug", "Code", "Wrench"],
  api: ["Code", "Braces", "PlugConnected"],
  database: ["Database", "Server", "Storage"],
  server: ["Server", "Database", "Cloud"],
  
  // -------------------------------------------------------------------------
  // AI & INTELLIGENCE
  // -------------------------------------------------------------------------
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
  
  // -------------------------------------------------------------------------
  // SCIENCE & RESEARCH
  // -------------------------------------------------------------------------
  science: ["Beaker", "MathFormula", "Brain", "Lightbulb", "Book", "CloudBeaker"],
  lab: ["Beaker", "CloudBeaker", "BeakerSettings"],
  laboratory: ["Beaker", "CloudBeaker", "BeakerSettings"],
  chemistry: ["Beaker", "CloudBeaker"],
  chemical: ["Beaker", "CloudBeaker"],
  experiment: ["Beaker", "Lightbulb", "CloudBeaker"],
  research: ["Beaker", "Search", "Document", "Brain", "Book", "Library"],
  math: ["MathFormula", "Calculator", "Number", "ClipboardMathFormula"],
  mathematics: ["MathFormula", "Calculator", "ClipboardMathFormula"],
  formula: ["MathFormula", "ClipboardMathFormula", "MathFormatLinear"],
  equation: ["MathFormula", "ClipboardMathFormula"],
  beaker: ["Beaker", "CloudBeaker", "BeakerSettings", "BeakerOff"],
  
  // -------------------------------------------------------------------------
  // LOCATION
  // -------------------------------------------------------------------------
  location: ["Location", "Map", "Pin", "Navigation"],
  map: ["Map", "Location", "Globe", "Navigation"],
  gps: ["Location", "Navigation", "Target"],
  navigation: ["Navigation", "Compass", "Map", "Arrow"],
  place: ["Location", "Pin", "Map"],
  address: ["Location", "Home", "Building"],
  compass: ["Compass", "Navigation", "Direction"],
  
  // -------------------------------------------------------------------------
  // NATURE & ANIMALS
  // -------------------------------------------------------------------------
  animal: ["Bug", "Cat", "Dog", "Fish"],
  tree: ["TreeDeciduous", "TreeEvergreen", "Leaf"],
  leaf: ["Leaf", "Tree", "Plant"],
  plant: ["Plant", "Leaf", "Tree"],
  flower: ["Flower", "Plant", "Leaf"],
  earth: ["Globe", "Earth", "World"],
  fire: ["Fire", "Flame", "Hot"],
  water: ["Drop", "Water", "Rain"],
  
  // -------------------------------------------------------------------------
  // FOOD & DRINK
  // -------------------------------------------------------------------------
  food: ["Food", "Restaurant", "Bowl", "Pizza", "Apple", "Egg"],
  fruit: ["Apple", "Food", "Leaf"],
  apple: ["Apple", "Food"],
  egg: ["Egg", "Food"],
  pizza: ["Pizza", "Food"],
  drink: ["Drink", "Coffee", "Cup", "DrinkBeer", "DrinkWine"],
  coffee: ["Coffee", "Drink", "Cup"],
  tea: ["Coffee", "Drink", "Cup"],
  restaurant: ["Food", "Restaurant", "Fork"],
  eat: ["Food", "Restaurant", "Bowl"],
  meal: ["Food", "Restaurant", "Bowl"],
  // Soups and bowls
  soup: ["Bowl", "Food", "Restaurant", "Drink"],
  wonton: ["Bowl", "Food", "Restaurant"],
  ramen: ["Bowl", "Food", "Restaurant"],
  noodle: ["Bowl", "Food", "Restaurant"],
  pasta: ["Bowl", "Food", "Restaurant"],
  salad: ["Bowl", "Food", "Leaf"],
  cereal: ["Bowl", "Food"],
  rice: ["Bowl", "Food"],
  bowl: ["Bowl", "Food"],
  // Beverages
  beer: ["DrinkBeer", "Drink", "Cup"],
  wine: ["DrinkWine", "Drink", "Cup"],
  cocktail: ["DrinkMargarita", "Drink", "Cup"],
  margarita: ["DrinkMargarita", "Drink"],
  juice: ["Drink", "Cup", "Apple"],
  soda: ["Drink", "Cup"],
  beverage: ["Drink", "Coffee", "Cup", "DrinkBeer"],
  // Cooking
  cook: ["Food", "Bowl", "Restaurant"],
  cooking: ["Food", "Bowl", "Restaurant"],
  chef: ["Food", "Restaurant", "Hat"],
  kitchen: ["Food", "Restaurant", "Bowl"],
  recipe: ["Food", "Document", "Book"],
  // Snacks and desserts
  snack: ["Food", "Cookie", "Apple"],
  dessert: ["Food", "Cookie", "Birthday"],
  cake: ["Food", "Birthday"],
  cookie: ["Cookie", "Food"],
  candy: ["Food", "Heart"],
  chocolate: ["Food", "Heart"],
  icecream: ["Food", "Cone"],
  // Breakfast
  breakfast: ["Food", "Egg", "Coffee", "Bowl"],
  lunch: ["Food", "Restaurant", "Bowl"],
  dinner: ["Food", "Restaurant", "Bowl"],
  brunch: ["Food", "Coffee", "Egg"],
  
  // -------------------------------------------------------------------------
  // TRANSPORTATION
  // -------------------------------------------------------------------------
  car: ["Vehicle", "Car", "Automobile"],
  vehicle: ["Vehicle", "Car", "Truck"],
  plane: ["Airplane", "Flight"],
  airplane: ["Airplane", "Flight"],
  flight: ["Airplane", "Flight"],
  train: ["Vehicle", "Subway"],
  bus: ["Vehicle", "Bus"],
  bike: ["Bicycle", "Vehicle"],
  bicycle: ["Bicycle", "Vehicle"],
  
  // -------------------------------------------------------------------------
  // MISCELLANEOUS
  // -------------------------------------------------------------------------
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

// ============================================================================
// ICON NAME PARSING
// ============================================================================

/**
 * Parses an icon name to extract its base name and variant.
 * 
 * Fluent UI icons follow the naming pattern: {BaseName}{Variant}
 * - BaseName: The descriptive part (e.g., "AddCircle", "ArrowLeft")
 * - Variant: The style suffix ("Regular", "Filled", or "Color")
 * 
 * @example
 * parseIconName("AddCircleRegular") // { baseName: "AddCircle", variant: "Regular" }
 * parseIconName("HeartFilled")      // { baseName: "Heart", variant: "Filled" }
 * parseIconName("FlagColor")        // { baseName: "Flag", variant: "Color" }
 * 
 * @param name - Full icon name
 * @returns Object with baseName and variant properties
 */
function parseIconName(name: string): { baseName: string; variant: string } {
  // Match pattern: anything + (Regular|Filled|Color) at the end
  const match = name.match(/^(.+?)(Regular|Filled|Color)$/);
  if (match) {
    return {
      baseName: match[1],
      variant: match[2],
    };
  }
  // Fallback for icons that don't match the pattern
  return { baseName: name, variant: "" };
}

// ============================================================================
// SEARCH INDEX INITIALIZATION
// ============================================================================

/**
 * Prepare icon data for Fuse.js search.
 * We pre-parse all icon names to enable searching on both full names and base names.
 * This allows "add" to match "AddCircleRegular" through the baseName field.
 */
const iconSearchItems: IconSearchItem[] = (FLUENT_ICON_NAMES as unknown as string[]).map((name) => {
  const { baseName, variant } = parseIconName(name);
  return { name, baseName, variant };
});

/**
 * Primary Fuse.js instance for fuzzy searching icon names.
 * 
 * Configuration explained:
 * - keys: Search on both baseName and full name
 * - threshold: 0.1 = strict matching (lower = stricter, 0 = exact only)
 * - distance: 100 = how far apart matches can be within the string
 * - includeScore: true = include match quality score in results
 * - minMatchCharLength: 2 = ignore very short matches
 * - ignoreLocation: true = match anywhere in the string, not just at start
 */
const iconFuse = new Fuse(iconSearchItems, {
  keys: ["baseName", "name"],
  threshold: 0.1,
  distance: 100,
  includeScore: true,
  minMatchCharLength: 2,
  ignoreLocation: true,
});

/**
 * Semantic key matching Fuse instance.
 * Used to fuzzy-match user queries against our semantic mapping keys.
 * For example, "favorit" (typo) would match "favorite" in our mapping.
 */
const semanticKeys = Object.keys(semanticIconMapping);
const semanticFuse = new Fuse(semanticKeys, {
  threshold: 0.1,
  distance: 50,
  includeScore: true,
  minMatchCharLength: 2,
});

// ============================================================================
// SYNONYM LOOKUP (synonyms package + WordNet fallback)
// ============================================================================

/**
 * Retrieves synonyms for a word using a two-tier approach:
 * 
 * 1. SYNONYMS PACKAGE (fast, synchronous)
 *    Uses the lightweight `synonyms` npm package for instant lookups.
 *    Returns undefined for many words, so we need a fallback.
 * 
 * 2. WORDNET (slower, async, more comprehensive)
 *    Used as fallback when `synonyms` doesn't have the word.
 *    WordNet is a lexical database with broader coverage.
 * 
 * Results are cached to avoid repeated lookups.
 * 
 * @param word - The word to look up synonyms for
 * @returns Promise resolving to array of synonym strings (max 10)
 */
function getSynonyms(word: string): Promise<string[]> {
  // Check cache first
  const cached = synonymCache.get(word);
  if (cached !== undefined) {
    return Promise.resolve(cached);
  }
  
  const allSynonyms = new Set<string>();
  
  // TIER 1: Try synonyms package first (fast, synchronous)
  try {
    const synResult = synonymsLib(word);
    if (synResult) {
      // synResult is { n: [...], v: [...], adj: [...], ... } by part of speech
      for (const posSynonyms of Object.values(synResult)) {
        if (Array.isArray(posSynonyms)) {
          for (const syn of posSynonyms) {
            const clean = syn.toLowerCase().replace(/[_\s]/g, "");
            if (clean !== word && clean.length >= 3) {
              allSynonyms.add(clean);
            }
          }
        }
      }
    }
  } catch {
    // synonyms package may throw for unknown words
  }
  
  // If synonyms package found results, use those (faster)
  if (allSynonyms.size > 0) {
    const limited = [...allSynonyms].slice(0, 10);
    synonymCache.set(word, limited);
    return Promise.resolve(limited);
  }
  
  // TIER 2: Fall back to WordNet (slower but more comprehensive)
  return new Promise((resolve) => {
    wordnet.lookup(word, (results) => {
      // Iterate through all synsets (synonym sets) for this word
      for (const result of results) {
        for (const synonym of result.synonyms) {
          // WordNet often returns compound words with underscores like "scientific_discipline"
          // Split these and add each part as a separate synonym for better matching
          const parts = synonym.toLowerCase().split("_");
          
          for (const part of parts) {
            // Filter: not the same word, at least 3 chars
            if (part !== word && part.length >= 3) {
              allSynonyms.add(part);
            }
          }
        }
      }
      
      // Limit to top 15 synonyms
      const limited = [...allSynonyms].slice(0, 15);
      synonymCache.set(word, limited);
      resolve(limited);
    });
  });
}

// ============================================================================
// SUBSTRING MATCHING
// ============================================================================

/**
 * Calculates a substring match score for an icon name.
 * 
 * This function checks if any query word appears as a substring in the icon name.
 * It differentiates between two types of matches:
 * 
 * 1. WORD BOUNDARY MATCH (score: 250)
 *    The search term starts at a word boundary in the PascalCase name.
 *    Example: "beer" in "DrinkBeer" - "beer" starts at the capital B
 *    
 * 2. EMBEDDED MATCH (score: 150)
 *    The search term appears inside a word.
 *    Example: "beer" in "GlobeError" - "beer" is embedded in "Glo[beer]ror"
 * 
 * Word boundary detection for PascalCase:
 * - Start of string (index 0)
 * - Transition from lowercase to uppercase (e.g., "k" to "B" in "DrinkBeer")
 * 
 * @param iconName - The icon name to check
 * @param queryWords - Array of search term words (lowercased)
 * @returns Score (0 if no match, 150 for embedded, 250 for word-boundary)
 */
function getSubstringMatchScore(iconName: string, queryWords: string[]): number {
  const nameLower = iconName.toLowerCase();
  let bestScore = 0;
  
  for (const word of queryWords) {
    const idx = nameLower.indexOf(word);
    if (idx === -1) continue; // No match for this word
    
    // Determine if this is a word boundary match
    // For PascalCase names, word boundaries occur at:
    // 1. Start of the string
    // 2. Uppercase letters following lowercase letters
    const beforeChar = idx > 0 ? iconName[idx - 1] : "";
    const matchChar = iconName[idx];
    
    const isWordBoundary = 
      idx === 0 ||  // Start of string
      (beforeChar === beforeChar.toLowerCase() && matchChar === matchChar.toUpperCase()) ||
      (beforeChar.toUpperCase() === beforeChar && /[A-Z]/.test(beforeChar));
    
    if (isWordBoundary) {
      bestScore = Math.max(bestScore, 250); // High score for word-boundary match
    } else {
      bestScore = Math.max(bestScore, 150); // Lower score for embedded match
    }
  }
  
  return bestScore;
}

// ============================================================================
// MAIN SEARCH FUNCTION
// ============================================================================

/**
 * Search for icons matching a query using multi-layered matching strategy.
 * 
 * This is the main entry point for icon search. It combines multiple search
 * strategies to provide comprehensive results:
 * 
 * SEARCH FLOW:
 * 
 * 1. DIRECT SUBSTRING MATCHING (Score: 150-250)
 *    First, scan all icons for exact substring matches.
 *    This ensures "beer" finds "DrinkBeer" even if fuzzy search would miss it.
 *    Word-boundary matches score higher (250) than embedded matches (150).
 * 
 * 2. FUZZY NAME MATCHING (Score: 0-100)
 *    Use Fuse.js to find typo-tolerant matches on icon names.
 *    "calender" would match "Calendar" despite the typo.
 *    Score is inversely proportional to Fuse.js distance score.
 * 
 * 3. SEMANTIC MAPPING (Score: 50-70)
 *    Map user intent to icon patterns using our custom mapping.
 *    "save" → searches for "Save", "Download", "Disk" icons.
 *    Also does fuzzy matching on semantic keys ("favorit" → "favorite").
 * 
 * 4. WORDNET SYNONYMS (Score: 40-55) - Always runs
 *    Expands search using dictionary synonyms from WordNet.
 *    "science" → "chemistry" → Beaker icons (via semantic bridge).
 *    "automobile" → "car" → VehicleCar icons.
 *    Semantic bridging (synonym → semantic key) scores 55.
 *    Direct synonym matching scores 40.
 * 
 * SCORING PRIORITY:
 * - Higher scores appear first in results
 * - Substring matches (150-250) beat fuzzy matches (0-100)
 * - Direct semantic matches (70) beat fuzzy semantic matches (50)
 * - WordNet→semantic bridge (55) beats direct WordNet (40)
 * - Regular variants preferred over Filled when scores are equal
 * 
 * @param query - User's search query (can be multiple words)
 * @param maxResults - Maximum number of results to return (default: 20)
 * @param threshold - Fuse.js threshold for fuzzy matching (0=exact, 1=loose, default: 0.1)
 * @returns Promise resolving to array of IconResult objects
 */
export async function searchIcons(
  query: string, 
  maxResults: number = 20, 
  threshold: number = 0.1
): Promise<IconResult[]> {
  // Normalize query: lowercase and split into words
  const queryLower = query.toLowerCase().trim();
  const queryWords = queryLower.split(/\s+/).filter(w => w.length > 0);
  
  // Map to track best score for each icon (icon name → score)
  const iconScores = new Map<string, number>();
  
  // -------------------------------------------------------------------------
  // LAYER 0: Direct substring matching (highest priority)
  // -------------------------------------------------------------------------
  // This ensures icons containing the exact search term always appear first.
  // Example: "beer" should find "DrinkBeerRegular" before "GlobeErrorRegular"
  // even though both contain the letters b-e-e-r.
  for (const item of iconSearchItems) {
    const score = getSubstringMatchScore(item.name, queryWords);
    if (score > 0) {
      iconScores.set(item.name, score);
    }
  }
  
  // -------------------------------------------------------------------------
  // LAYER 1: Fuzzy name matching with Fuse.js
  // -------------------------------------------------------------------------
  // Create a temporary Fuse instance with the user-specified threshold.
  // This allows runtime adjustment of fuzzy matching strictness.
  const searchFuse = new Fuse(iconSearchItems, {
    keys: ["baseName", "name"],
    threshold: threshold,
    distance: 100,
    includeScore: true,
    minMatchCharLength: 2,
    ignoreLocation: true,
  });
  
  // Search and score results
  const directResults = searchFuse.search(queryLower, { limit: maxResults * 2 });
  for (const result of directResults) {
    // Convert Fuse score (0 = perfect, 1 = worst) to our scale (100 = perfect, 0 = worst)
    const score = 100 - (result.score || 0) * 100;
    
    // Only update if not already set by substring match (which has higher score)
    const existingScore = iconScores.get(result.item.name) || 0;
    if (score > existingScore) {
      iconScores.set(result.item.name, score);
    }
  }
  
  // -------------------------------------------------------------------------
  // LAYER 2: Semantic/intent-based search
  // -------------------------------------------------------------------------
  // This layer maps user concepts to icon patterns using our custom mapping.
  for (const word of queryWords) {
    // 2a. Direct semantic key match
    // If the word exactly matches a semantic key, search for all mapped patterns
    if (semanticIconMapping[word]) {
      for (const pattern of semanticIconMapping[word]) {
        const semanticResults = iconFuse.search(pattern, { limit: 10 });
        for (const result of semanticResults) {
          // Semantic matches score slightly lower than direct matches
          const score = 70 - (result.score || 0) * 50;
          iconScores.set(
            result.item.name, 
            Math.max(iconScores.get(result.item.name) || 0, score)
          );
        }
      }
    }
    
    // 2b. Fuzzy semantic key match
    // Try to match the word against semantic keys with typo tolerance
    // This handles cases like "favorit" → "favorite"
    const fuzzySemanticMatches = semanticFuse.search(word, { limit: 5 });
    for (const semanticMatch of fuzzySemanticMatches) {
      const semanticKey = semanticMatch.item;
      const patterns = semanticIconMapping[semanticKey];
      
      if (patterns) {
        for (const pattern of patterns) {
          const semanticResults = iconFuse.search(pattern, { limit: 8 });
          for (const result of semanticResults) {
            // Lower score for fuzzy semantic matches (double fuzzy penalty)
            const score = 50 - (result.score || 0) * 30 - (semanticMatch.score || 0) * 20;
            iconScores.set(
              result.item.name, 
              Math.max(iconScores.get(result.item.name) || 0, score)
            );
          }
        }
      }
    }
  }
  
  // -------------------------------------------------------------------------
  // LAYER 3: Synonym expansion (synonyms package + WordNet fallback)
  // -------------------------------------------------------------------------
  // Synonym expansion helps discover related concepts even when we have
  // some results. For example, "science" → "chemistry" → Beaker icons.
  // This bridges terms that aren't in our semantic mapping through dictionary
  // relationships.
  for (const word of queryWords) {
    const synonyms = await getSynonyms(word);
    
    // Debug logging - helps diagnose synonym expansion
    if (synonyms.length > 0) {
      console.log(`[Synonyms] "${word}" → [${synonyms.join(", ")}]`);
    }
    
    for (const synonym of synonyms) {
      // 3a. Check if synonym matches a semantic key (PRIORITY)
      // This bridges WordNet → our custom mapping
      // e.g., "science" → WordNet "chemistry" → semantic "chemistry" → Beaker
      if (semanticIconMapping[synonym]) {
        for (const pattern of semanticIconMapping[synonym]) {
          const semanticResults = iconFuse.search(pattern, { limit: 8 });
          for (const result of semanticResults) {
            // Higher score for semantic bridging (55) than direct WordNet search (40)
            const score = 55 - (result.score || 0) * 30;
            iconScores.set(
              result.item.name, 
              Math.max(iconScores.get(result.item.name) || 0, score)
            );
          }
        }
      }
      
      // 3b. Search icons directly with the synonym
      const synonymResults = iconFuse.search(synonym, { limit: 5 });
      for (const result of synonymResults) {
        // WordNet direct matches score lower than semantic matches
        const score = 40 - (result.score || 0) * 30;
        iconScores.set(
          result.item.name, 
          Math.max(iconScores.get(result.item.name) || 0, score)
        );
      }
    }
  }
  
  // -------------------------------------------------------------------------
  // LAYER 4: Visual tag matching
  // -------------------------------------------------------------------------
  // Match icons by visual/conceptual characteristics.
  // This finds icons that LOOK like or represent the search term,
  // even if the name doesn't contain it.
  // Example: "circular" → finds Circle, Record, Sun icons
  //          "navigation" → finds Arrow, Compass, Map icons
  for (const word of queryWords) {
    // 4a. Direct tag match - word matches a visual tag exactly
    const tagIndex = TAG_DICTIONARY.indexOf(word);
    if (tagIndex !== -1) {
      // Find all icons with this tag
      for (const [baseName, tags] of Object.entries(ICON_VISUAL_TAGS)) {
        if (tags.includes(tagIndex)) {
          // Add both Regular and Filled variants
          for (const variant of ["Regular", "Filled"]) {
            const iconName = baseName + variant;
            if ((FLUENT_ICON_NAMES as readonly string[]).includes(iconName)) {
              const score = 60; // Visual tag direct match
              iconScores.set(
                iconName,
                Math.max(iconScores.get(iconName) || 0, score)
              );
            }
          }
        }
      }
    }
    
    // 4b. Fuzzy tag match - find tags similar to the search word
    const tagFuseResults = new Fuse(TAG_DICTIONARY, {
      threshold: 0.3,
      includeScore: true,
    }).search(word, { limit: 3 });
    
    for (const tagMatch of tagFuseResults) {
      const matchedTagIndex = TAG_DICTIONARY.indexOf(tagMatch.item);
      if (matchedTagIndex === -1) continue;
      
      // Find icons with this tag
      for (const [baseName, tags] of Object.entries(ICON_VISUAL_TAGS)) {
        if (tags.includes(matchedTagIndex)) {
          for (const variant of ["Regular", "Filled"]) {
            const iconName = baseName + variant;
            if ((FLUENT_ICON_NAMES as readonly string[]).includes(iconName)) {
              // Score decreases with fuzzy distance
              const score = 45 - (tagMatch.score || 0) * 30;
              iconScores.set(
                iconName,
                Math.max(iconScores.get(iconName) || 0, score)
              );
            }
          }
        }
      }
    }
  }
  
  // -------------------------------------------------------------------------
  // SORT AND FORMAT RESULTS
  // -------------------------------------------------------------------------
  const sortedIcons = [...iconScores.entries()]
    .sort((a, b) => {
      // Primary sort: by score (higher is better)
      if (b[1] !== a[1]) return b[1] - a[1];
      
      // Secondary sort: prefer "Regular" variant over "Filled"
      // This is a UX decision - Regular is typically the default style
      const aRegular = a[0].endsWith("Regular") ? 1 : 0;
      const bRegular = b[0].endsWith("Regular") ? 1 : 0;
      return bRegular - aRegular;
    })
    .slice(0, maxResults);
  
  // Transform to IconResult format
  return sortedIcons.map(([name, score]) => {
    const { baseName, variant } = parseIconName(name);
    const availableSizes = getIconSizes(name);
    
    // Determine which layer produced this score
    // Priority order: substring > semantic > visual > wordnet > fuzzy
    let scoreLayer: 'substring' | 'fuzzy' | 'semantic' | 'visual' | 'wordnet';
    if (score >= 150) {
      scoreLayer = 'substring'; // 150-250: direct substring match
    } else if (score >= 50 && score <= 70) {
      scoreLayer = 'semantic'; // 50-70: semantic mapping
    } else if (score >= 45 && score < 50) {
      scoreLayer = 'visual'; // 45-60: visual tag match (lower range)
    } else if (score >= 40 && score < 45) {
      scoreLayer = 'wordnet'; // 40-55: WordNet synonyms (lower range)
    } else {
      scoreLayer = 'fuzzy'; // 0-100: fuzzy name match (fallback)
    }
    
    return {
      name,
      jsxElement: `<${name} />`,
      importStatement: `import { ${name} } from "@fluentui/react-icons";`,
      category: variant || "Icon",
      availableSizes,
      score: Math.round(score),
      scoreLayer,
    };
  });
}

// ============================================================================
// EXPORTS
// ============================================================================

export { semanticIconMapping };
