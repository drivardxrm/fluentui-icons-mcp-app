# Fluent UI MCP App

An MCP App for exploring and searching **Fluent UI React V9 icons** from `@fluentui/react-icons`.

## Features

- 🔍 **Search Icons** - Natural language search for Fluent UI icons (e.g., "add", "calendar", "arrow left")
- 👀 **Visual Preview** - See icons rendered in a grid with live previews
- 📋 **Copy Code** - Get ready-to-use JSX and import statements
- 🎨 **Theme Integration** - Adapts to the host application's theme

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
  query: string;      // Search query (e.g., "add", "calendar", "arrow")
  maxResults?: number; // Max results (default: 20)
}
```

### Example Prompts

- "Find icons for adding items"
- "Search for calendar icons"
- "Show me arrow icons"
- "I need a save or download icon"

## Project Structure

```
fluentui-mcp-app/
├── server.ts          # MCP server with tool & resource registration
├── main.ts            # Express HTTP server setup
├── mcp-app.html       # HTML entry point
├── src/
│   ├── mcp-app.tsx    # React UI component
│   └── mcp-app.module.css # Styles
├── package.json
├── tsconfig.json
├── tsconfig.server.json
└── vite.config.ts     # Vite bundler config with singlefile plugin
```

## Tech Stack

- **MCP SDK**: `@modelcontextprotocol/ext-apps`, `@modelcontextprotocol/sdk`
- **UI Framework**: React 18
- **Icons**: `@fluentui/react-icons` (~2000+ icons)
- **Bundler**: Vite with `vite-plugin-singlefile`
- **Server**: Express with SSE transport

## License

MIT
