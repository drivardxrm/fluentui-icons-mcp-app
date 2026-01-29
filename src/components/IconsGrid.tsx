/**
 * @file IconsGrid component - displays grid of icons with empty states
 */
import { Search24Regular, SearchInfo24Regular } from "@fluentui/react-icons";
import { useAppStyles } from "../mcp-app.styles";
import { IconCard } from "./IconCard";
import type { IconResult, StructuredContent } from "../types/icons";

export interface IconsGridProps {
  displayData: StructuredContent | null;
  selectedBaseIcon: IconResult | null;
  selectedIconSize: string | null;
  onSelectIcon: (icon: IconResult, size: string | null, baseIcon: IconResult) => void;
  onSizeChange: (size: string | null) => void;
  onAddImport: (importStatement: string) => void;
}

export function IconsGrid({
  displayData,
  selectedBaseIcon,
  selectedIconSize,
  onSelectIcon,
  onSizeChange,
  onAddImport,
}: IconsGridProps) {
  const styles = useAppStyles();

  // Has results
  if (displayData && displayData.icons.length > 0) {
    return (
      <div className={styles.iconsGrid}>
        {displayData.icons.map((icon) => {
          const isCardSelected = selectedBaseIcon?.name === icon.name;
          return (
            <IconCard
              key={icon.name}
              icon={icon}
              isSelected={isCardSelected}
              onSelect={(iconWithSize, size) => {
                onSelectIcon(iconWithSize, size, icon);
              }}
              controlledSize={isCardSelected ? selectedIconSize : undefined}
              onSizeChange={isCardSelected ? onSizeChange : undefined}
              onAddImport={onAddImport}
            />
          );
        })}
      </div>
    );
  }

  // No results found
  if (displayData) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>
          <SearchInfo24Regular />
        </div>
        <p>No icons found. Try a different search term.</p>
      </div>
    );
  }

  // Initial empty state
  return (
    <div className={styles.emptyState}>
      <div className={styles.emptyIcon}>
        <Search24Regular />
      </div>
      <p>Search for Fluent UI icons to get started</p>
    </div>
  );
}
