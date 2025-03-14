import { ScrollMetrics } from './types';

/**
 * Initial metrics state with default/empty values
 */
export const initialMetricsState: ScrollMetrics = {
  // Visibility information
  visibility: {
    percentage: 0,
    isFullyVisible: false,
    isPartiallyVisible: false,
    isInvisible: true
  },
  
  // Position information
  position: {
    relativeToCenterY: 0,
    relativeToTopY: 0,
    relativeToBottomY: 0,
    normalizedCenter: 0,
    normalizedTop: 0,
    normalizedBottom: 0
  },
  
  // Dimension information
  dimensions: {
    height: 0,
    width: 0,
    heightRatio: 0,
    widthRatio: 0,
    viewportHeight: 0,
    viewportWidth: 0,
    hasZeroDimensions: false
  },
  
  // Scroll direction
  direction: null,
  
  // Scroll dynamics information
  dynamics: {
    velocity: 0,
    acceleration: 0,
    inertia: 0,
    eased: 0,
    lastScrollTime: 0,
    timeSinceLastScroll: 0
  },
  
  // Threshold tracking
  thresholds: {
    crossed: [],
    active: null,
    next: null
  },
  
  // Element entry/exit information
  entry: {
    from: null,
    to: null,
    time: null,
    duration: 0
  }
};