export type Theme = "auto" | "light" | "dark";
export const THEME_COOKIE = "regali_theme";

export function parseTheme(v: string | undefined): Theme {
  return v === "light" || v === "dark" ? v : "auto";
}

export const THEME_COLORS = { light: "#f6f1e7", dark: "#000000" };
