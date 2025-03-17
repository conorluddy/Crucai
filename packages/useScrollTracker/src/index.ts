import { useEffect, useRef, useState } from "react";
import ScrollTracker, { createScrollTracker } from "./ScrollTracker";
import {
  ScrollMetrics,
  ScrollTrackerOptions,
  ScrollTrackerResult,
} from "./utils/types";
import { initialMetricsState } from "./utils/initialState";

/**
 * A React hook that tracks an element's position relative to the viewport,
 * providing detailed metrics for creating scroll-based animations.
 *
 * This hook combines IntersectionObserver, ResizeObserver, and scroll events
 * to efficiently track an element's visibility, position, and movement as the user
 * scrolls. It provides detailed metrics that can be used to create scroll-based
 * animations, parallax effects, and other scroll-driven interactions.
 *
 * Key features:
 * - Visibility tracking (percentage visible, fully/partially visible states)
 * - Position relative to viewport (top, center, bottom, with normalized values)
 * - Threshold crossing detection (track when element passes specific visibility points)
 * - Scroll direction detection (up/down)
 * - Scroll physics (velocity, acceleration, inertia)
 * - Entry/exit tracking (direction, timing)
 *
 * @example
 * ```tsx
 * function FadeInElement() {
 *   const { ref, metrics } = useScrollTracker();
 *
 *   return (
 *     <div
 *       ref={ref}
 *       style={{
 *         opacity: metrics.visibility.percentage / 100,
 *       }}
 *     >
 *       This element fades in as it enters the viewport
 *     </div>
 *   );
 * }
 * ```
 *
 * @param options - Configuration options for customizing tracking behavior
 * @returns Object containing a ref to attach to the element and metrics about its scroll position
 */
export function useScrollTracker(
  options: ScrollTrackerOptions = {}
): ScrollTrackerResult {
  const ref = useRef<HTMLElement>(null);
  const trackerRef = useRef<ScrollTracker | null>(null);

  const [metrics, setMetrics] = useState<ScrollMetrics>(initialMetricsState);

  useEffect(() => {
    if (!ref.current) return;

    trackerRef.current = createScrollTracker(ref.current, options);

    trackerRef.current?.onUpdate((newMetrics) => {
      setMetrics(newMetrics);
    });

    return () => {
      trackerRef.current?.destroy();
      trackerRef.current = null;
    };
  }, []); // Re-run if options or ref.current changes

  return { ref, metrics };
}

/**
 * Props for the ScrollTracker component.
 * Extends ScrollTrackerOptions to include all hook configuration options
 * plus the children render prop function.
 */
export interface ScrollTrackerProps extends ScrollTrackerOptions {
  /**
   * Render prop function that receives metrics and ref.
   * This function-as-child pattern allows components to directly consume
   * scroll metrics without needing to manage refs or hook state themselves.
   *
   * @param metrics - Object containing all scroll-related measurements and calculations
   * @param ref - React ref that must be attached to the element to be tracked
   * @returns React elements to be rendered
   */
  children: (
    metrics: ScrollMetrics,
    ref: React.RefObject<HTMLElement>
  ) => React.ReactNode;
}

export { createScrollTracker, ScrollTracker } from "./ScrollTracker";
export default useScrollTracker;
