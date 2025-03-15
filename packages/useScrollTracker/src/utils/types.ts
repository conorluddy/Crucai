/**
 * Configuration options for the scroll tracker hook
 */
export interface ScrollTrackerOptions {
  /**
   * Array of percentage thresholds to track (0-100)
   * @default [0, 25, 50, 75, 100]
   */
  thresholds?: number[];

  /**
   * IntersectionObserver rootMargin property
   * Format: "top right bottom left" in pixels or percentage
   * @default "0px 0px 0px 0px"
   */
  rootMargin?: string;

  /**
   * Offset from top of viewport (e.g., for fixed headers)
   * Applied to calculations but not to IntersectionObserver
   * @default 0
   */
  offsetTop?: number;

  /**
   * Offset from bottom of viewport (e.g., for fixed footers)
   * Applied to calculations but not to IntersectionObserver
   * @default 0
   */
  offsetBottom?: number;

  /**
   * Temporarily disable tracking to conserve resources
   * @default false
   */
  disabled?: boolean;

  /**
   * Use a custom scrollable container instead of window
   * Useful for elements inside custom scroll areas
   * @default window
   */
  root?: React.RefObject<HTMLElement>;

  /**
   * Delay in ms before recalculating on scroll
   * Higher values improve performance but reduce accuracy
   * @default 0 (uses rAF timing)
   */
  throttleDelay?: number;

  /**
   * Options for controlling the scroll dynamics behavior
   */
  dynamics?: ScrollDynamicsOptions;
}

/**
 * Configuration options for the scroll dynamics system
 */
export interface ScrollDynamicsOptions {
  /**
   * How quickly inertia decays after scrolling stops (ms)
   * @default 300
   */
  inertiaDecayTime?: number;

  /**
   * Maximum expected scroll velocity (px/second)
   * Used to normalize velocity values
   * @default 1000
   */
  maxVelocity?: number;

  /**
   * Easing function to use for transitions
   * @default "easeInOut"
   */
  easing?: "linear" | "easeInOut" | "easeIn" | "easeOut" | "custom";

  /**
   * Custom easing cubic-bezier points if using "custom" easing
   * @default [0.33, 1, 0.68, 1]
   */
  customEasingPoints?: [number, number, number, number];
}

/**
 * Metrics about the tracked element's visibility
 */
export interface VisibilityMetrics {
  /**
   * Percentage of element visible in viewport (0-100)
   */
  percentage: number;

  /**
   * Element is fully visible in the viewport
   */
  isFullyVisible: boolean;

  /**
   * Element is partially visible in the viewport
   */
  isPartiallyVisible: boolean;

  /**
   * Element is not visible in the viewport
   */
  isInvisible: boolean;
}

/**
 * Metrics about the tracked element's position
 */
export interface PositionMetrics {
  /**
   * Relative distance to viewport center in pixels
   * Negative: element is above center, Positive: element is below center
   */
  relativeToCenterY: number;

  /**
   * Relative distance to viewport top in pixels
   * Negative: element is above viewport, Positive: element is below top
   */
  relativeToTopY: number;

  /**
   * Relative distance to viewport bottom in pixels
   * Negative: element is above bottom, Positive: element is below viewport
   */
  relativeToBottomY: number;

  /**
   * Normalized distance to viewport center (-1 to 1)
   * -1: completely above, 0: at center, 1: completely below
   */
  normalizedCenter: number;

  /**
   * Normalized distance to viewport top (-1 to 1)
   * -1: completely above, 0: at top edge, 1: completely below
   */
  normalizedTop: number;

  /**
   * Normalized distance to viewport bottom (-1 to 1)
   * -1: completely above, 0: at bottom edge, 1: completely below
   */
  normalizedBottom: number;
}

/**
 * Metrics about the tracked element's dimensions
 */
export interface DimensionMetrics {
  /**
   * Element height in pixels
   */
  height: number;

  /**
   * Element width in pixels
   */
  width: number;

  /**
   * Element height as a ratio of viewport height
   */
  heightRatio: number;

  /**
   * Element width as a ratio of viewport width
   */
  widthRatio: number;

  /**
   * Viewport height in pixels
   */
  viewportHeight: number;

  /**
   * Viewport width in pixels
   */
  viewportWidth: number;

  /**
   * Whether the element has zero dimensions
   */
  hasZeroDimensions?: boolean;
}

/**
 * Metrics about the tracked element's scroll dynamics
 */
export interface DynamicsMetrics {
  /**
   * Scroll velocity in pixels per second
   */
  velocity: number;

  /**
   * Scroll acceleration (rate of velocity change)
   */
  acceleration: number;

  /**
   * Inertia value that gradually decreases when scrolling stops
   * Ranges from 0 (stopped) to 1 (maximum inertia)
   */
  inertia: number;

  /**
   * Eased value for smooth animations based on scroll dynamics
   * Slower to start and end, useful for more natural animations
   */
  eased: number;

  /**
   * Timestamp of last scroll event
   */
  lastScrollTime: number;

  /**
   * Duration since last scroll event (ms)
   */
  timeSinceLastScroll: number;
}

/**
 * Metrics about thresholds the tracked element has crossed
 */
export interface ThresholdMetrics {
  /**
   * Map of threshold percentages to normalized progress values (-1 to 1)
   * -1: threshold not yet reached
   * 0: exactly at threshold
   * 1: threshold completely passed
   */
  [percentage: number]: number;

  /**
   * List of thresholds that have been passed
   */
  crossed: number[];

  /**
   * Most recently crossed threshold
   */
  active: number | null;

  /**
   * Next threshold to be crossed
   */
  next: number | null;
}

/**
 * Metrics about the tracked element's entry and exit from viewport
 */
export interface EntryMetrics {
  /**
   * Direction element entered viewport from
   */
  from: "top" | "bottom" | null;

  /**
   * Direction element is exiting viewport to
   */
  to: "top" | "bottom" | null;

  /**
   * Timestamp when element entered viewport
   */
  time: number | null;

  /**
   * Duration element has been in viewport (ms)
   */
  duration: number;
}

/**
 * Complete metrics returned by the useScrollTracker hook
 */
export interface ScrollMetrics {
  /**
   * Visibility information
   */
  visibility: VisibilityMetrics;

  /**
   * Position information
   */
  position: PositionMetrics;

  /**
   * Dimension information
   */
  dimensions: DimensionMetrics;

  /**
   * Scroll direction and status
   */
  direction: "up" | "down" | null;

  /**
   * Scroll dynamics information
   */
  dynamics: DynamicsMetrics;

  /**
   * Threshold tracking
   */
  thresholds: ThresholdMetrics;

  /**
   * Element entry/exit information
   */
  entry: EntryMetrics;
}

/**
 * Return value from the useScrollTracker hook
 */
export interface ScrollTrackerResult {
  /**
   * Ref to attach to the element you want to track
   */
  ref: React.RefObject<HTMLElement | null>;

  /**
   * Metrics about the tracked element
   */
  metrics: ScrollMetrics;
}
