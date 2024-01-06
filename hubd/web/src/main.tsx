import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { NextUIProvider } from "@nextui-org/react";
import { RouterProvider } from "react-router-dom";
import { router } from "./router.tsx";

const dark = window.matchMedia('(prefers-color-scheme: dark)').matches

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <NextUIProvider>
      <main className={dark ? "dark bg-background" : "bg-background"}>
        <RouterProvider router={router} />
      </main>
    </NextUIProvider>
  </React.StrictMode>,
);
