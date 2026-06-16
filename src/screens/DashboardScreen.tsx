import {
  ArrowRight,
  Bell,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  Crown,
  History,
  Info,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { formatMoney, formatShortDate } from "../utils/format";
import type { AppState, RequestStatus, View } from "../types/app";

type DashboardScreenProps = {
  appState: AppState;
  eligibleForAdvance: boolean;
  nextBlocker: string;
  notice: string;
  onNavigate: (view: View) => void;
  onToggleTheme?: () => void;
};

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map(n => n[0]?.toUpperCase() ?? "").join("");
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function daysUntilPayday(payrollDay?: number) {
  const today = new Date();
  const day = payrollDay ?? 30;
  let target = new Date(today.getFullYear(), today.getMonth(), day);
  if (target <= today) target = new Date(today.getFullYear(), today.getMonth() + 1, day);
  return Math.ceil((target.getTime() - today.getTime()) / 86_400_000);
}

/** SVG circular progress ring — r=22, stroke on outside of icon circle */
function ProgressRing({ pct, color }: { pct: number; color: string }) {
  const r = 24;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(pct, 100) / 100);
  return (
    <svg
      width="54" height="54" viewBox="0 0 54 54"
      style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
    >
      {/* track */}
      <circle cx="27" cy="27" r={r} fill="none" stroke="#f1f5f9" strokeWidth="3" />
      {/* fill */}
      {pct > 0 && (
        <circle
          cx="27" cy="27" r={r}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={`${circ}`}
          strokeDashoffset={`${offset}`}
          transform="rotate(-90 27 27)"
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      )}
    </svg>
  );
}

const ACTIVITY_PILL: Record<string, { color: string; bg: string }> = {
  "Submitted":          { color: "#b45309", bg: "#fef3c7" },
  "Employer Approved":  { color: "#0369a1", bg: "#e0f2fe" },
  "Admin Approved":     { color: "#0369a1", bg: "#dbeafe" },
  "Under Review":       { color: "#7c3aed", bg: "#ede9fe" },
  "Approved":           { color: "#15803d", bg: "#dcfce7" },
  "Disbursed":          { color: "#15803d", bg: "#dcfce7" },
  "Payment Scheduled":  { color: "#0369a1", bg: "#e0f2fe" },
  "Paid":               { color: "#15803d", bg: "#dcfce7" },
  "Recovery Scheduled": { color: "#0369a1", bg: "#e0f2fe" },
  "Recovered":          { color: "#0e7490", bg: "#cffafe" },
  "Rejected":           { color: "#dc2626", bg: "#fee2e2" },
};

export function DashboardScreen({ appState, onNavigate }: DashboardScreenProps) {
  const dash         = appState.dashboard;
  const profile      = appState.profile;
  const docs         = appState.documents;
  const memberActive = appState.membershipActive;
  const bank         = appState.bankAccount;

  const available  = Number(dash?.availableAdvance ?? 0);
  const salary     = Number(dash?.salaryInHand ?? 0);
  const payrollDay = dash?.payrollDay ?? null;
  const daysLeft   = payrollDay ? daysUntilPayday(payrollDay) : null;

  const today   = new Date();
  const nextPay = payrollDay ? new Date(today.getFullYear(), today.getMonth(), payrollDay) : null;
  if (nextPay && nextPay <= today) nextPay.setMonth(nextPay.getMonth() + 1);
  const nextPayLabel = nextPay ? formatShortDate(nextPay.toISOString()) : "—";

  const kycVerified = docs.filter(d => d.status === "Verified").length;
  const kycTotal    = 3;
  const kycDone     = kycVerified === kycTotal;

  // Overall completion
  const completionDone = [memberActive, Boolean(bank), kycDone].filter(Boolean).length;
  const completionPct  = Math.round((completionDone / 3) * 100);

  // Ring colours per item
  const memberRingColor = memberActive ? "#16a34a" : "#e5e7eb";
  const bankRingColor   = bank ? (bank.verified ? "#16a34a" : "#c4522a") : "#e5e7eb";
  const kycRingColor    = kycDone ? "#16a34a" : kycVerified > 0 ? "#f59e0b" : "#e5e7eb";
  const memberRingPct   = memberActive ? 100 : 0;
  const bankRingPct     = bank ? (bank.verified ? 100 : 50) : 0;
  const kycRingPct      = Math.round((kycVerified / kycTotal) * 100);

  return (
    <div className="dash-screen">

      {/* ── Top bar ─────────────────────────────────────────────── */}
      <div className="dash-top-bar">
        <div>
          <div className="dash-greeting-label">{getGreeting()}</div>
          <div className="dash-greeting-name">{profile.name}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button type="button" className="dash-bell-btn" aria-label="Notifications">
            <Bell size={20} />
            <span className="dash-bell-dot" />
          </button>
          <div className="dash-avatar">{getInitials(profile.name)}</div>
        </div>
      </div>

      {/* ── Hero card ───────────────────────────────────────────── */}
      <div className="hero-card">

        {/* Floating geometric motifs */}
        {/* Large coin ring top-right */}
        <div style={{ position:"absolute", top:-32, right:-32, width:140, height:140, borderRadius:"50%", border:"2px solid rgba(255,255,255,0.10)", pointerEvents:"none", zIndex:0 }} />
        <div style={{ position:"absolute", top:-12, right:-12, width:90, height:90, borderRadius:"50%", border:"1.5px solid rgba(255,255,255,0.07)", pointerEvents:"none", zIndex:0 }} />
        {/* Coin with ₹ */}
        <div style={{ position:"absolute", top:16, right:16, width:46, height:46, borderRadius:"50%", background:"rgba(255,255,255,0.12)", border:"1.5px solid rgba(255,255,255,0.20)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:17, fontWeight:800, color:"rgba(255,255,255,0.45)", pointerEvents:"none", zIndex:1 }}>₹</div>
        {/* Small diamond */}
        <div style={{ position:"absolute", bottom:26, right:22, width:18, height:18, borderRadius:4, background:"rgba(255,255,255,0.10)", transform:"rotate(45deg)", pointerEvents:"none", zIndex:0 }} />
        {/* Small dot cluster */}
        <div style={{ position:"absolute", bottom:18, right:48, width:8, height:8, borderRadius:"50%", background:"rgba(255,255,255,0.15)", pointerEvents:"none" }} />
        <div style={{ position:"absolute", bottom:30, right:58, width:5, height:5, borderRadius:"50%", background:"rgba(255,255,255,0.10)", pointerEvents:"none" }} />

        <div className="hero-card-top">
          <span className="hero-available-label">
            Available Advance
            <Info size={13} style={{ opacity: 0.65 }} />
          </span>
          {memberActive && (
            <button type="button" className="hero-membership-badge" onClick={() => onNavigate("member")}>
              <Crown size={11} color="#22c55e" />
              Active Membership
            </button>
          )}
        </div>

        {/* Oversized display amount */}
        <div className="hero-amount">
          {available > 0 ? formatMoney(available) : "N/A"}
        </div>

        {(salary > 0 || nextPay) && (
          <div className="hero-until">
            {salary > 0 && <>out of {formatMoney(salary)} salary</>}
            {salary > 0 && nextPay && <span className="hero-until-sep">|</span>}
            {nextPay && (
              <>
                <CalendarClock size={12} />
                Available until {formatShortDate(nextPay.toISOString())}
              </>
            )}
          </div>
        )}

        <button type="button" className="hero-cta" onClick={() => onNavigate("advance")}>
          Request Advance <ArrowRight size={15} />
        </button>
      </div>

      {/* ── Quick Actions ────────────────────────────────────────── */}
      <div className="section-header">
        <span className="section-title">Quick Actions</span>
      </div>
      <div className="qa-grid">
        {([
          { view: "activity", label: "History",    icon: <History size={22} />,     color: "#c4522a" },
          { view: "profile",  label: "KYC",        icon: <ShieldCheck size={22} />, color: "#16a34a" },
          { view: "profile",  label: "Bank",        icon: <CreditCard size={22} />,  color: "#0369a1" },
          { view: "member",   label: "Membership",  icon: <Crown size={22} />,       color: "#d97706" },
        ] as const).map(({ view, label, icon, color }) => (
          <button key={label} type="button" className="qa-grid-card" onClick={() => onNavigate(view)}>
            <span style={{ color }}>{icon}</span>
            <span className="qa-grid-label">{label}</span>
          </button>
        ))}
      </div>

      {/* ── Your Progress ────────────────────────────────────────── */}
      <div className="section-header">
        <span className="section-title">Your Progress</span>
        <button type="button" className="section-link" onClick={() => onNavigate("profile")}>
          View Details <ChevronRight size={13} />
        </button>
      </div>

      <div className="progress-strip">

        {/* Overall completion bar */}
        <div className="progress-overall-bar">
          <div className="progress-overall-header">
            <span className="progress-overall-label">Overall Completion</span>
            <span className="progress-overall-pct">{completionPct}%</span>
          </div>
          <div className="progress-overall-track">
            <div className="progress-overall-fill" style={{ width: `${completionPct}%` }} />
          </div>
        </div>

        {/* Three items with SVG rings */}
        <div className="progress-items-row">

          {/* Membership */}
          <div className="progress-item">
            <div className="progress-ring-wrap">
              <ProgressRing pct={memberRingPct} color={memberRingColor} />
              <div className={`progress-icon-wrap ${memberActive ? "done" : "pending"}`}>
                {memberActive ? <CheckCircle2 size={20} /> : <Crown size={18} />}
              </div>
            </div>
            <div className="progress-label">Membership</div>
            <div className={`progress-sub ${memberActive ? "green" : "muted"}`}>
              {memberActive ? "Active" : "Inactive"}
            </div>
          </div>

          {/* Bank */}
          <div className="progress-item">
            <div className="progress-ring-wrap">
              <ProgressRing pct={bankRingPct} color={bankRingColor} />
              <div className={`progress-icon-wrap ${bank ? (bank.verified ? "done" : "blue") : "pending"}`}>
                {bank ? <CheckCircle2 size={20} /> : <CreditCard size={18} />}
              </div>
            </div>
            <div className="progress-label">Bank Account</div>
            <div className={`progress-sub ${bank?.verified ? "green" : bank ? "blue" : "muted"}`}>
              {bank?.verified ? "Verified" : bank ? "Pending" : "Not Added"}
            </div>
          </div>

          {/* KYC */}
          <div className="progress-item">
            <div className="progress-ring-wrap">
              <ProgressRing pct={kycRingPct} color={kycRingColor} />
              <div className={`progress-icon-wrap ${kycDone ? "done" : "kyc"}`}>
                {kycDone
                  ? <CheckCircle2 size={20} />
                  : <span className="kyc-fraction">{kycVerified}/{kycTotal}</span>}
              </div>
            </div>
            <div className="progress-label">KYC Docs</div>
            <div className={`progress-sub ${kycDone ? "green" : "amber"}`}>
              {kycVerified}/{kycTotal} Done
            </div>
          </div>

        </div>
      </div>

      {/* ── Recent Activity ──────────────────────────────────────── */}
      {appState.requests.length > 0 && <>
        <div className="section-header">
          <span className="section-title">Recent Activity</span>
          <button type="button" className="section-link" onClick={() => onNavigate("activity")}>
            View All <ChevronRight size={13} />
          </button>
        </div>
        <div className="activity-list">
          {appState.requests.slice(0, 3).map((req) => {
            const pill = ACTIVITY_PILL[req.status as RequestStatus] ?? { color: "#64748b", bg: "#f1f5f9" };
            const label = req.statusLabel ?? req.status;
            return (
              <button key={req.id} type="button" className="activity-row" onClick={() => onNavigate("activity")}>
                <div className="activity-icon">
                  <Wallet size={16} color="#c4522a" />
                </div>
                <div className="activity-body">
                  <div className="activity-title">Advance Requested</div>
                  <div className="activity-amount">{formatMoney(req.requestedAmount)}</div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <span className="activity-pill" style={{ color: pill.color, background: pill.bg }}>
                    {label}
                  </span>
                  <div className="activity-date">{formatShortDate(req.requestDate)}</div>
                </div>
                <ChevronRight size={14} color="var(--t3)" style={{ flexShrink: 0 }} />
              </button>
            );
          })}
        </div>
      </>}

      <div style={{ height: 48 }} />
    </div>
  );
}
