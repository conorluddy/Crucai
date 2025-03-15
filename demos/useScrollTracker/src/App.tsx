import { Ref, useEffect, useState } from "react";
import reactLogo from "./assets/react.svg";
import "./App.css";

//
import useScrollTracker from "@crucai/use-scroll-tracker";

function App() {
  const { ref: logoRef, metrics: logoMetrics } = useScrollTracker();

  // May need to improve rerender/infinite render issues
  const [renderCount, setRenderCount] = useState(0);

  useEffect(() => {
    setRenderCount((prev) => prev + 1);
  }, [logoMetrics.dynamics.lastScrollTime]);

  return (
    <>
      <div>
        <a href="https://react.dev" target="_blank">
          <img
            ref={logoRef as Ref<HTMLImageElement>}
            src={reactLogo}
            className="logo react"
            alt="React logo"
            style={{
              transform: `rotate(${
                logoMetrics.position.relativeToCenterY * 1
              }deg)`,
            }}
          />
        </a>
      </div>

      <h1>useScrollTracker</h1>

      <h3>Render count: {renderCount}</h3>

      <pre className="card">{JSON.stringify(logoMetrics, null, 2)}</pre>

      <pre>{logoMetrics.direction ?? "stopped"}</pre>
    </>
  );
}

export default App;
