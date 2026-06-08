import { Info } from "lucide-react";

type InlineAlertProps = {
  message: string;
  tone?: "info" | "warning" | "success";
};

export function InlineAlert({ message, tone = "info" }: InlineAlertProps) {
  return (
    <div className={`inline-alert ${tone}`}>
      <Info size={17} />
      <p>{message}</p>
    </div>
  );
}
