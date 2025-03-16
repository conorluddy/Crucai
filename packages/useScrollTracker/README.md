# useScrollTracker

A high-performance React hook for tracking scroll position and element visibility in the viewport, enabling sophisticated scroll-based animations and interactions.

## Features

- **Visibility Tracking**: Precise calculations of how much of an element is visible in the viewport
- **Position Tracking**: Monitor element position relative to viewport top, center, and bottom
- **Threshold Detection**: Get notified when element crosses specific visibility thresholds
- **Scroll Direction**: Track whether user is scrolling up or down
- **Scroll Physics**: Access velocity, acceleration, and inertia metrics
- **Entry/Exit Tracking**: Detect how and when elements enter or exit the viewport
- **Performance Optimized**: Uses IntersectionObserver, ResizeObserver and passive event listeners
- **Zero Dependencies**: Lightweight and focused implementation

## Installation

```bash
npm install @crucai/use-scroll-tracker
# or
yarn add @crucai/use-scroll-tracker
```

## Basic Usage

```jsx
import React from "react";
import { useScrollTracker } from "@crucai/use-scroll-tracker";

function MyComponent() {
  const containerRef = React.useRef(null);
  const metrics = useScrollTracker(containerRef);

  return (
    <div
      ref={containerRef}
      style={{
        opacity: metrics.percentVisible,
        transform: `translateY(${(1 - metrics.percentVisible) * 20}px)`,
      }}
    >
      <p>Visibility: {Math.round(metrics.percentVisible * 100)}%</p>
      <p>Position: {metrics.positionRelativeToViewport}</p>
    </div>
  );
}
```

## Component API

The package also provides a component version using render props for a declarative approach:

```jsx
import { ScrollTracker } from "@crucai/use-scroll-tracker";

function MyComponent() {
  return (
    <ScrollTracker>
      {(metrics, ref) => (
        <div
          ref={ref}
          style={{
            opacity: metrics.percentVisible,
            transform: `translateY(${(1 - metrics.percentVisible) * 20}px)`,
          }}
        >
          <p>Visibility: {Math.round(metrics.percentVisible * 100)}%</p>
        </div>
      )}
    </ScrollTracker>
  );
}
```

## API Reference

The hook returns a metrics object with the following properties:

```typescript
{
  // Visibility metrics
  isVisible: boolean;              // Is element at least partially visible
  isFullyVisible: boolean;         // Is element 100% visible
  percentVisible: number;          // 0-1 value of visibility percentage

  // Position metrics
  positionRelativeToViewport: 'above' | 'inView' | 'below';  // General position
  distanceFromViewportTop: number;    // Pixels from top of viewport
  distanceFromViewportCenter: number; // Pixels from center of viewport
  distanceFromViewportBottom: number; // Pixels from bottom of viewport

  // Threshold metrics
  thresholdsPassed: string[];      // Array of passed threshold names

  // Direction metrics
  scrollDirection: 'up' | 'down' | null;  // Current scroll direction

  // Physics metrics
  scrollVelocity: number;          // Pixels per second
  scrollAcceleration: number;      // Change in velocity
  scrollInertia: number;           // Weighted historical velocity

  // Entry/Exit metrics
  entryDirection: 'top' | 'bottom' | null;  // Direction element entered viewport
  exitDirection: 'top' | 'bottom' | null;   // Direction element exited viewport
  timeSpentVisible: number;        // Milliseconds element has been visible
}
```

## Configuration Options

```typescript
useScrollTracker(ref, {
  // Optional configuration
  thresholds: [0.25, 0.5, 0.75], // Visibility thresholds to track
  throttleMs: 100, // Event throttling in milliseconds
  disabled: false, // Disable tracking when not needed
});
```

## Browser Support

- Modern browsers that support IntersectionObserver and ResizeObserver
- Fallback implementations for older browsers provided via polyfills

## Performance Considerations

This hook is optimized for performance through:

- Using efficient browser APIs instead of scroll event listeners
- Throttling calculations to prevent excessive re-renders
- Only tracking elements when they're near the viewport
- Passive event listeners to avoid blocking the main thread

For more details on performance optimizations, see the [SPEC.md](./SPEC.md) file.

## Advanced Usage

For advanced examples and implementation details, please refer to:

- [Technical Specification](./SPEC.md) - Detailed API design and implementation
- [Development Notes](./LLMCHAT.md) - My chats with Claude to spec this out.

## License

MIT
