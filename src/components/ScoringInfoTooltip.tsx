/**
 * @file ScoringInfoTooltip component - displays info about search scoring methods
 */
import {
  Popover,
  PopoverTrigger,
  PopoverSurface,
  Button,
  Text,
  makeStyles,
  tokens,
  shorthands,
} from "@fluentui/react-components";
import { Info16Regular } from "@fluentui/react-icons";

const useStyles = makeStyles({
  infoButton: {
    minWidth: "auto",
    ...shorthands.padding("2px"),
    height: "24px",
    width: "24px",
  },
  popoverContent: {
    maxWidth: "340px",
    ...shorthands.padding("12px", "14px"),
  },
  title: {
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase300,
    marginBottom: "6px",
    display: "block",
  },
  description: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
    marginBottom: "10px",
    display: "block",
    lineHeight: tokens.lineHeightBase200,
  },
  layerList: {
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap("5px"),
  },
  layerRow: {
    display: "flex",
    alignItems: "center",
    ...shorthands.gap("8px"),
  },
  layerBadge: {
    minWidth: "65px",
    textAlign: "center",
    fontSize: "10px",
    fontWeight: tokens.fontWeightSemibold,
    ...shorthands.padding("2px", "6px"),
    ...shorthands.borderRadius(tokens.borderRadiusSmall),
  },
  layerExact: {
    backgroundColor: tokens.colorPaletteDarkGreenBackground2,
    color: tokens.colorPaletteDarkGreenForeground2,
  },
  layerContained: {
    backgroundColor: tokens.colorPaletteGreenBackground2,
    color: tokens.colorPaletteGreenForeground2,
  },
  layerSemantic: {
    backgroundColor: tokens.colorPaletteBerryBackground2,
    color: tokens.colorPaletteBerryForeground2,
  },
  layerVisual: {
    backgroundColor: tokens.colorPaletteLavenderBackground2,
    color: tokens.colorPaletteLavenderForeground2,
  },
  layerSynonym: {
    backgroundColor: tokens.colorPaletteMarigoldBackground2,
    color: tokens.colorPaletteMarigoldForeground2,
  },
  layerFuzzy: {
    backgroundColor: tokens.colorNeutralBackground4,
    color: tokens.colorNeutralForeground2,
  },
  layerPoints: {
    fontSize: "11px",
    fontFamily: tokens.fontFamilyMonospace,
    color: tokens.colorNeutralForeground2,
    minWidth: "50px",
  },
  layerDescription: {
    fontSize: "11px",
    color: tokens.colorNeutralForeground3,
    flexGrow: 1,
  },
  divider: {
    ...shorthands.borderTop("1px", "solid", tokens.colorNeutralStroke2),
    marginTop: "10px",
    paddingTop: "8px",
  },
  note: {
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground3,
    fontStyle: "italic",
  },
});

interface ScoringLayer {
  name: string;
  points: string;
  description: string;
  styleKey: "layerExact" | "layerContained" | "layerSemantic" | "layerVisual" | "layerSynonym" | "layerFuzzy";
}

const SCORING_LAYERS: ScoringLayer[] = [
  {
    name: "Exact",
    points: "100 pts",
    description: "Full word match in icon name",
    styleKey: "layerExact",
  },
  {
    name: "Contained",
    points: "75 pts",
    description: "Query found within icon word",
    styleKey: "layerContained",
  },
  {
    name: "Semantic",
    points: "≤25 pts",
    description: "Concept mapping (e.g., save→disk)",
    styleKey: "layerSemantic",
  },
  {
    name: "Visual",
    points: "≤25 pts",
    description: "Visual tags (e.g., round→circle)",
    styleKey: "layerVisual",
  },
  {
    name: "Synonym",
    points: "≤20 pts",
    description: "Dictionary expansion",
    styleKey: "layerSynonym",
  },
  {
    name: "Fuzzy",
    points: "≤15 pts",
    description: "Similar spelling match",
    styleKey: "layerFuzzy",
  },
];

export function ScoringInfoTooltip() {
  const styles = useStyles();

  return (
    <Popover withArrow positioning="below-start">
      <PopoverTrigger disableButtonEnhancement>
        <Button
          appearance="subtle"
          icon={<Info16Regular />}
          className={styles.infoButton}
          aria-label="Scoring information"
        />
      </PopoverTrigger>
      <PopoverSurface className={styles.popoverContent}>
        <Text className={styles.title}>🎯 Search Scoring</Text>
        <Text className={styles.description}>
          Icons are ranked by additive scoring across multiple matching layers.
          Higher scores = better matches.
        </Text>
        
        <div className={styles.layerList}>
          {SCORING_LAYERS.map((layer) => (
            <div key={layer.name} className={styles.layerRow}>
              <span className={`${styles.layerBadge} ${styles[layer.styleKey]}`}>
                {layer.name}
              </span>
              <span className={styles.layerPoints}>{layer.points}</span>
              <span className={styles.layerDescription}>{layer.description}</span>
            </div>
          ))}
        </div>
        
        <div className={styles.divider}>
          <Text className={styles.note}>
            💡 Lower fuzzy threshold = stricter matching
          </Text>
        </div>
      </PopoverSurface>
    </Popover>
  );
}
