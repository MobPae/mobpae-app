import { ArrowRight, BadgeCheck, Clock } from "lucide-react";

type Props = {
  name: string;
  kycSubmitted: boolean;
  kycVerified: boolean;
  bankConnected: boolean;
  membershipActive: boolean;
  membershipSubmitted: boolean;
  onExplore: () => void;
};

export function OnboardingDoneScreen({
  name,
  kycSubmitted,
  kycVerified,
  bankConnected,
  onExplore,
}: Props) {
  const firstName = name.split(" ")[0] || "there";

  type Tone = "done" | "submitted" | "pending";
  const toneOrder: Record<Tone, number> = { done: 0, submitted: 1, pending: 2 };

  const variableRows: { label: string; status: string; tone: Tone }[] = [
    {
      label: "KYC Documents",
      status: kycVerified ? "Verified" : kycSubmitted ? "Under review" : "Pending",
      tone: (kycVerified ? "done" : kycSubmitted ? "submitted" : "pending") as Tone,
    },
    {
      label: "Bank Account",
      status: bankConnected ? "Added" : "Pending",
      tone: (bankConnected ? "done" : "pending") as Tone,
    },
  ].sort((a, b) => toneOrder[a.tone] - toneOrder[b.tone]);

  const statusRows = [
    { label: "Account Created", status: "Done", tone: "done" as const },
    ...variableRows,
  ];

  return (
    <div className="onb-done-screen">

      {/* Check icon */}
      <div className="onb-done-check">
        <BadgeCheck size={44} />
      </div>

      <div className="onb-done-title">You're all set, {firstName}! 🎉</div>
      <div className="onb-done-sub">
        Your account is ready. Complete the steps below to start requesting advances.
      </div>

      {/* Status card */}
      <div style={{ background: "#F9F8FF", borderRadius: 16, padding: "16px", width: "100%", marginBottom: 20, border: "1px solid #E8E5FF" }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: "#0F0A3C", marginBottom: 10 }}>Setup Status</div>
        {statusRows.map((item, i) => (
          <div
            key={item.label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "9px 0",
              borderBottom: i < statusRows.length - 1 ? "1px solid #F3F1FF" : "none",
            }}
          >
            <div style={{ color: item.tone === "done" ? "#16A34A" : item.tone === "submitted" ? "#D97706" : "#9CA3AF", display: "flex" }}>
              {item.tone === "done" ? <BadgeCheck size={16} /> : <Clock size={16} />}
            </div>
            <span style={{ flex: 1, fontSize: 13, color: item.tone === "done" ? "#0F0A3C" : "#6B7280", fontWeight: item.tone === "done" ? 600 : 400 }}>
              {item.label}
            </span>
            <span style={{
              fontSize: 11,
              fontWeight: 700,
              color: item.tone === "done" ? "#16A34A" : item.tone === "submitted" ? "#D97706" : "#9CA3AF",
            }}>
              {item.status}
            </span>
          </div>
        ))}
      </div>

      <div className="onb-done-hint">
        KYC verification may take up to 24 hours. You'll be notified once approved.
      </div>

      <button type="button" className="mp-btn-primary" style={{ width: "100%" }} onClick={onExplore}>
        Explore MobPae <ArrowRight size={16} />
      </button>
    </div>
  );
}
