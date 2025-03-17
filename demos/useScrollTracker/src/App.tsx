import { Ref, useMemo } from "react";
import reactLogo from "./assets/react.svg";
import useScrollTracker from "@crucai/use-scroll-tracker";
import "./App.css";

function App() {
  const { ref, metrics } = useScrollTracker();

  const tiltAmount = useMemo(
    () =>
      metrics.direction === "down" ? 45 : metrics.direction === "up" ? -45 : 0,
    [metrics.direction]
  );

  return (
    <>
      VIS:{metrics.visibility?.percentage}%
      <div ref={ref as Ref<HTMLDivElement>}>
        <a href="https://react.dev" target="_blank">
          <img
            src={reactLogo}
            className="logo react"
            alt="React logo"
            style={{
              transform: `rotate(${metrics.position.relativeToCenterY}deg)`,
            }}
          />
        </a>
      </div>
      <h1>useScrollTracker</h1>
      <div
        className="perspective"
        style={{
          transform: `perspective(1000px) rotateX(${tiltAmount}deg)`,
          opacity: metrics.visibility.percentage / 100,
        }}
      >
        XX
      </div>
      <pre>{metrics.direction ?? "stopped"}</pre>
      VIS:{metrics.visibility?.percentage}%
    </>
  );
}

export default App;
