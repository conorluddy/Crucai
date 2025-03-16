// Use testing-library/react directly instead of the deprecated react-hooks package
import { renderHook } from "@testing-library/react";
import { useScrollTracker } from "./index";
import {
  calculateVisibility,
  calculateDimensions,
  calculatePositions,
  calculateThresholds,
  calculateDynamics,
  calculateEntryMetrics,
} from "./utils/calculations";

// Define the global object type
declare global {
  interface Window {
    IntersectionObserver: typeof IntersectionObserver;
    ResizeObserver: typeof ResizeObserver;
  }
}

// Define the types for our mocks
type IntersectionObserverMock = jest.Mock<{
  observe: jest.Mock;
  unobserve: jest.Mock;
  disconnect: jest.Mock;
}>;

type ResizeObserverMock = jest.Mock<{
  observe: jest.Mock;
  unobserve: jest.Mock;
  disconnect: jest.Mock;
}>;

// Mock intersection observer
const mockIntersectionObserver = jest.fn() as IntersectionObserverMock;
(global as typeof window).IntersectionObserver =
  mockIntersectionObserver as unknown as typeof IntersectionObserver;

// Mock resize observer
const mockResizeObserver = jest.fn() as ResizeObserverMock;
(global as typeof window).ResizeObserver =
  mockResizeObserver as unknown as typeof ResizeObserver;

// Mock window properties and methods
Object.defineProperty(global, "innerHeight", { value: 800 });
Object.defineProperty(global, "innerWidth", { value: 1200 });

describe("useScrollTracker", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIntersectionObserver.mockImplementation(() => {
      return {
        observe: jest.fn(),
        unobserve: jest.fn(),
        disconnect: jest.fn(),
      };
    });
    mockResizeObserver.mockImplementation(() => {
      return {
        observe: jest.fn(),
        unobserve: jest.fn(),
        disconnect: jest.fn(),
      };
    });
  });

  it("should initialize with default values", () => {
    // Updated to use the new renderHook API from @testing-library/react
    const { result } = renderHook(() => useScrollTracker());

    expect(result.current.ref).toBeDefined();
    expect(result.current.metrics).toBeDefined();
    expect(result.current.metrics.visibility.percentage).toBe(0);
    expect(result.current.metrics.visibility.isInvisible).toBe(true);
  });

  it("should accept options", () => {
    // Updated to use the new renderHook API from @testing-library/react
    const { result } = renderHook(() =>
      useScrollTracker({
        thresholds: [0, 50, 100],
        rootMargin: "10px",
        offsetTop: 50,
      }),
    );

    expect(result.current.ref).toBeDefined();
  });

  // Add more tests for hook behavior
});

describe("Calculation Utils", () => {
  describe("calculateVisibility", () => {
    it("should calculate visibility percentage correctly", () => {
      const mockEntry = {
        isIntersecting: true,
        intersectionRatio: 0.5,
      } as IntersectionObserverEntry;

      const result = calculateVisibility(mockEntry);

      expect(result.percentage).toBe(50);
      expect(result.isPartiallyVisible).toBe(true);
      expect(result.isFullyVisible).toBe(false);
      expect(result.isInvisible).toBe(false);
    });

    it("should handle fully visible elements", () => {
      const mockEntry = {
        isIntersecting: true,
        intersectionRatio: 1,
      } as IntersectionObserverEntry;

      const result = calculateVisibility(mockEntry);

      expect(result.percentage).toBe(100);
      expect(result.isFullyVisible).toBe(true);
    });

    it("should handle invisible elements", () => {
      const mockEntry = {
        isIntersecting: false,
        intersectionRatio: 0,
      } as IntersectionObserverEntry;

      const result = calculateVisibility(mockEntry);

      expect(result.percentage).toBe(0);
      expect(result.isInvisible).toBe(true);
    });
  });

  describe("calculateDimensions", () => {
    it("should calculate dimensions correctly", () => {
      const mockRect = {
        width: 300,
        height: 200,
      } as DOMRectReadOnly;

      const result = calculateDimensions(mockRect, 800, 1200);

      expect(result.width).toBe(300);
      expect(result.height).toBe(200);
      expect(result.heightRatio).toBe(0.25); // 200/800
      expect(result.widthRatio).toBe(0.25); // 300/1200
    });

    it("should handle zero dimensions", () => {
      const mockRect = {
        width: 0,
        height: 0,
      } as DOMRectReadOnly;

      const result = calculateDimensions(mockRect, 800, 1200);

      expect(result.hasZeroDimensions).toBe(true);
    });
  });

  describe("calculatePositions", () => {
    it("should calculate positions correctly", () => {
      const mockRect = {
        top: 100,
        bottom: 300,
        left: 200,
        right: 500,
        width: 300,
        height: 200,
      } as DOMRectReadOnly;

      const result = calculatePositions(mockRect, 800, 1200);

      // Element center Y = 100 + 200/2 = 200
      // Viewport center Y = 800/2 = 400
      // relativeToCenterY = 200 - 400 = -200
      expect(result.relativeToCenterY).toBe(-200);

      // Element top = 100
      // relativeToTopY = 100
      expect(result.relativeToTopY).toBe(100);

      // Element bottom = 300
      // Viewport bottom = 800
      // relativeToBottomY = 300 - 800 = -500
      expect(result.relativeToBottomY).toBe(-500);
    });

    it("should apply offsets correctly", () => {
      const mockRect = {
        top: 100,
        bottom: 300,
        width: 300,
        height: 200,
      } as DOMRectReadOnly;

      const result = calculatePositions(mockRect, 800, 1200, 50, 30);

      // relativeToTopY = top - offsetTop = 100 - 50 = 50
      expect(result.relativeToTopY).toBe(50);

      // relativeToBottomY = bottom - (viewportHeight - offsetBottom)
      // = 300 - (800 - 30) = 300 - 770 = -470
      expect(result.relativeToBottomY).toBe(-470);
    });
  });

  describe("calculateThresholds", () => {
    it("should calculate threshold progress correctly", () => {
      const result = calculateThresholds(0.5, [0, 25, 50, 75, 100]);

      // Current percentage is 50%
      // Thresholds at 0, 25, 50 are crossed (progress >= 0)
      // Thresholds at 75, 100 are not crossed (progress < 0)
      expect(result.crossed).toEqual([0, 25, 50]);
      expect(result.active).toBe(50);
      expect(result.next).toBe(75);

      // Progress values:
      // 0% threshold: fully passed (1.0)
      // 25% threshold: fully passed (1.0)
      // 50% threshold: exactly at (0.0)
      // 75% threshold: not reached (-1.0)
      // 100% threshold: not reached (-1.0)
      expect(result[0]).toBeGreaterThan(0);
      expect(result[25]).toBeGreaterThan(0);
      expect(result[50]).toBe(0);
      expect(result[75]).toBeLessThan(0);
      expect(result[100]).toBeLessThan(0);
    });
  });

  describe("calculateDynamics", () => {
    it("should calculate dynamics metrics correctly", () => {
      const result = calculateDynamics(
        100, // current scroll Y
        50, // previous scroll Y
        1000, // current time
        900, // previous time
        0, // previous velocity
        0, // previous inertia
        300, // inertia decay time
        1000, // max velocity
      );

      // Scroll distance = |100 - 50| = 50 pixels
      // Time delta = 1000 - 900 = 100ms = 0.1s
      // Velocity = 50 / 0.1 = 500 pixels/second
      expect(result.velocity).toBe(500);

      // Previous velocity = 0
      // Time delta = 0.1s
      // Acceleration = (500 - 0) / 0.1 = 5000 pixels/second²
      expect(result.acceleration).toBe(5000);

      // Time since last scroll = 100ms which is > 50ms
      // isScrolling = false, so inertia will use decay formula:
      // inertia = Math.max(0, previousInertia - inertiaDecayFactor)
      // where inertiaDecayFactor = Math.min(1, 100 / 300) = 0.33...
      // since previousInertia is 0, max(0, 0 - 0.33) = 0
      expect(result.inertia).toBe(0);

      // Normalized velocity = min(1, 500/1000) = 0.5
      // Eased value depends on the bezier function
      expect(result.eased).toBeGreaterThan(0);
      expect(result.eased).toBeLessThan(1);
    });
  });

  describe("calculateEntryMetrics", () => {
    it("should handle element entering viewport from top", () => {
      const previousEntryMetrics = {
        from: null,
        to: null,
        time: null,
        duration: 0,
      };

      const result = calculateEntryMetrics(
        true, // isInViewport
        false, // wasInViewport
        "down", // direction
        previousEntryMetrics,
        1000, // time
      );

      expect(result.from).toBe("top");
      expect(result.to).toBe(null);
      expect(result.time).toBe(1000);
      expect(result.duration).toBe(0);
    });

    it("should handle element staying in viewport", () => {
      // Use the correct type for from property: 'top' | 'bottom' | null
      const previousEntryMetrics = {
        from: "top" as const, // Use const assertion to specify the literal type
        to: null,
        time: 900,
        duration: 100,
      };

      const result = calculateEntryMetrics(
        true, // isInViewport
        true, // wasInViewport
        "down", // direction
        previousEntryMetrics,
        1000, // time
      );

      expect(result.from).toBe("top");
      expect(result.to).toBe(null);
      expect(result.time).toBe(900);
      expect(result.duration).toBe(100); // 1000 - 900
    });

    it("should handle element exiting viewport", () => {
      // Use the correct type for from property: 'top' | 'bottom' | null
      const previousEntryMetrics = {
        from: "top" as const, // Use const assertion to specify the literal type
        to: null,
        time: 900,
        duration: 100,
      };

      const result = calculateEntryMetrics(
        false, // isInViewport
        true, // wasInViewport
        "down", // direction
        previousEntryMetrics,
        1000, // time
      );

      expect(result.from).toBe("top");
      expect(result.to).toBe("bottom"); // Exit in the direction of scroll
      expect(result.time).toBe(900);
      expect(result.duration).toBe(0); // Reset duration on exit
    });
  });
});
