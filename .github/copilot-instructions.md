# Copilot Instructions for Fluent UI Icons MCP App

This is a Model Context Protocol (MCP) App that provides a visual icon search tool for `@fluentui/react-icons`. It consists of an Express server exposing MCP tools and a React UI bundled as a single HTML file.

## Architecture Overview

```
main.ts          → Express HTTP server with SSE transport (entry point)
server.ts        → MCP server: registers tools, resources, and search logic
src/mcp-app.tsx  → React UI component (renders in MCP host like VS Code)
src/icon-registry.tsx → Dynamic icon imports (auto-generated)
src/icon-names.ts     → Static list of icon names (auto-generated)
src/icon-sizes.ts     → Icon size mappings (auto-generated)
```

**Data Flow**: Client connects via SSE → `main.ts` creates transport → `server.ts` handles tool calls → returns results to UI

## Build & Run Commands

```bash
npm run build    # Compile TypeScript + bundle UI into dist/mcp-app.html
npm run serve    # Start server at http://localhost:3001/mcp
npm run dev      # Watch mode with concurrent build + serve
```

The build produces a **single ~3.9MB HTML file** using `vite-plugin-singlefile` that embeds all React/Fluent UI code.

## Code Generation Scripts

When updating icon support, regenerate these files:

```bash
npx tsx scripts/generate-icon-list.ts   # → src/icon-names.ts
npx tsx scripts/generate-icon-sizes.ts  # → src/icon-sizes.ts
npx tsx scripts/generate-icon-registry.ts # → src/icon-registry.tsx
```

These parse `node_modules/@fluentui/react-icons` declaration files to extract icon metadata.

## Key Patterns

### MCP Tool Registration (server.ts)
Use `registerAppTool()` from `@modelcontextprotocol/ext-apps/server` with Zod schemas:
```typescript
registerAppTool(server, "tool-name", {
  title: "...",
  description: "...",
  inputSchema: { query: z.string(), maxResults: z.number().optional() },
  _meta: { ui: { resourceUri } },  // Links tool to UI resource
}, async (args) => { /* handler */ });
```

### Styling (src/mcp-app.styles.ts)
All styles use **Griffel** with **Fluent UI tokens** for theming:
```typescript
import { makeStyles, tokens } from "@fluentui/react-components";
backgroundColor: tokens.colorNeutralBackground1,  // NOT hardcoded colors
```

### Icon Search (server.ts)
The search uses layered matching:
1. **Semantic mapping** (`semanticIconMapping`) - maps concepts like "save" → ["Save", "Download", "Disk"]
2. **Fuse.js fuzzy search** - matches icon names with configurable threshold
3. **WordNet synonyms** - expands search terms using `natural` library

### React UI Hooks (src/mcp-app.tsx)
Use MCP ext-apps React hooks for host integration:
```typescript
const { app } = useApp({ onAppCreated: (app) => { app.ontoolresult = ... } });
useHostStyles(app);  // Apply host theme
```

## File Naming Conventions

- **Icons**: Names follow pattern `{BaseName}{Variant}` (e.g., `AddRegular`, `AddFilled`)
- **Sized icons**: Pattern `{BaseName}{Size}{Variant}` (e.g., `Add24Regular`)
- Generated files have header comments indicating regeneration command

## Testing

No automated tests currently. Manual testing workflow:
1. Run `npm run serve`
2. Connect via VS Code MCP settings or basic-host example
3. Invoke `search-fluentui-icons` tool with various queries
