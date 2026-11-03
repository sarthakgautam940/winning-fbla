"use client";

import { useEffect } from "react";
import { useProgress } from "@/lib/progress/store";

// Keeps <html data-theme> in step with the saved setting. Light is the default;
// an older saved "system" value is treated as light.
export function ThemeSync() {
  const theme = useProgress().settings.theme;
  useEffect(() => {
    try {
      localStorage.setItem("wf-theme", theme);
    } catch {
      // storage blocked: the theme still applies for this visit
    }
    document.documentElement.dataset.theme = theme === "dark" ? "dark" : "light";
  }, [theme]);
  return null;
}
