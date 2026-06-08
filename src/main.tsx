import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { EmployeeApp } from "./screens/EmployeeApp";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <EmployeeApp />
  </StrictMode>
);
