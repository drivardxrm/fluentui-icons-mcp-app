/**
 * @file Header component - app title, logo, and theme toggle
 */
import { Switch, Tooltip } from "@fluentui/react-components";
import { WeatherSunny16Filled, WeatherMoon16Filled } from "@fluentui/react-icons";
import { useAppStyles } from "../mcp-app.styles";
import mcpLogo from "../assets/mcp.png";

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
  );
}
