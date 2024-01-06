import React, { useRef, useEffect, useState } from "react";
import * as d3 from "d3";
import locationData from "./locations.json";
import { FeatureCollection } from "geojson";
import worldDataJSON from "./world.json";
import { Grid } from "@nextui-org/react";
import { useTheme } from "@nextui-org/react";

const worldData = worldDataJSON as FeatureCollection;

const EarthAnimation = (props: { children: React.ReactNode }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { theme } = useTheme();

  // State
  const [screenWidth, setScreenWidth] = useState(0);
  const [screenHeight, setScreenHeight] = useState(0);
  const [rotation, setRotation] = useState(210); // Initial rotation
  const [pings, setPings] = useState<number[][]>([]);

  // Handle screen resize
  useEffect(() => {
    const handleResize = () => {
      setScreenWidth(window.outerWidth);
      setScreenHeight(window.outerHeight);
    };
    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Pings
  const pingDecay = 1.03; // 0.05/1 = 20 ticks
  const initialPingRatio = 0.01;
  const pingRatio = 0.0003;

  /* disable animations
  useEffect(() => {

    setPings(locationData.map(loc => { return [loc[0], loc[1], Math.floor(Math.random() + initialPingRatio)] }));
  }, [pingRatio]);

  // Animation loop (Ping decay and rotation)
  useEffect(() => {
    const intervalId = setInterval(() => {
      setRotation(rotation => (rotation + 0.015) % 360);
      // decay visible pings
      pings.map(ping => { return (ping[2] /= pingDecay) })
      setPings(pings.map(loc => { return loc[2] < 0.15 ? ([loc[0], loc[1], Math.floor(Math.random() + pingRatio)]) : loc }));
    }, 25);

    return () => {
      clearInterval(intervalId);
    };
  }, [pings, pingDecay, pingRatio]);
   */

  // Event-driven Animation
  useEffect(() => {
    function drawPoint(
      point: number[],
      projection: d3.GeoProjection,
      context: CanvasRenderingContext2D
    ) {
      const projectedPoints = projection([point[0], point[1]]);
      if (!projectedPoints) return; // If point is not visible, don't draw it

      context.beginPath();
      context.fillStyle = theme?.colors.primary.value ?? "grey";
      context.filter = "opacity(" + point[2] + ")";
      context?.arc(
        projectedPoints[0],
        projectedPoints[1],
        4,
        0,
        2 * Math.PI,
        true
      );
      context?.fill();
    }

    if (canvasRef.current) {
      const canvas = d3.select(canvasRef.current);
      const context = (canvas.node() as HTMLCanvasElement).getContext("2d");
      const projection = d3
        .geoOrthographic()
        .scale(800)
        .translate([screenWidth / 2, screenHeight / 2])
        .rotate([rotation, 0, 23.4]);

      if (context) {
        const path = d3.geoPath().projection(projection).context(context);

        context?.clearRect(0, 0, screenWidth, screenHeight);
        context?.beginPath();
        path({ type: "FeatureCollection", features: worldData.features });
        context.filter = "opacity(1.0)";
        context.fillStyle = theme?.colors.textLight.value ?? "rgb(75, 75, 75)";
        context?.fill();
        context.lineWidth = 0.5;
        context.strokeStyle = theme?.colors.border.value ?? "rgb(25, 25, 25)";
        context?.stroke();

        // Filter pings that aren't visible
        pings
          .filter((p) => {
            {
              let diff = Math.abs(-rotation - p[0]) % 360;
              let truediff = diff > 180 ? 360 - diff : diff;
              return truediff < 86;
            }
          })
          .forEach((ping) => {
            drawPoint(ping, projection, context);
          }); // Now draw filtered points
      }
    }
  }, [screenWidth, screenHeight, rotation, pings, theme]);

  return (
    <div style={{ maxWidth: "100vw", maxHeight: "100vh", overflow: "hidden" }}>
      <div
        style={{
          width: "100vw",
          height: "100vh",
          position: "absolute",
          zIndex: "1",
        }}
      >
        {props.children}
      </div>
      <Grid sm={12} xs={0}>
        <canvas
          style={{
            position: "absolute",
            top: "0px",
            zIndex: "-1",
            background: theme?.colors.background.value,
          }}
          ref={canvasRef}
          width={screenWidth}
          height={screenHeight}
        />
      </Grid>
    </div>
  );
};

export default EarthAnimation;
