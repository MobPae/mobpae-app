import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
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

/* ── Avatar color palette — consistent per initial ─────────── */
const AVATAR_COLORS = [
  "#7B64FF", "#5B3CE3", "#A78BFA", "#6366F1",
  "#8B5CF6", "#EC4899", "#14B8A6", "#F59E0B",
];
function avatarColor(name: string) {
  const code = name.charCodeAt(0) || 65;
  return AVATAR_COLORS[code % AVATAR_COLORS.length];
}
function firstNameOnly(displayName: string) {
  return displayName.split(" ")[0];
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

  const peer = appState.peerActivity;
  const hasPeers = peer && peer.activeUsers > 0;

  return (
    <div className="home-screen-v2">
      {notice && <div className="home-notice-v2">{notice}</div>}

      {/* ── Hero card — greeting folded in ── */}
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

      {/* ── Repayment due card ── */}
      {repaymentDue > 0 && (
        <button
          type="button"
          className="home-repay-card-v2"
          onClick={() => onNavigate("repayments")}
        >
          <div className="home-repay-card-left">
            <div className="home-repay-card-label">Repayment Due</div>
            <div className="home-repay-card-amount">{formatMoney(repaymentDue)}</div>
            <div className="home-repay-card-date">Due on {repaymentDate}</div>
          </div>
          <div className="home-repay-card-right">
            <span className="home-repay-card-icon"><ArrowDown size={16} /></span>
          </div>
        </button>
      )}

      {/* ── Membership payment action required ── */}
      {requests.some(r => r.status === "Awaiting Membership") && (
        <button
          type="button"
          onClick={() => onNavigate("profile-membership")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: "linear-gradient(135deg, #FEF3C7, #FDE68A)",
            border: "1.5px solid #F59E0B",
            borderRadius: 14,
            padding: "12px 14px",
            margin: "0 16px 12px",
            width: "calc(100% - 32px)",
            textAlign: "left",
            cursor: "pointer",
          }}
        >
          <span style={{ fontSize: 22 }}>🔐</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#92400E" }}>
              Action Required: Pay Membership
            </div>
            <div style={{ fontSize: 11.5, color: "#B45309", marginTop: 2 }}>
              Your advance request is approved — complete membership to receive funds.
            </div>
          </div>
          <span style={{ fontSize: 18, color: "#B45309" }}>›</span>
        </button>
      )}

      {/* ── Unified feed — Activity + Colleagues ── */}
      <section className="home-feed-v2">

        {/* Recent Activity */}
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

        {/* Divider between activity and colleagues */}
        <div className="home-feed-divider-v2" />

        {/* Colleagues — compact */}
        {hasPeers ? (
          <>
            {/* Header: label + stacked avatars + count */}
            <div className="home-peers-head-v2">
              <span>Your Colleagues</span>
              <div className="home-peers-right-v2">
                <div className="home-peers-stack-v2">
                  {peer!.recentActivity.slice(0, 3).map((item, i) => {
                    const n = firstNameOnly(item.displayName);
                    return (
                      <div key={i} className="home-peer-avatar-sm-v2" style={{ background: avatarColor(n), marginLeft: i === 0 ? 0 : -8 }}>
                        {n[0]?.toUpperCase() ?? "?"}
                      </div>
                    );
                  })}
                </div>
                <span className="home-peers-count-v2">
                  {peer!.activeUsers} using MobPae
                </span>
              </div>
            </div>
            {/* Compact activity rows */}
            {peer!.recentActivity.slice(0, 3).map((item, i) => {
              const n = firstNameOnly(item.displayName);
              const timeLabel = item.daysAgo === 0 ? "Today" : item.daysAgo === 1 ? "Yesterday" : `${item.daysAgo}d ago`;
              return (
                <div key={i} className="home-peer-row-v2">
                  <div className="home-peer-avatar-v2" style={{ background: avatarColor(n) }}>
                    {n[0]?.toUpperCase() ?? "?"}
                  </div>
                  <p className="home-peer-text-v2">
                    <strong>{n}</strong> {item.action}
                  </p>
                  <span className="home-peer-time-v2">{timeLabel}</span>
                </div>
              );
            })}
          </>
        ) : (
          <div className="home-peers-empty-v2">
            <span>🚀</span>
            <p>Be the first from your company to use MobPae</p>
          </div>
        )}
      </section>

      <div className="mp-bottom-space" />
    </div>
  );
}
