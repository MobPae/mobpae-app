import { useEffect } from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

type Props = {
  message: string;
  onDismiss: () => void;
};

export function AppToast({ message, onDismiss }: Props) {
  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(onDismiss, 4500);
    return () => window.clearTimeout(timer);
  }, [message, onDismiss]);

  if (!message) return null;

  const lower = message.toLowerCase();
  const tone = /unable|failed|error|invalid|incorrect|expired|unavailable/.test(lower)
    ? "error"
    : /saved|updated|uploaded|activated|submitted|success/.test(lower)
      ? "success"
      : "info";

  return (
    <div className={`app-toast ${tone}`} role={tone === "error" ? "alert" : "status"}>
      <span className="app-toast-icon">
        {tone === "error" ? <AlertCircle size={17} /> : tone === "success" ? <CheckCircle2 size={17} /> : <Info size={17} />}
      </span>
      <p>{message}</p>
      <button type="button" onClick={onDismiss} aria-label="Dismiss message"><X size={15} /></button>
    </div>
  );
}
