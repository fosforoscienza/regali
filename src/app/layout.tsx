import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { THEME_COLORS, THEME_COOKIE, parseTheme } from "@/lib/theme";
import "./globals.css";

export const metadata: Metadata = {
  title: "Regali",
  description: "La lista dei desideri condivisa della famiglia.",
  appleWebApp: { capable: true, title: "Regali", statusBarStyle: "default" },
};

export async function generateViewport(): Promise<Viewport> {
  const theme = parseTheme((await cookies()).get(THEME_COOKIE)?.value);
  return {
    width: "device-width",
    initialScale: 1,
    viewportFit: "cover",
    themeColor:
      theme === "auto"
        ? [
            { media: "(prefers-color-scheme: light)", color: THEME_COLORS.light },
            { media: "(prefers-color-scheme: dark)", color: THEME_COLORS.dark },
          ]
        : THEME_COLORS[theme],
  };
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const theme = parseTheme((await cookies()).get(THEME_COOKIE)?.value);
  return (
    <html lang="it" data-theme={theme === "auto" ? undefined : theme}>
      <body>{children}</body>
    </html>
  );
}
