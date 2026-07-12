"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";

import { cn } from "@/lib/utils";

export interface DraggableCollageContextValue {
  /**
   * Container element the dragged cards are constrained to.
   * Passed straight to framer-motion's `dragConstraints`.
   */
  boundsRef: RefObject<HTMLDivElement | null>;
  /** id of the card currently (or most recently) brought to the front. */
  topId: number | string | undefined;
  /** Lift a card above its siblings and mark the collage as "engaged". */
  bringToFront: (id: number | string) => void;
}

const DraggableCollageContext =
  createContext<DraggableCollageContextValue | null>(null);

/**
 * Read the nearest draggable-collage context. Returns `null` when used
 * outside a provider so consumers can degrade gracefully.
 */
export function useDraggableCollage(): DraggableCollageContextValue | null {
  return useContext(DraggableCollageContext);
}

interface DraggableCollageProps {
  children: ReactNode;
  className?: string;
}

/**
 * Boundary + stacking context for a cluster of physics-draggable cards.
 *
 * Renders a single positioned container whose ref becomes the
 * `dragConstraints` target for every child draggable, and tracks which
 * card was most recently grabbed so siblings can react with depth/dim.
 */
export function DraggableCollage({ children, className }: DraggableCollageProps) {
  const boundsRef = useRef<HTMLDivElement | null>(null);
  const [topId, setTopId] = useState<number | string | undefined>(undefined);

  const bringToFront = useCallback((id: number | string) => {
    setTopId(id);
  }, []);

  return (
    <DraggableCollageContext.Provider
      value={{ boundsRef, topId, bringToFront }}
    >
      <div ref={boundsRef} className={cn(className)}>
        {children}
      </div>
    </DraggableCollageContext.Provider>
  );
}
