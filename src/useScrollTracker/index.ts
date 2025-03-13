import * as React from 'react';
const { useRef, useState, useEffect, useCallback } = React;
import { 
  ScrollTrackerOptions,
  ScrollMetrics,
  ScrollTrackerResult
} from './utils/types';
import {
  calculateVisibility,
  calculateDimensions,
  calculatePositions,
  calculateThresholds,
  calculateDynamics,
  calculateEntryMetrics,
  detectDirection
} from './utils/calculations';
import {
  debounce,
  rafThrottle,
  isBrowser,
  hasIntersectionObserver,
  hasResizeObserver
} from './utils/performance';
import { initialMetricsState } from './utils/initialState';

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
export function useScrollTracker(options: ScrollTrackerOptions = {}): ScrollTrackerResult {
  // Merge provided options with defaults for a complete configuration
  const {
    // Thresholds determine at which visibility percentages we want to track crossing points
    // e.g. [0, 25, 50, 75, 100] tracks when the element is 0%, 25%, 50%, 75%, and 100% visible
    thresholds = [0, 25, 50, 75, 100],
    
    // The rootMargin affects the IntersectionObserver calculation area, similar to CSS margin
    // A positive value expands the area, making elements "visible" before they actually are
    rootMargin = '0px 0px 0px 0px',
    
    // Offsets adjust the position calculations to account for fixed elements like headers/footers
    offsetTop = 0,
    offsetBottom = 0,
    
    // Allows temporarily disabling tracking for performance optimization
    disabled = false,
    
    // Custom scroll container instead of window
    root = undefined,
    
    // Controls how frequently scroll events are processed for smoother performance
    throttleDelay = 0,
    
    // Configuration for physics-based scroll animation behaviors
    dynamics = {
      // Controls how quickly the inertia effect decays after scrolling stops
      inertiaDecayTime: 300,
      
      // Used to normalize velocity values into a 0-1 range
      maxVelocity: 1000,
      
      // Determines the acceleration curve for animations
      easing: 'easeInOut',
      
      // Control points for custom cubic-bezier easing
      customEasingPoints: [0.33, 1, 0.68, 1]
    }
  } = options;

  // ===== REF DECLARATIONS =====
  
  // Ref for the tracked DOM element - this must be attached to the element via the ref attribute
  const elementRef = useRef<HTMLElement>(null);
  
  // Refs for browser APIs that need to be cleaned up on unmount
  const intersectionObserver = useRef<IntersectionObserver | null>(null);
  const resizeObserver = useRef<ResizeObserver | null>(null);
  const animationFrameId = useRef<number | null>(null);

  // Refs for persistent values that need to be maintained across renders
  // These are essential for calculating velocity, acceleration, and inertia
  const previousScrollY = useRef<number>(0);        // Last scroll position
  const previousScrollTime = useRef<number>(0);     // Timestamp of last scroll event
  const previousVelocity = useRef<number>(0);       // Last calculated velocity
  const previousInertia = useRef<number>(0);        // Last calculated inertia value
  const isInViewportRef = useRef<boolean>(false);   // Current visibility state for optimization

  // ===== STATE MANAGEMENT =====
  
  // Main metrics state containing all calculated scroll-related data
  // Using one state object instead of multiple state values prevents multiple re-renders
  const [metrics, setMetrics] = useState<ScrollMetrics>(initialMetricsState);

  // ===== ANIMATION FRAME MANAGEMENT =====
  
  /**
   * Utility to cancel any pending animation frames to prevent memory leaks
   * and ensure clean updates when component unmounts or rerenders.
   * This is crucial for preventing outdated calculations from being applied
   * after the component's state has changed.
   */
  const cancelAnimationFrame = useCallback(() => {
    if (animationFrameId.current !== null) {
      window.cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
  }, []);

  // ===== INTERSECTION HANDLER =====
  
  /**
   * Processes IntersectionObserver entries when the tracked element's
   * visibility changes relative to the viewport.
   * 
   * This is the primary handler for calculating core metrics when an element
   * enters, exits, or changes its intersection with the viewport. It provides
   * a complete recalculation of all metrics.
   */
  const handleIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
    // Skip processing if element is missing or tracking is disabled
    if (!elementRef.current || disabled) return;
    
    // Get the first entry (there should only be one for our observed element)
    const entry = entries[0];
    
    // Track visibility state changes for entry/exit detection
    const wasInViewport = isInViewportRef.current;
    const isInViewport = entry.isIntersecting;
    isInViewportRef.current = isInViewport;
    
    // Get current viewport dimensions for calculations
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    
    // Calculate current direction
    const currentScrollY = window.scrollY;
    const direction = detectDirection(currentScrollY, previousScrollY.current);
    previousScrollY.current = currentScrollY;
    
    // Get element rect
    const rect = entry.boundingClientRect;
    
    // Calculate all metrics
    const visibility = calculateVisibility(entry);
    const dimensions = calculateDimensions(rect, viewportHeight, viewportWidth);
    const position = calculatePositions(rect, viewportHeight, viewportWidth, offsetTop, offsetBottom);
    const thresholdsMetrics = calculateThresholds(entry.intersectionRatio, thresholds);
    
    // Calculate dynamics
    const now = performance.now();
    const dynamicsMetrics = calculateDynamics(
      currentScrollY,
      previousScrollY.current,
      now,
      previousScrollTime.current || now,
      previousVelocity.current,
      previousInertia.current,
      dynamics.inertiaDecayTime,
      dynamics.maxVelocity
    );
    
    // Update refs for next dynamics calculation
    previousScrollTime.current = now;
    previousVelocity.current = dynamicsMetrics.velocity;
    previousInertia.current = dynamicsMetrics.inertia;
    
    // Calculate entry/exit metrics
    const entryMetrics = calculateEntryMetrics(
      isInViewport,
      wasInViewport,
      direction,
      metrics.entry,
      now
    );
    
    // Update metrics
    setMetrics(prevMetrics => ({
      visibility,
      dimensions,
      position,
      direction,
      dynamics: dynamicsMetrics,
      thresholds: thresholdsMetrics,
      entry: entryMetrics
    }));
    
  }, [metrics.entry, disabled, offsetTop, offsetBottom, thresholds, dynamics.inertiaDecayTime, dynamics.maxVelocity]);

  // ===== SCROLL EVENT HANDLER =====
  
  /**
   * Processes scroll events to update dynamics-related metrics.
   * 
   * Unlike the intersection handler which recalculates all metrics,
   * this handler is optimized to only update scroll physics values
   * (velocity, inertia, etc.) for performance reasons, since these
   * need to update more frequently during active scrolling.
   * 
   * The handler uses requestAnimationFrame to limit updates to the
   * browser's render cycle, preventing excessive calculations.
   */
  const handleScroll = useCallback(() => {
    // Skip if element is missing, tracking is disabled, or element is not visible
    // The visibility check is a key optimization - no need to calculate metrics
    // for elements that aren't currently visible in the viewport
    if (!elementRef.current || disabled || !isInViewportRef.current) return;
    
    // Use requestAnimationFrame to throttle updates to browser's render cycle
    // This cancels any pending frame before requesting a new one to prevent
    // multiple redundant updates when scroll events fire rapidly
    cancelAnimationFrame();
    animationFrameId.current = requestAnimationFrame(() => {
      // Get current scroll position and calculate direction
      const currentScrollY = window.scrollY;
      const direction = detectDirection(currentScrollY, previousScrollY.current);
      
      // Get current timestamp for timing calculations
      const now = performance.now();
      
      // Calculate dynamics metrics (velocity, acceleration, inertia)
      // These physics-based values enable natural-feeling animations
      const dynamicsMetrics = calculateDynamics(
        currentScrollY,
        previousScrollY.current,
        now,
        previousScrollTime.current,
        previousVelocity.current,
        previousInertia.current,
        dynamics.inertiaDecayTime,
        dynamics.maxVelocity
      );
      
      // Store current values for next calculation
      previousScrollY.current = currentScrollY;
      previousScrollTime.current = now;
      previousVelocity.current = dynamicsMetrics.velocity;
      previousInertia.current = dynamicsMetrics.inertia;
      
      // Partial state update for performance - only update direction and dynamics
      // This is more efficient than recalculating all metrics on every scroll event
      setMetrics(prevMetrics => ({
        ...prevMetrics,
        direction,
        dynamics: dynamicsMetrics
      }));
    });
  }, [cancelAnimationFrame, disabled, dynamics.inertiaDecayTime, dynamics.maxVelocity]);

  // ===== RESIZE EVENT HANDLER =====
  
  /**
   * Handles resize events for both the element and viewport.
   * 
   * When the element or viewport size changes, we need to recalculate metrics
   * since all position and dimension values may have changed. This handler
   * is debounced to prevent excessive calculations during continuous resize.
   * 
   * The implementation disconnects and reconnects the IntersectionObserver
   * to force a complete recalculation of intersection metrics.
   */
  const handleResize = useCallback(debounce(() => {
    if (!elementRef.current || disabled) return;
    
    // Disconnect observer to reset its internal calculations
    // This ensures we get fresh measurements after the resize
    intersectionObserver.current?.disconnect();
    
    // Re-observe after a short delay to ensure resize is completely finished
    // This helps with accurate measurements, especially in complex layouts
    setTimeout(() => {
      if (elementRef.current) {
        intersectionObserver.current?.observe(elementRef.current);
      }
    }, 100);
  }, 200), [disabled]);

  // ===== SETUP AND CLEANUP EFFECT =====
  
  /**
   * Main effect for setting up and cleaning up observers and event listeners.
   * 
   * This effect runs when the component mounts and when key dependencies change.
   * It's responsible for:
   * 1. Setting up the IntersectionObserver to track element visibility
   * 2. Setting up the ResizeObserver to handle size changes
   * 3. Adding scroll and resize event listeners
   * 4. Cleaning up all observers and listeners when the component unmounts
   */
  useEffect(() => {
    // Skip setup in non-browser environments (SSR) or when disabled
    if (!isBrowser() || disabled) return;
    
    // Get the target element from the ref
    const element = elementRef.current;
    if (!element) return;
    
    // Clean up any existing observers before creating new ones
    // This prevents memory leaks and duplicate observers
    intersectionObserver.current?.disconnect();
    resizeObserver.current?.disconnect();
    cancelAnimationFrame();
    
    // ===== INTERSECTION OBSERVER SETUP =====
    if (hasIntersectionObserver()) {
      // Create a new IntersectionObserver with the provided options
      intersectionObserver.current = new IntersectionObserver(
        handleIntersection,
        {
          // Convert percentage thresholds to 0-1 values for the browser API
          threshold: thresholds.map(t => t / 100),
          
          // Apply root margin for adjusting the intersection rectangle
          rootMargin,
          
          // Set custom scroll container if provided, otherwise use viewport
          root: root?.current || null
        }
      );
      
      // Start observing the target element
      intersectionObserver.current.observe(element);
    }
    
    // ===== RESIZE OBSERVER SETUP =====
    if (hasResizeObserver()) {
      // Create ResizeObserver to track element size changes
      resizeObserver.current = new ResizeObserver(handleResize);
      resizeObserver.current.observe(element);
      
      // Also track viewport size changes via window resize
      window.addEventListener('resize', handleResize);
    }
    
    // ===== SCROLL LISTENER SETUP =====
    
    // Create optimized scroll handler based on throttle options
    // - If throttleDelay is provided, use debounce with that delay
    // - Otherwise, use requestAnimationFrame throttling for smoothest performance
    const scrollHandler = throttleDelay > 0 
      ? debounce(handleScroll, throttleDelay) 
      : rafThrottle(handleScroll);
    
    // Add scroll listener with passive flag for better performance
    // Passive listeners don't block the browser's main thread
    window.addEventListener('scroll', scrollHandler, { passive: true });
    
    // ===== CLEANUP FUNCTION =====
    return () => {
      // Disconnect all observers
      intersectionObserver.current?.disconnect();
      resizeObserver.current?.disconnect();
      
      // Remove event listeners
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', scrollHandler);
      
      // Cancel any pending animation frames
      cancelAnimationFrame();
    };
  }, [
    // Dependencies that should trigger observer reset when changed
    disabled,            // Re-setup when enabled/disabled changes
    handleIntersection,  // Re-setup if intersection handler changes
    handleResize,        // Re-setup if resize handler changes
    handleScroll,        // Re-setup if scroll handler changes
    rootMargin,          // Re-setup if observer margins change
    thresholds,          // Re-setup if threshold points change
    root,                // Re-setup if scroll container changes
    throttleDelay,       // Re-setup if throttling behavior changes
    cancelAnimationFrame // Re-setup if frame cancellation changes
  ]);
  
  return { ref: elementRef, metrics };
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
  children: (metrics: ScrollMetrics, ref: React.RefObject<HTMLElement>) => React.ReactNode;
}

/**
 * A wrapper component that provides scroll tracking metrics to its children
 * using the render props pattern.
 * 
 * This component is a thin wrapper around the useScrollTracker hook, providing
 * a more declarative way to use scroll tracking within JSX. It handles attaching
 * the ref and passing metrics to children through a render prop function.
 * 
 * @example
 * ```tsx
 * <ScrollTracker>
 *   {(metrics, ref) => (
 *     <div ref={ref} style={{ opacity: metrics.visibility.percentage / 100 }}>
 *       This element fades in as it enters the viewport
 *     </div>
 *   )}
 * </ScrollTracker>
 * ```
 * 
 * @param props - ScrollTracker component props including children render function and options
 * @returns Fragment containing the result of the children render function
 */
export const ScrollTracker: React.FC<ScrollTrackerProps> = ({ 
  children, 
  ...options 
}): JSX.Element => {
  // Apply the useScrollTracker hook with the provided options
  const { ref, metrics } = useScrollTracker(options);
  
  // Call the children render function with metrics and ref
  return <>{children(metrics, ref)}</>;
};

export default useScrollTracker;