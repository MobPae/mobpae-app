import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  UserRoundPlus,
} from "lucide-react";
import type { CSSProperties } from "react";
import type { AdvanceRequest, AppState, View } from "../types/app";
import {
  formatMoney,
  formatReadableDate,
  formatRequestStatus,
  formatShortDate,
} from "../utils/format";

type DashboardScreenProps = {
  appState: AppState;
  notice: string;
  onNavigate: (view: View) => void;
};

function firstName(name?: string) {
  return (name || "there").trim().split(/\s+/)[0] || "there";
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function nextPaydayDate(payrollDay?: number | null) {
  if (!payrollDay) return null;
  const today = new Date();
  const offset = today.getDate() > payrollDay ? 1 : 0;
  return new Date(today.getFullYear(), today.getMonth() + offset, payrollDay);
}

function latestRequest(requests: AdvanceRequest[]) {
  return [...requests].sort(
    (a, b) =>
      new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime()
  )[0];
}

function activeAdvance(requests: AdvanceRequest[]) {
  return (
    requests.find(
      (r) =>
        r.disbursalStatus === "Disbursed" && r.recoveryStatus === "Scheduled"
    ) ??
    requests.find((r) => r.disbursalStatus === "Pending") ??
    latestRequest(requests)
  );
}

export function DashboardScreen({
  appState,
  notice,
  onNavigate,
}: DashboardScreenProps) {
  const { profile, dashboard, requests } = appState;
  const name = firstName(profile.name || dashboard?.employeeName);
  const monthlySalary = dashboard?.salaryInHand ?? profile.salaryLimit ?? 0;
  const limit = dashboard?.approvedLimit ?? monthlySalary;
  const current = activeAdvance(requests);
  const advanceTaken = current
    ? current.approvedAmount || current.requestedAmount
    : dashboard?.activeRequestAmount ?? 0;
  const availableNow =
    dashboard?.availableAdvance ?? Math.max(0, limit - advanceTaken);
  const usedPercent =
    limit > 0 ? Math.min(100, Math.round((advanceTaken / limit) * 100)) : 0;
  const payday = nextPaydayDate(dashboard?.payrollDay);
  const repaymentDue = current?.totalRecoveryAmount || advanceTaken;
  const repaymentDate = current?.recoveryDate
    ? formatReadableDate(current.recoveryDate)
    : payday
    ? payday.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";
  const recent = latestRequest(requests);

  return (
    <div className="home-screen-v2">
      {notice && <div className="home-notice-v2">{notice}</div>}

      <section className="home-greeting-v2">
        <h1>
          {greeting()}, <em>{name}.</em>
        </h1>
      </section>

      <section className="home-salary-v2">
        <div className="home-salary-ink-v2" />
        <div className="home-salary-top-v2">
          <div
            className="home-usage-ring-v2"
            style={{ "--usage": `${usedPercent * 3.6}deg` } as CSSProperties}
          >
            <div>
              <strong>{usedPercent}%</strong>
              <span>USED</span>
            </div>
          </div>

          <div className="home-salary-main-v2">
            <div className="home-eyebrow-v2">Monthly Salary</div>
            <div className="home-salary-amount-v2">
              {monthlySalary ? formatMoney(monthlySalary) : "—"}
            </div>
            <div className="home-updated-v2">
              <span />
              {dashboard ? "Updated today" : "Syncing salary data"}
            </div>
          </div>
        </div>

        <div className="home-salary-line-v2" />

        <div className="home-salary-bottom-v2">
          <div>
            <span>Available now</span>
            <strong>{formatMoney(availableNow)}</strong>
          </div>
          <div>
            <span>Advance taken</span>
            <strong>{formatMoney(advanceTaken)}</strong>
          </div>
          <button type="button" onClick={() => onNavigate("advance")}>
            Access <ArrowRight size={25} />
          </button>
        </div>
      </section>

      {repaymentDue > 0 && (
        <section className="home-repayment-section-v2">
          <div className="home-section-top-v2">
            <span>Repayment</span>
            <button type="button" onClick={() => onNavigate("repayments")}>
              Schedule <ArrowRight size={16} />
            </button>
          </div>
          <div className="home-repayment-v2">
            <div className="home-repayment-amount-wrap-v2">
              <span className="home-deduct-icon-v2">
                <ArrowDown size={15} />
              </span>
              <div>
                <span>Amount due</span>
                <strong>{formatMoney(repaymentDue)}</strong>
              </div>
            </div>
            <div>
              <span>Due date</span>
              <strong>{repaymentDate}</strong>
            </div>
          </div>
        </section>
      )}

      <section className="home-activity-v2">
        <div className="home-section-top-v2">
          <span>Recent Activity</span>
          <button type="button" onClick={() => onNavigate("activity")}>
            View all <ArrowRight size={16} />
          </button>
        </div>
        {recent ? (
          <button
            type="button"
            className="home-activity-row-v2"
            onClick={() => onNavigate("activity")}
          >
            <span className="home-activity-icon-v2">
              <ArrowUp size={15} />
            </span>
            <span className="home-activity-text-v2">
              <strong>
                {recent.disbursalStatus === "Disbursed"
                  ? "Advance Credited"
                  : "Advance Requested"}
              </strong>
              <small>
                {formatShortDate(recent.disbursalDate || recent.requestDate)} ·{" "}
                {formatRequestStatus(recent.status, recent.statusLabel)}
              </small>
            </span>
            <span className="home-activity-money-v2">
              +{formatMoney(recent.approvedAmount || recent.requestedAmount)}
            </span>
          </button>
        ) : (
          <div className="home-empty-v2">
            Your first advance activity will appear here.
          </div>
        )}
      </section>

      <section className="home-members-v2">
        <div className="home-members-head-v2">
          <div>
            <span>Active Members</span>
            <strong>128 colleagues are on board</strong>
          </div>
          <div className="home-member-stack-v2">
            <span>AK</span>
            <span>RP</span>
            <span>SM</span>
            <span>+124</span>
          </div>
        </div>
        <div className="home-member-divider-v2" />
        <div className="home-invite-v2">
          <span className="home-invite-icon-v2">
            <UserRoundPlus size={27} />
          </span>
          <strong>Refer a teammate, earn ₹500</strong>
          <button type="button" onClick={() => onNavigate("help")}>
            Invite
          </button>
        </div>
      </section>

      <div className="mp-bottom-space" />
    </div>
  );
}
