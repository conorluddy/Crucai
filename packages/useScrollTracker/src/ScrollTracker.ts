/**
 * ScrollTracker - Vanilla JavaScript version
 *
 * A class-based implementation of the scroll tracking functionality
 * that works without React. Provides the same metrics and features
 * as the React hook version.
 */

import {
  calculateVisibility,
  calculateDimensions,
  calculatePositions,
  calculateThresholds,
  calculateDynamics,
  calculateEntryMetrics,
  detectDirection,
} from "./utils/calculations";

import {
  debounce,
  rafThrottle,
  isBrowser,
  hasIntersectionObserver,
  hasResizeObserver,
} from "./utils/performance";

import { initialMetricsState } from "./utils/initialState";

import type {
  ScrollTrackerOptions,
  ScrollMetrics,
  EntryMetrics,
} from "./utils/types";

type Callback = (metrics: ScrollMetrics) => void;

/**
 * ScrollTracker class for vanilla JavaScript projects
 *
 * Tracks an element's position relative to the viewport and provides
 * detailed metrics for creating scroll-based animations without React.
 *
 * @example
 * ```js
 * const tracker = new ScrollTracker(myElement, {
 *   thresholds: [0, 50, 100]
 * });
 *
 * tracker.onUpdate((metrics) => {
 *   // Update your UI based on scroll metrics
 *   myElement.style.opacity = metrics.visibility.percentage / 100;
 * });
 *
 * // Later when done:
 * tracker.destroy();
 * ```
 */
export class ScrollTracker {
  private element: HTMLElement;
  private options: ScrollTrackerOptions;
  private metrics: ScrollMetrics = initialMetricsState;
  private updateCallbacks: Callback[] = [];

  // Browser API instances
  private intersectionObserver: IntersectionObserver | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private animationFrameId: number | null = null;

  // Tracking values for calculations
  private previousScrollY: number = 0;
  private previousScrollTime: number = 0;
  private previousVelocity: number = 0;
  private previousInertia: number = 0;
  private isInViewport: boolean = false;
  private entryMetrics: EntryMetrics = {
    from: null,
    to: null,
    time: null,
    duration: 0,
  };

  // Bound handlers to ensure we can properly remove event listeners
  private boundHandleScroll: () => void;
  private boundHandleResize: () => void;

  /**
   * Create a new ScrollTracker instance
   *
   * @param element - The DOM element to track
   * @param options - Configuration options
   */
  constructor(element: HTMLElement, options: ScrollTrackerOptions = {}) {
    if (!element) {
      throw new Error("ScrollTracker requires a valid DOM element");
    }

    this.element = element;

    // Merge provided options with defaults
    this.options = {
      thresholds: options.thresholds || [0, 25, 50, 75, 100],
      rootMargin: options.rootMargin || "0px 0px 0px 0px",
      offsetTop: options.offsetTop || 0,
      offsetBottom: options.offsetBottom || 0,
      disabled: options.disabled || false,
      root: options.root,
      throttleDelay: options.throttleDelay || 0,
      dynamics: {
        inertiaDecayTime: options.dynamics?.inertiaDecayTime || 300,
        maxVelocity: options.dynamics?.maxVelocity || 1000,
        easing: options.dynamics?.easing || "easeInOut",
        customEasingPoints: options.dynamics?.customEasingPoints || [
          0.33, 1, 0.68, 1,
        ],
      },
    };

    // Create bound handlers for event listeners
    this.boundHandleScroll =
      this.throttleDelay > 0
        ? debounce(this.handleScroll.bind(this), this.throttleDelay)
        : rafThrottle(this.handleScroll.bind(this));

    this.boundHandleResize = debounce(this.handleResize.bind(this), 200);

    // Initialize tracking
    this.initialize();
  }

  /**
   * Set up observers and event listeners
   */
  private initialize(): void {
    if (!isBrowser() || this.options.disabled) return;

    // Set up IntersectionObserver
    if (hasIntersectionObserver()) {
      this.intersectionObserver = new IntersectionObserver(
        this.handleIntersection.bind(this),
        {
          threshold: this.options.thresholds?.map((t) => t / 100),
          rootMargin: this.options.rootMargin,
          root: this.options.root?.current || null,
        }
      );
      this.intersectionObserver.observe(this.element);
    }

    // Set up ResizeObserver
    if (hasResizeObserver()) {
      this.resizeObserver = new ResizeObserver(this.boundHandleResize);
      this.resizeObserver.observe(this.element);
      window.addEventListener("resize", this.boundHandleResize);
    }

    // Set up scroll listener
    window.addEventListener("scroll", this.boundHandleScroll, {
      passive: true,
    });
  }

  /**
   * Clean up observers and event listeners
   */
  public destroy(): void {
    // Disconnect observers
    this.intersectionObserver?.disconnect();
    this.resizeObserver?.disconnect();

    // Remove event listeners
    window.removeEventListener("resize", this.boundHandleResize);
    window.removeEventListener("scroll", this.boundHandleScroll);

    // Cancel any pending animation frames
    if (this.animationFrameId !== null) {
      window.cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    // Clear update callbacks
    this.updateCallbacks = [];
  }

  /**
   * Register a callback to be called when metrics update
   *
   * @param callback - Function to call with updated metrics
   * @returns Function to remove this specific callback
   */
  public onUpdate(callback: Callback): () => void {
    this.updateCallbacks.push(callback);

    // Immediately call with current metrics
    callback(this.metrics);

    // Return a function to remove this callback
    return () => {
      this.updateCallbacks = this.updateCallbacks.filter(
        (cb) => cb !== callback
      );
    };
  }

  /**
   * Get the current metrics
   */
  public getMetrics(): ScrollMetrics {
    return this.metrics;
  }

  /**
   * Handle intersection changes
   */
  private handleIntersection(entries: IntersectionObserverEntry[]): void {
    if (this.options.disabled) return;

    const entry = entries[0];

    // Track visibility state changes
    const wasInViewport = this.isInViewport;
    const isInViewport = entry.isIntersecting;
    this.isInViewport = isInViewport;

    // Get current viewport dimensions
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    // Calculate current direction
    const currentScrollY = window.scrollY;
    const direction = detectDirection(currentScrollY, this.previousScrollY);
    this.previousScrollY = currentScrollY;

    // Get element rect
    const rect = entry.boundingClientRect;

    // Calculate all metrics
    const visibility = calculateVisibility(entry);
    const dimensions = calculateDimensions(rect, viewportHeight, viewportWidth);
    const position = calculatePositions(
      rect,
      viewportHeight,
      this.options.offsetTop ?? 0,
      this.options.offsetBottom
    );
    const thresholdsMetrics = calculateThresholds(
      entry.intersectionRatio,
      this.options.thresholds ?? []
    );

    // Calculate dynamics
    const now = performance.now();
    const dynamicsMetrics = calculateDynamics(
      currentScrollY,
      this.previousScrollY,
      now,
      this.previousScrollTime || now,
      this.previousVelocity,
      this.previousInertia,
      this.options.dynamics?.inertiaDecayTime,
      this.options.dynamics?.maxVelocity
    );

    // Update refs for next dynamics calculation
    this.previousScrollTime = now;
    this.previousVelocity = dynamicsMetrics.velocity;
    this.previousInertia = dynamicsMetrics.inertia;

    // Calculate entry/exit metrics
    const entryMetrics = calculateEntryMetrics(
      isInViewport,
      wasInViewport,
      direction,
      this.entryMetrics,
      now
    );

    // Update entry metrics
    this.entryMetrics = entryMetrics;

    // Update metrics
    const newMetrics = {
      visibility,
      dimensions,
      position,
      direction,
      dynamics: dynamicsMetrics,
      thresholds: thresholdsMetrics,
      entry: entryMetrics,
    };

    // Check if metrics have significantly changed before notifying
    if (
      this.metrics.visibility.percentage !== visibility.percentage ||
      this.metrics.position.normalizedCenter !== position.normalizedCenter ||
      this.metrics.direction !== direction ||
      Math.abs(this.metrics.dynamics.velocity - dynamicsMetrics.velocity) >=
        5 ||
      Math.abs(this.metrics.dynamics.inertia - dynamicsMetrics.inertia) >= 0.02
    ) {
      this.metrics = newMetrics;
      this.notifyUpdateCallbacks();
    }
  }

  /**
   * Handle scroll events
   */
  private handleScroll(): void {
    if (this.options.disabled || !this.isInViewport) return;

    // Use requestAnimationFrame to throttle updates to browser's render cycle
    if (this.animationFrameId !== null) {
      window.cancelAnimationFrame(this.animationFrameId);
    }

    this.animationFrameId = requestAnimationFrame(() => {
      // Get current scroll position and calculate direction
      const currentScrollY = window.scrollY;
      const direction = detectDirection(currentScrollY, this.previousScrollY);

      // Get current timestamp
      const now = performance.now();

      // Calculate dynamics metrics
      const dynamicsMetrics = calculateDynamics(
        currentScrollY,
        this.previousScrollY,
        now,
        this.previousScrollTime,
        this.previousVelocity,
        this.previousInertia,
        this.options.dynamics?.inertiaDecayTime,
        this.options.dynamics?.maxVelocity
      );

      // Store current values for next calculation
      this.previousScrollY = currentScrollY;
      this.previousScrollTime = now;
      this.previousVelocity = dynamicsMetrics.velocity;
      this.previousInertia = dynamicsMetrics.inertia;

      // Check if metrics have significantly changed
      if (
        this.metrics.direction !== direction ||
        Math.abs(this.metrics.dynamics.velocity - dynamicsMetrics.velocity) >=
          10 ||
        Math.abs(this.metrics.dynamics.inertia - dynamicsMetrics.inertia) >=
          0.05
      ) {
        // Update only direction and dynamics for performance
        this.metrics = {
          ...this.metrics,
          direction,
          dynamics: dynamicsMetrics,
        };

        this.notifyUpdateCallbacks();
      }
    });
  }

  /**
   * Handle resize events
   */
  private handleResize(): void {
    if (this.options.disabled) return;

    // Disconnect observer to reset its internal calculations
    this.intersectionObserver?.disconnect();

    // Re-observe after a short delay
    setTimeout(() => {
      if (this.element && this.intersectionObserver) {
        this.intersectionObserver.observe(this.element);
      }
    }, 100);
  }

  /**
   * Notify all registered callbacks with current metrics
   */
  private notifyUpdateCallbacks(): void {
    this.updateCallbacks.forEach((callback) => callback(this.metrics));
  }

  /**
   * Access to throttle delay for internal use
   */
  private get throttleDelay(): number {
    return this.options.throttleDelay || 0;
  }
}

/**
 * Create a standalone scroll tracker for a DOM element
 *
 * @param element - DOM element to track
 * @param options - Configuration options
 * @returns ScrollTracker instance
 */
export function createScrollTracker(
  element: HTMLElement | null,
  options: ScrollTrackerOptions = {}
): ScrollTracker | null {
  if (!element) return null;
  return new ScrollTracker(element, options);
}

export default ScrollTracker;
