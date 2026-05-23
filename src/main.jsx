import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

const stored = localStorage.getItem("bingo-theme");
const prefersLight = window.matchMedia?.("(prefers-color-scheme: light)").matches;
const initial = stored === "light" || stored === "dark" ? stored : prefersLight ? "light" : "dark";
document.documentElement.classList.add(initial);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
