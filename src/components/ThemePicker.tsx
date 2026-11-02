"use client";

import { useState } from "react";
import { THEME_COLORS, THEME_COOKIE, type Theme } from "@/lib/theme";

const OPTIONS: { value: Theme; label: string }[] = [
  { value: "auto", label: "Automatico" },
  { value: "light", label: "Chiaro" },
  { value: "dark", label: "Scuro" },
];

export function ThemePicker({ initial }: { initial: Theme }) {
  const [theme, setTheme] = useState<Theme>(initial);

  function apply(next: Theme) {
    setTheme(next);
    const root = document.documentElement;
    if (next === "auto") delete root.dataset.theme;
    else root.dataset.theme = next;
    document.cookie = `${THEME_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    // Colore della barra del browser
    const dark =
      next === "dark" ||
      (next === "auto" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.querySelectorAll('meta[name="theme-color"]').forEach((m) => {
      m.removeAttribute("media");
      m.setAttribute("content", dark ? THEME_COLORS.dark : THEME_COLORS.light);
    });
  }

  return (
    <div className="segmented" role="radiogroup" aria-label="Aspetto">
      {OPTIONS.map((o) => (
        <label key={o.value}>
          <input
            type="radio"
            name="theme"
            value={o.value}
            checked={theme === o.value}
            onChange={() => apply(o.value)}
          />
          {o.label}
        </label>
      ))}
    </div>
  );
}
