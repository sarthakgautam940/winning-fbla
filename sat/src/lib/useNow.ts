"use client";

import { useSyncExternalStore } from "react";

// Current time, rounded to the minute so it is stable between renders. 0 before hydration.
let cached = 0;
function snapshot() {
  const n = Math.floor(Date.now() / 60000) * 60000;
  if (n !== cached) cached = n;
  return cached;
}
function subscribe(cb: () => void) {
  const t = setInterval(cb, 30000);
  return () => clearInterval(t);
}

export function useNow(): number {
  return useSyncExternalStore(subscribe, snapshot, () => 0);
}
