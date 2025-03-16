import {
  VisibilityMetrics,
  PositionMetrics,
  DimensionMetrics,
  ThresholdMetrics,
  DynamicsMetrics,
  EntryMetrics,
} from "./types";

/**
 * Calculate visibility metrics from an IntersectionObserver entry
 */
export function calculateVisibility(
  entry: IntersectionObserverEntry
): VisibilityMetrics {
  // Calculate percentage visible (0-100)
  const percentage = Math.round(entry.intersectionRatio * 100);

  // Determine visibility states
  const isPartiallyVisible = entry.isIntersecting && percentage > 0;
  const isFullyVisible = percentage >= 99; // Allow tiny rounding errors
  const isInvisible = percentage === 0;

  return {
    percentage,
    isFullyVisible,
    isPartiallyVisible,
    isInvisible,
  };
}

/**
 * Calculate dimension metrics from element and viewport
 */
export function calculateDimensions(
  rect: DOMRectReadOnly,
  viewportHeight: number,
  viewportWidth: number
): DimensionMetrics {
  // Check for zero dimensions
  const hasZeroDimensions = rect.height === 0 || rect.width === 0;

  // Calculate basic dimensions
  const height = rect.height;
  const width = rect.width;

  // Calculate ratios
  const heightRatio = viewportHeight > 0 ? height / viewportHeight : 0;
  const widthRatio = viewportWidth > 0 ? width / viewportWidth : 0;

  return {
    height,
    width,
    heightRatio,
    widthRatio,
    viewportHeight,
    viewportWidth,
    hasZeroDimensions,
  };
}

/**
 * Calculate position metrics relative to viewport
 */
export function calculatePositions(
  rect: DOMRectReadOnly,
  viewportHeight: number,
  _viewportWidth: number,
  offsetTop: number = 0,
  offsetBottom: number = 0
): PositionMetrics {
  // Calculate center positions
  const elementCenterY = rect.top + rect.height / 2;
  const viewportCenterY = viewportHeight / 2;

  // Calculate relative positions (px)
  const relativeToCenterY = elementCenterY - viewportCenterY;
  const relativeToTopY = rect.top - offsetTop;
  const relativeToBottomY = rect.bottom - (viewportHeight - offsetBottom);

  // Calculate normalized positions (-1 to 1)
  // For normalizedCenter:
  // -1 means element is entirely above viewport center
  // 0 means element center is aligned with viewport center
  // 1 means element is entirely below viewport center
  const maxDistance = Math.max(viewportHeight, rect.height) / 2;
  const normalizedCenter =
    maxDistance > 0
      ? Math.max(-1, Math.min(1, relativeToCenterY / maxDistance))
      : 0;

  // For normalizedTop:
  // -1 means element is entirely above viewport
  // 0 means element top is aligned with viewport top
  // 1 means element is entirely below viewport top
  const normalizedTop = Math.max(
    -1,
    Math.min(1, relativeToTopY / (viewportHeight * 0.5))
  );

  // For normalizedBottom:
  // -1 means element is entirely above viewport bottom
  // 0 means element bottom is aligned with viewport bottom
  // 1 means element is entirely below viewport bottom
  const normalizedBottom = Math.max(
    -1,
    Math.min(1, relativeToBottomY / (viewportHeight * 0.5))
  );

  return {
    relativeToCenterY,
    relativeToTopY,
    relativeToBottomY,
    normalizedCenter,
    normalizedTop,
    normalizedBottom,
  };
}

/**
 * Calculate threshold metrics based on element position
 */
export function calculateThresholds(
  intersectionRatio: number,
  thresholdValues: number[]
): ThresholdMetrics {
  // Sort thresholds in ascending order
  const sortedThresholds = [...thresholdValues].sort((a, b) => a - b);

  // Current visibility percentage
  const currentPercentage = intersectionRatio * 100;

  // Initialize threshold tracking
  const thresholds: ThresholdMetrics = {
    crossed: [],
    active: null,
    next: null,
  };

  // Calculate progress for each threshold
  sortedThresholds.forEach((threshold) => {
    // Calculate normalized progress for this threshold (-1 to 1)
    // -1: threshold not yet reached
    // 0: exactly at threshold
    // 1: completely passed threshold
    const distance = currentPercentage - threshold;
    const maxDistance = 25; // Assume 25 percentage points is the max distance to normalize to -1 or 1
    const normalizedProgress = Math.max(
      -1,
      Math.min(1, distance / maxDistance)
    );

    // Add to thresholds object
    thresholds[threshold] = normalizedProgress;

    // Track crossed thresholds
    if (normalizedProgress >= 0) {
      thresholds.crossed.push(threshold);
    }
  });

  // Determine active and next thresholds
  if (thresholds.crossed.length > 0) {
    thresholds.active = Math.max(...thresholds.crossed);

    // Find next threshold
    const nextThresholds = sortedThresholds.filter(
      (t) => t > (thresholds.active || 0)
    );
    thresholds.next =
      nextThresholds.length > 0 ? Math.min(...nextThresholds) : null;
  } else {
    thresholds.active = null;
    thresholds.next = sortedThresholds.length > 0 ? sortedThresholds[0] : null;
  }

  return thresholds;
}

/**
 * Calculate scroll dynamics metrics
 */
export function calculateDynamics(
  currentScrollY: number,
  previousScrollY: number,
  currentTime: number,
  previousTime: number,
  previousVelocity: number,
  previousInertia: number,
  inertiaDecayTime: number = 300,
  maxExpectedVelocity: number = 1000
): DynamicsMetrics {
  // Calculate time delta, ensuring it's at least 1ms to avoid division by zero
  const timeDelta = Math.max(1, currentTime - previousTime);

  // Calculate velocity in pixels per second
  const distance = Math.abs(currentScrollY - previousScrollY);
  const velocity = distance / (timeDelta / 1000);

  // Calculate acceleration (change in velocity)
  const acceleration = (velocity - previousVelocity) / (timeDelta / 1000);

  // Calculate inertia (decays over time when scrolling stops)
  const timeSinceLastScroll = currentTime - previousTime;
  const isScrolling = timeSinceLastScroll < 50; // Consider scrolling stopped after 50ms
  const inertiaDecayFactor = Math.min(
    1,
    timeSinceLastScroll / inertiaDecayTime
  );
  const inertia = isScrolling
    ? 1
    : Math.max(0, previousInertia - inertiaDecayFactor);

  // Calculate eased value based on chosen easing
  const normalizedVelocity = Math.min(1, velocity / maxExpectedVelocity);
  const eased = cubicBezier(0.33, 1, 0.68, 1, normalizedVelocity);

  return {
    velocity,
    acceleration,
    inertia,
    eased,
    lastScrollTime: currentTime,
    timeSinceLastScroll,
  };
}

/**
 * Calculate entry/exit metrics
 */
export function calculateEntryMetrics(
  isInViewport: boolean,
  wasInViewport: boolean,
  currentDirection: "up" | "down" | null,
  previousEntry: EntryMetrics,
  currentTime: number
): EntryMetrics {
  const result = { ...previousEntry };

  // Handle entry
  if (isInViewport && !wasInViewport) {
    result.from = currentDirection === "down" ? "top" : "bottom";
    result.to = null;
    result.time = currentTime;
  }

  // Handle exit
  if (!isInViewport && wasInViewport) {
    result.to = currentDirection === "down" ? "bottom" : "top";
  }

  // Calculate duration if in viewport
  if (isInViewport && result.time !== null) {
    result.duration = currentTime - result.time;
  } else if (!isInViewport) {
    result.duration = 0;
  }

  return result;
}

/**
 * Apply a cubic bezier function with the given control points
 */
export function cubicBezier(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  t: number
): number {
  // Cubic Bezier function with control points (0,0), (x1,y1), (x2,y2), (1,1)
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;

  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;

  const sampleCurveX = (t: number) => ((ax * t + bx) * t + cx) * t;
  const sampleCurveY = (t: number) => ((ay * t + by) * t + cy) * t;

  // Find t for given x using Newton-Raphson method
  let x = t;
  for (let i = 0; i < 8; i++) {
    const z = sampleCurveX(x) - t;
    if (Math.abs(z) < 1e-3) break;
    x = x - z / (3 * ax * x * x + 2 * bx * x + cx);
  }

  return sampleCurveY(x);
}

/**
 * Calculate the direction of scroll
 */
export function detectDirection(
  currentScrollY: number,
  previousScrollY: number
): "up" | "down" | null {
  if (currentScrollY === previousScrollY) return null;
  return currentScrollY > previousScrollY ? "down" : "up";
}

/**
 * Get default direction based on element position relative to viewport
 */
export function getDefaultEntryDirection(
  rect: DOMRectReadOnly,
  viewportHeight: number
): "top" | "bottom" {
  const elementMiddle = rect.top + rect.height / 2;
  const viewportMiddle = viewportHeight / 2;
  return elementMiddle <= viewportMiddle ? "top" : "bottom";
}
