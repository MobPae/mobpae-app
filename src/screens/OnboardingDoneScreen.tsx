import { ArrowRight, BadgeCheck, Banknote, CreditCard, Crown, ShieldCheck, Zap } from "lucide-react";

type Props = {
  name: string;
  kycSubmitted: boolean;
  bankConnected: boolean;
  onExplore: () => void;
};

export function OnboardingDoneScreen({ name, kycSubmitted, bankConnected, onExplore }: Props) {
  const firstName = name.split(" ")[0] || "there";

  const benefits = [
    { icon: <Banknote size={18} />, title: "Salary Advance", sub: "Access up to 50% of your salary anytime" },
    { icon: <Zap size={18} />, title: "Instant Approval", sub: "Same-day disbursal after employer approval" },
    { icon: <CreditCard size={18} />, title: "Auto Repayment", sub: "Seamlessly deducted on payday" },
    { icon: <ShieldCheck size={18} />, title: "Fully Secure", sub: "256-bit SSL · RBI compliant" },
  ];

  return (
    <div className="onb-done-screen">

      {/* Check icon */}
      <div className="onb-done-check">
        <BadgeCheck size={44} />
      </div>

      <div className="onb-done-title">You're all set, {firstName}! 🎉</div>
      <div className="onb-done-sub">
        Your account is ready. You can now request salary advances whenever you need them.
      </div>

      {/* Status card */}
      <div style={{ background: "#F9F8FF", borderRadius: 16, padding: "16px", width: "100%", marginBottom: 20, border: "1px solid #E8E5FF" }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: "#0F0A3C", marginBottom: 10 }}>Setup Status</div>
        {[
          { label: "Account Created", done: true },
          { label: "KYC Documents", done: kycSubmitted },
          { label: "Bank Account", done: bankConnected },
          { label: "Membership Active", done: false },
        ].map((item) => (
          <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid #F3F1FF" }}>
            <div style={{ color: item.done ? "#16A34A" : "#9CA3AF", display: "flex" }}>
              {item.done ? <BadgeCheck size={16} /> : <Crown size={16} />}
            </div>
            <span style={{ flex: 1, fontSize: 13, color: item.done ? "#0F0A3C" : "#6B7280", fontWeight: item.done ? 600 : 400 }}>
              {item.label}
            </span>
            <span style={{ fontSize: 11, fontWeight: 700, color: item.done ? "#16A34A" : "#D97706" }}>
              {item.done ? "Done" : "Pending"}
            </span>
          </div>
        ))}
      </div>

      {/* Benefits */}
      <div className="onb-done-benefits">
        <div className="onb-done-benefits-title">What you can do now</div>
        {benefits.map((b) => (
          <div key={b.title} className="onb-done-benefit-row">
            <div className="onb-done-benefit-icon">{b.icon}</div>
            <div className="onb-done-benefit-body">
              <div className="onb-done-benefit-title">{b.title}</div>
              <div className="onb-done-benefit-sub">{b.sub}</div>
            </div>
            <BadgeCheck size={15} color="#16A34A" className="onb-done-benefit-check" />
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
