/**
 * @file SearchBar component - search input for icons
 */
import { SearchBox } from "@fluentui/react-components";
import { useAppStyles } from "../mcp-app.styles";
import { useCallback } from "react";

export interface SearchBarProps {
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  onSearch: () => void;
  isSearching: boolean;
}

export function SearchBar({ 
  searchQuery, 
  onSearchQueryChange, 
  onSearch, 
  isSearching 
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
    </div>
  );
}
