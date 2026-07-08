import * as React from "react";

// @see https://usehooks.com/useLockBodyScroll.
export function useLockBody(lock: boolean = true) {
  React.useLayoutEffect((): (() => void) | void => {
    if (!lock) return;
    const originalStyle: string = window.getComputedStyle(
      document.body
    ).overflow;
    document.body.style.overflow = "hidden";
    return () => (document.body.style.overflow = originalStyle);
  }, [lock]);
}
