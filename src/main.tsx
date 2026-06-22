import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { EmployeeApp } from "./screens/EmployeeApp";
import { ErrorBoundary } from "./components/ui/ErrorBoundary";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <EmployeeApp />
    </ErrorBoundary>
  </StrictMode>
);
