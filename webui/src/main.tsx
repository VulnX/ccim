import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./main.css";
import { BrowserRouter } from "react-router-dom";
import { ClipboardProvider } from "./context/ClipboardContext.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <ClipboardProvider>
        <App />
      </ClipboardProvider>
    </BrowserRouter>
  </StrictMode>
);
