# Fluent UI Icons - MCP App

An MCP App for exploring and searching **Fluent UI React V9 icons** from `@fluentui/react-icons`.

<img width="783" height="1075" alt="image" src="https://github.com/user-attachments/assets/4e690a63-3787-49c1-a962-1c508c1bdf25" />
<br />
<br />
<img width="377" height="308" alt="image" src="https://github.com/user-attachments/assets/fcec4455-b474-4976-b330-683284dc91ce" />


## Features

- 🔍 **Fuzzy Search** - Natural language search with semantic matching and WordNet synonyms
- 📏 **Size Variants** - Toggle between unsized and pixel-specific icon sizes (10, 12, 16, 20, 24, 28, 32, 48)
- 👀 **Visual Preview** - See icons rendered in a grid with live previews
- 📋 **Copy Code** - Get ready-to-use JSX and import statements
- 📥 **Add Import** - Insert import statements directly into your code via Copilot
<img width="974" height="475" alt="image" src="https://github.com/user-attachments/assets/94324d86-0ae6-48c2-815c-21c1cc1ec91a" />

- 🌙 **Dark/Light Mode** - Toggle between themes with persistent preference
- 🎨 **Fluent UI Styling** - Built with Griffel and Fluent UI tokens

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Build the App

```bash
npm run build
```

### 3. Run the Server

```bash
npm run serve
```

The server will start at `http://localhost:3001/mcp`

### 4. Development Mode

For development with hot-reload:

```bash
npm run dev
```

## Usage with VS Code

### Option 1: User Settings (Global)

Add this to your VS Code User Settings (`settings.json`):

```json
{
  "mcp": {
    "servers": {
      "fluentui-icons": {
        "url": "http://localhost:3001/mcp"
      }
    }
  }
}
```

### Option 2: Workspace Settings (Per Project)

Create or edit `.vscode/mcp.json` in your workspace:

```json
{
  "servers": {
    "fluentui-icons": {
      "url": "http://localhost:3001/mcp"
    }
  }
}
```

### Using the App

1. Start the server: `npm run serve`
2. Open GitHub Copilot Chat in VS Code
3. Ask Copilot to search for icons (e.g., "Find me a calendar icon")
4. The MCP App UI will appear with search results
5. Click an icon to see details, copy JSX, or add the import to your file

## Usage with Claude Desktop

Add this to your Claude Desktop configuration file:

**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "fluentui-icons": {
      "url": "http://localhost:3001/mcp"
    }
  }
}
```

## Testing with Basic Host

You can test the MCP App using the basic-host from the ext-apps repository:

```bash
# Terminal 1: Run your server
npm run serve

# Terminal 2: Run basic-host (from cloned ext-apps repo)
cd temp-mcp-reference/examples/basic-host
npm install
SERVERS='["http://localhost:3001/mcp"]' npm run start
# Open http://localhost:8080
```

## Tool: search-fluentui-icons

Search for Fluent UI icons by name or description.

### Input Schema

```typescript
{
  query: string;       // Search query (e.g., "add", "calendar", "arrow")
  maxResults?: number; // Max results (default: 20)
  threshold?: number;  // Fuzzy matching threshold 0-1 (default: 0.1, lower = stricter)
}
```

### Search Algorithm

The search uses **multi-layered additive scoring** where all matching layers contribute to the final score (capped at 100):

| Layer | Max Points | Description |
|-------|------------|-------------|
| **Exact** | 100 | Full word match in icon name (e.g., "save" matches "Save" in SaveRegular) |
| **Contained** | 75 | Query found within icon word, for words > 4 chars (e.g., "agent" in "Agents") |
| **Semantic** | 25 | Concept mapping (e.g., "save" → Save, Download, Disk icons) |
| **Visual** | 25 | Visual tag matching from curated icon descriptions |
| **Synonym** | 20 | Dictionary expansion via WordNet (e.g., "trash" → "delete") |
| **Fuzzy** | 15 | Fuse.js name similarity for typo tolerance |

Click the **ℹ️ Scoring** button in the header to see this breakdown in the UI.

#### How Scoring Works



1. **Additive scoring**: Each layer adds points independently. An icon matching multiple layers scores higher than one matching a single layer.

2. **Score capping**: The total score is capped at 100 points. An exact substring match immediately gives 100 pts.

3. **Score breakdown example** for searching "save":
   - `SaveRegular` → 100 pts (exact word match)
   - `ArrowDownloadRegular` → 40 pts (25 semantic + 15 fuzzy)
   - `DiskRegular` → 25 pts (semantic mapping only)

   For searching "agent":
   - `AgentsRegular` → 90 pts (75 contained + 15 fuzzy)

4. **Score badge colors** in the UI:
   - 🟢 **Green** (80-100): Excellent match
   - 🔵 **Blue** (50-79): Good match  
   - 🟡 **Yellow** (25-49): Moderate match
   - ⚫ **Gray** (0-24): Weak match

5. **Threshold parameter**: Controls fuzzy matching strictness (0 = exact only, 1 = match anything). Default is 0.1 (strict). This applies to all fuzzy operations across all layers.

Icons matching multiple layers rank higher. The `threshold` parameter controls fuzzy matching strictness across all layers.

### Example Prompts

- "Find icons for adding items"
- "Search for calendar icons"
- "Show me arrow icons"
- "I need a save or download icon"
- "Find running or shoe icons" (uses sports semantic mappings)

## Project Structure

```
fluentui-icons-mcp-app/
├── server.ts              # MCP server with tool & resource registration
├── main.ts                # Express HTTP server setup
├── mcp-app.html           # HTML entry point
├── src/
│   ├── mcp-app.tsx        # React UI component
│   ├── mcp-app.styles.ts  # Griffel styles with Fluent UI tokens
│   ├── icon-registry.tsx  # 5,684 explicit icon imports
│   ├── icon-names.ts      # Static list of unsized icon names
│   ├── icon-sizes.ts      # Mapping of base names to available sizes
│   ├── icon-visual-tags.ts # Visual tags for semantic search
│   ├── components/        # React UI components
│   │   ├── Header.tsx
│   │   ├── SearchBar.tsx
│   │   ├── IconsGrid.tsx
│   │   ├── IconCard.tsx
│   │   ├── DetailPanel.tsx
│   │   └── ScoringInfoTooltip.tsx  # Scoring explanation popover
│   ├── services/
│   │   └── iconSearchService.ts  # Multi-layer search algorithm
│   ├── types/
│   │   └── icons.ts       # TypeScript type definitions
│   ├── utils/
│   │   ├── iconHelpers.ts
│   │   └── parseToolResult.ts
│   └── assets/
│       └── mcp.png        # MCP logo
├── scripts/
│   ├── generate-icon-list.ts      # Generate icon names
│   ├── generate-icon-sizes.ts     # Generate size mappings
│   ├── generate-icon-registry.ts  # Generate icon imports
│   └── generate-icon-visual-tags.ts # Generate visual tags
├── package.json
├── tsconfig.json
├── tsconfig.server.json
└── vite.config.ts         # Vite bundler config with singlefile plugin
```

## Tech Stack

- **MCP SDK**: `@modelcontextprotocol/ext-apps`, `@modelcontextprotocol/sdk`
- **UI Framework**: React 18 with Fluent UI React Components v9
- **Styling**: Griffel (CSS-in-JS) with Fluent UI tokens
- **Icons**: `@fluentui/react-icons` (5,684 unsized icons)
- **Search**: Fuse.js for fuzzy matching, WordNet for synonyms
- **Bundler**: Vite with `vite-plugin-singlefile` (~3.9MB single HTML)
- **Server**: Express with SSE transport

## License

MIT
