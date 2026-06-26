import {
  ArrowRight,
  BadgeCheck,
  Banknote,
  CalendarDays,
  CheckCircle,
  ChevronRight,
  Clock,
  CreditCard,
  Gift,
  IndianRupee,
  Info,
  RefreshCw,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { useState } from "react";
import { formatFullDate, formatMoney, formatRequestStatus, formatShortDate } from "../utils/format";
import type { AdvanceRequest, RecoveryPreview, View } from "../types/app";

const MIN_AMOUNT = 500;

type AdvanceScreenProps = {
  amount: number;
  eligible: boolean;
  limit: number;
  nextBlocker: string;
  preview: RecoveryPreview | null;
  previewLoading: boolean;
  currentRequest?: AdvanceRequest;
  submitting: boolean;
  salaryInHand?: number;
  payrollDay?: number | null;
  onAmountChange: (amount: number) => void;
  onSubmit: () => void;
  blockerActionLabel: string;
  onResolveBlocker: () => void;
  onNavigate?: (view: View) => void;
};

function nextPaydayDate(payrollDay?: number | null) {
  if (!payrollDay) return null;
  const today = new Date();
  const offset = today.getDate() > payrollDay ? 1 : 0;
  return new Date(today.getFullYear(), today.getMonth() + offset, payrollDay);
}
function formatPayday(d: Date | null) {
  if (!d) return "—";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

/* ── Page heading shared across all advance states ── */

export function AdvanceScreen({
  amount,
  eligible,
  limit,
  nextBlocker,
  preview,
  previewLoading,
  currentRequest,
  submitting,
  salaryInHand,
  payrollDay,
  onAmountChange,
  onSubmit,
  blockerActionLabel,
  onResolveBlocker,
  onNavigate,
}: AdvanceScreenProps) {
  const [step, setStep] = useState<"calculator" | "review" | "success">("calculator");
  const [agree1, setAgree1] = useState(false);
  const [agree2, setAgree2] = useState(false);

  const hasActive = Boolean(
    currentRequest &&
    !["Paid", "Recovered", "Rejected"].includes(currentRequest.status)
  );
  const canSubmit = eligible && !hasActive && amount >= MIN_AMOUNT && amount <= limit && !previewLoading;

  const nextPayday = nextPaydayDate(payrollDay);
  const salary = salaryInHand ?? (limit > 0 ? Math.round(limit / 0.5) : 0);

  // Show net salary only for the month the recovery actually hits
  const recoveryDate = hasActive && currentRequest?.recoveryDate
    ? new Date(currentRequest.recoveryDate)
    : null;
  const today = new Date();
  const recoveryIsThisMonth = recoveryDate
    && recoveryDate.getMonth() === today.getMonth()
    && recoveryDate.getFullYear() === today.getFullYear();
  const activeRecovery = hasActive && currentRequest?.disbursalStatus === "Disbursed" && recoveryIsThisMonth
    ? (currentRequest.totalRecoveryAmount || 0)
    : 0;
  const salaryThisMonth = Math.max(0, salary - activeRecovery);
  // Sub-label for the hero card
  const recoveryMonthName = recoveryDate
    ? recoveryDate.toLocaleDateString("en-IN", { month: "long" })
    : null;
  const salarySubLabel = hasActive && currentRequest?.disbursalStatus === "Disbursed" && recoveryDate
    ? recoveryIsThisMonth
      ? `After −${formatMoney(currentRequest.totalRecoveryAmount || 0)} deduction`
      : `Full pay · deduction in ${recoveryMonthName}`
    : "Updated just now";

  // ── Active advance overview (matches mockup) ──────────────
  if (hasActive && currentRequest) {
    const isPaid = currentRequest.recoveryStatus === "Completed";
    const statusLabel = isPaid ? "Repaid" : formatRequestStatus(currentRequest.status, currentRequest.statusLabel);
    const chipClass = isPaid ? "chip-green" : "chip-amber";
    const iconBg = isPaid ? "#F0FDF4" : "#FFFBEB";
    const iconColor = isPaid ? "var(--green)" : "var(--amber)";

    return (
      <div className="adv-screen">

        {/* Hero card */}
        <div className="adv-hero-card">
          <div className="adv-hero-circle adv-hero-circle--tl" />
          <div className="adv-hero-circle adv-hero-circle--br" />
          <div className="adv-hero-top">
            <div className="adv-hero-left">
              <div className="adv-hero-label">
                {activeRecovery > 0 ? "Salary This Month" : "Monthly Salary"}
              </div>
              <div className="adv-hero-amount">{salaryThisMonth > 0 ? formatMoney(salaryThisMonth) : "—"}</div>
              <div className="adv-hero-updated">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z"/></svg>
                {salarySubLabel}
              </div>
            </div>
            <div className="adv-hero-divider" />
            <div className="adv-hero-right">
              <div>
                <div className="adv-hero-stat-label">Available for Advance</div>
                <div className="adv-hero-stat-val">{formatMoney(limit)}</div>
              </div>
              <div>
                <div className="adv-hero-stat-label">Next Payday</div>
                <div className="adv-hero-stat-val">{nextPayday ? formatPayday(nextPayday) : "—"}</div>
              </div>
            </div>
          </div>
          <button
            type="button"
            className="adv-hero-btn"
            onClick={() => onNavigate?.("repayments")}
          >
            <CreditCard size={14} color="#5B3CE3" />
            View Repayment Schedule
            <ArrowRight size={13} color="#5B3CE3" style={{ marginLeft: "auto" }} />
          </button>
        </div>

        <div className="screen-body" style={{ padding: "0 0 16px" }}>

          {/* Your Advances section */}
          <div className="adv-ov-section-hdr">
            <span className="adv-ov-section-title">Your Advances</span>
            <button type="button" className="adv-ov-section-link" onClick={() => onNavigate?.("activity")}>
              View History <ChevronRight size={13} />
            </button>
          </div>

          <div className="adv-ov-card">
            {/* Main advance row */}
            <div className="adv-ov-row" onClick={() => onNavigate?.("repayments")} style={{ cursor: "pointer" }}>
              <div className="adv-ov-icon" style={{ background: iconBg, color: iconColor }}>
                <Wallet size={22} />
              </div>
              <div className="adv-ov-info">
                <div className="adv-ov-amount">
                  Advance of {formatMoney(currentRequest.approvedAmount || currentRequest.requestedAmount)}
                </div>
                <div className="adv-ov-meta">
                  <span className={`chip ${chipClass}`} style={{ fontSize: 11 }}>
                    <span className="chip-dot" />{statusLabel}
                  </span>
                </div>
                <div className="adv-ov-date">
                  {formatFullDate(currentRequest.requestDate)}
                </div>
              </div>
              <ChevronRight size={16} color="#9CA3AF" />
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: "#F3F1FF" }} />

            {/* Stats row */}
            <div className="adv-ov-stats">
              <div className="adv-ov-stat">
                <div className="adv-ov-stat-label">You Received</div>
                <div className="adv-ov-stat-val">{formatMoney(currentRequest.principalAmount || currentRequest.approvedAmount || currentRequest.requestedAmount)}</div>
              </div>
              <div className="adv-ov-stat-sep" />
              <div className="adv-ov-stat">
                <div className="adv-ov-stat-label">Repayment on</div>
                <div className="adv-ov-stat-val" style={{ fontWeight: 800 }}>{formatFullDate(currentRequest.recoveryDate)}</div>
              </div>
              <div className="adv-ov-stat-sep" />
              <div className="adv-ov-stat">
                <div className="adv-ov-stat-label">Total Repayment</div>
                <div className="adv-ov-stat-val" style={{ color: "var(--P)" }}>
                  {formatMoney(currentRequest.totalRecoveryAmount)}
                </div>
                {!isPaid && (
                  <span className="chip chip-green" style={{ fontSize: 10, marginTop: 3 }}>
                    <span className="chip-dot" /> On Payday
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Why salary advances */}
          <div className="adv-why-card">
            <div className="adv-why-body">
              <div className="adv-why-title">Why salary advances?</div>
              <div className="adv-why-sub">Access your earned salary anytime and manage your finances better.</div>
            </div>
            <div className="adv-why-illus">💰</div>
          </div>

          {/* Refer & Earn */}
          <div className="adv-refer-card">
            <div className="adv-refer-icon">🎁</div>
            <div className="adv-refer-body">
              <div className="adv-refer-title">Refer &amp; Earn Rewards!</div>
              <div className="adv-refer-sub">Refer your friends and earn exciting rewards on every successful referral.</div>
            </div>
            <button type="button" className="adv-refer-btn">
              <Gift size={14} /> Refer Now <ArrowRight size={13} />
            </button>
          </div>

        </div>
      </div>
    );
  }

  // ── Setup required (not eligible, no active) ──────────────
  if (!eligible) {
    const blockerReasons = [
      { label: "KYC Verification", done: nextBlocker !== "Complete KYC" && nextBlocker !== "Verify KYC" && nextBlocker !== "KYC under review" },
      { label: "Bank Account", done: nextBlocker !== "Add bank account" && nextBlocker !== "Bank verification pending" },
      { label: "Activate Membership", done: nextBlocker !== "Activate plan" && nextBlocker !== "Activate membership" },
    ];
    return (
      <div className="adv-screen">
        <div className="screen-body">
          <div className="adv-blocked-hero">
            <div className="adv-blocked-icon-wrap"><Wallet size={32} /></div>
            <div className="adv-blocked-badge" style={{ background: "#FEF3C7", color: "#D97706" }}>Setup Required</div>
            <div className="adv-blocked-title">Complete setup to access advances</div>
            <div className="adv-blocked-sub">{nextBlocker || "Please complete all required steps below."}</div>
          </div>
          <div className="adv-step-card">
            <div className="adv-step-hdr">Required steps</div>
            {blockerReasons.map((r, i) => (
              <div key={r.label} className="adv-step-row">
                <div className={`adv-step-num ${r.done ? "done" : ""}`}>
                  {r.done ? <CheckCircle size={14} /> : i + 1}
                </div>
                <div className="adv-step-body">
                  <div className="adv-step-title">{r.label}</div>
                  <div className="adv-step-sub">{r.done ? "Completed" : "Action required"}</div>
                </div>
                {r.done && <BadgeCheck size={16} color="#16A34A" />}
              </div>
            ))}
          </div>
          <div style={{ padding: "0 16px 16px" }}>
            <button type="button" className="mp-btn-primary" onClick={onResolveBlocker}>
              {blockerActionLabel || "Complete Setup"} <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Success screen ────────────────────────────────────────
  if (step === "success") {
    return (
      <div className="adv-success-screen">
        <div className="adv-success-topbar">
          <div className="adv-success-topbar-left">
            <img src="/logo-icon.svg" alt="MobPae" width="22" height="14" style={{ objectFit: "contain" }} />
            MobPae
          </div>
          <div className="adv-success-topbar-right">
            <ShieldCheck size={14} /> Secured
          </div>
        </div>
        <div className="adv-success-body">
          <div className="adv-success-check"><CheckCircle size={40} /></div>
          <div className="adv-success-title">Advance Requested! 🎉</div>
          <div className="adv-success-sub">
            Your salary advance request has been submitted and is under review.
            Funds will be credited to your bank account once approved.
          </div>
          <div className="adv-success-amount-card">
            <div className="adv-success-amount-label">Amount Requested</div>
            <div className="adv-success-amount-val">{formatMoney(amount)}</div>
            {preview && (
              <div className="adv-success-bank-row">
                <div className="adv-success-bank-col">
                  <div className="adv-success-bank-lbl">You receive</div>
                  <div className="adv-success-bank-val">{formatMoney(preview.youReceive)}</div>
                </div>
                <div className="adv-success-bank-col">
                  <div className="adv-success-bank-lbl">Interest</div>
                  <div className="adv-success-bank-val">{formatMoney(preview.interest)}</div>
                </div>
                <div className="adv-success-bank-col">
                  <div className="adv-success-bank-lbl">Repay on</div>
                  <div className="adv-success-bank-val">{formatShortDate(preview.recoveryDate)}</div>
                </div>
              </div>
            )}
          </div>
          <div className="adv-repayment-list">
            <div className="adv-repayment-list-hdr">What happens next?</div>
            {[
              { icon: <Clock size={16} />, title: "Employer review", sub: "Your employer will review and approve" },
              { icon: <BadgeCheck size={16} />, title: "Admin approval", sub: "MobPae team gives final approval" },
              { icon: <CreditCard size={16} />, title: "Funds credited", sub: "Amount sent to your bank account" },
              { icon: <CalendarDays size={16} />, title: "Auto repayment", sub: preview ? `Recovered on ${formatShortDate(preview.recoveryDate)}` : "Recovered on your next payday" },
            ].map((item) => (
              <div key={item.title} className="adv-repayment-list-row">
                <div className="adv-repayment-list-icon">{item.icon}</div>
                <div className="adv-repayment-list-body">
                  <div className="adv-repayment-list-title">{item.title}</div>
                  <div className="adv-repayment-list-sub">{item.sub}</div>
                </div>
                <CheckCircle size={14} color="#16A34A" />
              </div>
            ))}
          </div>
          <div className="adv-thankyou-card">
            <div className="adv-thankyou-icon">✨</div>
            <div className="adv-thankyou-text">Thank you for using MobPae! Track your advance status in the History tab.</div>
          </div>
        </div>
        <div className="adv-success-footer">
          <button type="button" className="mp-btn-primary" onClick={() => setStep("calculator")}>Done</button>
        </div>
      </div>
    );
  }

  // ── Review screen ─────────────────────────────────────────
  if (step === "review") {
    const canConfirm = agree1 && agree2 && !submitting;
    return (
      <div className="adv-review-screen">
        <div className="mp-topbar">
          <button type="button" className="mp-topbar-back" onClick={() => setStep("calculator")}>
            ← Back
          </button>
          <div className="mp-topbar-logo">
            <span className="mp-topbar-logo-text" style={{ fontSize: 15 }}>Review Request</span>
          </div>
          <div style={{ width: 60 }} />
        </div>
        <div className="screen-body adv-review-body">
          <div className="adv-summary-card">
            <div className="adv-summary-hdr">
              <div className="adv-summary-icon"><IndianRupee size={18} /></div>
              <div className="adv-summary-title">Advance Summary</div>
            </div>
            <div className="adv-review-row">
              <span className="adv-review-lbl">Requested amount</span>
              <span className="adv-review-val">{formatMoney(amount)}</span>
            </div>
            {preview && (
              <>
                <div className="adv-review-row">
                  <span className="adv-review-lbl">Processing fee</span>
                  <span className="adv-review-val">{formatMoney(preview.processingFee)}</span>
                </div>
                <div className="adv-review-row">
                  <span className="adv-review-lbl">Interest ({preview.interestDays} days{preview.interestRate ? ` @ ${preview.interestRate}% p.a.` : ""})</span>
                  <span className="adv-review-val">{formatMoney(preview.interest)}</span>
                </div>
                <div className="adv-review-row">
                  <span className="adv-review-lbl">You will receive</span>
                  <span className="adv-review-val" style={{ color: "#16A34A", fontWeight: 800 }}>{formatMoney(preview.youReceive)}</span>
                </div>
                <div className="adv-review-row">
                  <span className="adv-review-lbl">Repayment date</span>
                  <span className="adv-review-val">{formatShortDate(preview.recoveryDate)}</span>
                </div>
              </>
            )}
            <div className="adv-review-total">
              <span className="adv-review-total-lbl">Total repayment</span>
              <span className="adv-review-total-val">{preview ? formatMoney(preview.total) : formatMoney(amount)}</span>
            </div>
          </div>
          {preview && (
            <div className="adv-important-note">
              <div className="adv-important-note-row">
                <CheckCircle size={16} color="#16A34A" />
                <div className="adv-important-note-title">How this works</div>
              </div>
              <div className="adv-flow-row">
                <div className="adv-flow-col">
                  <div className="adv-flow-when">Today</div>
                  <div className="adv-flow-action">You request</div>
                  <div className="adv-flow-amt">{formatMoney(amount)}</div>
                </div>
                <div className="adv-flow-arrow">→</div>
                <div className="adv-flow-col">
                  <div className="adv-flow-when">After approval</div>
                  <div className="adv-flow-action">Receive</div>
                  <div className="adv-flow-amt">{formatMoney(preview.youReceive)}</div>
                </div>
                <div className="adv-flow-arrow">→</div>
                <div className="adv-flow-col">
                  <div className="adv-flow-when">{formatShortDate(preview.recoveryDate)}</div>
                  <div className="adv-flow-action">Repay</div>
                  <div className="adv-flow-amt">{formatMoney(preview.total)}</div>
                </div>
              </div>
            </div>
          )}
          <div className="adv-agree-box">
            <div className="adv-agree-title">Please confirm</div>
            <label className="adv-agree-item" style={{ display: "flex", cursor: "pointer" }}>
              <input type="checkbox" checked={agree1} onChange={e => setAgree1(e.target.checked)} style={{ marginTop: 2, accentColor: "#5B3CE3", width: 16, height: 16, flexShrink: 0 }} />
              <span className="adv-agree-text" style={{ marginLeft: 8 }}>
                I agree to the <a href="#terms">Terms &amp; Conditions</a> and understand that {preview ? formatMoney(preview.total) : "the full amount"} will be deducted from my salary on the due date.
              </span>
            </label>
            <label className="adv-agree-item" style={{ display: "flex", cursor: "pointer" }}>
              <input type="checkbox" checked={agree2} onChange={e => setAgree2(e.target.checked)} style={{ marginTop: 2, accentColor: "#5B3CE3", width: 16, height: 16, flexShrink: 0 }} />
              <span className="adv-agree-text" style={{ marginLeft: 8 }}>I authorize MobPae and my employer to recover the repayment amount from my salary.</span>
            </label>
          </div>
          <div className="mp-bottom-space" />
        </div>
        <div className="adv-sticky-btn">
          <button type="button" className="mp-btn-primary" disabled={!canConfirm} onClick={async () => { await onSubmit(); setStep("success"); }}>
            {submitting ? <span className="mp-spinner" /> : <>Confirm Advance <ArrowRight size={16} /></>}
          </button>
          <div className="adv-secure-note"><ShieldCheck size={12} /> 256-bit SSL encrypted</div>
        </div>
      </div>
    );
  }

  // ── Calculator ────────────────────────────────────────────
  return (
    <div className="adv-screen">
      <div className="screen-body adv-page-body">

        {/* Salary info card */}
        <div className="adv-salary-card">
          <div className="adv-salary-left">
            <div className="adv-salary-icon"><Wallet size={20} /></div>
            <div className="adv-salary-label">Monthly Salary</div>
            <div className="adv-salary-amount">{limit > 0 ? formatMoney(limit / 0.5) : "—"}</div>
            <div className="adv-salary-updated"><RefreshCw size={10} /> Updated today</div>
          </div>
          <div className="adv-salary-right">
            <div>
              <div className="adv-avail-label">Available for Advance</div>
              <div className="adv-avail-amount">{formatMoney(limit)}</div>
              <span className="chip chip-green"><span className="chip-dot" /> Active</span>
            </div>
          </div>
        </div>

        {/* Amount slider */}
        <div className="adv-slider-card">
          <div className="adv-slider-title">How much do you need?</div>
          <div className="adv-slider-sub">Select an amount up to {formatMoney(limit)}</div>
          <div className="adv-slider-amount">{formatMoney(amount)}</div>
          <input type="range" className="adv-range" min={MIN_AMOUNT} max={limit} step={500} value={amount} onChange={e => onAmountChange(Number(e.target.value))} />
          <div className="adv-range-labels">
            <span className="adv-range-lbl">{formatMoney(MIN_AMOUNT)}</span>
            <span className="adv-range-lbl">{formatMoney(limit)}</span>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 12 }}>
            {[Math.round(limit * 0.25 / 500) * 500, Math.round(limit * 0.5 / 500) * 500, Math.round(limit * 0.75 / 500) * 500, limit]
              .filter(v => v >= MIN_AMOUNT)
              .map(v => (
                <button key={v} type="button" onClick={() => onAmountChange(v)} style={{ padding: "6px 12px", borderRadius: 99, background: amount === v ? "#5B3CE3" : "#F4F3FF", color: amount === v ? "white" : "#5B3CE3", border: "1.5px solid", borderColor: amount === v ? "#5B3CE3" : "#C4BBFF", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                  {formatMoney(v)}
                </button>
              ))}
          </div>
        </div>

        {/* Interest & details */}
        <div className="adv-detail-card">
          <div className="adv-detail-hdr">
            <span className="adv-detail-hdr-title">Advance details</span>
            {previewLoading && <RefreshCw size={14} color="#9CA3AF" className="spin" />}
          </div>
          <div className="adv-detail-grid">
            <div className="adv-detail-item">
              <div className="adv-detail-item-label"><IndianRupee size={12} /> You receive</div>
              <div className="adv-detail-item-val purple">{preview ? formatMoney(preview.youReceive) : "—"}</div>
            </div>
            <div className="adv-detail-item">
              <div className="adv-detail-item-label"><Info size={12} /> Interest</div>
              <div className="adv-detail-item-val">{preview ? formatMoney(preview.interest) : "—"}</div>
            </div>
            <div className="adv-detail-item">
              <div className="adv-detail-item-label"><CalendarDays size={12} /> Repay on</div>
              <div className="adv-detail-item-val">{preview ? formatShortDate(preview.recoveryDate) : "—"}</div>
            </div>
            <div className="adv-detail-item">
              <div className="adv-detail-item-label"><CreditCard size={12} /> Total repayment</div>
              <div className="adv-detail-item-val">{preview ? formatMoney(preview.total) : "—"}</div>
            </div>
          </div>
          {preview && (
            <div className="adv-hiw-box">
              <div className="adv-hiw-label">How it works</div>
              <div className="adv-hiw-row">
                <div className="adv-hiw-col">
                  <div className="adv-hiw-when">Today</div>
                  <div className="adv-hiw-action">You request</div>
                  <div className="adv-hiw-amt">{formatMoney(amount)}</div>
                </div>
                <div className="adv-hiw-arrow">→</div>
                <div className="adv-hiw-col">
                  <div className="adv-hiw-when">After approval</div>
                  <div className="adv-hiw-action">Receive</div>
                  <div className="adv-hiw-amt">{formatMoney(preview.youReceive)}</div>
                </div>
                <div className="adv-hiw-arrow">→</div>
                <div className="adv-hiw-col">
                  <div className="adv-hiw-when">{formatShortDate(preview.recoveryDate)}</div>
                  <div className="adv-hiw-action">Repay</div>
                  <div className="adv-hiw-amt">{formatMoney(preview.total)}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Feature highlights */}
        <div className="adv-features">
          {[
            { icon: <CheckCircle size={16} />, label: "Zero hidden", sub: "fees" },
            { icon: <CheckCircle size={16} />, label: "Instant", sub: "approval" },
            { icon: <CheckCircle size={16} />, label: "Flexible", sub: "amounts" },
            { icon: <CheckCircle size={16} />, label: "Auto", sub: "repayment" },
            { icon: <CheckCircle size={16} />, label: "Secure", sub: "transfer" },
            { icon: <CheckCircle size={16} />, label: "No credit", sub: "score check" },
          ].map((f) => (
            <div key={f.label} className="adv-feature-item">
              <div className="adv-feature-icon">{f.icon}</div>
              <div className="adv-feature-label">{f.label}</div>
              <div className="adv-feature-sub">{f.sub}</div>
            </div>
          ))}
        </div>

        <div className="mp-bottom-space" />
      </div>

      <div className="adv-sticky-btn">
        <button type="button" className="mp-btn-primary" disabled={!canSubmit} onClick={() => setStep("review")}>
          Continue <ArrowRight size={16} />
        </button>
        <div className="adv-secure-note"><ShieldCheck size={12} /> Your request is encrypted and secure</div>
      </div>
    </div>
  );
}
