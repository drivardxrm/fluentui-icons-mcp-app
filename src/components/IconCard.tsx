/**
 * @file IconCard component - displays a single icon with size toggles
 */
import { useCallback, useMemo, useState, useRef } from "react";
import { ToggleButton, Button, Tooltip, Badge, Tag, mergeClasses } from "@fluentui/react-components";
import { Code16Regular, DocumentAdd16Regular, Copy16Regular } from "@fluentui/react-icons";
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

  // Copy SVG handler - copies the base icon SVG markup to clipboard
  const handleCopySvg = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Get the base icon component (without size suffix)
    const baseIconName = icon.name;
    const IconComp = getIconComponent(baseIconName);
    
    if (!IconComp) {
      console.warn(`Could not find icon component for ${baseIconName}`);
      return;
    }

    // Use ReactDOMServer to render the icon to static markup (synchronous)
    import('react-dom/server').then(({ renderToStaticMarkup }) => {
      try {
        // Render icon to SVG string
        const svgMarkup = renderToStaticMarkup(<IconComp />);
        
        // Parse to add xmlns if needed
        const parser = new DOMParser();
        const doc = parser.parseFromString(svgMarkup, 'image/svg+xml');
        const svgElement = doc.querySelector('svg');
        
        if (svgElement) {
          // Ensure proper SVG attributes for standalone file
          svgElement.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
          if (!svgElement.getAttribute('width')) {
            svgElement.setAttribute('width', '24');
          }
          if (!svgElement.getAttribute('height')) {
            svgElement.setAttribute('height', '24');
          }
          
          // Convert to string and copy to clipboard
          const svgString = new XMLSerializer().serializeToString(svgElement);
          navigator.clipboard.writeText(svgString).then(() => {
            console.log('SVG copied to clipboard');
          }).catch((err) => {
            console.error('Failed to copy SVG:', err);
          });
        } else {
          console.error('Failed to parse SVG element');
        }
      } catch (err) {
        console.error('Error generating SVG:', err);
      }
    }).catch((err) => {
      console.error('Failed to load react-dom/server:', err);
    });
  }, [icon.name]);

  // Get score badge info with breakdown tooltip
  const scoreBadgeInfo = useMemo(() => {
    if (icon.score === undefined) return null;
    
    const score = Math.round(icon.score);
    
    // Determine style class based on score range (theme-aware, subtle colors)
    let styleClass: string;
    if (score >= 80) {
      styleClass = styles.scoreBadgeExcellent;  // Green-ish: excellent match
    } else if (score >= 50) {
      styleClass = styles.scoreBadgeGood;       // Blue: good match
    } else if (score >= 25) {
      styleClass = styles.scoreBadgeModerate;   // Neutral: moderate match
    } else {
      styleClass = styles.scoreBadgeWeak;       // Muted: weak match
    }
    
    // Build breakdown tooltip content
    const layerNames: Record<string, string> = {
      substring: 'Substring',
      fuzzy: 'Fuzzy',
      semantic: 'Semantic',
      visual: 'Visual',
      synonym: 'Synonym',
    };
    
    const breakdownLines: string[] = [];
    if (icon.scoreBreakdown) {
      const bd = icon.scoreBreakdown;
      if (bd.substring > 0) breakdownLines.push(`${layerNames.substring}: ${Math.round(bd.substring)}`);
      if (bd.fuzzy > 0) breakdownLines.push(`${layerNames.fuzzy}: ${Math.round(bd.fuzzy)}`);
      if (bd.semantic > 0) breakdownLines.push(`${layerNames.semantic}: ${Math.round(bd.semantic)}`);
      if (bd.visual > 0) breakdownLines.push(`${layerNames.visual}: ${Math.round(bd.visual)}`);
      if (bd.synonym > 0) breakdownLines.push(`${layerNames.synonym}: ${Math.round(bd.synonym)}`);
    }
    
    const tooltipContent = breakdownLines.length > 0
      ? `Score: ${score}/100\n\n${breakdownLines.join('\n')}`
      : `Score: ${score}/100`;
    
    return {
      score,
      styleClass,
      tooltipContent,
    };
  }, [icon.score, icon.scoreBreakdown, styles]);

  return (
    <div
      className={mergeClasses(styles.iconCard, isSelected && styles.iconCardSelected)}
      onClick={handleCardClick}
    >
      {/* Score badge */}
      {scoreBadgeInfo && (
        <Tooltip 
          content={<div style={{ whiteSpace: 'pre-line' }}>{scoreBadgeInfo.tooltipContent}</div>} 
          relationship="description"
          positioning="above-start"
        >
          <Badge
            size="small"
            appearance="tint"
            className={mergeClasses(styles.scoreBadge, scoreBadgeInfo.styleClass)}
            style={{ cursor: 'default' }}
          >
            {scoreBadgeInfo.score}
          </Badge>
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
          <Tooltip 
            content={<Tag size="extra-small" appearance="outline">{`<${displayIconName} />`}</Tag>} 
            relationship="label"
          >
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
          <Tooltip content="Copy SVG markup" relationship="label">
            <Button
              appearance="subtle"
              size="small"
              icon={<Copy16Regular />}
              onClick={handleCopySvg}
              className={styles.iconCardCopyButton}
            >
              SVG
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
