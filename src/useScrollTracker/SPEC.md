# useScrollTracker - Technical Specification

## Overview

`useScrollTracker` is a React hook that provides comprehensive scroll position data for DOM elements relative to the viewport. It enables developers to create scroll-based animations and interactions with minimal effort and maximum performance. The hook abstracts away complex scroll calculations and browser APIs, offering a simple interface that works seamlessly with Next.js applications.

## Goals

- Provide accurate scroll position metrics with minimal performance impact
- Create an intuitive, ergonomic API for React developers
- Support multiple tracking modes and customization options
- Maintain compatibility with Next.js and other React frameworks
- Handle edge cases gracefully (SSR, resize, orientation changes)

## API Design

### Basic Usage

```tsx
const { ref, metrics } = useScrollTracker();

return (
  <div ref={ref}>
    {/* Element to track */}
  </div>
);
```

### Advanced Usage

```tsx
const { ref, metrics } = useScrollTracker({
  thresholds: [25, 50, 75, 100],
  rootMargin: "0px 0px 100px 0px",
  offsetTop: 80, // Header height
  disabled: false,
});

return (
  <div 
    ref={ref}
    style={{
      opacity: metrics.visibility.percentage / 100,
      transform: `translateY(${metrics.direction === 'down' ? 
        Math.max(0, 50 - metrics.visibility.percentage / 2) : 0}px)`
    }}
  >
    {/* Element to track */}
  </div>
);
```

### Via Component

```tsx
<ScrollTracker
  thresholds={[25, 50, 75, 100]}
  rootMargin="0px 0px 100px 0px"
>
  {(metrics, ref) => (
    <div 
      ref={ref}
      style={{
        opacity: metrics.visibility.percentage / 100
      }}
    >
      {/* Element to track */}
    </div>
  )}
</ScrollTracker>
```

## Core Types

```typescript
interface ScrollTrackerOptions {
  // Array of percentage thresholds to track (0-100)
  // Default: [0, 25, 50, 75, 100]
  thresholds?: number[];
  
  // IntersectionObserver rootMargin property
  // Format: "top right bottom left" in pixels or percentage
  // Default: "0px 0px 0px 0px"
  rootMargin?: string;
  
  // Offset from top of viewport (e.g., for fixed headers)
  // Applied to calculations but not to IntersectionObserver
  // Default: 0
  offsetTop?: number;
  
  // Offset from bottom of viewport (e.g., for fixed footers)
  // Applied to calculations but not to IntersectionObserver
  // Default: 0
  offsetBottom?: number;
  
  // Temporarily disable tracking to conserve resources
  // Default: false
  disabled?: boolean;
  
  // Use a custom scrollable container instead of window
  // Useful for elements inside custom scroll areas
  // Default: window
  root?: React.RefObject<HTMLElement>;
  
  // Delay in ms before recalculating on scroll
  // Higher values improve performance but reduce accuracy
  // Default: 0 (uses rAF timing)
  throttleDelay?: number;
}

interface ScrollMetrics {
  // Visibility information
  visibility: {
    // Percentage of element visible in viewport (0-100)
    percentage: number;
    
    // Boolean flags for common visibility states
    isFullyVisible: boolean;
    isPartiallyVisible: boolean;
    isInvisible: boolean;
  };
  
  // Position information
  position: {
    // Relative distances to viewport landmarks in pixels
    // Negative values mean element is above, positive means below
    relativeToCenterY: number;
    relativeToTopY: number;
    relativeToBottomY: number;
    
    // Relative distances as normalized values (-1 to 1)
    // 0 means perfectly aligned, -1 means completely above, 1 means completely below
    normalizedCenter: number;
    normalizedTop: number;
    normalizedBottom: number;
  };
  
  // Dimension information
  dimensions: {
    // Element dimensions in pixels
    height: number;
    width: number;
    
    // Element dimensions relative to viewport
    heightRatio: number;
    widthRatio: number;
    
    // Viewport dimensions
    viewportHeight: number;
    viewportWidth: number;
  };
  
  // Scroll direction and status
  direction: 'up' | 'down' | null;
  
  // Scroll dynamics information
  dynamics: {
    // Scroll velocity in pixels per second
    velocity: number;
    
    // Scroll acceleration (rate of velocity change)
    acceleration: number;
    
    // Inertia value that gradually decreases when scrolling stops
    // Ranges from 0 (stopped) to 1 (maximum inertia)
    inertia: number;
    
    // Eased value for smooth animations based on scroll dynamics
    // Slower to start and end, useful for more natural animations
    eased: number;
    
    // Timestamp of last scroll event
    lastScrollTime: number;
    
    // Duration since last scroll event (ms)
    timeSinceLastScroll: number;
  };
  
  // Threshold tracking
  thresholds: {
    // Map of threshold percentages to normalized progress values (-1 to 1)
    // -1: threshold not yet reached
    // 0: exactly at threshold
    // 1: threshold completely passed
    [percentage: number]: number;
    
    // List of thresholds that have been passed
    crossed: number[];
    
    // Most recently crossed threshold
    active: number | null;
    
    // Next threshold to be crossed
    next: number | null;
  };
  
  // Element entry/exit information
  entry: {
    // Direction element entered viewport from
    from: 'top' | 'bottom' | null;
    
    // Direction element is exiting viewport to
    to: 'top' | 'bottom' | null;
    
    // Timestamp when element entered viewport
    time: number | null;
    
    // Duration element has been in viewport (ms)
    duration: number;
  };
}
```

## Implementation Details

### Core Technologies

1. **IntersectionObserver API**
   - Used for efficient detection of element visibility
   - Avoids layout thrashing by operating asynchronously

2. **ResizeObserver API**
   - Monitors changes in element and viewport dimensions
   - Recalculates metrics when size changes occur

3. **requestAnimationFrame**
   - Throttles scroll event processing to animation frames
   - Ensures smooth performance during rapid scrolling

### Optimizations

1. **Lazy initialization**
   - Initialize observers only when component mounts
   - SSR-friendly implementation with feature detection

2. **Passive event listening**
   - Use passive scroll listeners for better touchscreen performance
   ```js
   window.addEventListener('scroll', handleScroll, { passive: true });
   ```

3. **Memoization**
   - Memoize complex calculations to prevent unnecessary re-renders
   ```js
   const calculateThresholds = useCallback((rect, viewport) => {
     // Calculations here
   }, []);
   ```

4. **Batched updates**
   - Batch metric updates to minimize React rendering cycles
   ```js
   const updateMetrics = useCallback(() => {
     // Gather all new metrics
     setMetrics(prevMetrics => ({
       ...prevMetrics,
       // Update all changed properties at once
     }));
   }, []);
   ```

5. **Custom equality checks**
   - Prevent unnecessary renders with deep equality checks
   ```js
   const isMetricsEqual = (prev, next) => {
     // Custom deep comparison logic
   };
   ```

### Implementation Algorithm

1. **Initialization Phase**
   ```js
   // Create refs for element and observers
   const elementRef = useRef(null);
   const intersectionObserver = useRef(null);
   const resizeObserver = useRef(null);
   
   // Initialize state
   const [metrics, setMetrics] = useState(initialMetricsState);
   const previousScrollY = useRef(0);
   ```

2. **Observer Setup**
   ```js
   useEffect(() => {
     if (typeof IntersectionObserver === 'undefined' || disabled) return;
     
     const element = elementRef.current;
     if (!element) return;
     
     // Create and connect observers
     intersectionObserver.current = new IntersectionObserver(
       handleIntersection,
       { 
         threshold: options.thresholds.map(t => t / 100), 
         rootMargin: options.rootMargin,
         root: options.root?.current || null
       }
     );
     
     intersectionObserver.current.observe(element);
     
     // Setup resize observer
     if (typeof ResizeObserver !== 'undefined') {
       resizeObserver.current = new ResizeObserver(handleResize);
       resizeObserver.current.observe(element);
     }
     
     // Add scroll listeners
     window.addEventListener('scroll', handleScroll, { passive: true });
     
     return () => {
       // Cleanup
       intersectionObserver.current?.disconnect();
       resizeObserver.current?.disconnect();
       window.removeEventListener('scroll', handleScroll);
     };
   }, [options, disabled]);
   ```

3. **Core Calculation Functions**
   ```js
   const calculateVisibility = useCallback((entry) => {
     // Calculate intersection ratios and visibility flags
   }, []);
   
   const calculatePositions = useCallback((rect, viewport) => {
     // Calculate relative positions to viewport landmarks
   }, []);
   
   const calculateThresholds = useCallback((entry, thresholdValues) => {
     // Calculate threshold progress values
   }, [options.thresholds]);
   
   const detectDirection = useCallback(() => {
     const currentScrollY = window.scrollY;
     const direction = currentScrollY > previousScrollY.current ? 'down' : 'up';
     previousScrollY.current = currentScrollY;
     return direction;
   }, []);
   
   const calculateDynamics = useCallback(() => {
     const now = performance.now();
     const currentScrollY = window.scrollY;
     const previousY = previousScrollY.current;
     const previousTime = previousScrollTime.current || now;
     const timeDelta = Math.max(1, now - previousTime); // Avoid division by zero
     
     // Calculate velocity in pixels per second
     const distance = Math.abs(currentScrollY - previousY);
     const velocity = distance / (timeDelta / 1000);
     
     // Calculate acceleration (change in velocity)
     const previousVelocity = previousVelocityRef.current || 0;
     const acceleration = (velocity - previousVelocity) / (timeDelta / 1000);
     
     // Calculate inertia (decays over time when scrolling stops)
     // Start with high value during scroll, decay when stopped
     const timeSinceLastScroll = now - previousTime;
     const isScrolling = timeSinceLastScroll < 50; // Consider scrolling stopped after 50ms
     const INERTIA_DECAY_MS = 300; // Inertia fully decays after 300ms
     const inertiaDecayFactor = Math.min(1, timeSinceLastScroll / INERTIA_DECAY_MS);
     const previousInertia = previousInertiaRef.current || 0;
     const inertia = isScrolling ? 1 : Math.max(0, previousInertia - inertiaDecayFactor);
     
     // Calculate eased value for smoother animations
     // Provides a value between 0-1 that eases in/out based on scroll velocity
     const MAX_EXPECTED_VELOCITY = 1000; // pixels per second
     const normalizedVelocity = Math.min(1, velocity / MAX_EXPECTED_VELOCITY);
     const eased = cubicBezier(0.33, 1, 0.68, 1, normalizedVelocity);
     
     // Update refs for next calculation
     previousScrollTime.current = now;
     previousVelocityRef.current = velocity;
     previousInertiaRef.current = inertia;
     
     return {
       velocity,
       acceleration,
       inertia,
       eased,
       lastScrollTime: now,
       timeSinceLastScroll
     };
   }, []);
   ```

4. **Update Cycle**
   ```js
   const handleIntersection = useCallback((entries) => {
     const entry = entries[0];
     
     // Update visibility metrics
     const visibility = calculateVisibility(entry);
     
     // Handle entry/exit events
     if (entry.isIntersecting && !metrics.visibility.isPartiallyVisible) {
       // Element just entered viewport
       handleElementEntry();
     } else if (!entry.isIntersecting && metrics.visibility.isPartiallyVisible) {
       // Element just exited viewport
       handleElementExit();
     }
     
     // Update all metrics
     updateAllMetrics(entry);
   }, [metrics]);
   
   const handleScroll = useCallback(() => {
     if (!isInViewport) return;
     
     // Use requestAnimationFrame to throttle updates
     cancelAnimationFrame(animationFrameId.current);
     animationFrameId.current = requestAnimationFrame(() => {
       const direction = detectDirection();
       
       // Get fresh measurements
       const rect = elementRef.current.getBoundingClientRect();
       
       // Update metrics with new measurements
       updateMetricsOnScroll(rect, direction);
     });
   }, [isInViewport]);
   ```

## Edge Cases and Error Handling

1. **Server-Side Rendering**
   - Check for browser environment before using browser APIs
   - Provide sensible default values for SSR
   ```js
   const isBrowser = typeof window !== 'undefined';
   const initialMetrics = { 
     visibility: { percentage: 0, isFullyVisible: false, isPartiallyVisible: false, isInvisible: true },
     position: { relativeToCenterY: 0, relativeToTopY: 0, relativeToBottomY: 0, normalizedCenter: 0, normalizedTop: 0, normalizedBottom: 0 },
     dimensions: { height: 0, width: 0, heightRatio: 0, widthRatio: 0, viewportHeight: 0, viewportWidth: 0 },
     direction: null,
     thresholds: { crossed: [], active: null, next: null },
     entry: { from: null, to: null, time: null, duration: 0 }
   };
   ```

2. **Element Resize**
   - Recalculate metrics when element or viewport dimensions change
   - Handle orientation changes on mobile devices
   - Debounce resize calculations to prevent performance issues
   ```js
   const handleResize = debounce(() => {
     // Recalculate metrics
   }, 100);
   ```

3. **Scroll Container Changes**
   - Support custom scroll containers (not just window)
   - Handle nested scrollable elements properly
   - Reattach observers when root container changes
   ```js
   useEffect(() => {
     // Reattach observers when options.root changes
   }, [options.root]);
   ```

4. **Zero-Height Elements**
   - Provide meaningful values even for elements with zero dimensions
   - Return special flag for zero-height elements
   ```js
   const hasZeroDimensions = rect.height === 0 || rect.width === 0;
   if (hasZeroDimensions) {
     return { ...metrics, dimensions: { ...metrics.dimensions, hasZeroDimensions: true } };
   }
   ```

5. **Performance Issues**
   - Throttle updates during rapid scrolling
   - Disable tracking when element is far from viewport
   - Use passive event listeners for better touchscreen performance
   - Consider reducing precision for non-visible elements
   ```js
   const updateFrequency = isFullyVisible ? 'high' : 'low';
   if (updateFrequency === 'low' && scrollCounter % 3 !== 0) {
     return; // Only update every 3rd scroll event when not visible
   }
   ```

6. **Browser Compatibility**
   - Provide fallbacks for browsers without IntersectionObserver
   - Detect and adapt to different browser scroll behaviors
   ```js
   const hasIntersectionObserver = typeof IntersectionObserver !== 'undefined';
   if (!hasIntersectionObserver) {
     // Fallback to getBoundingClientRect and scroll events
   }
   ```

7. **Animation Frame Management**
   - Cancel pending animation frames on unmount
   - Handle multiple synchronous calls properly
   ```js
   useEffect(() => {
     return () => {
       if (animationFrameId.current) {
         cancelAnimationFrame(animationFrameId.current);
       }
     };
   }, []);

## Performance Goals

- **Runtime performance**: <5ms per scroll event on mid-range devices
- **Memory usage**: <1MB additional memory overhead
- **Bundle size**: <5KB minified and gzipped

## Scroll Dynamics and Inertia Configuration

The scroll dynamics system can be configured through options to match the desired feel:

```typescript
interface ScrollDynamicsOptions {
  // How quickly inertia decays after scrolling stops (ms)
  // Default: 300
  inertiaDecayTime?: number;
  
  // Maximum expected scroll velocity (px/second)
  // Used to normalize velocity values
  // Default: 1000
  maxVelocity?: number;
  
  // Easing function to use for transitions
  // Options: "linear", "easeInOut", "easeIn", "easeOut", "custom"
  // Default: "easeInOut"
  easing?: string;
  
  // Custom easing cubic-bezier points if using "custom" easing
  // Default: [0.33, 1, 0.68, 1]
  customEasingPoints?: [number, number, number, number];
}
```

### How Inertia Works

The inertia system provides a physics-like experience for scroll animations by:

1. **Detecting Motion**: Tracking scroll velocity and acceleration in real-time
2. **Maintaining Momentum**: Preserving a high inertia value while actively scrolling
3. **Gradual Decay**: Slowly reducing inertia after scrolling stops
4. **Natural Motion**: Using easing functions to create organic movement

This creates animations that:
- Continue briefly after the user stops scrolling
- Move faster when the user scrolls faster
- Gradually decelerate rather than stop abruptly
- Feel responsive and natural

## Accessibility Considerations

- Functions correctly with zoom/magnification
- Respects reduced motion preferences
- Works with keyboard navigation

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Fallback behavior for browsers without IntersectionObserver
- Polyfill recommendations for older browsers

## Usage Examples

### Simple Fade-In Animation

```tsx
function FadeInElement() {
  const { ref, metrics } = useScrollTracker();
  
  // Derived values from metrics
  const opacity = metrics.visibility.percentage / 100;
  const translateY = metrics.visibility.isFullyVisible ? 0 : 20;
  
  return (
    <div 
      ref={ref}
      style={{
        opacity,
        transform: `translateY(${translateY}px)`,
        transition: 'opacity 0.3s ease, transform 0.3s ease'
      }}
    >
      This element fades in as it enters the viewport
    </div>
  );
}
```

### Inertia-Based Animation

```tsx
function InertiaBasedAnimation() {
  const { ref, metrics } = useScrollTracker();
  
  // Use inertia values for smoother, more natural animations
  // that continue slightly after scrolling stops
  const translateX = useMemo(() => {
    // Dynamics.inertia provides a value that gradually decreases when scrolling stops
    const baseOffset = metrics.dynamics.inertia * 100;
    
    // Use direction to determine which way to move
    return metrics.direction === 'down' ? baseOffset : -baseOffset;
  }, [metrics.dynamics.inertia, metrics.direction]);
  
  // Scale based on scroll velocity - faster scroll = more dramatic effect
  const scale = useMemo(() => {
    const baseScale = 1;
    const velocityFactor = Math.min(0.2, metrics.dynamics.velocity / 5000);
    return baseScale + velocityFactor;
  }, [metrics.dynamics.velocity]);
  
  return (
    <div 
      ref={ref}
      style={{
        transform: `translateX(${translateX}px) scale(${scale})`,
        // Transition helps smooth out the animation
        // Using a slight delay creates a trailing effect
        transition: 'transform 0.6s cubic-bezier(0.25, 1, 0.5, 1)'
      }}
    >
      This element moves with inertia and scales based on scroll velocity
    </div>
  );
}
```

### Parallax Effect

```tsx
function ParallaxBackground() {
  const { ref, metrics } = useScrollTracker();
  
  const parallaxOffset = useMemo(() => {
    return metrics.position.normalizedCenter * 100; // -100px to +100px
  }, [metrics.position.normalizedCenter]);
  
  return (
    <div ref={ref} className="parallax-container">
      <div 
        className="parallax-bg"
        style={{
          transform: `translateY(${parallaxOffset}px)`
        }}
      />
      <div className="content">
        Content with parallax background
      </div>
    </div>
  );
}
```

### Progress Bar

```tsx
function ScrollProgressBar() {
  const { ref, metrics } = useScrollTracker();
  
  return (
    <div ref={ref} className="article">
      <div 
        className="progress-bar"
        style={{ width: `${metrics.visibility.percentage}%` }}
      />
      <h1>Article Title</h1>
      <p>Article content...</p>
    </div>
  );
}
```

### Threshold-Based Animation

```tsx
function StaggeredReveal() {
  const { ref, metrics } = useScrollTracker({
    thresholds: [25, 50, 75, 100]
  });
  
  return (
    <div ref={ref} className="staggered-container">
      <div 
        className="item-1" 
        style={{ opacity: metrics.thresholds[25] >= 0 ? 1 : 0 }}
      />
      <div 
        className="item-2" 
        style={{ opacity: metrics.thresholds[50] >= 0 ? 1 : 0 }}
      />
      <div 
        className="item-3" 
        style={{ opacity: metrics.thresholds[75] >= 0 ? 1 : 0 }}
      />
      <div 
        className="item-4" 
        style={{ opacity: metrics.thresholds[100] >= 0 ? 1 : 0 }}
      />
    </div>
  );
}
```

### Direction-Based Animation

```tsx
function DirectionalSlide() {
  const { ref, metrics } = useScrollTracker();
  
  const slideOffset = useMemo(() => {
    if (metrics.visibility.isFullyVisible) return 0;
    
    const baseOffset = 100 - metrics.visibility.percentage;
    return metrics.direction === 'down' 
      ? baseOffset // Slide up when scrolling down
      : -baseOffset; // Slide down when scrolling up
  }, [metrics]);
  
  return (
    <div 
      ref={ref}
      style={{
        transform: `translateY(${slideOffset}px)`
      }}
    >
      This slides differently based on scroll direction
    </div>
  );
}
```

## Integration with Animation Libraries

The `useScrollTracker` hook is designed to work seamlessly with popular animation libraries:

### With Framer Motion

```tsx
function FramerMotionIntegration() {
  const { ref, metrics } = useScrollTracker();
  
  // Map visibility percentage to progress (0-1)
  const progress = metrics.visibility.percentage / 100;
  
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={{ 
        opacity: progress, 
        y: 50 * (1 - progress) 
      }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      Smooth animation with Framer Motion
    </motion.div>
  );
}
```

### With React Spring

```tsx
function ReactSpringIntegration() {
  const { ref, metrics } = useScrollTracker();
  
  // Use metrics to drive springs
  const springs = useSpring({
    opacity: metrics.visibility.percentage / 100,
    transform: `translateY(${metrics.visibility.isFullyVisible ? 0 : 30}px)`,
    config: { mass: 1, tension: 280, friction: 60 }
  });
  
  return (
    <animated.div ref={ref} style={springs}>
      Physics-based animation with React Spring
    </animated.div>
  );
}
```

## Testing Strategy

### Unit Testing

- Test core calculation functions in isolation
- Mock IntersectionObserver and ResizeObserver
- Verify correct threshold calculations
- Test SSR compatibility

```tsx
// Example unit test
test('calculateVisibility returns correct percentage', () => {
  const mockEntry = { intersectionRatio: 0.5 };
  const result = calculateVisibility(mockEntry);
  expect(result.percentage).toBe(50);
});
```

### Integration Testing

- Test with different viewport sizes
- Verify threshold crossing behavior
- Test performance under rapid scrolling

### E2E Testing

- Verify actual scroll behavior in browser
- Test with different devices and screen sizes

## Conclusion

The `useScrollTracker` hook provides a comprehensive, performance-optimized solution for scroll-based interactions in React applications. By focusing on developer experience, flexible configuration, and robust error handling, it enables developers to create engaging scroll animations without managing complex scroll logic themselves.

Key benefits:

- **Simplified Development**: Abstract away complex scroll calculations
- **Performance Optimized**: Efficient implementation with minimal overhead
- **Flexible API**: Support for various use cases and animation patterns
- **Robust Error Handling**: Graceful handling of edge cases
- **Next.js Compatibility**: Works seamlessly with SSR

This specification provides the foundation for implementing a hook that will empower developers to create rich, scroll-based interactions with minimal effort and maximum reliability.