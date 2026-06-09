import { ArrowRight, BadgeIndianRupee, CheckCircle2, Clock3, FileCheck2, Landmark, Send, ShieldCheck, WalletCards } from "lucide-react";
import { Card } from "../components/ui/Card";
import { InlineAlert } from "../components/ui/InlineAlert";
import { SectionHeader } from "../components/ui/SectionHeader";
import { formatMoney } from "../utils/format";
import type { AppState, View } from "../types/app";

type DashboardScreenProps = {
  appState: AppState;
  eligibleForAdvance: boolean;
  nextBlocker: string;
  notice: string;
  onNavigate: (view: View) => void;
};

const formatHomeStatus = (status?: string) => {
  if (!status) return "None";
  return status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .replace("Repayment Scheduled", "Payment Scheduled")
    .replace("Recovery Scheduled", "Payment Scheduled");
};

export function DashboardScreen({ appState, eligibleForAdvance, nextBlocker, notice, onNavigate }: DashboardScreenProps) {
  const latestRequest = appState.requests[0];
  const paymentStatus = appState.dashboard?.activeRepaymentStatus ?? appState.dashboard?.activeRequestStatus ?? latestRequest?.status;
  const formattedStatus = formatHomeStatus(paymentStatus);
  const kycComplete = appState.documents.every((item) => item.status === "Verified");
  const setupComplete = kycComplete && Boolean(appState.bankAccount?.verified) && appState.membershipActive;
  let nextSetupView: View = setupComplete ? "advance" : "profile";

  if (!kycComplete) {
    nextSetupView = "kyc";
  }

  const ctaView: View = eligibleForAdvance ? "advance" : setupComplete ? "tracking" : nextSetupView;
  const ctaLabel = eligibleForAdvance ? "Request advance" : setupComplete ? "Track request" : "Continue setup";
  const ctaHint = eligibleForAdvance ? "Ready this cycle" : setupComplete ? formattedStatus : nextBlocker;
  const completedStatuses = ["Submitted"];

  if (["Approved", "Under Review", "Disbursed", "Payment Scheduled", "Paid"].includes(formattedStatus)) completedStatuses.push("Employer");
  if (["Under Review", "Disbursed", "Payment Scheduled", "Paid"].includes(formattedStatus)) completedStatuses.push("Admin");
  if (["Disbursed", "Payment Scheduled", "Paid"].includes(formattedStatus)) completedStatuses.push("Disbursed");

  const journey = [
    { label: "Submitted", icon: <Send size={15} /> },
    { label: "Employer", icon: <CheckCircle2 size={15} /> },
    { label: "Admin", icon: <ShieldCheck size={15} /> },
    { label: "Disbursed", icon: <WalletCards size={15} /> }
  ];

  return (
    <>
      <section className="home-balance">
        <div className="home-balance-top">
          <div>
            <p>Available advance</p>
            <strong>{formatMoney(appState.profile.salaryLimit)}</strong>
            <span>{ctaHint}</span>
          </div>
          <span className="home-membership-chip">
            <ShieldCheck size={17} />
            {appState.membershipActive ? "Member" : "Employee"}
          </span>
        </div>
        <div className="home-balance-grid">
          <div>
            <p>Latest request</p>
            <strong>{latestRequest ? formatMoney(latestRequest.requestedAmount) : "None"}</strong>
          </div>
          <div>
            <p>Status</p>
            <strong>{formatHomeStatus(paymentStatus)}</strong>
          </div>
        </div>
      </section>

      <Card className="journey-card">
        <SectionHeader title="Request journey" eyebrow="Current flow" icon={<Clock3 size={19} />} />
        <div className="journey-track">
          {journey.map((step) => {
            const done = completedStatuses.includes(step.label);
            return (
              <div className={`journey-step ${done ? "done" : ""}`} key={step.label}>
                <span>{step.icon}</span>
                <p>{step.label}</p>
              </div>
            );
          })}
        </div>
      </Card>

      <button className="hero-action" type="button" onClick={() => onNavigate(ctaView)}>
        <span>{ctaLabel}</span>
        <ArrowRight size={16} />
      </button>

      <section className="home-status-strip">
        <div className={kycComplete ? "done" : ""}>
          <FileCheck2 size={17} />
          <span>KYC</span>
          <strong>{kycComplete ? "Verified" : "Pending"}</strong>
        </div>
        <div className={appState.bankAccount?.verified ? "done" : ""}>
          <Landmark size={17} />
          <span>Bank</span>
          <strong>{appState.bankAccount?.verified ? "Verified" : "Pending"}</strong>
        </div>
        <div className={appState.membershipActive ? "done" : ""}>
          <BadgeIndianRupee size={17} />
          <span>Plan</span>
          <strong>{appState.membershipActive ? "Active" : "Pending"}</strong>
        </div>
      </section>

      <InlineAlert message={notice} tone={eligibleForAdvance ? "success" : "warning"} />

      <Card>
        <SectionHeader title="Recent activity" eyebrow="Updates" />
        <div className="list">
          {appState.notifications.map((notification) => (
            <div className="notification" key={notification}>
              <span />
              <p>{notification}</p>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}
