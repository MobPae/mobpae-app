import {
  ArrowUpRight,
  Banknote,
  Building2,
  Check,
  CreditCard,
  HelpCircle,
  History,
  ShieldCheck,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { formatMoney, formatRequestStatus, formatShortDate } from "../utils/format";
import type { AdvanceRequest, AppState, View } from "../types/app";

type DashboardScreenProps = {
  appState: AppState;
  notice: string;
  onNavigate: (view: View) => void;
};

function nextPaydayDate(payrollDay?: number | null) {
  if (!payrollDay) return null;
  const today = new Date();
  const offset = today.getDate() > payrollDay ? 1 : 0;
  return new Date(today.getFullYear(), today.getMonth() + offset, payrollDay);
}

function daysUntilPayday(payrollDay?: number | null): number | null {
  const d = nextPaydayDate(payrollDay);
  if (!d) return null;
  return Math.ceil((d.getTime() - Date.now()) / 86_400_000);
}

function formatPayday(d: Date | null) {
  if (!d) return "—";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

/* ── Advance Status Tracker ─────────────────────────────────────────── */
const TRACKER_STEPS = [
  { label: "Requested",  tIdx: 0, icon: <Banknote   size={13} /> },
  { label: "Employer",   tIdx: 1, icon: <Building2  size={13} /> },
  { label: "MobPae",     tIdx: 2, icon: <ShieldCheck size={13} /> },
  { label: "Credited",   tIdx: 3, icon: <Banknote   size={13} /> },
] as const;

const STATUS_MSGS: Record<number, string> = {
  0: "Advance placed — waiting for employer review",
  1: "Employer is reviewing your request",
  2: "MobPae team is processing your advance",
  3: "Funds are on the way to your account",
};

function AdvanceTracker({ request, onNavigate }: { request: AdvanceRequest; onNavigate: (v: View) => void }) {
  const t = request.timeline;
  const isRejected = t[5]?.done === true && t[5]?.status === "Rejected";
  const activeStepIdx = TRACKER_STEPS.findIndex(s => !t[s.tIdx]?.done);

  if (isRejected) {
    return (
      <div className="home-card">
        <div className="home-section-hdr">
          <span className="home-section-title">Advance Request</span>
          <button type="button" className="home-section-link" onClick={() => onNavigate("activity")}>
            View history <ArrowUpRight size={13} />
          </button>
        </div>
        <div style={{ padding: "0 16px 16px" }}>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start", background: "#FFF1F2", borderRadius: 12, padding: "14px 16px", border: "1px solid #FFE4E6" }}>
            <XCircle size={22} color="var(--red)" style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "var(--red)", marginBottom: 4 }}>Request Not Approved</div>
              <div style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.6 }}>
                {request.remarks || "Your advance request was declined. You can request again or contact support for more details."}
              </div>
            </div>
          </div>
          <button
            type="button"
            className="mp-btn-secondary"
            style={{ marginTop: 12, width: "100%", padding: "10px 0" }}
            onClick={() => onNavigate("advance")}
          >
            Request Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="home-card">
      <div className="home-section-hdr">
        <span className="home-section-title">Advance Request</span>
        <button type="button" className="home-section-link" onClick={() => onNavigate("activity")}>
          Details <ArrowUpRight size={13} />
        </button>
      </div>

      {/* Amount row */}
      <div style={{ padding: "0 16px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "var(--t1)", lineHeight: 1 }}>
            {formatMoney(request.requestedAmount)}
          </div>
          <div style={{ fontSize: 11, color: "var(--t2)", marginTop: 3 }}>
            Requested {formatShortDate(request.requestDate)}
          </div>
        </div>
        <span className="chip chip-amber" style={{ fontSize: 11 }}>
          <span className="chip-dot" /> In Progress
        </span>
      </div>

      {/* Step tracker */}
      <div className="home-tracker-steps">
        {TRACKER_STEPS.flatMap((step, i) => {
          const done = t[step.tIdx]?.done ?? false;
          const isActive = i === activeStepIdx;
          const nodes = [
            <div key={`step-${i}`} className="home-tracker-step">
              <div className={`home-tracker-dot ${done ? "done" : isActive ? "active" : "pending"}`}>
                {done ? <Check size={13} strokeWidth={3} /> : isActive ? step.icon : <span style={{ fontSize: 10, fontWeight: 700 }}>{i + 1}</span>}
              </div>
              <div className={`home-tracker-label ${done ? "done" : isActive ? "active" : ""}`}>{step.label}</div>
            </div>,
          ];
          if (i < TRACKER_STEPS.length - 1) {
            nodes.push(<div key={`line-${i}`} className={`home-tracker-line ${done ? "done" : ""}`} />);
          }
          return nodes;
        })}
      </div>

      {/* Current status message */}
      <div className="home-tracker-status">
        <div className="home-tracker-pulse-dot" />
        <span>{STATUS_MSGS[activeStepIdx < 0 ? 3 : activeStepIdx]}</span>
      </div>
    </div>
  );
}

export function DashboardScreen({
  appState,
  notice,
  onNavigate,
}: DashboardScreenProps) {
  const { profile, dashboard, requests } = appState;
  const salaryInHand = dashboard?.salaryInHand ?? 0;
  const availableAdvance = dashboard?.availableAdvance ?? 0;
  const payrollDay = dashboard?.payrollDay;
  const earnedSoFar = dashboard?.earnedSoFar ?? 0;
  const nextPayday = nextPaydayDate(payrollDay);
  const daysLeft = daysUntilPayday(payrollDay);
  const activeRequest = requests.find(
    (r) => r.disbursalStatus === "Pending" || r.recoveryStatus === "Scheduled"
  );

  const recentRequests = [...requests]
    .sort((a, b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime())
    .slice(0, 3);

  const kycDone = appState.documents.length > 0 && appState.documents.every((d) => d.status === "Verified");
  const bankDone = !!appState.bankAccount?.verified;
  const memberDone = appState.membershipActive;

  const quickActions = [
    { label: "Advance", icon: <Banknote size={22} />, view: "advance" as View },
    { label: "Repayments", icon: <CreditCard size={22} />, view: "repayments" as View },
    { label: "History", icon: <History size={22} />, view: "activity" as View },
    { label: "Help", icon: <HelpCircle size={22} />, view: "help" as View },
  ];

  const statusColor = activeRequest?.recoveryStatus === "Completed" ? "var(--green)" : "var(--amber)";
  const statusBg = activeRequest?.recoveryStatus === "Completed" ? "#F0FDF4" : "#FFFBEB";

  return (
    <div className="home-screen">

      {/* ── Notice banner ── */}
      {notice && (
        <div style={{ background: "#FEF3C7", color: "#92400E", padding: "10px 16px", fontSize: 12, fontWeight: 600 }}>
          ⚠ {notice}
        </div>
      )}

      {/* ── Salary hero card with graphics ── */}
      <div className="home-salary-card">
        {/* Decorative circles */}
        <div className="home-salary-circle home-salary-circle--tl" />
        <div className="home-salary-circle home-salary-circle--br" />
        <div className="home-salary-circle home-salary-circle--mid" />

        <div className="home-salary-top">
          <div className="home-salary-left">
            <div className="home-salary-label">Monthly Salary</div>
            <div className="home-salary-amount">{formatMoney(salaryInHand)}</div>
            <div className="home-salary-updated">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z"/></svg>
              Updated today
            </div>
            <button type="button" className="home-access-btn" onClick={() => onNavigate("advance")}>
              <Banknote size={13} color="#5B3CE3" />
              Access Advance
            </button>
          </div>
          <div className="home-salary-divider" />
          <div className="home-salary-right">
            <div>
              <div className="home-salary-stat-label">Next Payday</div>
              <div className="home-salary-stat-val">
                {nextPayday ? formatPayday(nextPayday) : "—"}
                {daysLeft !== null ? <span className="home-salary-days-pill">{daysLeft}d</span> : null}
              </div>
            </div>
            <div>
              <div className="home-salary-stat-label">For Advance</div>
              <div className="home-salary-stat-val">{formatMoney(availableAdvance)}</div>
            </div>
            <div>
              <div className="home-salary-stat-label">
                {activeRequest ? "Advance Taken" : "Earned So Far"}
              </div>
              <div className="home-salary-stat-val">
                {activeRequest
                  ? formatMoney(activeRequest.approvedAmount || activeRequest.requestedAmount)
                  : (earnedSoFar > 0 ? formatMoney(earnedSoFar) : "—")}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Setup banners ── */}
      {(!kycDone || !bankDone || !memberDone) && (
        <div className="home-card" style={{ padding: "14px 0 4px" }}>
          <div style={{ padding: "0 16px 8px", fontSize: 12, fontWeight: 800, color: "#6B7280", textTransform: "uppercase", letterSpacing: ".05em" }}>Complete Setup</div>
          {[
            { done: kycDone, label: "KYC Verification", sub: "Upload Aadhaar, PAN & Selfie", view: "onboarding-kyc" as View },
            { done: bankDone, label: "Bank Account", sub: "Add your salary account", view: "onboarding-bank" as View },
            { done: memberDone, label: "Activate Plan", sub: "Enable salary advance access", view: "profile-membership" as View },
          ].filter(s => !s.done).map((step, i, arr) => (
            <button
              key={step.label}
              type="button"
              onClick={() => onNavigate(step.view)}
              className="home-setup-row"
              style={{ borderBottom: i < arr.length - 1 ? "1px solid #F3F1FF" : "none" }}
            >
              <div className="home-setup-icon">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
              </div>
              <div style={{ flex: 1 }}>
                <div className="home-setup-title">{step.label}</div>
                <div className="home-setup-sub">{step.sub}</div>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          ))}
        </div>
      )}

      {/* ── Quick actions ── */}
      <div className="home-card home-quick-grid">
        {quickActions.map((a) => (
          <button key={a.label} type="button" className="home-quick-item" onClick={() => onNavigate(a.view)}>
            <div className="home-quick-icon">{a.icon}</div>
            <span className="home-quick-label">{a.label}</span>
          </button>
        ))}
      </div>

      {/* ── Advance Tracker (pre-disbursed) ── */}
      {activeRequest && activeRequest.disbursalStatus === "Pending" && (
        <AdvanceTracker request={activeRequest} onNavigate={onNavigate} />
      )}

      {/* ── Current Advance (post-disbursed — repayment tracking) ── */}
      {activeRequest && activeRequest.disbursalStatus === "Disbursed" && (
        <div className="home-card">
          <div className="home-section-hdr">
            <span className="home-section-title">Repayment Due</span>
            <button type="button" className="home-section-link" onClick={() => onNavigate("repayments")}>
              View schedule <ArrowUpRight size={13} />
            </button>
          </div>
          <div className="home-adv-row">
            <div className="home-adv-icon" style={{ background: statusBg, color: statusColor }}>
              <TrendingUp size={19} />
            </div>
            <div className="home-adv-info">
              <div className="home-adv-amount">
                {formatMoney(activeRequest.totalRecoveryAmount || activeRequest.approvedAmount || activeRequest.requestedAmount)}
              </div>
              <div className="home-adv-due">
                {activeRequest.recoveryDate ? `Due ${formatShortDate(activeRequest.recoveryDate)}` : "Due date TBD"}
              </div>
            </div>
            <div className="home-adv-status">
              <span className={`chip ${activeRequest.recoveryStatus === "Completed" ? "chip-green" : "chip-amber"}`} style={{ fontSize: 11 }}>
                <span className="chip-dot" />
                {activeRequest.recoveryStatus === "Completed" ? "Repaid" : formatRequestStatus(activeRequest.status, activeRequest.statusLabel)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── Recent Activity ── */}
      <div className="home-card">
        <div className="home-section-hdr">
          <span className="home-section-title">Recent Activity</span>
          {recentRequests.length > 0 && (
            <button type="button" className="home-section-link" onClick={() => onNavigate("activity")}>
              View all <ArrowUpRight size={13} />
            </button>
          )}
        </div>
        {recentRequests.length === 0 ? (
          <div className="home-empty-row">
            <div className="home-empty-icon">💸</div>
            <div className="home-empty-title">No transactions yet</div>
            <div className="home-empty-sub">Request your first salary advance to get started</div>
          </div>
        ) : (
          recentRequests.map((req, i) => {
            const amount = req.approvedAmount || req.requestedAmount;
            const isDisbursed = req.disbursalStatus === "Disbursed";
            const isPaid = req.recoveryStatus === "Completed";
            return (
              <div key={req.id}>
                {i > 0 && <div style={{ height: 1, background: "#F3F1FF", margin: "0 16px" }} />}
                <div
                  className="home-activity-row"
                  onClick={() => onNavigate("activity")}
                  style={{ cursor: "pointer" }}
                >
                  <div className={`home-activity-icon ${isDisbursed ? "green" : isPaid ? "" : "amber"}`}>
                    <Banknote size={18} />
                  </div>
                  <div className="home-activity-body">
                    <div className="home-activity-title">
                      {isDisbursed ? "Advance Credited" : isPaid ? "Advance Repaid" : "Advance Requested"}
                    </div>
                    <div className="home-activity-sub">{formatShortDate(req.requestDate)} · {formatRequestStatus(req.status, req.statusLabel)}</div>
                  </div>
                  <div className="home-activity-right">
                    <div className={`home-activity-amount ${isDisbursed ? "green" : isPaid ? "red" : ""}`}>
                      {isDisbursed ? "+" : isPaid ? "−" : ""}{formatMoney(amount)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="mp-bottom-space" />
    </div>
  );
}
