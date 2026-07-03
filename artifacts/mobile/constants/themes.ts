export type ThemeId = "space" | "noir" | "nordic" | "dawn";

export interface ThemeColors {
  background: string;
  card: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  foreground: string;
  subForeground: string;
  mutedForeground: string;
  border: string;
  amber: string;
  green: string;
  red: string;
  track: string;
  radius: number;
}

export interface Theme {
  id: ThemeId;
  nameRu: string;
  preview: string;
  colors: ThemeColors;
}

const THEMES: Record<ThemeId, Theme> = {
  space: {
    id: "space",
    nameRu: "Космос",
    preview: "#6366F1",
    colors: {
      background: "#0F0F1A",
      card: "#16162A",
      primary: "#6366F1",
      primaryForeground: "#FFFFFF",
      secondary: "#1E1E30",
      foreground: "#F1F5F9",
      subForeground: "rgba(241,245,249,0.55)",
      mutedForeground: "rgba(241,245,249,0.30)",
      border: "#1E1E32",
      amber: "#F59E0B",
      green: "#10B981",
      red: "#EF4444",
      track: "#1E1E30",
      radius: 16,
    },
  },
  noir: {
    id: "noir",
    nameRu: "Нуар",
    preview: "#22D3EE",
    colors: {
      background: "#000000",
      card: "#0E0E0E",
      primary: "#22D3EE",
      primaryForeground: "#000000",
      secondary: "#1A1A1A",
      foreground: "#F8FAFC",
      subForeground: "rgba(248,250,252,0.55)",
      mutedForeground: "rgba(248,250,252,0.30)",
      border: "#1A1A1A",
      amber: "#FCD34D",
      green: "#4ADE80",
      red: "#F87171",
      track: "#1A1A1A",
      radius: 12,
    },
  },
  nordic: {
    id: "nordic",
    nameRu: "Нордик",
    preview: "#14B8A6",
    colors: {
      background: "#0D1B2A",
      card: "#122233",
      primary: "#14B8A6",
      primaryForeground: "#FFFFFF",
      secondary: "#1B2E42",
      foreground: "#E2E8F0",
      subForeground: "rgba(226,232,240,0.55)",
      mutedForeground: "rgba(226,232,240,0.30)",
      border: "#1B2E42",
      amber: "#FBBF24",
      green: "#34D399",
      red: "#F87171",
      track: "#1B2E42",
      radius: 20,
    },
  },
  dawn: {
    id: "dawn",
    nameRu: "Рассвет",
    preview: "#EA580C",
    colors: {
      background: "#FFFBF5",
      card: "#FFFFFF",
      primary: "#EA580C",
      primaryForeground: "#FFFFFF",
      secondary: "#FEF3E2",
      foreground: "#1C1917",
      subForeground: "rgba(28,25,23,0.60)",
      mutedForeground: "rgba(28,25,23,0.40)",
      border: "#FDE8D0",
      amber: "#D97706",
      green: "#16A34A",
      red: "#DC2626",
      track: "#FEF3E2",
      radius: 16,
    },
  },
};

export default THEMES;
