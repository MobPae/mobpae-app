import { ArrowRight, BadgeIndianRupee, CheckCircle2, FileCheck2, Landmark, Send, ShieldCheck, WalletCards } from "lucide-react";
import { InlineAlert } from "../components/ui/InlineAlert";
import { formatMoney, formatShortDate } from "../utils/format";
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

const getNextPayday = () => {
  const today = new Date();
  const payday = new Date(today.getFullYear(), today.getMonth(), 28);

  if (payday.getTime() < today.getTime()) {
    payday.setMonth(payday.getMonth() + 1);
  }

  return payday.toISOString();
};

export function DashboardScreen({ appState, eligibleForAdvance, nextBlocker, notice, onNavigate }: DashboardScreenProps) {
  const latestRequest = appState.requests[0];
  const paymentStatus = appState.dashboard?.activeRepaymentStatus ?? appState.dashboard?.activeRequestStatus ?? latestRequest?.status;
  const formattedStatus = formatHomeStatus(paymentStatus);
  const kycComplete = appState.documents.every((item) => item.status === "Verified");
  const setupComplete = kycComplete && Boolean(appState.bankAccount?.verified) && appState.membershipActive;
  const withdrawnAmount = Number(appState.dashboard?.activeRequestAmount ?? latestRequest?.requestedAmount ?? 0);
  const availableAdvance = Number(appState.dashboard?.availableAdvance ?? appState.profile.salaryLimit);
  const approvedLimit = Number(appState.dashboard?.approvedLimit ?? availableAdvance + withdrawnAmount);
  const totalSalary = Number(appState.dashboard?.salaryInHand ?? approvedLimit);
  const nextPayday = latestRequest?.recoveryDate || getNextPayday();
  const availablePercent = approvedLimit > 0 ? Math.max(0, Math.min(100, (availableAdvance / approvedLimit) * 100)) : 0;
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
  if (["Disbursed", "Payment Scheduled", "Paid"].includes(formattedStatus)) completedStatuses.push("Disbursal");

  const journey = [
    { label: "Submitted", caption: latestRequest ? "Sent for review" : "Not started", icon: <Send size={14} /> },
    { label: "Employer", caption: "Approval", icon: <CheckCircle2 size={14} /> },
    { label: "Admin", caption: "Approval", icon: <ShieldCheck size={14} /> },
    { label: "Disbursal", caption: "Payout", icon: <WalletCards size={14} /> }
  ];

  return (
    <>
      <section className="home-balance">
        <div className="home-balance-top">
          <span className="home-membership-chip">
            <ShieldCheck size={17} />
            {appState.membershipActive ? "Member" : "Employee"}
          </span>
        </div>
        <div className="home-balance-summary">
          <p>Available to withdraw</p>
          <strong>{formatMoney(availableAdvance)}</strong>
          <span>of {formatMoney(approvedLimit)} limit</span>
        </div>
        <div className="home-progress-track" aria-hidden="true">
          <span style={{ width: `${availablePercent}%` }} />
        </div>
      </section>
      {withdrawnAmount > 0 && availableAdvance < approvedLimit ? (
        <p className="home-advance-note">You can withdraw again after the current due is cleared.</p>
      ) : null}

      <section className="home-salary-row" aria-label="Salary summary">
        <div>
          <span>Total Salary</span>
          <strong>{formatMoney(totalSalary)}</strong>
        </div>
        <div>
          <span>Withdrawn</span>
          <strong>{formatMoney(withdrawnAmount)}</strong>
        </div>
        <div>
          <span>Next payday</span>
          <strong>{formatShortDate(nextPayday)}</strong>
        </div>
      </section>

      <section className="journey-card">
        <h2>Your request journey</h2>
        <div className="journey-track">
          {journey.map((step) => {
            const done = completedStatuses.includes(step.label);
            return (
              <div className={`journey-step ${done ? "done" : ""}`} key={step.label}>
                <span>{step.icon}</span>
                <p>{step.label}</p>
                <small>{step.caption}</small>
              </div>
            );
          })}
        </div>
      </section>

      <h2 className="home-section-title">Setup status</h2>
      <section className="home-status-strip">
        <div className={kycComplete ? "done" : "pending"}>
          <FileCheck2 size={17} />
          <span>KYC</span>
          <strong>{kycComplete ? "Verified" : "Pending"}</strong>
        </div>
        <div className={appState.bankAccount?.verified ? "done" : "pending"}>
          <Landmark size={17} />
          <span>Bank</span>
          <strong>{appState.bankAccount?.verified ? "Verified" : "Pending"}</strong>
        </div>
        <div className={appState.membershipActive ? "active" : "pending"}>
          <BadgeIndianRupee size={17} />
          <span>Plan</span>
          <strong>{appState.membershipActive ? "Active" : "Pending"}</strong>
        </div>
      </section>

      <InlineAlert message={notice} tone={eligibleForAdvance ? "success" : "warning"} />

      <button className="hero-action" type="button" onClick={() => onNavigate(ctaView)}>
        <span>{ctaLabel}</span>
        <ArrowRight size={16} />
      </button>
    </>
  );
}
