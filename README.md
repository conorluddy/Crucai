# Crúcai 🪝

> **Crúcai** - Irish for "Hooks" - A modern React hooks library

A collection of high-performance, zero-dependency React hooks for building responsive and interactive UIs.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![NPM Version](https://img.shields.io/npm/v/crucai.svg)](https://www.npmjs.com/package/crucai)
![TypeScript](https://img.shields.io/badge/TypeScript-4.9+-blue)
![React](https://img.shields.io/badge/React-18.0+-blue)

## 📚 Table of Contents

- [Installation](#-installation)
- [Hooks Overview](#-hooks-overview)
  - [useScrollTracker](#usescrolltracker)
  - [useFuzzyFilter](#usefuzzyfilter)
- [Contributing](#-contributing)
- [License](#-license)

## 🚀 Installation

```bash
npm install crucai
# or
yarn add crucai
# or
pnpm add crucai
```

## 🔌 Hooks Overview

<details>
<summary><h3>useScrollTracker</h3></summary>

A high-performance hook for tracking element visibility and position as users scroll.

```tsx
import { useScrollTracker } from "crucai";

function FadeInElement() {
  const { ref, metrics } = useScrollTracker();
  
  return (
    <div 
      ref={ref}
      style={{ 
        opacity: metrics.visibility.percentage / 100,
        transform: `translateY(${(1 - metrics.visibility.percentage / 100) * 20}px)`,
      }}
    >
      This element fades in as it enters the viewport
    </div>
  );
}
```

#### Key Features:

- **Visibility tracking**: Percentage visible, fully/partially visible states
- **Position tracking**: Relative to viewport top, center, bottom
- **Threshold detection**: Track when element crosses specific visibility points
- **Scroll direction**: Detect up/down scrolling
- **Scroll physics**: Velocity, acceleration, inertia measurements
- **Entry/exit tracking**: Direction, timing, duration
- **High performance**: Uses IntersectionObserver, throttling, and passive events

#### Component API:

The hook also provides a component API using render props:

```tsx
import { ScrollTracker } from "crucai";

function AnimatedElement() {
  return (
    <ScrollTracker>
      {(metrics, ref) => (
        <div 
          ref={ref}
          style={{ 
            opacity: metrics.visibility.percentage / 100,
          }}
        >
          Animated content
        </div>
      )}
    </ScrollTracker>
  );
}
```

#### Options:

```tsx
const { ref, metrics } = useScrollTracker({
  // Visibility thresholds to track (0-100)
  thresholds: [0, 25, 50, 75, 100],
  
  // Offset from top/bottom of viewport (e.g., for fixed headers/footers)
  offsetTop: 0,
  offsetBottom: 0,
  
  // Custom scroll container instead of window
  root: containerRef,
  
  // Other options for fine-tuning
  rootMargin: "0px 0px 0px 0px",
  disabled: false,
  throttleDelay: 0,
  
  // Physics-based animation control
  dynamics: {
    inertiaDecayTime: 300,
    maxVelocity: 1000,
    easing: "easeInOut",
    customEasingPoints: [0.33, 1, 0.68, 1]
  }
});
```

> 💡 **Performance Tip:** The hook is optimized to prevent re-renders when metrics haven't changed significantly, making it suitable for scroll-based animations without performance degradation.

</details>

<details>
<summary><h3>useFuzzyFilter</h3></summary>

A powerful hook for fuzzy text filtering with advanced matching capabilities.

```tsx
import { useFuzzyFilter } from "crucai";

function SearchableList({ items }) {
  const { filteredItems, setQuery } = useFuzzyFilter({
    items,
    threshold: 2, // Max Levenshtein distance
  });
  
  return (
    <div>
      <input 
        type="text"
        onChange={(e) => setQuery(e.target.value)} 
        placeholder="Search items..." 
      />
      <ul>
        {filteredItems.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
```

#### Key Features:

- **Fuzzy searching**: Finds close matches even with typos
- **Levenshtein distance**: Controls how strict the matching is
- **Performance optimized**: Uses trie data structure for efficient filtering
- **Customizable**: Set match thresholds and search keys

#### Options:

```tsx
const { filteredItems, setQuery } = useFuzzyFilter({
  // Items to filter (strings or objects)
  items: ['apple', 'banana', 'orange'],
  
  // If items are objects, specify which keys to search in
  keys: ['name', 'description'],
  
  // Maximum Levenshtein distance for a match (default: 2)
  threshold: 2,
  
  // Initial search query (optional)
  initialQuery: '',
  
  // Whether to match entire query or individual words (default: false)
  matchByWord: true,
  
  // Sort results by relevance (default: true)
  sortResults: true
});
```

> 🔍 **Tip:** Using a lower threshold (1-2) provides stricter matching, while higher values (3+) allow more fuzzy results.

</details>

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  <sub>Built with ❤️ by contributors</sub>
</div>