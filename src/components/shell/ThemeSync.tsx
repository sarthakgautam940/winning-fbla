"use client";

import { useEffect } from "react";
import { useProgress } from "@/lib/progress/store";

// Keeps <html data-theme> in step with the saved setting and, for "system",
// with the operating system's light or dark preference.
export function ThemeSync() {
  const theme = useProgress().settings.theme;
  useEffect(() => {
    try {
      localStorage.setItem("wf-theme", theme);
    } catch {
      // storage blocked: the theme still applies for this visit
    }
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const dark = theme === "dark" || (theme === "system" && media.matches);
      document.documentElement.dataset.theme = dark ? "dark" : "light";
    };
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [theme]);
  return null;
}
