import type { ReactNode } from "react";

type MetricProps = {
  icon: ReactNode;
  label: string;
  value: string;
  tone?: "default" | "good" | "warn" | "dark";
};

export function Metric({ icon, label, value, tone = "default" }: MetricProps) {
  return (
    <div className={`metric ${tone}`}>
      <span>{icon}</span>
      <p>{label}</p>
      <span>{value}</span>
    </div>
  );
}
