/**
 * @file Fluent UI Icons Explorer MCP App
 * Displays Fluent UI React icons with their JSX code and import statements.
 */
import type { App, McpUiHostContext } from "@modelcontextprotocol/ext-apps";
import { useApp, useHostStyles } from "@modelcontextprotocol/ext-apps/react";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { Search24Regular } from "@fluentui/react-icons";
import { FluentProvider, webLightTheme, webDarkTheme, ToggleButton } from "@fluentui/react-components";
import { getIconComponent } from "./icon-registry";
import { StrictMode, useCallback, useEffect, useState, useMemo } from "react";
import { createRoot } from "react-dom/client";
import styles from "./mcp-app.module.css";

// Type for icon result from the server
interface IconResult {
  name: string;
  jsxElement: string;
  importStatement: string;
  category: string;
  availableSizes?: string[];
}

interface StructuredContent {
  query: string;
  icons: IconResult[];
  totalCount: number;
}

/**
 * Parse structured content from tool result
 */
function parseToolResult(result: CallToolResult): StructuredContent | null {
  // Check for structured content first
  if (result.structuredContent) {
    const sc = result.structuredContent as Record<string, unknown>;
    if (sc.query !== undefined && sc.icons !== undefined && sc.totalCount !== undefined) {
      return sc as unknown as StructuredContent;
    }
  }
  
  // Fallback: Try to parse from text content
  const textContent = result.content?.find((c) => c.type === "text");
  if (!textContent || textContent.type !== "text") return null;
  
  // Parse the text output format
  const lines = textContent.text.split("\n");
  const icons: IconResult[] = [];
  
  let currentIcon: Partial<IconResult> = {};
  for (const line of lines) {
    const nameMatch = line.match(/^\d+\.\s+(\w+)/);
    if (nameMatch) {
      if (currentIcon.name) {
        icons.push(currentIcon as IconResult);
      }
      currentIcon = { name: nameMatch[1], category: "Icon" };
    }
    
    const jsxMatch = line.match(/JSX:\s*(.+)/);
    if (jsxMatch) {
      currentIcon.jsxElement = jsxMatch[1];
    }
    
    const importMatch = line.match(/Import:\s*(.+)/);
    if (importMatch) {
      currentIcon.importStatement = importMatch[1];
    }
  }
  
  if (currentIcon.name) {
    icons.push(currentIcon as IconResult);
  }
  
  const queryMatch = lines[0]?.match(/matching "(.+?)"/);
  
  return {
    query: queryMatch?.[1] || "",
    icons,
    totalCount: icons.length,
  };
}

/**
 * Main App Component
 */
function FluentUIIconsApp() {
  const [toolResult, setToolResult] = useState<CallToolResult | null>(null);
  const [hostContext, setHostContext] = useState<McpUiHostContext | undefined>();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { app, error: connectionError } = useApp({
    appInfo: { name: "Fluent UI Icons Explorer", version: "1.0.0" },
    capabilities: {},
    onAppCreated: (app) => {
      app.onteardown = async () => {
        console.info("App is being torn down");
        return {};
      };

      app.ontoolinput = async (input) => {
        console.info("Received tool input:", input);
        // Pre-populate search from tool input
        if (input.arguments?.query) {
          setSearchQuery(input.arguments.query as string);
        }
      };

      app.ontoolresult = async (result) => {
        console.info("Received tool result:", result);
        setToolResult(result);
        setIsSearching(false);
      };

      app.ontoolcancelled = () => {
        setIsSearching(false);
      };

      app.onerror = (err) => {
        console.error("App error:", err);
        setError(String(err));
        setIsSearching(false);
      };

      app.onhostcontextchanged = (params) => {
        setHostContext((prev) => ({ ...prev, ...params }));
      };
    },
  });

  // Apply host styles for theme integration
  useHostStyles(app);

  useEffect(() => {
    if (app) {
      setHostContext(app.getHostContext());
    }
  }, [app]);

  if (connectionError) {
    return (
      <div className={styles.app}>
        <div className={styles.error}>
          <strong>Connection Error:</strong> {connectionError.message}
        </div>
      </div>
    );
  }

  if (!app) {
    return (
      <div className={styles.app}>
        <div className={styles.loading}>Connecting...</div>
      </div>
    );
  }

  return (
    <FluentUIIconsAppInner
      app={app}
      toolResult={toolResult}
      hostContext={hostContext}
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      isSearching={isSearching}
      setIsSearching={setIsSearching}
      error={error}
      setError={setError}
    />
  );
}

interface AppInnerProps {
  app: App;
  toolResult: CallToolResult | null;
  hostContext?: McpUiHostContext;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isSearching: boolean;
  setIsSearching: (searching: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
}

/**
 * Helper to compute sized icon name from unsized icon name
 * e.g., "SendRegular" + "24" => "Send24Regular"
 */
function getSizedIconName(unsizedName: string, size: string | null): string {
  if (!size) return unsizedName;
  
  // Pattern: BaseName + Variant (Regular/Filled/Color)
  const match = unsizedName.match(/^(.+?)(Regular|Filled|Color)$/);
  if (match) {
    return `${match[1]}${size}${match[2]}`;
  }
  return unsizedName;
}

/**
 * IconCard component with size toggle buttons
 */
interface IconCardProps {
  icon: IconResult;
  isSelected: boolean;
  onSelect: (icon: IconResult, selectedSize: string | null) => void;
}

function IconCard({ icon, isSelected, onSelect }: IconCardProps) {
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  
  // Build size options: "--" for unsized, then available pixel sizes
  const sizeOptions = useMemo(() => {
    const options: (string | null)[] = [null]; // null represents unsized "--"
    if (icon.availableSizes && icon.availableSizes.length > 0) {
      options.push(...icon.availableSizes);
    }
    return options;
  }, [icon.availableSizes]);
  
  // Get the display icon name based on selected size
  const displayIconName = useMemo(() => {
    return getSizedIconName(icon.name, selectedSize);
  }, [icon.name, selectedSize]);
  
  // Calculate icon size in pixels (unsized = 32px)
  const iconSizePx = selectedSize ? parseInt(selectedSize, 10) : 32;
  
  const IconComponent = getIconComponent(icon.name);
  
  const handleSizeClick = useCallback((size: string | null, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card selection when clicking size buttons
    setSelectedSize(size);
  }, []);
  
  const handleCardClick = useCallback(() => {
    onSelect({ 
      ...icon, 
      name: displayIconName,
      jsxElement: `<${displayIconName} />`,
      importStatement: `import { ${displayIconName} } from "@fluentui/react-icons";`
    }, selectedSize);
  }, [icon, displayIconName, selectedSize, onSelect]);

  return (
    <div
      className={`${styles.iconCard} ${isSelected ? styles.selected : ""}`}
      onClick={handleCardClick}
    >
      <div className={styles.iconPreview}>
        {IconComponent ? <IconComponent style={{ fontSize: `${iconSizePx}px` }} /> : "?"}
      </div>
      <div className={styles.iconName}>{displayIconName}</div>
      <div className={styles.iconVariant}>{icon.category}</div>
      
      {/* Size Toggle Buttons */}
      {sizeOptions.length > 1 && (
        <div className={styles.sizeToggleGroup}>
          {sizeOptions.map((size) => (
            <ToggleButton
              key={size ?? "unsized"}
              size="small"
              shape="rounded"
              appearance={selectedSize === size ? "secondary" : "subtle"}
              checked={selectedSize === size}
              onClick={(e) => handleSizeClick(size, e)}
              className={styles.sizeToggleButton}
            >
              {size ?? "--"}
            </ToggleButton>
          ))}
        </div>
      )}
    </div>
  );
}

function FluentUIIconsAppInner({
  app,
  toolResult,
  hostContext,
  searchQuery,
  setSearchQuery,
  isSearching,
  setIsSearching,
  error,
  setError,
}: AppInnerProps) {
  const [selectedIcon, setSelectedIcon] = useState<IconResult | null>(null);

  // Parse tool result into structured data
  const iconsData = useMemo(() => {
    if (!toolResult) return null;
    return parseToolResult(toolResult);
  }, [toolResult]);

  // Handle search
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setError(null);
    setSelectedIcon(null);
    
    try {
      const result = await app.callServerTool({
        name: "search-fluentui-icons",
        arguments: { query: searchQuery, maxResults: 30 },
      });
      setToolResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSearching(false);
    }
  }, [app, searchQuery]);

  // Local state for results when callServerTool is used
  const [localResult, setToolResult] = useState<CallToolResult | null>(toolResult);
  
  useEffect(() => {
    setToolResult(toolResult);
  }, [toolResult]);

  const displayData = useMemo(() => {
    if (!localResult) return null;
    return parseToolResult(localResult);
  }, [localResult]);

  // Handle Enter key
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !isSearching) {
        handleSearch();
      }
    },
    [handleSearch, isSearching]
  );

  // Copy to clipboard
  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
  }, []);

  return (
    <main
      className={styles.app}
      style={{
        paddingTop: hostContext?.safeAreaInsets?.top,
        paddingRight: hostContext?.safeAreaInsets?.right,
        paddingBottom: hostContext?.safeAreaInsets?.bottom,
        paddingLeft: hostContext?.safeAreaInsets?.left,
      }}
    >
      {/* Header */}
      <header className={styles.header}>
        <h1 className={styles.title}>Fluent UI Icons</h1>
        <p className={styles.subtitle}>
          Search and explore @fluentui/react-icons for your React projects
        </p>
      </header>

      {/* Search Box */}
      <div className={styles.searchBox}>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Search icons (e.g., 'add', 'calendar', 'arrow')"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isSearching}
        />
        <button
          className={styles.searchButton}
          onClick={handleSearch}
          disabled={isSearching || !searchQuery.trim()}
        >
          {isSearching ? "Searching..." : "Search"}
        </button>
      </div>

      {/* Error State */}
      {error && <div className={styles.error}>{error}</div>}

      {/* Results Info */}
      {displayData && displayData.icons.length > 0 && (
        <div className={styles.resultsInfo}>
          Found {displayData.totalCount} icons matching "{displayData.query}"
        </div>
      )}

      {/* Icons Grid */}
      {displayData && displayData.icons.length > 0 ? (
        <div className={styles.iconsGrid}>
          {displayData.icons.map((icon) => (
            <IconCard
              key={icon.name}
              icon={icon}
              isSelected={selectedIcon?.name === icon.name || 
                Boolean(selectedIcon && icon.name.includes(selectedIcon.name.replace(/\d+/, '')))}
              onSelect={(iconWithSize) => setSelectedIcon(iconWithSize)}
            />
          ))}
        </div>
      ) : displayData ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🔍</div>
          <p>No icons found. Try a different search term.</p>
        </div>
      ) : (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <Search24Regular />
          </div>
          <p>Search for Fluent UI icons to get started</p>
        </div>
      )}

      {/* Detail Panel */}
      {selectedIcon && (
        <div className={styles.detailPanel}>
          <div className={styles.detailHeader}>
            <div className={styles.detailIcon}>
              {(() => {
                const IconComponent = getIconComponent(selectedIcon.name);
                return IconComponent ? <IconComponent /> : "?";
              })()}
            </div>
            <h2 className={styles.detailTitle}>{selectedIcon.name}</h2>
          </div>

          <div className={styles.codeLabel}>Import Statement</div>
          <div className={styles.codeBlock}>
            <code>{selectedIcon.importStatement}</code>
            <button
              className={styles.copyButton}
              onClick={() => copyToClipboard(selectedIcon.importStatement)}
            >
              Copy
            </button>
          </div>

          <div className={styles.codeLabel}>JSX Element</div>
          <div className={styles.codeBlock}>
            <code>{selectedIcon.jsxElement}</code>
            <button
              className={styles.copyButton}
              onClick={() => copyToClipboard(selectedIcon.jsxElement)}
            >
              Copy
            </button>
          </div>

          <div className={styles.codeLabel}>Usage Example</div>
          <div className={styles.codeBlock}>
            <code>{`import { ${selectedIcon.name} } from "@fluentui/react-icons";

function MyComponent() {
  return (
    <button>
      <${selectedIcon.name} /> Click me
    </button>
  );
}`}</code>
            <button
              className={styles.copyButton}
              onClick={() =>
                copyToClipboard(
                  `import { ${selectedIcon.name} } from "@fluentui/react-icons";\n\nfunction MyComponent() {\n  return (\n    <button>\n      <${selectedIcon.name} /> Click me\n    </button>\n  );\n}`
                )
              }
            >
              Copy
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

// Mount the app
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <FluentProvider theme={webLightTheme}>
      <FluentUIIconsApp />
    </FluentProvider>
  </StrictMode>
);
