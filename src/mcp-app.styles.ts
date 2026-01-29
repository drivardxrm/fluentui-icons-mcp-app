/**
 * Griffel styles for Fluent UI Icons Explorer
 * All colors use Fluent UI theming tokens
 */
import { makeStyles, shorthands, tokens } from "@fluentui/react-components";

export const useAppStyles = makeStyles({
  app: {
    fontFamily: tokens.fontFamilyBase,
    ...shorthands.padding("16px"),
    minHeight: "100vh",
    boxSizing: "border-box",
    backgroundColor: tokens.colorNeutralBackground1,
    color: tokens.colorNeutralForeground1,
  },

  stickyHeader: {
    position: "sticky",
    top: 0,
    zIndex: 100,
    backgroundColor: tokens.colorNeutralBackground1,
    paddingBottom: "16px",
    ...shorthands.margin("-16px", "-16px", "0", "-16px"),
    ...shorthands.padding("16px"),
  },

  header: {
    marginBottom: "20px",
  },

  headerRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },

  titleContainer: {
    display: "flex",
    alignItems: "center",
    ...shorthands.gap("12px"),
  },

  mcpLogo: {
    width: "40px",
    height: "40px",
    objectFit: "contain",
  },

  title: {
    fontSize: tokens.fontSizeHero800,
    fontWeight: tokens.fontWeightSemibold,
    ...shorthands.margin("0", "0", "8px", "0"),
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
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground2,
    ...shorthands.margin("0"),
  },

  searchRow: {
    display: "flex",
    ...shorthands.gap("16px"),
    marginBottom: "20px",
    alignItems: "stretch",
  },

  searchBox: {
    display: "flex",
    alignItems: "center",
    ...shorthands.gap("16px"),
    flexGrow: 1,
  },

  searchInput: {
    flexGrow: 1,
    minWidth: "200px",
  },

  thresholdContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    minWidth: "140px",
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

  selectedIconBox: {
    display: "flex",
    alignItems: "center",
    ...shorthands.gap("10px"),
    ...shorthands.padding("8px", "12px"),
    backgroundColor: tokens.colorNeutralBackground2,
    ...shorthands.border("1px", "solid", tokens.colorNeutralStroke1),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    minWidth: "200px",
  },

  selectedIconPreview: {
    fontSize: "24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: tokens.colorNeutralForeground1,
  },

  selectedIconJsx: {
    fontSize: tokens.fontSizeBase200,
    fontFamily: tokens.fontFamilyMonospace,
    color: tokens.colorNeutralForeground1,
    whiteSpace: "nowrap",
    ...shorthands.overflow("hidden"),
    textOverflow: "ellipsis",
    maxWidth: "150px",
  },

  selectedIconPlaceholder: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    fontStyle: "italic",
  },

  copiedButton: {
    color: `${tokens.colorStatusSuccessForeground1} !important`,
  },

  resultsHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
    flexWrap: "wrap",
    ...shorthands.gap("12px"),
  },

  resultsInfo: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
  },

  variantFilterGroup: {
    display: "flex",
    ...shorthands.gap("6px"),
  },

  variantToggleButton: {
    minWidth: "60px",
    ...shorthands.padding("4px", "10px"),
    fontSize: "11px",
    height: "24px !important" as "24px",
  },

  resultsDivider: {
    ...shorthands.margin("2px", "0"),
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground2,
  },

  iconsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
    ...shorthands.gap("12px"),
  },

  iconCard: {
    backgroundColor: tokens.colorNeutralBackground2,
    ...shorthands.border("1px", "solid", tokens.colorNeutralStroke1),
    ...shorthands.borderRadius(tokens.borderRadiusLarge),
    ...shorthands.padding("16px"),
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    cursor: "pointer",
    transitionProperty: "all",
    transitionDuration: "0.15s",
    transitionTimingFunction: "ease",
    position: "relative", // Required for absolute positioned badge
    ":hover": {
      ...shorthands.borderColor(tokens.colorBrandStroke1),
      transform: "translateY(-2px)",
      boxShadow: tokens.shadow8,
    },
  },

  iconCardSelected: {
    ...shorthands.borderColor(tokens.colorBrandStroke1),
    backgroundColor: tokens.colorBrandBackground2,
  },

  scoreBadge: {
    position: "absolute",
    top: "4px",
    left: "4px",
    cursor: "help",
    fontWeight: 600,
    minWidth: "24px",
  },

  // Score badge color variants - subtle, theme-aware colors
  scoreBadgeExcellent: {
    // Green-ish for excellent matches (80-100)
    backgroundColor: tokens.colorPaletteGreenBackground2,
    color: tokens.colorPaletteGreenForeground2,
  },

  scoreBadgeGood: {
    // Blue for good matches (50-79)
    backgroundColor: tokens.colorNeutralBackground3,
    color: tokens.colorBrandForeground1,
  },

  scoreBadgeModerate: {
    // Neutral for moderate matches (25-49)
    backgroundColor: tokens.colorNeutralBackground4,
    color: tokens.colorNeutralForeground2,
  },

  scoreBadgeWeak: {
    // Muted for weak matches (0-24)
    backgroundColor: tokens.colorNeutralBackground5,
    color: tokens.colorNeutralForeground3,
  },

  iconCardActionButtons: {
    position: "absolute",
    top: "4px",
    right: "4px",
    display: "flex",
    gap: "2px",
  },

  iconCardCopyButton: {
    fontSize: tokens.fontSizeBase100,
  },

  iconPreview: {
    minHeight: "48px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "12px",
    color: tokens.colorNeutralForeground1,
    transitionProperty: "font-size",
    transitionDuration: "0.15s",
    transitionTimingFunction: "ease",
  },

  iconName: {
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightMedium,
    textAlign: "center",
    wordBreak: "break-word",
    color: tokens.colorNeutralForeground1,
  },

  iconVariant: {
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground2,
    marginTop: "4px",
  },

  iconSizes: {
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground3,
    marginTop: "8px",
    paddingTop: "8px",
    ...shorthands.borderTop("1px", "solid", tokens.colorNeutralStroke2),
    fontFamily: tokens.fontFamilyMonospace,
    letterSpacing: "2px",
  },

  sizeToggleGroup: {
    display: "flex",
    flexWrap: "wrap",
    ...shorthands.gap("4px"),
    marginTop: "12px",
    paddingTop: "12px",
    ...shorthands.borderTop("1px", "solid", tokens.colorNeutralStroke2),
    justifyContent: "center",
  },

  sizeToggleButton: {
    minWidth: "24px !important" as "24px",
    maxWidth: "28px",
    ...shorthands.padding("0", "4px"),
    fontSize: "10px",
    fontFamily: tokens.fontFamilyMonospace,
    height: "20px !important" as "20px",
    lineHeight: "1",
  },

  selectedIconDivider: {
    marginTop: "24px",
    marginBottom: "16px",
  },

  detailPanel: {
    backgroundColor: tokens.colorNeutralBackground2,
    ...shorthands.border("1px", "solid", tokens.colorNeutralStroke1),
    ...shorthands.borderRadius(tokens.borderRadiusLarge),
    ...shorthands.padding("20px"),
  },

  detailHeader: {
    display: "flex",
    alignItems: "center",
    ...shorthands.gap("16px"),
    marginBottom: "16px",
  },

  detailIcon: {
    fontSize: "48px",
    color: tokens.colorNeutralForeground1,
  },

  detailTitle: {
    fontSize: tokens.fontSizeBase500,
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
    ...shorthands.padding("12px", "16px"),
    fontFamily: tokens.fontFamilyMonospace,
    fontSize: tokens.fontSizeBase200,
    overflowX: "auto",
    marginBottom: "12px",
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
    top: "8px",
    right: "8px",
    ...shorthands.padding("4px", "8px"),
    fontSize: "11px",
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
    ...shorthands.padding("40px"),
    color: tokens.colorNeutralForeground2,
  },

  error: {
    backgroundColor: tokens.colorStatusDangerBackground1,
    ...shorthands.border("1px", "solid", tokens.colorStatusDangerBorder1),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    ...shorthands.padding("12px", "16px"),
    color: tokens.colorStatusDangerForeground1,
    marginBottom: "16px",
  },

  emptyState: {
    textAlign: "center",
    ...shorthands.padding("60px", "20px"),
    color: tokens.colorNeutralForeground2,
  },

  emptyIcon: {
    fontSize: "48px",
    marginBottom: "16px",
    opacity: 0.5,
  },
});
