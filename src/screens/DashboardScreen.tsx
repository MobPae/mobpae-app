import { ArrowRight, Clock3, FileCheck2, Landmark, ShieldCheck } from "lucide-react";
import { Card } from "../components/ui/Card";
import { InlineAlert } from "../components/ui/InlineAlert";
import { Metric } from "../components/ui/Metric";
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
  const kycComplete = appState.documents.every((item) => item.status === "Verified");
  let nextSetupView: View = !kycComplete || !appState.bankAccount?.verified || !appState.membershipActive ? "profile" : "advance";

  if (!kycComplete) {
    nextSetupView = "kyc";
  }

  return (
    <>
      <section className="hero-card">
        <div>
          <p>Available salary advance</p>
          <strong>{formatMoney(appState.profile.salaryLimit)}</strong>
          <span>{eligibleForAdvance ? "Ready to request from this pay cycle" : nextBlocker}</span>
        </div>
        <span className="hero-badge">
          <ShieldCheck size={19} />
          {appState.membershipActive ? "Member" : "Employee"}
        </span>
      </section>
      <button className="hero-action" type="button" onClick={() => onNavigate(eligibleForAdvance ? "advance" : nextSetupView)}>
        <span>{eligibleForAdvance ? "Request advance" : "Continue setup"}</span>
        <ArrowRight size={16} />
      </button>

      <InlineAlert message={notice} tone={eligibleForAdvance ? "success" : "warning"} />

      <section className="metric-grid">
        <Metric icon={<FileCheck2 size={18} />} label="KYC status" value={appState.documents.every((item) => item.status === "Verified") ? "Verified" : "Pending"} tone="warn" />
        <Metric icon={<Landmark size={18} />} label="Bank account" value={appState.bankAccount?.verified ? "Verified" : "Pending"} tone={appState.bankAccount?.verified ? "good" : "warn"} />
        <Metric icon={<Clock3 size={18} />} label="Payment status" value={formatHomeStatus(paymentStatus)} />
      </section>

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
