/**
 * The 8 locked group colors (PRD §16.5.2).
 * Used by both client (color picker UI) and server (validation).
 */
export const GROUP_COLORS = [
  "#10B981", // emerald
  "#6366F1", // indigo
  "#F59E0B", // amber
  "#EF4444", // red
  "#EC4899", // pink
  "#06B6D4", // cyan
  "#8B5CF6", // violet
  "#84CC16", // lime
] as const;

export type GroupColor = (typeof GROUP_COLORS)[number];

export function isValidGroupColor(hex: string): hex is GroupColor {
  return (GROUP_COLORS as readonly string[]).includes(hex);
}

/** Pretty name for screen-reader labels and palette tooltips. */
export const GROUP_COLOR_NAMES: Record<GroupColor, string> = {
  "#10B981": "Emerald",
  "#6366F1": "Indigo",
  "#F59E0B": "Amber",
  "#EF4444": "Red",
  "#EC4899": "Pink",
  "#06B6D4": "Cyan",
  "#8B5CF6": "Violet",
  "#84CC16": "Lime",
};
