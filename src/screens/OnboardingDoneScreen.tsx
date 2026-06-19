import { CheckCircle2 } from "lucide-react";

type Props = {
  name: string;
  kycSubmitted: boolean;
  bankConnected: boolean;
  onExplore: () => void;
};

export function OnboardingDoneScreen({ name, kycSubmitted, bankConnected, onExplore }: Props) {
  const firstName = name.split(" ")[0] || "there";

  return (
    <div className="ob-done-screen">
      {/* Background gradient */}
      <div className="ob-done-bg" />

      {/* Decorative blobs */}
      <div className="ob-done-blob ob-done-blob--tl" />
      <div className="ob-done-blob ob-done-blob--br" />

      <div className="ob-done-content">
        {/* Success icon */}
        <div className="ob-done-check-ring">
          <CheckCircle2 size={52} color="white" strokeWidth={1.6} />
        </div>

        <h1 className="ob-done-title">
          {kycSubmitted && bankConnected
            ? <>You're all set,<br />{firstName}!</>
            : <>Almost there,<br />{firstName}!</>}
        </h1>
        <p className="ob-done-sub">
          {kycSubmitted && bankConnected
            ? "Your account is being reviewed. You'll be ready to request a salary advance once verification is complete."
            : "Complete the pending steps below to unlock salary advance requests."}
        </p>

        {/* Summary */}
        <div className="ob-done-summary">
          <SummaryRow
            done={kycSubmitted}
            label={kycSubmitted ? "KYC documents submitted — pending review" : "KYC documents not yet uploaded"}
          />
          <SummaryRow
            done={bankConnected}
            label={bankConnected ? "Bank account connected" : "Bank account not yet added"}
          />
          <SummaryRow done label="Account created & secured" />
        </div>

        <p className="ob-done-note">
          {kycSubmitted && bankConnected
            ? "Admin verification usually takes up to 24 hours."
            : "You can complete pending steps anytime from your Profile."}
        </p>

        <button type="button" className="ob-done-btn" onClick={onExplore}>
          {kycSubmitted && bankConnected ? "Explore MobPae" : "Go to App"}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function SummaryRow({ done, label }: { done: boolean; label: string }) {
  return (
    <div className="ob-done-row">
      <div className={`ob-done-row-dot ${done ? "ob-done-row-dot--done" : "ob-done-row-dot--pending"}`}>
        {done ? (
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
            <path d="M2 6.5L4.5 9L10 3.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: "rgba(255,255,255,0.6)" }} />
        )}
      </div>
      <span className="ob-done-row-label">{label}</span>
    </div>
  );
}
