/**
 * Create a debounced version of a function
 * @param func Function to debounce
 * @param wait Wait time in milliseconds
 */
export function debounce<T extends (...args: unknown[]) => unknown>(func: T, wait: number): T {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function(this: unknown, ...args: Parameters<T>) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const context = this;
    if (timeout) clearTimeout(timeout);
    
    timeout = setTimeout(() => {
      func.apply(context, args);
    }, wait);
  } as T;
}

/**
 * Create a throttled version of a function
 * @param func Function to throttle
 * @param limit Time limit in milliseconds
 */
export function throttle<T extends (...args: unknown[]) => unknown>(func: T, limit: number): T {
  let inThrottle = false;
  let lastFunc: ReturnType<typeof setTimeout>;
  let lastRan: number;
  
  return function(this: unknown, ...args: Parameters<T>) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const context = this;
    
    if (!inThrottle) {
      func.apply(context, args);
      lastRan = Date.now();
      inThrottle = true;
      
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    } else {
      clearTimeout(lastFunc);
      lastFunc = setTimeout(() => {
        if (Date.now() - lastRan >= limit) {
          func.apply(context, args);
          lastRan = Date.now();
        }
      }, limit - (Date.now() - lastRan));
    }
  } as T;
}

/**
 * Create a request animation frame throttled version of a function
 * @param callback Function to throttle using requestAnimationFrame
 */
export function rafThrottle<T extends (...args: unknown[]) => unknown>(callback: T): T {
  let requestId: number | null = null;
  let lastArgs: Parameters<T>;
  
  const later = (context: unknown) => () => {
    requestId = null;
    callback.apply(context, lastArgs);
  };
  
  // Create the throttled function
  const throttled = function(this: unknown, ...args: Parameters<T>) {
    lastArgs = args;
    if (requestId === null) {
      requestId = requestAnimationFrame(later(this));
    }
  } as unknown as T & { cancel: () => void };
  
  // Add cancel method
  throttled.cancel = () => {
    if (requestId !== null) {
      cancelAnimationFrame(requestId);
      requestId = null;
    }
  };
  
  return throttled;
}

/**
 * Determine if code is running in a browser environment
 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Check if the IntersectionObserver API is available
 */
export function hasIntersectionObserver(): boolean {
  return isBrowser() && 'IntersectionObserver' in window;
}

/**
 * Check if the ResizeObserver API is available
 */
export function hasResizeObserver(): boolean {
  return isBrowser() && 'ResizeObserver' in window;
}