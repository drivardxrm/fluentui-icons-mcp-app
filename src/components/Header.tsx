/**
 * @file Header component - app title, logo, and theme toggle
 */
import { Switch, Tooltip, Text, Link } from "@fluentui/react-components";
import { WeatherSunny16Filled, WeatherMoon16Filled } from "@fluentui/react-icons";
import { useAppStyles } from "../mcp-app.styles";
import mcpLogo from "../assets/mcp.png";
import { ScoringInfoTooltip } from "./ScoringInfoTooltip";

// Version injected at build time by Vite
declare const __APP_VERSION__: string;
const APP_VERSION = typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "dev";

// GitHub icon SVG component
function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" aria-label="GitHub">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
    </svg>
  );
}

export interface HeaderProps {
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

export function Header({ isDarkMode, onToggleTheme }: HeaderProps) {
  const styles = useAppStyles();

  return (
    <header className={styles.header}>
      <div className={styles.headerRow}>
        <div className={styles.titleContainer}>
          <img src={mcpLogo} alt="MCP" className={styles.mcpLogo} />
          <h1 className={styles.title}>Fluent UI Icons - MCP App</h1>
        </div>
        <div className={styles.headerRightControls}>
          <Tooltip
            content={
              <div style={{ textAlign: "center" }}>
                <div>github.com/drivardxrm/fluentui-icons-mcp-app</div>
                <div style={{ opacity: 0.7, fontSize: "12px" }}>by David Rivard</div>
                <div style={{ opacity: 0.5, fontSize: "11px", marginTop: "4px" }}>v{APP_VERSION}</div>
              </div>
            }
            relationship="description"
            positioning="below"
          >
            <Link
              href="https://github.com/drivardxrm/fluentui-icons-mcp-app"
              target="_blank"
              className={styles.githubLink}
            >
              <GitHubIcon className={styles.githubIcon} />
            </Link>
          </Tooltip>
          <div className={styles.scoringInfoContainer}>
            <ScoringInfoTooltip />
            <Text size={200} className={styles.scoringLabel}>Scoring</Text>
          </div>
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
      </div>
      <p className={styles.subtitle}>
        Search and explore @fluentui/react-icons for your React projects
      </p>
    </header>
  );
}
