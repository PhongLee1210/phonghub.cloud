"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * Returns `false` during SSR and the initial client render (hydration),
 * then `true` once mounted on the client.
 *
 * Use this instead of `useState(false) + useEffect(() => setMounted(true), [])`
 * to avoid the `react-hooks/set-state-in-effect` violation while staying
 * hydration-safe — React's recommended replacement for the isMounted pattern.
 */
export function useMounted(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
