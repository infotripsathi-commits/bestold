import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { AppWrapper } from "./components/common/PageMeta.tsx";
import { initSentry } from "./lib/sentry";
import { initPerformanceTracking } from "./lib/performance";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";

// Initialize monitoring
initSentry();
initPerformanceTracking();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppWrapper>
      <App />
      <Analytics />
      <SpeedInsights />
    </AppWrapper>
  </StrictMode>
);

