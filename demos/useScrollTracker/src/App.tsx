import { useEffect, useRef } from "react";
import reactLogo from "./assets/react.svg";
import "./App.css";

//
import { createScrollTracker } from "@crucai/use-scroll-tracker";
// import { ScrollMetrics } from "../../../packages/useScrollTracker/src/utils/types";

function App() {
  // const [metrics, setMetrics] = useState<ScrollMetrics>();
  // const { ref: logoRef, metrics } = useScrollTracker({
  //   dynamics: {
  //     inertiaDecayTime: 3000,
  //   },
  // });

  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) {
      const st = createScrollTracker(
        ref.current as unknown as HTMLImageElement
      );
      console.log(st);
      const metrics = st.getMetrics();
      console.log(metrics);

      st.onUpdate(() => {
        const metrics = st.getMetrics();
        console.log(metrics);
      });
    }
  }, [ref]);

  // const tiltAmount =
  //   metrics.dynamics.velocity * 0.01 * metrics.dynamics.inertia;

  return (
    <>
      <div>
        <a href="https://react.dev" target="_blank">
          <img
            ref={ref}
            // ref={logoRef as Ref<HTMLImageElement>}
            src={reactLogo}
            className="logo react"
            alt="React logo"
            // style={{
            //   transform: `rotate(${metrics.position.relativeToCenterY * 1}deg)`,
            // }}
          />
        </a>
      </div>

      <h1>useScrollTracker</h1>

      <div
        className="perspective"
        // style={{
        //   transform: `perspective(1000px) rotateX(${tiltAmount}deg)`,
        // }}
      >
        XX
      </div>

      {/* <pre>{metrics.direction ?? "stopped"}</pre> */}
    </>
  );
}

export default App;
