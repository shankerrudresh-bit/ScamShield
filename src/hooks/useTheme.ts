import { useCallback, useEffect, useMemo, useState } from "react";

const THEME_KEY = "scamshield_theme";
export type Theme = "light" | "dark";

function systemPrefersDark(): boolean {
  try {
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  } catch {
    return false;
  }
}

function storedTheme(): Theme | null {
  try {
    const raw = localStorage.getItem(THEME_KEY);
    if (raw === "light" || raw === "dark") return raw;
    return null;
  } catch {
    return null;
  }
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => storedTheme() ?? (systemPrefersDark() ? "dark" : "light"));

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      /* noop */
    }
  }, [theme]);

  // Keep in sync if the host iframe pushes a theme after mount (main.tsx does this).
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === "host:set-theme") {
        setTheme(event.data.theme === "dark" ? "dark" : "light");
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  }, []);

  return useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme]);
}