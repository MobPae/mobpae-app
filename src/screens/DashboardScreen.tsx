import { BadgeIndianRupee, CheckCircle2, Clock3, FileCheck2, Landmark, ShieldCheck } from "lucide-react";
import { ActionRow } from "../components/ui/ActionRow";
import { Card } from "../components/ui/Card";
import { InlineAlert } from "../components/ui/InlineAlert";
import { Metric } from "../components/ui/Metric";
import { SectionHeader } from "../components/ui/SectionHeader";
import { OnboardingSteps } from "../components/onboarding/OnboardingSteps";
import { formatMoney } from "../utils/format";
import type { AppState, View } from "../types/app";

type DashboardScreenProps = {
  appState: AppState;
  eligibleForAdvance: boolean;
  membershipFee: number;
  nextBlocker: string;
  notice: string;
  onboardingSteps: Array<{ label: string; done: boolean }>;
  onNavigate: (view: View) => void;
};

export function DashboardScreen({ appState, eligibleForAdvance, membershipFee, nextBlocker, notice, onboardingSteps, onNavigate }: DashboardScreenProps) {
  const latestRequest = appState.requests[0];

  return (
    <>
      <section className="hero-card">
        <div>
          <p>Available salary advance</p>
          <strong>{formatMoney(appState.profile.salaryLimit)}</strong>
          <span>{eligibleForAdvance ? "Ready for a new request" : nextBlocker}</span>
        </div>
        <ShieldCheck size={34} />
      </section>

      <OnboardingSteps steps={onboardingSteps} />
      <InlineAlert message={notice} tone={eligibleForAdvance ? "success" : "warning"} />

      <section className="metric-grid">
        <Metric icon={<BadgeIndianRupee size={18} />} label="Membership fee" value={formatMoney(membershipFee)} tone="dark" />
        <Metric icon={<FileCheck2 size={18} />} label="KYC status" value={appState.documents.every((item) => item.status === "Verified") ? "Verified" : "Pending"} tone="warn" />
        <Metric icon={<Landmark size={18} />} label="Bank account" value={appState.bankAccount ? "Added" : "Missing"} tone={appState.bankAccount ? "good" : "warn"} />
        <Metric icon={<Clock3 size={18} />} label="Latest request" value={latestRequest?.status ?? "None"} />
      </section>

      <Card>
        <SectionHeader title="Next actions" eyebrow="MVP flow" icon={<CheckCircle2 size={19} />} />
        <ActionRow icon={<FileCheck2 size={18} />} title="Finish KYC" description="Upload and verify employee documents." onClick={() => onNavigate("kyc")} />
        <ActionRow icon={<Landmark size={18} />} title="Add bank account" description="Required before disbursal." onClick={() => onNavigate("profile")} />
        <ActionRow icon={<BadgeIndianRupee size={18} />} title="Request salary advance" description="Preview recovery before submitting." onClick={() => onNavigate("advance")} />
      </Card>

      <Card>
        <SectionHeader title="Notifications" eyebrow="Updates" />
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
