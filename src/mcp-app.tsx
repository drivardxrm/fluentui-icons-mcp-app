/**
 * @file Fluent UI Icons Explorer MCP App
 * Displays Fluent UI React icons with their JSX code and import statements.
 */
import type { App, McpUiHostContext } from "@modelcontextprotocol/ext-apps";
import { useApp, useHostStyles } from "@modelcontextprotocol/ext-apps/react";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { Search24Regular, Copy20Regular, Checkmark20Regular, WeatherSunny16Filled, WeatherMoon16Filled, Code16Regular, DocumentAdd16Regular } from "@fluentui/react-icons";
import { FluentProvider, webLightTheme, webDarkTheme, ToggleButton, Divider, SearchBox, Button, Tooltip, mergeClasses, Switch } from "@fluentui/react-components";
import { getIconComponent } from "./icon-registry";
import { StrictMode, useCallback, useEffect, useState, useMemo } from "react";
import { createRoot } from "react-dom/client";
import { useAppStyles } from "./mcp-app.styles";

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
interface FluentUIIconsAppProps {
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

function FluentUIIconsApp({ isDarkMode, onToggleTheme }: FluentUIIconsAppProps) {
  const styles = useAppStyles();
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
      isDarkMode={isDarkMode}
      onToggleTheme={onToggleTheme}
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
  isDarkMode: boolean;
  onToggleTheme: () => void;
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
  /** Controlled size from parent (used when selected) */
  controlledSize?: string | null;
  /** Callback when size changes (used when selected) */
  onSizeChange?: (size: string | null) => void;
  /** Callback to add import statement to file */
  onAddImport?: (importStatement: string) => void;
}

function IconCard({ icon, isSelected, onSelect, controlledSize, onSizeChange, onAddImport }: IconCardProps) {
  const styles = useAppStyles();
  const [internalSize, setInternalSize] = useState<string | null>(null);
  
  // Use controlled size when selected and provided, otherwise use internal state
  const selectedSize = isSelected && controlledSize !== undefined ? controlledSize : internalSize;
  
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
    setInternalSize(size);
    
    // If controlled, notify parent of size change
    if (onSizeChange) {
      onSizeChange(size);
    }
    
    // Update selected icon with new size
    const newDisplayName = getSizedIconName(icon.name, size);
    onSelect({ 
      ...icon, 
      name: newDisplayName,
      jsxElement: `<${newDisplayName} />`,
      importStatement: `import { ${newDisplayName} } from "@fluentui/react-icons";`
    }, size);
  }, [icon, onSelect, onSizeChange]);
  
  const handleCardClick = useCallback(() => {
    onSelect({ 
      ...icon, 
      name: displayIconName,
      jsxElement: `<${displayIconName} />`,
      importStatement: `import { ${displayIconName} } from "@fluentui/react-icons";`
    }, selectedSize);
  }, [icon, displayIconName, selectedSize, onSelect]);

  const handleCopyClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const jsxElement = `<${displayIconName} />`;
    navigator.clipboard.writeText(jsxElement);
  }, [displayIconName]);

  const handleAddImportClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAddImport) {
      const importStatement = `import { ${displayIconName} } from "@fluentui/react-icons";`;
      onAddImport(importStatement);
    }
  }, [displayIconName, onAddImport]);

  return (
    <div
      className={mergeClasses(styles.iconCard, isSelected && styles.iconCardSelected)}
      onClick={handleCardClick}
    >
      {/* Action buttons on selected card */}
      {isSelected && (
        <div className={styles.iconCardActionButtons}>
          {onAddImport && (
            <Tooltip content="Add import to file" relationship="label">
              <Button
                appearance="subtle"
                size="small"
                icon={<DocumentAdd16Regular />}
                onClick={handleAddImportClick}
                className={styles.iconCardCopyButton}
              >
                Import
              </Button>
            </Tooltip>
          )}
          <Tooltip content="Copy JSX" relationship="label">
            <Button
              appearance="subtle"
              size="small"
              icon={<Code16Regular />}
              onClick={handleCopyClick}
              className={styles.iconCardCopyButton}
            >
              Copy
            </Button>
          </Tooltip>
        </div>
      )}
      <div className={styles.iconPreview}>
        {IconComponent ? <IconComponent style={{ fontSize: `${iconSizePx}px` }} /> : "?"}
      </div>
      <div className={styles.iconName}>{displayIconName}</div>
      
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
  isDarkMode,
  onToggleTheme,
}: AppInnerProps) {
  const styles = useAppStyles();
  const [selectedIcon, setSelectedIcon] = useState<IconResult | null>(null);
  const [selectedIconSize, setSelectedIconSize] = useState<string | null>(null);
  const [selectedBaseIcon, setSelectedBaseIcon] = useState<IconResult | null>(null); // Original icon from search
  const [copied, setCopied] = useState(false);
  
  // Copy JSX to clipboard with indicator
  const copyJsxToClipboard = useCallback(() => {
    if (selectedIcon) {
      navigator.clipboard.writeText(selectedIcon.jsxElement);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [selectedIcon]);

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

  // Add import to current file via Copilot
  const addImportToFile = useCallback(async (importStatement: string) => {
    if (!app) return;
    try {
      await app.sendMessage({
        role: "user",
        content: [{
          type: "text",
          text: `Add this import statement to the current file if it doesn't already exist: ${importStatement}`
        }]
      });
    } catch (err) {
      console.error("Failed to send message to add import:", err);
    }
  }, [app]);

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
      {/* Sticky Header Section */}
      <div className={styles.stickyHeader}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.headerRow}>
            <h1 className={styles.title}>Fluent UI Icons</h1>
            <Tooltip content={isDarkMode ? "Dark mode" : "Light mode"} relationship="label">
              <div className={styles.themeToggleContainer}>
                <WeatherSunny16Filled className={styles.themeIcon} />
                <Switch
                  checked={isDarkMode}
                  onChange={onToggleTheme}
                  className={styles.themeSwitch}
                />
                <WeatherMoon16Filled className={styles.themeIcon} />
              </div>
            </Tooltip>
          </div>
          <p className={styles.subtitle}>
            Search and explore @fluentui/react-icons for your React projects
          </p>
        </header>

        {/* Search Box */}
        <div className={styles.searchBox}>
          <SearchBox
            className={styles.searchInput}
            placeholder="Search icons (e.g., 'add', 'calendar', 'arrow')"
            value={searchQuery}
            onChange={(e, data) => setSearchQuery(data.value)}
            onKeyDown={handleKeyDown}
            disabled={isSearching}
            size="large"
          />
        </div>

        {/* Error State */}
        {error && <div className={styles.error}>{error}</div>}

      {/* Results Divider */}
      {displayData && displayData.icons.length > 0 && (
        <Divider className={styles.resultsDivider}>Found {displayData.totalCount} icons matching "{displayData.query}"</Divider>
      )}
      </div>

      {/* Icons Grid */}
      {displayData && displayData.icons.length > 0 ? (
        <div className={styles.iconsGrid}>
          {displayData.icons.map((icon) => {
              const isCardSelected = selectedBaseIcon?.name === icon.name;
              return (
              <IconCard
                key={icon.name}
                icon={icon}
                isSelected={isCardSelected}
                onSelect={(iconWithSize, size) => {
                  setSelectedIcon(iconWithSize);
                  setSelectedIconSize(size);
                  setSelectedBaseIcon(icon); // Store the original unsized icon
                }}
                controlledSize={isCardSelected ? selectedIconSize : undefined}
                onSizeChange={isCardSelected ? setSelectedIconSize : undefined}
                onAddImport={addImportToFile}
              />
            );
          })}
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

      {/* Selected Icon Divider */}
      {selectedIcon && selectedBaseIcon && (
        <Divider className={styles.selectedIconDivider}>Selected Icon</Divider>
      )}

      {/* Detail Panel */}
      {selectedIcon && selectedBaseIcon && (
        <div className={styles.detailPanel}>
          <div className={styles.detailHeader}>
            <div className={styles.detailIcon}>
              {(() => {
                // Get the base (unsized) icon component - extract base name
                const baseName = selectedIcon.name.replace(/\d+(?=Regular|Filled|Color)/, '');
                const IconComponent = getIconComponent(baseName);
                const iconSizePx = selectedIconSize ? parseInt(selectedIconSize, 10) : 32;
                return IconComponent ? <IconComponent style={{ fontSize: `${iconSizePx}px` }} /> : "?";
              })()}
            </div>
            <h2 className={styles.detailTitle}>{selectedIcon.name}</h2>
            
            {/* Size Toggle Buttons beside icon name */}
            {selectedBaseIcon.availableSizes && selectedBaseIcon.availableSizes.length > 0 && (
              <div className={styles.detailSizeToggleContainer}>
                <span className={styles.sizeLabel}>Size</span>
                <div className={styles.sizeToggleGroup}>
                  <ToggleButton
                    size="small"
                    shape="rounded"
                    appearance={selectedIconSize === null ? "secondary" : "subtle"}
                    checked={selectedIconSize === null}
                    onClick={() => {
                      setSelectedIconSize(null);
                      // Update selectedIcon to match
                      const newDisplayName = getSizedIconName(selectedBaseIcon.name, null);
                      setSelectedIcon({
                        ...selectedBaseIcon,
                        name: newDisplayName,
                        jsxElement: `<${newDisplayName} />`,
                        importStatement: `import { ${newDisplayName} } from "@fluentui/react-icons";`
                      });
                    }}
                    className={styles.sizeToggleButton}
                  >
                    --
                  </ToggleButton>
                  {selectedBaseIcon.availableSizes.map((size) => (
                    <ToggleButton
                      key={size}
                      size="small"
                      shape="rounded"
                      appearance={selectedIconSize === size ? "secondary" : "subtle"}
                      checked={selectedIconSize === size}
                      onClick={() => {
                        setSelectedIconSize(size);
                        // Update selectedIcon to match
                        const newDisplayName = getSizedIconName(selectedBaseIcon.name, size);
                        setSelectedIcon({
                          ...selectedBaseIcon,
                          name: newDisplayName,
                          jsxElement: `<${newDisplayName} />`,
                          importStatement: `import { ${newDisplayName} } from "@fluentui/react-icons";`
                        });
                      }}
                      className={styles.sizeToggleButton}
                    >
                      {size}
                    </ToggleButton>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className={styles.codeLabelRow}>
            <div className={styles.codeLabel}>Import Statement</div>
            <Tooltip content="Add import to current file" relationship="label">
              <Button
                appearance="subtle"
                size="small"
                icon={<DocumentAdd16Regular />}
                onClick={() => addImportToFile(selectedIcon.importStatement)}
                className={styles.addImportButton}
              >
                Add Import to file
              </Button>
            </Tooltip>
          </div>
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

// Theme wrapper component
function ThemedApp() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check for saved preference or system preference
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('fluentui-icons-theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  const toggleTheme = useCallback(() => {
    setIsDarkMode(prev => {
      const newValue = !prev;
      localStorage.setItem('fluentui-icons-theme', newValue ? 'dark' : 'light');
      return newValue;
    });
  }, []);

  return (
    <FluentProvider theme={isDarkMode ? webDarkTheme : webLightTheme}>
      <FluentUIIconsApp isDarkMode={isDarkMode} onToggleTheme={toggleTheme} />
    </FluentProvider>
  );
}

// Mount the app
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemedApp />
  </StrictMode>
);
