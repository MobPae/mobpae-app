import {
  ArrowUpRight,
  Banknote,
  Bell,
  Crown,
  FileCheck2,
  History,
  Landmark,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react";
import { getFileUrl } from "../services/api";
import { formatMoney, formatRequestStatus, formatShortDate } from "../utils/format";
import type { AppState, View } from "../types/app";

type DashboardScreenProps = {
  appState: AppState;
  eligibleForAdvance: boolean;
  nextBlocker: string;
  notice: string;
  refreshing?: boolean;
  onRefresh: () => void;
  onNavigate: (view: View) => void;
};

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("");
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function daysUntilPayday(payrollDay?: number | null) {
  if (!payrollDay) return null;
  const today = new Date();
  let target = new Date(today.getFullYear(), today.getMonth(), payrollDay);
  if (target <= today) {
    target = new Date(today.getFullYear(), today.getMonth() + 1, payrollDay);
  }
  return Math.ceil((target.getTime() - today.getTime()) / 86_400_000);
}

function nextPaydayDate(payrollDay?: number | null) {
  if (!payrollDay) return null;
  const today = new Date();
  const monthOffset = today.getDate() > payrollDay ? 1 : 0;
  return new Date(today.getFullYear(), today.getMonth() + monthOffset, payrollDay);
}

export function DashboardScreen({
  appState,
  refreshing,
  onRefresh,
  onNavigate,
}: DashboardScreenProps) {
  const profile = appState.profile;
  const dashboard = appState.dashboard;
  const firstName = profile.name.split(" ")[0] || profile.name || "there";
  const payrollDay = dashboard?.payrollDay ?? null;
  const nextPayday = nextPaydayDate(payrollDay);
  const daysLeft = daysUntilPayday(payrollDay);

  const salaryInHand = Number(dashboard?.salaryInHand ?? 0);
  const available = Number(dashboard?.availableAdvance ?? profile.salaryLimit ?? 0);
  const baseLimit = Number(dashboard?.approvedLimit ?? profile.salaryLimit ?? salaryInHand ?? 0);
  const activeRequest = appState.requests.find(
    (request) => !["Paid", "Recovered", "Rejected"].includes(request.status)
  );
  const withdrawn = activeRequest
    ? Number(activeRequest.approvedAmount || activeRequest.requestedAmount)
    : Number(dashboard?.activeRequestAmount ?? 0);
  const availablePct = baseLimit > 0 ? Math.min(100, Math.max(4, Math.round((available / baseLimit) * 100))) : 0;

  const verifiedDocs = appState.documents.filter((document) => document.status === "Verified").length;
  const reviewingDocs = appState.documents.filter((document) => document.status === "Under Review").length;
  const kycDone = verifiedDocs >= 3 && profile.selfieStatus === "VERIFIED";
  const kycLabel = kycDone
    ? "Verified"
    : reviewingDocs > 0
      ? "Reviewing"
      : verifiedDocs > 0
        ? `${verifiedDocs}/3`
        : "Pending";

  const bankDone = Boolean(appState.bankAccount?.verified);
  const memberActive = appState.membershipActive;

  const journey = [
    {
      label: "Submitted",
      sub: "Request sent",
      icon: <Send size={17} />,
      done: Boolean(activeRequest),
    },
    {
      label: "Employer",
      sub: "Approval",
      icon: <ShieldCheck size={17} />,
      done: ["Employer Approved", "Admin Approved", "Disbursed", "Payment Scheduled", "Paid"].includes(activeRequest?.status ?? ""),
    },
    {
      label: "Admin",
      sub: "Review",
      icon: <FileCheck2 size={17} />,
      done: ["Admin Approved", "Disbursed", "Payment Scheduled", "Paid"].includes(activeRequest?.status ?? ""),
    },
    {
      label: "Payout",
      sub: "Transfer",
      icon: <Wallet size={17} />,
      done: ["Disbursed", "Payment Scheduled", "Paid"].includes(activeRequest?.status ?? ""),
    },
  ];

  const setupItems = [
    {
      label: "KYC",
      value: kycLabel,
      icon: <FileCheck2 size={21} />,
      active: kycDone,
      view: "profile-kyc" as View,
    },
    {
      label: "Bank",
      value: bankDone ? "Verified" : appState.bankAccount ? "Pending" : "Add now",
      icon: <Landmark size={21} />,
      active: bankDone,
      view: "profile-bank" as View,
    },
    {
      label: "Plan",
      value: memberActive ? "Active" : "Inactive",
      icon: <Crown size={21} />,
      active: memberActive,
      view: "profile-membership" as View,
    },
  ];

  const recentRequests = appState.requests.slice(0, 3);

  return (
    <div className="mp-dashboard">
      <section className="mp-home-hero">
        <div className="mp-home-top">
          <button type="button" className="mp-avatar-btn" onClick={() => onNavigate("profile")}>
            {profile.profilePhotoUrl ? (
              <img src={getFileUrl(profile.profilePhotoUrl)} alt={profile.name} />
            ) : (
              getInitials(profile.name || "M")
            )}
          </button>
          <div className="mp-home-greeting">
            <span>{profile.employer || "MobPae"}</span>
            <strong>{getGreeting()}, {firstName}</strong>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              className="mp-icon-btn mp-bell-btn"
              aria-label="Notifications"
              onClick={() => onNavigate("notifications")}
            >
              <Bell size={17} />
              {appState.notifications.length > 0 && (
                <span className="mp-bell-badge">
                  {appState.notifications.length > 9 ? "9+" : appState.notifications.length}
                </span>
              )}
            </button>
            <button
              type="button"
              className="mp-icon-btn"
              aria-label="Refresh dashboard"
              onClick={onRefresh}
            >
              <RefreshCw size={17} className={refreshing ? "spin" : ""} />
            </button>
          </div>
        </div>

        <div className="mp-limit-card">
          <div className="mp-limit-orb" />
          <div className="mp-limit-top">
            <span>Available to withdraw</span>
            <button
              type="button"
              className={`mp-member-pill ${memberActive ? "active" : ""}`}
              onClick={() => onNavigate("profile-membership")}
            >
              <ShieldCheck size={15} />
              {memberActive ? "Member" : "Activate"}
            </button>
          </div>
          <div className="mp-limit-amount">{formatMoney(available)}</div>
          <div className="mp-limit-sub">of {baseLimit > 0 ? formatMoney(baseLimit) : "no"} limit</div>
          <div className="mp-limit-track">
            <span style={{ width: `${availablePct}%` }} />
          </div>
          {activeRequest && available <= 500 && (
            <div className="mp-limit-note">
              <Sparkles size={14} />
              More advance opens after your scheduled payment is cleared.
            </div>
          )}
        </div>

        <div className="mp-salary-strip">
          <div>
            <span>Total salary</span>
            <strong>{salaryInHand > 0 ? formatMoney(salaryInHand) : "N/A"}</strong>
          </div>
          <div>
            <span>Withdrawn</span>
            <strong>{withdrawn > 0 ? formatMoney(withdrawn) : "₹0"}</strong>
          </div>
          <div>
            <span>Next payday</span>
            <strong>{nextPayday ? formatShortDate(nextPayday.toISOString()) : daysLeft !== null ? `${daysLeft}d` : "N/A"}</strong>
          </div>
        </div>
      </section>

      {activeRequest ? (
        <section className="mp-section mp-journey-card">
          <div className="mp-section-title-row">
            <div>
              <span>Live request</span>
              <h2>Your request journey</h2>
            </div>
            <button type="button" className="mp-slim-link" onClick={() => onNavigate("activity")}>
              Track <ArrowUpRight size={14} />
            </button>
          </div>
          <div className="mp-journey">
            {journey.map((step, index) => (
              <div className={`mp-journey-step ${step.done ? "done" : ""}`} key={step.label}>
                {index < journey.length - 1 && <span className="mp-journey-line" />}
                <div className="mp-journey-dot">{step.icon}</div>
                <strong>{step.label}</strong>
                <small>{step.sub}</small>
              </div>
            ))}
          </div>
          <div className="mp-live-request">
            <div>
              <span>Current request</span>
              <strong>{formatMoney(activeRequest.approvedAmount || activeRequest.requestedAmount)}</strong>
            </div>
            <div>
              <span>Status</span>
              <strong>{formatRequestStatus(activeRequest.status, activeRequest.statusLabel)}</strong>
            </div>
          </div>
        </section>
      ) : (
        <section className="mp-empty-action">
          <div>
            <span>Ready when you are</span>
            <strong>No active salary request</strong>
          </div>
          <button type="button" onClick={() => onNavigate("advance")}>
            Request <ArrowUpRight size={15} />
          </button>
        </section>
      )}

      <section className="mp-section mp-setup-section">
        <div className="mp-section-title-row">
          <div>
            <span>Account</span>
            <h2>Setup status</h2>
          </div>
        </div>
        <div className="mp-setup-row">
          {setupItems.map((item, index) => (
            <button
              key={item.label}
              type="button"
              className="mp-setup-item"
              onClick={() => onNavigate(item.view)}
            >
              {index > 0 && <span className="mp-setup-divider" />}
              <span className={`mp-setup-icon ${item.active ? "active" : ""}`}>{item.icon}</span>
              <strong>{item.label}</strong>
              <small className={item.active ? "ok" : ""}>{item.value}</small>
            </button>
          ))}
        </div>
      </section>

      <section className="mp-section">
        <div className="mp-section-title-row">
          <div>
            <span>Money movement</span>
            <h2>My transactions</h2>
          </div>
          <button type="button" className="mp-slim-link" onClick={() => onNavigate("activity")}>
            View all <ArrowUpRight size={14} />
          </button>
        </div>

        {recentRequests.length > 0 ? (
          <div className="mp-transaction-list">
            {recentRequests.map((request) => {
              const amount = request.approvedAmount || request.requestedAmount;
              return (
                <button key={request.id} type="button" className="mp-transaction-row" onClick={() => onNavigate("activity")}>
                  <span className="mp-transaction-icon">
                    <Banknote size={18} />
                  </span>
                  <span className="mp-transaction-body">
                    <strong>Salary advance</strong>
                    <small>{formatRequestStatus(request.status, request.statusLabel)} · {formatShortDate(request.requestDate)}</small>
                  </span>
                  <span className="mp-transaction-amount">{formatMoney(amount)}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="mp-transaction-empty">
            <History size={18} />
            <span>Your advance history will appear here.</span>
          </div>
        )}
      </section>

      {!memberActive && (
        <section className="mp-member-nudge">
          <Crown size={20} />
          <div>
            <strong>Unlock full MobPae access</strong>
            <span>Activate your plan to request salary advances.</span>
          </div>
          <button type="button" onClick={() => onNavigate("profile-membership")}>Activate</button>
        </section>
      )}

      <div className="mp-bottom-space" />
    </div>
  );
}
