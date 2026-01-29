/**
 * @file SearchBar component - search input for icons with fuzzy threshold slider
 */
import { SearchBox, Slider, Label, Tooltip } from "@fluentui/react-components";
import { Info16Regular } from "@fluentui/react-icons";
import { useAppStyles } from "../mcp-app.styles";
import { useCallback } from "react";

export interface SearchBarProps {
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  onSearch: () => void;
  isSearching: boolean;
  threshold: number;
  onThresholdChange: (threshold: number) => void;
}

export function SearchBar({ 
  searchQuery, 
  onSearchQueryChange, 
  onSearch, 
  isSearching,
  threshold,
  onThresholdChange,
}: SearchBarProps) {
  const styles = useAppStyles();

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !isSearching) {
        onSearch();
      }
    },
    [onSearch, isSearching]
  );

  const handleThresholdChange = useCallback(
    (_: unknown, data: { value: number }) => {
      onThresholdChange(data.value);
    },
    [onThresholdChange]
  );

  return (
    <div className={styles.searchBox}>
      <SearchBox
        className={styles.searchInput}
        placeholder="Search icons (e.g., 'add', 'calendar', 'arrow')"
        value={searchQuery}
        onChange={(e, data) => onSearchQueryChange(data.value)}
        onKeyDown={handleKeyDown}
        disabled={isSearching}
        size="large"
      />
      <div className={styles.thresholdContainer}>
        <div className={styles.thresholdLabel}>
          <Label size="small">Fuzzy: {threshold.toFixed(2)}</Label>
          <Tooltip
            content="0 = exact match only, 1 = match anything. Lower values are stricter."
            relationship="description"
          >
            <Info16Regular className={styles.thresholdInfo} />
          </Tooltip>
        </div>
        <Slider
          className={styles.thresholdSlider}
          min={0}
          max={1}
          step={0.05}
          value={threshold}
          onChange={handleThresholdChange}
          disabled={isSearching}
          size="small"
        />
      </div>
    </div>
  );
}
