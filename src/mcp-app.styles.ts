/**
 * Griffel styles for Fluent UI Icons Explorer
 * All colors use Fluent UI theming tokens
 */
import { makeStyles, shorthands, tokens } from "@fluentui/react-components";

export const useAppStyles = makeStyles({
  app: {
    fontFamily: tokens.fontFamilyBase,
    ...shorthands.padding("12px"),
    minHeight: "100vh",
    boxSizing: "border-box",
    backgroundColor: tokens.colorNeutralBackground1,
    color: tokens.colorNeutralForeground1,
  },

  header: {
    marginBottom: "12px",
  },

  headerRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },

  titleContainer: {
    display: "flex",
    alignItems: "center",
    ...shorthands.gap("8px"),
  },

  mcpLogo: {
    width: "32px",
    height: "32px",
    objectFit: "contain",
  },

  title: {
    fontSize: tokens.fontSizeHero700,
    fontWeight: tokens.fontWeightSemibold,
    ...shorthands.margin("0", "0", "4px", "0"),
    color: tokens.colorNeutralForeground1,
  },

  themeToggleContainer: {
    display: "flex",
    alignItems: "center",
    ...shorthands.gap("4px"),
  },

  themeSwitch: {
    minWidth: "auto",
  },

  themeIcon: {
    fontSize: "16px",
    color: tokens.colorNeutralForeground2,
  },

  subtitle: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
    ...shorthands.margin("0"),
  },

  searchBox: {
    display: "flex",
    alignItems: "center",
    ...shorthands.gap("12px"),
    flexGrow: 1,
  },

  searchInput: {
    flexGrow: 1,
    minWidth: "180px",
  },

  thresholdContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    minWidth: "120px",
  },

  thresholdLabel: {
    display: "flex",
    alignItems: "center",
    ...shorthands.gap("4px"),
    marginBottom: "2px",
  },

  thresholdInfo: {
    color: tokens.colorNeutralForeground3,
    cursor: "help",
  },

  thresholdSlider: {
    width: "100%",
  },

  resultsDivider: {
    ...shorthands.margin("2px", "0"),
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground2,
  },

  iconsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
    ...shorthands.gap("6px"),
  },

  iconCard: {
    backgroundColor: tokens.colorNeutralBackground2,
    ...shorthands.border("1px", "solid", tokens.colorNeutralStroke1),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    ...shorthands.padding("6px"),
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    cursor: "pointer",
    transitionProperty: "all",
    transitionDuration: "0.1s",
    transitionTimingFunction: "ease",
    position: "relative",
    ":hover": {
      ...shorthands.borderColor(tokens.colorBrandStroke1),
      boxShadow: tokens.shadow4,
    },
  },

  iconCardSelected: {
    ...shorthands.borderColor(tokens.colorBrandStroke1),
    backgroundColor: tokens.colorBrandBackground2,
  },

  scoreBadge: {
    position: "absolute",
    top: "2px",
    left: "2px",
    cursor: "help",
    fontWeight: 600,
    minWidth: "18px",
    fontSize: "9px",
  },

  // Score badge color variants - theme-aware colors with clear visual distinction
  scoreBadgeExcellent: {
    // Green for excellent matches (80-100)
    backgroundColor: tokens.colorPaletteGreenBackground2,
    color: tokens.colorPaletteGreenForeground2,
  },

  scoreBadgeGood: {
    // Blue/brand for good matches (50-79)
    backgroundColor: tokens.colorBrandBackground2,
    color: tokens.colorBrandForeground1,
  },

  scoreBadgeModerate: {
    // Yellow/marigold for moderate matches (25-49)
    backgroundColor: tokens.colorPaletteMarigoldBackground2,
    color: tokens.colorPaletteMarigoldForeground2,
  },

  scoreBadgeWeak: {
    // Gray/muted for weak matches (0-24)
    backgroundColor: tokens.colorNeutralBackground5,
    color: tokens.colorNeutralForeground4,
  },

  iconCardActionButtons: {
    position: "absolute",
    top: "2px",
    right: "2px",
    display: "flex",
    gap: "0px",
  },

  iconCardCopyButton: {
    fontSize: "9px",
    minWidth: "18px",
    height: "18px",
    ...shorthands.padding("0"),
  },

  iconPreview: {
    minHeight: "28px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "2px",
    marginTop: "10px",
    color: tokens.colorNeutralForeground1,
  },

  iconName: {
    fontSize: "9px",
    fontWeight: tokens.fontWeightMedium,
    textAlign: "center",
    wordBreak: "break-word",
    color: tokens.colorNeutralForeground2,
    lineHeight: "1.2",
    maxHeight: "2.4em",
    overflow: "hidden",
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
  },

  sizeToggleGroup: {
    display: "flex",
    flexWrap: "wrap",
    ...shorthands.gap("2px"),
    marginTop: "4px",
    paddingTop: "4px",
    ...shorthands.borderTop("1px", "solid", tokens.colorNeutralStroke2),
    justifyContent: "center",
  },

  sizeToggleButton: {
    minWidth: "18px !important" as "18px",
    maxWidth: "22px",
    ...shorthands.padding("0", "2px"),
    fontSize: "8px",
    fontFamily: tokens.fontFamilyMonospace,
    height: "14px !important" as "14px",
    lineHeight: "1",
  },

  selectedIconDivider: {
    marginTop: "12px",
    marginBottom: "8px",
  },

  detailPanel: {
    backgroundColor: tokens.colorNeutralBackground2,
    ...shorthands.border("1px", "solid", tokens.colorNeutralStroke1),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    ...shorthands.padding("12px"),
  },

  detailHeader: {
    display: "flex",
    alignItems: "center",
    ...shorthands.gap("12px"),
    marginBottom: "10px",
  },

  detailIcon: {
    fontSize: "36px",
    color: tokens.colorNeutralForeground1,
  },

  detailTitle: {
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold,
    ...shorthands.margin("0"),
  },

  detailSizeToggleContainer: {
    display: "flex",
    alignItems: "center",
    marginLeft: "auto",
  },

  sizeLabel: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
    marginRight: "8px",
  },

  codeBlock: {
    backgroundColor: tokens.colorNeutralBackground6,
    color: tokens.colorNeutralForeground1,
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    ...shorthands.padding("8px", "10px"),
    fontFamily: tokens.fontFamilyMonospace,
    fontSize: tokens.fontSizeBase200,
    overflowX: "auto",
    marginBottom: "8px",
    position: "relative",
  },

  codeLabelRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "4px",
  },

  codeLabel: {
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground2,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },

  addImportButton: {
    fontSize: tokens.fontSizeBase100,
    height: "auto",
    minWidth: "auto",
    ...shorthands.padding("2px", "6px"),
  },

  copyButton: {
    position: "absolute",
    top: "4px",
    right: "4px",
    ...shorthands.padding("2px", "6px"),
    fontSize: "10px",
    backgroundColor: tokens.colorNeutralBackground1Hover,
    color: tokens.colorNeutralForeground1,
    ...shorthands.border("none"),
    ...shorthands.borderRadius(tokens.borderRadiusSmall),
    cursor: "pointer",
    ":hover": {
      backgroundColor: tokens.colorNeutralBackground1Pressed,
    },
  },

  loading: {
    textAlign: "center",
    ...shorthands.padding("32px"),
    color: tokens.colorNeutralForeground2,
  },

  error: {
    backgroundColor: tokens.colorStatusDangerBackground1,
    ...shorthands.border("1px", "solid", tokens.colorStatusDangerBorder1),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    ...shorthands.padding("8px", "12px"),
    color: tokens.colorStatusDangerForeground1,
    marginBottom: "8px",
  },

  emptyState: {
    textAlign: "center",
    ...shorthands.padding("32px", "16px"),
    color: tokens.colorNeutralForeground2,
  },

  emptyIcon: {
    fontSize: "36px",
    marginBottom: "8px",
    opacity: 0.5,
  },
});
