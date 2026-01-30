/**
 * @file Fluent UI Icons Explorer MCP App
 * Main entry point - displays Fluent UI React icons with their JSX code and import statements.
 */
import type { App, McpUiHostContext } from "@modelcontextprotocol/ext-apps";
import { useApp, useHostStyles } from "@modelcontextprotocol/ext-apps/react";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { FluentProvider, webLightTheme, webDarkTheme, Divider } from "@fluentui/react-components";
import { StrictMode, useCallback, useEffect, useState, useMemo } from "react";
import { createRoot } from "react-dom/client";

import { useAppStyles } from "./mcp-app.styles";
import { parseToolResult } from "./utils/parseToolResult";
import { Header, SearchBar, IconsGrid, DetailPanel } from "./components";
import type { IconResult } from "./types/icons";

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
  const [threshold, setThreshold] = useState(0.1);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { app, error: connectionError } = useApp({
    appInfo: { name: "Fluent UI Icons - MCP App", version: "1.0.0" },
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
      threshold={threshold}
      setThreshold={setThreshold}
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
  threshold: number;
  setThreshold: (threshold: number) => void;
  isSearching: boolean;
  setIsSearching: (searching: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

function FluentUIIconsAppInner({
  app,
  toolResult,
  hostContext,
  searchQuery,
  setSearchQuery,
  threshold,
  setThreshold,
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
  const [selectedBaseIcon, setSelectedBaseIcon] = useState<IconResult | null>(null);

  // Handle search
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setError(null);
    setSelectedIcon(null);
    
    try {
      const result = await app.callServerTool({
        name: "search-fluentui-icons",
        arguments: { query: searchQuery, maxResults: 30, threshold },
      });
      setLocalResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSearching(false);
    }
  }, [app, searchQuery, threshold, setError, setIsSearching]);

  // Local state for results when callServerTool is used
  const [localResult, setLocalResult] = useState<CallToolResult | null>(toolResult);
  
  useEffect(() => {
    setLocalResult(toolResult);
  }, [toolResult]);

  // Retrigger search when threshold changes (with debounce)
  useEffect(() => {
    if (!searchQuery.trim() || !localResult) return;
    
    const timer = setTimeout(() => {
      handleSearch();
    }, 300);
    
    return () => clearTimeout(timer);
  }, [threshold]); // Only trigger on threshold change

  const displayData = useMemo(() => {
    if (!localResult) return null;
    return parseToolResult(localResult);
  }, [localResult]);

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

  // Handle icon selection from grid
  const handleSelectIcon = useCallback((iconWithSize: IconResult, size: string | null, baseIcon: IconResult) => {
    setSelectedIcon(iconWithSize);
    setSelectedIconSize(size);
    setSelectedBaseIcon(baseIcon);
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
      {/* Header Section */}
      <div>
        <Header isDarkMode={isDarkMode} onToggleTheme={onToggleTheme} />

        <SearchBar
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          onSearch={handleSearch}
          isSearching={isSearching}
          threshold={threshold}
          onThresholdChange={setThreshold}
        />

        {/* Error State */}
        {error && <div className={styles.error}>{error}</div>}

        {/* Results Divider */}
        {displayData && displayData.icons.length > 0 && (
          <Divider className={styles.resultsDivider}>
            Found {displayData.totalCount} icons matching "{displayData.query}"
          </Divider>
        )}
      </div>

      {/* Icons Grid */}
      <IconsGrid
        displayData={displayData}
        selectedBaseIcon={selectedBaseIcon}
        selectedIconSize={selectedIconSize}
        onSelectIcon={handleSelectIcon}
        onSizeChange={setSelectedIconSize}
        onAddImport={addImportToFile}
      />

      {/* Detail Panel */}
      {selectedIcon && selectedBaseIcon && (
        <DetailPanel
          selectedIcon={selectedIcon}
          selectedBaseIcon={selectedBaseIcon}
          selectedIconSize={selectedIconSize}
          onSizeChange={setSelectedIconSize}
          onIconUpdate={setSelectedIcon}
          onAddImport={addImportToFile}
        />
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
