// Polyfills for AWS Cognito SDK
import { Buffer } from "buffer";
import process from "process";

// Make globals available
(window as any).global = window;
(window as any).Buffer = Buffer;
(window as any).process = process;

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
