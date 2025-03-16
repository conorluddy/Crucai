Reusable Scroll Tracking Hook for Next.js

I'm a typescript/react dev
I'm building a next js website
I want to build a reusable hook that we can use, probably in a wrapper component, that we'd wrap around elements that we want to decorate with scroll data
This component could then pass down an object to its child with various values that describe how the child is positioned relative to the viewport, so that we can react to the child as it enters and leaves the viewport, in either direction.
Lets not generate any code yet, I'm just feeling out the specifications I need, so maybe you can help with that.

I'm thinking that for the child element, we'll call it the 'subject' for the purposes of this chat, some values that could be actioned on might be:

- What percentage/proportion of the subject is visible
- What is the position of the subject relative to the bottom, centre and top of the viewport
- What is the height of the subject, and maybe the height relative to the VP height

I'm sure there are many other things that would be worth calculating, I'm wondering what your thoughts might be on it.

---

I'd be happy to help you think through this scroll tracking hook for your Next.js website. You've already identified several key metrics that would be useful. Let's explore the specifications and additional values that might be valuable.

Based on your requirements, here's what I'm thinking for a comprehensive scroll tracking hook:

Core Metrics (ones you mentioned)
Visibility percentage: What portion of the subject is currently visible in the viewport
Relative position: Where the subject is positioned relative to viewport landmarks (top, center, bottom)
Element dimensions: Height of the subject, and ratio compared to viewport height
Additional Useful Metrics
Direction of travel: Whether the user is scrolling up or down when the subject is in view
Entry/exit points: Which edge of the viewport the subject entered from or is exiting through
Time in viewport: How long the subject has been visible (useful for engagement metrics)
Scroll velocity: How fast the user is scrolling when interacting with the subject
Distance from viewport center: How far (in pixels or percentage) the subject is from the viewport's center
Viewport crossing events: Specific trigger points when the subject crosses thresholds (25%, 50%, 75%, etc.)
Absolute position: Actual pixel coordinates relative to the viewport
Design Considerations
Performance optimization: Scroll events fire frequently, so debouncing or throttling will be important
Resize handling: The calculations should adjust when the window resizes
Cleanup: Proper removal of event listeners when components unmount
Initial state handling: What values to provide before scrolling begins
SSR compatibility: Ensuring the hook works with Next.js server-side rendering
Interface Design
You might want to structure the data object that gets passed down something like:

{
visibility: {
percentage: number,
isFullyVisible: boolean,
isPartiallyVisible: boolean,
isInvisible: boolean
},
position: {
relativeToCenterY: number, // negative above center, positive below
relativeToTopY: number,
relativeToBottomY: number,
crossedThresholds: string[] // e.g. ["top", "center", "25%"]
},
dimensions: {
height: number,
heightRatio: number, // compared to viewport
width: number,
widthRatio: number
},
events: {
direction: "up" | "down" | null,
enteredFrom: "top" | "bottom" | null,
exitingTo: "top" | "bottom" | null,
timeInView: number
}
}
Would any of these additional metrics be helpful for your use case? And are there specific animations or behaviors you're planning to implement that might need particular data points?

---

C
Awesome, thanks. I was trying to think of various useful values. You touched on the events there for the viewport crossing events at 25% 50% 75% 100% - I had been wondering that maybe if we had those values as a map/kv pair, where each themselves would have a percentage, could it be useful, or just confusing.

E.g.

{
25: 0, // Decimal -1.0 - 0.0 - 1.0
50: 0,
75: 0,
100: 0
}
It might just be redundant if we have the overall percentage anyways, but I thought it might give us granular control of some sort over what could happen at each point.

---

You raise an interesting point about granular control with specific threshold markers. Let's think about how that might work compared to just having the overall percentage.

The threshold map approach has some distinct advantages:

Normalized progression values: Instead of working with raw percentages (which might require additional logic in components), you get pre-calculated normalized values (-1.0 to 1.0) for each threshold. This makes animations and transitions easier to implement.
Discrete event handling: Rather than constantly checking "is the percentage now above X?" in your components, you can react directly to specific landmarks.
Conceptual clarity: It's sometimes clearer to think "the element is 75% through its journey through the viewport" rather than dealing with raw visibility percentages.
Here's how I would structure this approach:

{
thresholds: {
25: -0.8, // Element is 80% of the way to the 25% threshold (negative means approaching)
50: 0.2, // Element has passed the 50% threshold by 20% of the way
75: -1.0, // Element hasn't reached the 75% threshold yet
100: -1.0 // Element hasn't reached the 100% threshold yet
}
}
Where each value represents:

-1.0: Element hasn't reached this threshold yet
0.0: Element is exactly at this threshold
1.0: Element has completely passed this threshold
This approach isn't redundant with the overall percentage because:

It normalizes values into a consistent -1 to 1 range, which is easier for animation libraries
It provides semantic meaning to specific points in the scroll journey
It reduces the need for components to implement their own threshold logic
You could even enhance this by adding:

crossedThresholds: ["25", "50"], // Which thresholds have been crossed already
activeThreshold: "50", // The most recently crossed threshold
nextThreshold: "75" // The next threshold to be crossed
This would give components everything they need to implement progressive animations or behaviors tied to scroll position. Does this approach make sense for your use case?

---

C
Yeah, I think so. It's one of those things that I won't really know until I start actually hooking it into elements and animations :) Thanks!!

---

You're absolutely right! Sometimes you need to get your hands dirty with implementation before you can fully evaluate the design. The beauty of building a reusable hook is that you can refine it as you go based on real-world usage.

If you find yourself needing adjustments as you implement, you might consider:

Starting with a simpler version of the hook that tracks just the core metrics
Adding the threshold system as a higher-level abstraction once you have a better feel for how you'll use it
Creating a few component examples to test various animation scenarios
Feel free to reach back out when you start implementing if you hit any specific challenges or want to discuss refinements to the API. Good luck with your scroll tracking component! It sounds like it will add some really nice interactive elements to your Next.js site.

---

C
Yeah good shout! If you were gonna think outside the box on this one (pun related), what other things/attributes/features might you dream up? Think as laterally as you like

---

Thinking outside the box for scroll tracking, here are some more innovative features you might consider:

Advanced Spatial Awareness
Z-index based interactions: Track when the subject passes "beneath" or "above" other elements in a 3D space representation
Parallax coefficients: Auto-calculate optimal parallax speeds based on element position and size
Scroll path mapping: For non-linear scroll experiences, track position along curved or custom paths
Physics-Inspired Features
Momentum and inertia values: Calculate how much "momentum" the subject has based on scroll velocity and mass (size)
Attraction/repulsion fields: Allow elements to influence each other's behavior when they come into proximity
Scroll gravity: Elements could "fall" into place or "orbit" around focal points as they become visible
User Behavior Integration
Attention heatmap: Track how long the subject stays at different positions in viewport
Scroll rhythm detection: Identify patterns in user scrolling behavior to anticipate and enhance animations
Gaze prediction: Use scroll velocity and direction to predict where the user might be looking
Content-Aware Features
Read progress tracking: For text elements, calculate approximate reading completion
Visual weight balancing: Calculate and balance the visual weight of multiple tracked elements as they enter/exit
Content density adaptation: Adjust animations based on how much content is visible simultaneously
Environmental Responsiveness
Time-of-day effects: Scroll behaviors that subtly change based on user's local time
Device motion integration: Combine scroll position with device orientation/motion sensors for richer interactions
Ambient light detection: If supported, adapt visual effects to complement the user's environment
Contextual Interactions
Scroll sequence choreography: Coordinate multiple elements in timed sequences triggered by scroll position
Path dependency: Elements behave differently based on the "path" taken to reach them (scroll up vs down)
Scroll history: Track where the user has already scrolled to create "memory" effects when revisiting sections
Some of these might be purely experimental or might require additional APIs beyond just scroll tracking, but they could lead to some unique and memorable user experiences!

---

C
Nice ideas. I like the inertia ones, and the idea that a subject could have a different behaviour depending on which direction it's being scrolled (e.g. can fade in when scrolling down, and not fade out when scrolling back up).

If we were to consider the overall architecture of a React hook for this, what might it look like at a high level

---

I'm glad you liked those ideas! The direction-based behavior is definitely a practical feature that could add nuance to your scroll animations.

For the high-level architecture of this React hook, here's how I'd approach it:

High-Level Architecture of a Scroll Tracking Hook

useScrollTracker
├── State Management
│ ├── Element measurements
│ ├── Viewport metrics
│ ├── Scroll metrics
│ └── Event flags
│
├── Effect Handlers
│ ├── Initialization
│ ├── Scroll event listener
│ ├── Resize observer
│ ├── Intersection observer
│ └── Cleanup
│
├── Calculation Engine
│ ├── Visibility calculations
│ ├── Position calculations
│ ├── Threshold processing
│ ├── Direction detection
│ └── Physics calculations
│
└── Return Interface
├── Ref to attach to subject
├── Metrics object
├── Helper functions
└── Event callbacks
Implementation Strategy:
Core Hook Implementation
typescript

function useScrollTracker(options?: ScrollTrackerOptions) {
// Refs
const subjectRef = useRef<HTMLElement>(null);
const observerRef = useRef<IntersectionObserver | null>(null);
const frameRef = useRef<number | null>(null);

// State
const [metrics, setMetrics] = useState<ScrollMetrics>(initialMetricsState);
const [direction, setDirection] = useState<'up' | 'down' | null>(null);
const previousScrollY = useRef<number>(0);

// Setup observers and event listeners
useEffect(() => {
// Initialize observers
// Set up scroll listeners
// Handle cleanup
}, [options]);

// Calculation functions
const calculateMetrics = useCallback(() => {
// Get all measurements
// Calculate visibility
// Calculate positions
// Process thresholds
// Update state
}, []);

return {
ref: subjectRef,
metrics,
direction,
// Helper functions
};
}
Wrapper Component
typescript

function ScrollAware({ children, options }) {
const { ref, metrics, direction } = useScrollTracker(options);

return (
<div ref={ref}>
{children(metrics, direction)}
</div>
);
}
Usage Example
tsx

<ScrollAware options={{ thresholds: [25, 50, 75, 100] }}>
{(metrics, direction) => (
<div
style={{
        opacity: metrics.visibility.percentage / 100,
        transform: `translateY(${direction === 'down' ?
          Math.max(0, 50 - metrics.visibility.percentage / 2) : 0}px)`
      }} >
Content here
</div>
)}
</ScrollAware>
Key Architectural Decisions:
Performance Optimizations
Use requestAnimationFrame for smooth animations
Leverage IntersectionObserver for efficient visibility tracking
Implement throttling for scroll events
Modular Design
Separate core calculations from effect management
Allow configuration through options object
Provide both raw data and processed metrics
React Patterns
Use forwarded refs for attaching to DOM elements
Implement render props pattern for flexibility
Keep state management within the hook
This architecture gives you a solid foundation that can be extended to include the various features we discussed while maintaining good performance and developer ergonomics.

---

C
I like that pattern {children(metrics, direction)}, I've never children called with params before

---

That's one of the more powerful but less commonly used patterns in React! It's called the "render props" pattern, specifically using the function-as-child variant.

Instead of passing a component as children:

jsx

<Component>
  <div>Static content</div>
</Component>
You pass a function that receives arguments and returns components:

jsx

<Component>
  {(someData, moreData) => <div>Dynamic content based on {someData}</div>}
</Component>
This pattern gives you incredible flexibility because:

The parent component controls what data gets passed down
The child function has complete control over how to use that data
It creates a clear contract between the components
The child only re-renders when the passed parameters change
It's particularly useful for components like your scroll tracker where you want to:

Encapsulate complex logic (scroll calculations)
Provide dynamic data to children
Allow complete flexibility in how that data is used
Many popular libraries like React Router and Formik have used this pattern. It's less common now with hooks available, but in cases like yours where you want to combine ref handling with dynamic data passing, it remains an elegant solution.

Would you like to see more examples of how this pattern could be used with your scroll tracker?

---

C
I wonder what other options there are, for example if we just want to be able to cleanly compose components and don't know what level of depth their children might have

---

Great question! When dealing with components that need to track scroll behavior for children at any depth, you have several options beyond the render props pattern. Here are some alternative approaches:

1. Context API
   Using React's Context API lets you make scroll data available to any descendant component without explicit prop passing:

tsx

// Create a context
const ScrollContext = createContext<ScrollMetrics | null>(null);

// Provider component
function ScrollProvider({ children }) {
const scrollData = useScrollTracker();

return (
<ScrollContext.Provider value={scrollData}>
<div ref={scrollData.ref}>{children}</div>
</ScrollContext.Provider>
);
}

// Consume in any descendant component
function ChildComponent() {
const scrollData = useContext(ScrollContext);
// Use scrollData to affect styling/behavior
}
This approach is great when you have multiple components at different levels that need access to the scroll data.

2. HOC (Higher-Order Component)
   Create a Higher-Order Component that wraps any component with scroll tracking:

tsx

function withScrollTracking(Component) {
return function WrappedComponent(props) {
const scrollData = useScrollTracker();

    return (
      <div ref={scrollData.ref}>
        <Component {...props} scrollData={scrollData} />
      </div>
    );

};
}

// Usage
const EnhancedComponent = withScrollTracking(MyComponent); 3. Custom Hook + Ref Forwarding
Provide a custom hook that can be used directly in any component:

tsx

function MyComponent() {
const containerRef = useRef(null);
const scrollData = useScrollTracker({ ref: containerRef });

return (
<div ref={containerRef}>
{/_ Children can be anything _/}
<ChildComponent />
<DeepNestedStructure />
</div>
);
} 4. Composition with Cloning
Use React's cloneElement to inject props into direct children:

tsx

function ScrollTracker({ children }) {
const { ref, metrics, direction } = useScrollTracker();

return (
<div ref={ref}>
{React.Children.map(children, child =>
React.cloneElement(child, { scrollMetrics: metrics, scrollDirection: direction })
)}
</div>
);
} 5. Compound Components Pattern
Create a family of components that work together:

tsx

function ScrollContainer({ children }) {
const scrollData = useScrollTracker();

return (
<div ref={scrollData.ref}>
<ScrollDataContext.Provider value={scrollData}>
{children}
</ScrollDataContext.Provider>
</div>
);
}

ScrollContainer.Item = function ScrollItem({ children }) {
const scrollData = useContext(ScrollDataContext);
// Use scrollData to apply effects

return <div>{children}</div>;
};

// Usage
<ScrollContainer>
<ScrollContainer.Item>
<DeeplyNested />
</ScrollContainer.Item>
</ScrollContainer>
Each approach has its benefits depending on your specific needs, but the Context API is often the most flexible solution when you need to support components at arbitrary depths while maintaining clean component composition.

---

C
I think we'll keep it simple and constrain it to only allow the scroll related styling to work on the immediate children. Otherwise I'm just looking for trouble :)

---

Keeping it simple is often the wisest approach! Limiting the scroll tracking to immediate children will make your implementation much cleaner and more predictable.

In that case, I'd recommend sticking with either:

The render props pattern we discussed:
jsx

<ScrollTracker>
  {(metrics, direction) => (
    <div style={{ opacity: metrics.visibility.percentage / 100 }}>
      Content here
    </div>
  )}
</ScrollTracker>
Or a straightforward wrapper component:
jsx

<ScrollTracker>
  <div className="my-content">
    Content here that will receive scroll data via props
  </div>
</ScrollTracker>
Where the ScrollTracker would use React.cloneElement to inject the scroll metrics into its immediate child.

This keeps your component tree clean and makes it very clear where the scroll effects are being applied. It also avoids the complexity of context management or deep prop passing that you'd need for affecting deeply nested components.

When you start implementing the hook, focusing on the core metrics first will let you quickly get something working that you can then refine based on your actual usage patterns. Good call on keeping the scope manageable!

---
