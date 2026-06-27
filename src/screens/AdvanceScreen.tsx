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
import {
  formatFullDate,
  formatMoney,
  formatRequestStatus,
  formatShortDate,
} from "../utils/format";
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
  kycComplete: boolean;
  bankComplete: boolean;
  membershipActive: boolean;
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
  kycComplete,
  bankComplete,
  membershipActive,
  onAmountChange,
  onSubmit,
  blockerActionLabel,
  onResolveBlocker,
  onNavigate,
}: AdvanceScreenProps) {
  const [step, setStep] = useState<"calculator" | "review" | "success">(
    "calculator"
  );
  const [agree1, setAgree1] = useState(false);
  const [agree2, setAgree2] = useState(false);

  const hasActive = Boolean(
    currentRequest &&
      !["Paid", "Recovered", "Rejected"].includes(currentRequest.status)
  );
  const canSubmit =
    eligible &&
    !hasActive &&
    amount >= MIN_AMOUNT &&
    amount <= limit &&
    !previewLoading;

  const nextPayday = nextPaydayDate(payrollDay);
  const salary = salaryInHand ?? 0;
  const sliderMax = Math.max(limit, MIN_AMOUNT);
  const quickAmounts = Array.from(
    new Set(
      [0.25, 0.5, 0.75, 1]
        .map((ratio) => Math.round((limit * ratio) / 500) * 500)
        .filter((value) => value >= MIN_AMOUNT && value <= limit)
    )
  );

  // Show net salary only for the month the recovery actually hits
  const recoveryDate =
    hasActive && currentRequest?.recoveryDate
      ? new Date(currentRequest.recoveryDate)
      : null;
  const today = new Date();
  const recoveryIsThisMonth =
    recoveryDate &&
    recoveryDate.getMonth() === today.getMonth() &&
    recoveryDate.getFullYear() === today.getFullYear();
  const activeRecovery =
    hasActive &&
    currentRequest?.disbursalStatus === "Disbursed" &&
    recoveryIsThisMonth
      ? currentRequest.totalRecoveryAmount || 0
      : 0;
  const salaryThisMonth = Math.max(0, salary - activeRecovery);
  // Sub-label for the hero card
  const recoveryMonthName = recoveryDate
    ? recoveryDate.toLocaleDateString("en-IN", { month: "long" })
    : null;
  const salarySubLabel =
    hasActive && currentRequest?.disbursalStatus === "Disbursed" && recoveryDate
      ? recoveryIsThisMonth
        ? `After −${formatMoney(
            currentRequest.totalRecoveryAmount || 0
          )} deduction`
        : `Full pay · deduction in ${recoveryMonthName}`
      : "Updated just now";

  // ── Active advance overview (matches mockup) ──────────────
  if (hasActive && currentRequest) {
    const isPaid = currentRequest.recoveryStatus === "Completed";
    const statusLabel = isPaid
      ? "Repaid"
      : formatRequestStatus(currentRequest.status, currentRequest.statusLabel);
    const principal =
      currentRequest.principalAmount ||
      currentRequest.approvedAmount ||
      currentRequest.requestedAmount;
    const totalRepayment =
      currentRequest.totalRecoveryAmount ||
      principal + (currentRequest.interestAmount || 0);
    const interest =
      currentRequest.interestAmount || Math.max(0, totalRepayment - principal);
    const interestDays =
      currentRequest.interestDays ||
      (currentRequest.recoveryDate
        ? Math.max(
            1,
            Math.ceil(
              (new Date(currentRequest.recoveryDate).getTime() -
                new Date(currentRequest.requestDate).getTime()) /
                86_400_000
            )
          )
        : 0);
    const monthlyRate =
      principal > 0 && interestDays > 0
        ? (interest / principal / (interestDays / 30)) * 100
        : null;
    const rateLabel = monthlyRate
      ? `${monthlyRate.toFixed(1)}% flat / month`
      : "Flat interest";
    const scheduleDate = formatShortDate(
      currentRequest.recoveryDate ||
        currentRequest.disbursalDate ||
        currentRequest.requestDate
    );
    const advanceHeadline =
      currentRequest.disbursalStatus === "Disbursed" ? "Credited" : "Advance";

    return (
      <div className="adv-screen">
        <div className="screen-body adv-active-body">
          <button
            type="button"
            className="adv-active-card"
            onClick={() => onNavigate?.("repayments")}
          >
            <div className="adv-active-main">
              <div className="adv-active-icon">
                <CreditCard size={20} />
              </div>
              <div className="adv-active-info">
                <strong>
                  {advanceHeadline} {formatMoney(principal)}
                </strong>
                <small className="adv-active-subline">
                  {statusLabel} - {scheduleDate}
                </small>
              </div>
              <ChevronRight size={22} />
            </div>

            <div className="adv-active-stats">
              <div>
                <span>Received</span>
                <strong>{formatMoney(principal)}</strong>
              </div>
              <div>
                <span>Due by</span>
                <strong>{formatFullDate(currentRequest.recoveryDate)}</strong>
              </div>
              <div>
                <span>Amount</span>
                <strong className="purple">
                  {formatMoney(totalRepayment)}
                </strong>
                {!isPaid && (
                  <span className="adv-on-payday">
                    <span /> On payday
                  </span>
                )}
              </div>
            </div>
          </button>

          <div className="adv-calc-head">
            <h2>How we calculate</h2>
            <span>{rateLabel}</span>
          </div>

          <div className="adv-calc-list">
            <div className="adv-calc-row">
              <span className="adv-calc-icon">1</span>
              <div>
                <strong>Advance amount</strong>
                <small>Principal you receive</small>
              </div>
              <b>{formatMoney(principal)}</b>
            </div>
            <div className="adv-calc-row">
              <span className="adv-calc-icon adv-calc-icon--warm">+</span>
              <div>
                <strong>Interest</strong>
                <small>
                  {formatMoney(principal)} ×{" "}
                  {monthlyRate ? `${monthlyRate.toFixed(1)}%` : "rate"} ×{" "}
                  {interestDays || "—"} days
                </small>
              </div>
              <b className="orange">{formatMoney(interest)}</b>
            </div>
            <div className="adv-calc-total">
              <span className="adv-calc-check">✓</span>
              <div>
                <strong>Total repayable</strong>
                <small>Auto-deducted on payday</small>
              </div>
              <b>{formatMoney(totalRepayment)}</b>
            </div>
          </div>

          <div className="adv-refer-card">
            <div className="adv-refer-icon">🎁</div>
            <div className="adv-refer-body">
              <div className="adv-refer-title">Refer &amp; Earn Rewards</div>
              <div className="adv-refer-sub">
                Earn rewards on every successful referral.
              </div>
            </div>
            <button type="button" className="adv-refer-btn">
              Refer <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Setup required (not eligible, no active) ──────────────
  if (!eligible) {
    const blockerReasons = [
      { label: "KYC Verification", done: kycComplete },
      { label: "Bank Account", done: bankComplete },
      { label: "Activate Membership", done: membershipActive },
    ];
    return (
      <div className="adv-screen">
        <div className="screen-body">
          <div className="adv-blocked-hero">
            <div className="adv-blocked-icon-wrap">
              <Wallet size={32} />
            </div>
            <div
              className="adv-blocked-badge"
              style={{ background: "#FEF3C7", color: "#D97706" }}
            >
              Setup Required
            </div>
            <div className="adv-blocked-title">
              Complete setup to access advances
            </div>
            <div className="adv-blocked-sub">
              {nextBlocker || "Please complete all required steps below."}
            </div>
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
                  <div className="adv-step-sub">
                    {r.done ? "Completed" : "Action required"}
                  </div>
                </div>
                {r.done && <BadgeCheck size={16} color="#16A34A" />}
              </div>
            ))}
          </div>
          <div style={{ padding: "0 16px 16px" }}>
            <button
              type="button"
              className="mp-btn-primary"
              onClick={onResolveBlocker}
            >
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
            <img
              src="/logo-icon.svg"
              alt="MobPae"
              width="22"
              height="14"
              style={{ objectFit: "contain" }}
            />
            MobPae
          </div>
          <div className="adv-success-topbar-right">
            <ShieldCheck size={14} /> Secured
          </div>
        </div>
        <div className="adv-success-body">
          <div className="adv-success-check">
            <CheckCircle size={40} />
          </div>
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
                  <div className="adv-success-bank-val">
                    {formatMoney(preview.youReceive)}
                  </div>
                </div>
                <div className="adv-success-bank-col">
                  <div className="adv-success-bank-lbl">Interest</div>
                  <div className="adv-success-bank-val">
                    {formatMoney(preview.interest)}
                  </div>
                </div>
                <div className="adv-success-bank-col">
                  <div className="adv-success-bank-lbl">Repay on</div>
                  <div className="adv-success-bank-val">
                    {formatShortDate(preview.recoveryDate)}
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="adv-repayment-list">
            <div className="adv-repayment-list-hdr">What happens next?</div>
            {[
              {
                icon: <Clock size={16} />,
                title: "Employer review",
                sub: "Your employer will review and approve",
              },
              {
                icon: <BadgeCheck size={16} />,
                title: "Admin approval",
                sub: "MobPae team gives final approval",
              },
              {
                icon: <CreditCard size={16} />,
                title: "Funds credited",
                sub: "Amount sent to your bank account",
              },
              {
                icon: <CalendarDays size={16} />,
                title: "Auto repayment",
                sub: preview
                  ? `Recovered on ${formatShortDate(preview.recoveryDate)}`
                  : "Recovered on your next payday",
              },
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
            <div className="adv-thankyou-text">
              Thank you for using MobPae! Track your advance status in the
              History tab.
            </div>
          </div>
        </div>
        <div className="adv-success-footer">
          <button
            type="button"
            className="mp-btn-primary"
            onClick={() => setStep("calculator")}
          >
            Done
          </button>
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
          <button
            type="button"
            className="mp-topbar-back"
            onClick={() => setStep("calculator")}
          >
            ← Back
          </button>
          <div className="mp-topbar-logo">
            <span className="mp-topbar-logo-text" style={{ fontSize: 15 }}>
              Review Request
            </span>
          </div>
          <div style={{ width: 60 }} />
        </div>
        <div className="screen-body adv-review-body">
          <div className="adv-summary-card">
            <div className="adv-summary-hdr">
              <div className="adv-summary-icon">
                <IndianRupee size={18} />
              </div>
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
                  <span className="adv-review-val">
                    {formatMoney(preview.processingFee)}
                  </span>
                </div>
                <div className="adv-review-row">
                  <span className="adv-review-lbl">
                    Interest ({preview.interestDays} days
                    {preview.interestRate
                      ? ` @ ${preview.interestRate}% p.a.`
                      : ""}
                    )
                  </span>
                  <span className="adv-review-val">
                    {formatMoney(preview.interest)}
                  </span>
                </div>
                <div className="adv-review-row">
                  <span className="adv-review-lbl">You will receive</span>
                  <span
                    className="adv-review-val"
                    style={{ color: "#16A34A", fontWeight: 800 }}
                  >
                    {formatMoney(preview.youReceive)}
                  </span>
                </div>
                <div className="adv-review-row">
                  <span className="adv-review-lbl">Repayment date</span>
                  <span className="adv-review-val">
                    {formatShortDate(preview.recoveryDate)}
                  </span>
                </div>
              </>
            )}
            <div className="adv-review-total">
              <span className="adv-review-total-lbl">Total repayment</span>
              <span className="adv-review-total-val">
                {preview ? formatMoney(preview.total) : formatMoney(amount)}
              </span>
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
                  <div className="adv-flow-amt">
                    {formatMoney(preview.youReceive)}
                  </div>
                </div>
                <div className="adv-flow-arrow">→</div>
                <div className="adv-flow-col">
                  <div className="adv-flow-when">
                    {formatShortDate(preview.recoveryDate)}
                  </div>
                  <div className="adv-flow-action">Repay</div>
                  <div className="adv-flow-amt">
                    {formatMoney(preview.total)}
                  </div>
                </div>
              </div>
            </div>
          )}
          <div className="adv-agree-box">
            <div className="adv-agree-title">Please confirm</div>
            <label
              className="adv-agree-item"
              style={{ display: "flex", cursor: "pointer" }}
            >
              <input
                type="checkbox"
                checked={agree1}
                onChange={(e) => setAgree1(e.target.checked)}
                style={{
                  marginTop: 2,
                  accentColor: "#5B3CE3",
                  width: 16,
                  height: 16,
                  flexShrink: 0,
                }}
              />
              <span className="adv-agree-text" style={{ marginLeft: 8 }}>
                I agree to the <a href="#terms">Terms &amp; Conditions</a> and
                understand that{" "}
                {preview ? formatMoney(preview.total) : "the full amount"} will
                be deducted from my salary on the due date.
              </span>
            </label>
            <label
              className="adv-agree-item"
              style={{ display: "flex", cursor: "pointer" }}
            >
              <input
                type="checkbox"
                checked={agree2}
                onChange={(e) => setAgree2(e.target.checked)}
                style={{
                  marginTop: 2,
                  accentColor: "#5B3CE3",
                  width: 16,
                  height: 16,
                  flexShrink: 0,
                }}
              />
              <span className="adv-agree-text" style={{ marginLeft: 8 }}>
                I authorize MobPae and my employer to recover the repayment
                amount from my salary.
              </span>
            </label>
          </div>
          <div className="mp-bottom-space" />
        </div>
        <div className="adv-sticky-btn">
          <button
            type="button"
            className="mp-btn-primary"
            disabled={!canConfirm}
            onClick={async () => {
              await onSubmit();
              setStep("success");
            }}
          >
            {submitting ? (
              <span className="mp-spinner" />
            ) : (
              <>
                Confirm Advance <ArrowRight size={16} />
              </>
            )}
          </button>
          <div className="adv-secure-note">
            <ShieldCheck size={12} /> 256-bit SSL encrypted
          </div>
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
            <div className="adv-salary-icon">
              <Wallet size={20} />
            </div>
            <div className="adv-salary-label">Monthly Salary</div>
            <div className="adv-salary-amount">
              {salary > 0 ? formatMoney(salary) : "—"}
            </div>
            <div className="adv-salary-updated">
              <RefreshCw size={10} /> Updated today
            </div>
          </div>
          <div className="adv-salary-right">
            <div>
              <div className="adv-avail-label">Available for Advance</div>
              <div className="adv-avail-amount">{formatMoney(limit)}</div>
              <span className="chip chip-green">
                <span className="chip-dot" /> Active
              </span>
            </div>
          </div>
        </div>

        {/* Amount slider */}
        <div className="adv-slider-card">
          <div className="adv-slider-title">How much do you need?</div>
          <div className="adv-slider-sub">
            Select an amount up to {formatMoney(limit)}
          </div>
          <div className="adv-slider-amount">{formatMoney(amount)}</div>
          <input
            type="range"
            className="adv-range"
            min={MIN_AMOUNT}
            max={sliderMax}
            step={500}
            value={Math.min(amount, sliderMax)}
            disabled={limit < MIN_AMOUNT}
            onChange={(e) => onAmountChange(Number(e.target.value))}
          />
          <div className="adv-range-labels">
            <span className="adv-range-lbl">{formatMoney(MIN_AMOUNT)}</span>
            <span className="adv-range-lbl">{formatMoney(limit)}</span>
          </div>
          <div
            style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 12 }}
          >
            {quickAmounts.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => onAmountChange(v)}
                style={{
                  padding: "6px 12px",
                  borderRadius: 99,
                  background: amount === v ? "#5B3CE3" : "#F4F3FF",
                  color: amount === v ? "white" : "#5B3CE3",
                  border: "1.5px solid",
                  borderColor: amount === v ? "#5B3CE3" : "#C4BBFF",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                {formatMoney(v)}
              </button>
            ))}
          </div>
        </div>

        {/* Interest & details */}
        <div className="adv-detail-card">
          <div className="adv-detail-hdr">
            <span className="adv-detail-hdr-title">Advance details</span>
            {previewLoading && (
              <RefreshCw size={14} color="#9CA3AF" className="spin" />
            )}
          </div>
          <div className="adv-detail-grid">
            <div className="adv-detail-item">
              <div className="adv-detail-item-label">
                <IndianRupee size={12} /> Amount
              </div>
              <div className="adv-detail-item-val purple">
                {preview ? formatMoney(preview.youReceive) : "—"}
              </div>
            </div>
            <div className="adv-detail-item">
              <div className="adv-detail-item-label">
                <Clock size={12} /> Tenure
              </div>
              <div className="adv-detail-item-val">
                {preview ? `${preview.interestDays} days` : "—"}
              </div>
            </div>
            <div className="adv-detail-item">
              <div className="adv-detail-item-label">
                <Info size={12} /> Interest
              </div>
              <div className="adv-detail-item-val">
                {preview ? formatMoney(preview.interest) : "—"}
              </div>
            </div>
            <div className="adv-detail-item">
              <div className="adv-detail-item-label">
                <CreditCard size={12} /> Total payment
              </div>
              <div className="adv-detail-item-val">
                {preview ? formatMoney(preview.total) : "—"}
              </div>
            </div>
          </div>
          <div className="adv-payment-date-row">
            <div>
              <span>Payment scheduled</span>
              <strong>
                {preview ? formatShortDate(preview.recoveryDate) : "—"}
              </strong>
            </div>
            <CalendarDays size={18} />
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
                  <div className="adv-hiw-amt">
                    {formatMoney(preview.youReceive)}
                  </div>
                </div>
                <div className="adv-hiw-arrow">→</div>
                <div className="adv-hiw-col">
                  <div className="adv-hiw-when">
                    {formatShortDate(preview.recoveryDate)}
                  </div>
                  <div className="adv-hiw-action">Repay</div>
                  <div className="adv-hiw-amt">
                    {formatMoney(preview.total)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Feature highlights */}
        <div className="adv-features">
          {[
            {
              icon: <CheckCircle size={16} />,
              label: "Zero hidden",
              sub: "fees",
            },
            {
              icon: <CheckCircle size={16} />,
              label: "Instant",
              sub: "approval",
            },
            {
              icon: <CheckCircle size={16} />,
              label: "Flexible",
              sub: "amounts",
            },
            {
              icon: <CheckCircle size={16} />,
              label: "Auto",
              sub: "repayment",
            },
            {
              icon: <CheckCircle size={16} />,
              label: "Secure",
              sub: "transfer",
            },
            {
              icon: <CheckCircle size={16} />,
              label: "No credit",
              sub: "score check",
            },
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
        <button
          type="button"
          className="mp-btn-primary"
          disabled={!canSubmit}
          onClick={() => setStep("review")}
        >
          Continue <ArrowRight size={16} />
        </button>
        <div className="adv-secure-note">
          <ShieldCheck size={12} /> Your request is encrypted and secure
        </div>
      </div>
    </div>
  );
}
