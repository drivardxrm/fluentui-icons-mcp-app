/**
 * @file DetailPanel component - shows selected icon details with code snippets
 */
import { ToggleButton, Button, Tooltip, Divider } from "@fluentui/react-components";
import { DocumentAdd16Regular } from "@fluentui/react-icons";
import { getIconComponent } from "../icon-registry";
import { useAppStyles } from "../mcp-app.styles";
import { getSizedIconName } from "../utils/iconHelpers";
import type { IconResult } from "../types/icons";
import { useCallback, useState, useEffect } from "react";

// Helper component to render SVG markup
function SvgMarkupBlock({ 
  iconName, 
  copyToClipboard, 
  styles 
}: { 
  iconName: string; 
  copyToClipboard: (text: string) => void;
  styles: ReturnType<typeof useAppStyles>;
}) {
  const [svgMarkup, setSvgMarkup] = useState<string>("");

  useEffect(() => {
    const IconComp = getIconComponent(iconName);
    if (!IconComp) {
      setSvgMarkup("<!-- Icon not found -->");
      return;
    }

    import('react-dom/server').then(({ renderToStaticMarkup }) => {
      try {
        const markup = renderToStaticMarkup(<IconComp />);
        const parser = new DOMParser();
        const doc = parser.parseFromString(markup, 'image/svg+xml');
        const svgElement = doc.querySelector('svg');
        
        if (svgElement) {
          svgElement.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
          if (!svgElement.getAttribute('width')) {
            svgElement.setAttribute('width', '24');
          }
          if (!svgElement.getAttribute('height')) {
            svgElement.setAttribute('height', '24');
          }
          
          const svgString = new XMLSerializer().serializeToString(svgElement);
          setSvgMarkup(svgString);
        }
      } catch (err) {
        console.error('Error generating SVG:', err);
        setSvgMarkup("<!-- Error generating SVG -->");
      }
    });
  }, [iconName]);

  return (
    <>
      <div className={styles.codeLabel}>SVG Markup</div>
      <div className={styles.codeBlock}>
        <code style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{svgMarkup}</code>
        <button
          className={styles.copyButton}
          onClick={() => copyToClipboard(svgMarkup)}
        >
          Copy
        </button>
      </div>
    </>
  );
}

export interface DetailPanelProps {
  selectedIcon: IconResult;
  selectedBaseIcon: IconResult;
  selectedIconSize: string | null;
  onSizeChange: (size: string | null) => void;
  onIconUpdate: (icon: IconResult) => void;
  onAddImport: (importStatement: string) => void;
}

export function DetailPanel({
  selectedIcon,
  selectedBaseIcon,
  selectedIconSize,
  onSizeChange,
  onIconUpdate,
  onAddImport,
}: DetailPanelProps) {
  const styles = useAppStyles();

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
  }, []);

  const handleSizeClick = useCallback((size: string | null) => {
    onSizeChange(size);
    const newDisplayName = getSizedIconName(selectedBaseIcon.name, size);
    onIconUpdate({
      ...selectedBaseIcon,
      name: newDisplayName,
      jsxElement: `<${newDisplayName} />`,
      importStatement: `import { ${newDisplayName} } from "@fluentui/react-icons";`
    });
  }, [selectedBaseIcon, onSizeChange, onIconUpdate]);

  // Get the base (unsized) icon component
  const baseName = selectedIcon.name.replace(/\d+(?=Regular|Filled|Color)/, '');
  const IconComponent = getIconComponent(baseName);
  const iconSizePx = selectedIconSize ? parseInt(selectedIconSize, 10) : 32;

  return (
    <>
      <Divider className={styles.selectedIconDivider}>Selected Icon</Divider>

      <div className={styles.detailPanel}>
        <div className={styles.detailHeader}>
          <div className={styles.detailIcon}>
            {IconComponent ? <IconComponent style={{ fontSize: `${iconSizePx}px` }} /> : "?"}
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
                  onClick={() => handleSizeClick(null)}
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
                    onClick={() => handleSizeClick(size)}
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
              onClick={() => onAddImport(selectedIcon.importStatement)}
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

        <SvgMarkupBlock 
          iconName={selectedBaseIcon.name} 
          copyToClipboard={copyToClipboard} 
          styles={styles} 
        />
      </div>
    </>
  );
}
