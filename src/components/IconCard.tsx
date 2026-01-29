/**
 * @file IconCard component - displays a single icon with size toggles
 */
import { useCallback, useMemo, useState } from "react";
import { ToggleButton, Button, Tooltip, mergeClasses } from "@fluentui/react-components";
import { Code16Regular, DocumentAdd16Regular } from "@fluentui/react-icons";
import { getIconComponent } from "../icon-registry";
import { useAppStyles } from "../mcp-app.styles";
import { getSizedIconName } from "../utils/iconHelpers";
import type { IconResult } from "../types/icons";

export interface IconCardProps {
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

export function IconCard({ 
  icon, 
  isSelected, 
  onSelect, 
  controlledSize, 
  onSizeChange, 
  onAddImport 
}: IconCardProps) {
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

  // Get score badge info
  const scoreBadgeInfo = useMemo(() => {
    if (!icon.score || !icon.scoreLayer) return null;
    
    const layerDescriptions: Record<string, { label: string; description: string; styleClass: string }> = {
      substring: {
        label: 'S',
        description: `Substring match (${icon.score})\nDirect text match in icon name`,
        styleClass: styles.scoreBadgeSubstring,
      },
      fuzzy: {
        label: 'F',
        description: `Fuzzy match (${icon.score})\nTypo-tolerant name matching`,
        styleClass: styles.scoreBadgeFuzzy,
      },
      semantic: {
        label: 'M',
        description: `Semantic match (${icon.score})\nConcept/intent mapping`,
        styleClass: styles.scoreBadgeSemantic,
      },
      visual: {
        label: 'V',
        description: `Visual match (${icon.score})\nVisual tag matching`,
        styleClass: styles.scoreBadgeVisual,
      },
      wordnet: {
        label: 'W',
        description: `WordNet match (${icon.score})\nDictionary synonym`,
        styleClass: styles.scoreBadgeWordnet,
      },
    };
    
    return layerDescriptions[icon.scoreLayer] || null;
  }, [icon.score, icon.scoreLayer, styles]);

  return (
    <div
      className={mergeClasses(styles.iconCard, isSelected && styles.iconCardSelected)}
      onClick={handleCardClick}
    >
      {/* Score badge */}
      {scoreBadgeInfo && (
        <Tooltip 
          content={scoreBadgeInfo.description} 
          relationship="description"
          positioning="above-start"
        >
          <div className={mergeClasses(styles.scoreBadge, scoreBadgeInfo.styleClass)}>
            {scoreBadgeInfo.label}
          </div>
        </Tooltip>
      )}
      
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
