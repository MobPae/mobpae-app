import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  CheckCircle,
  ChevronRight,
  Clock,
  CreditCard,
  IndianRupee,
  RefreshCw,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { useState } from "react";
import {
  formatReadableDate,
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
  kycSubmitted: boolean;
  bankComplete: boolean;
  bankSubmitted: boolean;
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

function formatBackendMoney(value?: number | null) {
  return value && value > 0 ? formatMoney(value) : "—";
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
  kycSubmitted,
  bankComplete,
  bankSubmitted,
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
  const [showBreakdown, setShowBreakdown] = useState(false);

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
  const setupSteps = [
    { label: "KYC Verification", done: kycComplete, submitted: kycSubmitted, view: "onboarding-kyc" as View },
    { label: "Bank Account", done: bankComplete, submitted: bankSubmitted, view: "onboarding-bank" as View },
  ].map((step) => {
    if (step.done) return { ...step, status: "Completed", tone: "done" };
    if (step.submitted) return { ...step, status: "Completed · Pending review", tone: "review" };
    return { ...step, status: "Action required", tone: "todo" };
  });
  const hasMissingSetupAction = setupSteps.some((setupStep) => setupStep.tone === "todo");
  const isWaitingForSetupReview = !eligible && !hasMissingSetupAction;

  // ── Active advance overview ───────────────────────────────
  if (hasActive && currentRequest) {
    const isPaid = currentRequest.recoveryStatus === "Completed";
    const statusLabel = isPaid
      ? "Repaid"
      : formatRequestStatus(currentRequest.status, currentRequest.statusLabel);
    const principal = currentRequest.principalAmount;
    const totalRepayment = currentRequest.totalRecoveryAmount;
    const interest = currentRequest.interestAmount;
    const interestDays = currentRequest.interestDays;
    const interestRate = currentRequest.interestRate;
    const rateLabel = interestRate
      ? `${interestRate}% p.a.`
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

          {/* ── Inline advance overview (no card) ── */}
          <div className="adv-inline-hero">
            <div className="adv-inline-top">
              <div className="adv-inline-eyebrow">{advanceHeadline}</div>
              <span className={isPaid ? "chip chip-green" : "chip chip-amber"}>{statusLabel}</span>
            </div>
            <div className="adv-inline-amount">{formatBackendMoney(principal)}</div>
            <button
              type="button"
              className="adv-inline-link"
              onClick={() => onNavigate?.("repayments")}
            >
              View repayment schedule <ChevronRight size={13} />
            </button>
            <div className="adv-inline-divider" />
            <div className="adv-inline-stats">
              <div className="adv-inline-stat">
                <span>Requested</span>
                <strong>{formatReadableDate(currentRequest.requestDate)}</strong>
              </div>
              <div className="adv-inline-stat">
                <span>Due by</span>
                <strong>{scheduleDate}</strong>
              </div>
              <div className="adv-inline-stat">
                <span>Total payable</span>
                <strong className="amber">{formatBackendMoney(totalRepayment)}</strong>
              </div>
            </div>
          </div>

          {/* ── Breakdown ── */}
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
              <b>{formatBackendMoney(principal)}</b>
            </div>
            <div className="adv-calc-row">
              <span className="adv-calc-icon adv-calc-icon--warm">+</span>
              <div>
                <strong>Interest</strong>
                <small>{formatBackendMoney(principal)} × {interestRate ? `${interestRate}% p.a.` : "rate"} × {interestDays || "—"} days</small>
              </div>
              <b className="orange">{formatBackendMoney(interest)}</b>
            </div>
            <div className="adv-calc-total">
              <span className="adv-calc-check">✓</span>
              <div>
                <strong>Total repayable</strong>
                <small>Auto-deducted on payday</small>
              </div>
              <b>{formatBackendMoney(totalRepayment)}</b>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Success screen ────────────────────────────────────────
  if (step === "success") {
    return (
      <div className="adv-success-screen">
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
        <div className="adv-review-body">
          <button type="button" className="adv-review-back" onClick={() => setStep("calculator")}>
            ← Back to calculator
          </button>
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
                {preview.cycleMessage && (
                  <div
                    className={`adv-cycle-note ${
                      preview.isNextCycleRecovery ? "is-next-cycle" : ""
                    }`}
                  >
                    <CalendarDays size={15} />
                    <span>{preview.cycleMessage}</span>
                  </div>
                )}
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

  // ── Compact unified calculator (eligible + setup-required same layout) ──
  return (
    <div className="adv-screen adv-compact-screen">
      <div className="adv-c-body">

        {/* ── Hero card ── */}
        <div className="adv-c-hero">
          <div className="adv-c-hero-top">
            <div>
              <div className="adv-c-hero-eyebrow">Available advance</div>
              <div className="adv-c-hero-amt">
                {eligible && limit > 0 ? formatMoney(limit) : "—"}
              </div>
            </div>
            <div className={`adv-c-badge ${eligible ? "ready" : "pending"}`}>
              {eligible ? <CheckCircle size={11} /> : <Clock size={11} />}
              {eligible ? "Ready" : "Pending"}
            </div>
          </div>
          <div className="adv-c-hero-meta">
            {salary > 0 && <span>Salary {formatMoney(salary)}</span>}
            {nextPayday && <><span>·</span><span>Payday {formatPayday(nextPayday)}</span></>}
          </div>
          {/* Setup progress (only when not eligible) */}
          {!eligible && (
            <div className="adv-c-steps">
              {setupSteps.map((s) => (
                <button
                  key={s.label}
                  type="button"
                  className={`adv-c-step ${s.tone}`}
                  onClick={() => s.tone === "todo" ? onNavigate?.(s.view) : undefined}
                >
                  <span className={`adv-c-step-dot ${s.tone}`} />
                  <span className="adv-c-step-label">{s.label}</span>
                  <span className="adv-c-step-status">{s.status}</span>
                  {s.tone === "todo" && <ChevronRight size={11} />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Amount selector ── */}
        <div className="adv-c-section">
          <div className="adv-c-row">
            <span className="adv-c-label">Request amount</span>
            {limit > 0 && <span className="adv-c-limit-chip">Max {formatMoney(limit)}</span>}
          </div>
          <div className="adv-c-amount">{formatMoney(amount)}</div>
          {limit >= MIN_AMOUNT && (
            <>
              <input
                type="range"
                className="adv-range adv-c-range"
                min={MIN_AMOUNT}
                max={sliderMax}
                step={500}
                value={Math.min(amount, sliderMax)}
                onChange={(e) => onAmountChange(Number(e.target.value))}
              />
              <div className="adv-range-labels">
                <span className="adv-range-lbl">{formatMoney(MIN_AMOUNT)}</span>
                <span className="adv-range-lbl">{formatMoney(limit)}</span>
              </div>
            </>
          )}
          <div className="adv-c-pills">
            {quickAmounts.map((v) => (
              <button
                key={v}
                type="button"
                className={`adv-c-pill ${amount === v ? "active" : ""}`}
                onClick={() => onAmountChange(v)}
              >
                {formatMoney(v)}
              </button>
            ))}
          </div>
        </div>

        {/* ── Repayment row ── */}
        <div className="adv-c-divider" />
        <div className="adv-c-repay">
          <div className="adv-c-repay-stat">
            <span className="adv-c-label">
              Total repayable
              {previewLoading && <RefreshCw size={11} className="spin" style={{ marginLeft: 4 }} />}
            </span>
            <span className="adv-c-repay-val">
              {preview ? formatMoney(preview.total) : "—"}
            </span>
          </div>
          <div className="adv-c-repay-stat">
            <span className="adv-c-label">On payday</span>
            <span className="adv-c-repay-val">
              {preview
                ? formatShortDate(preview.recoveryDate)
                : formatPayday(nextPayday) || "—"}
            </span>
          </div>
          <button
            type="button"
            className="adv-c-how-btn"
            onClick={() => setShowBreakdown(true)}
          >
            Details ↗
          </button>
        </div>

      </div>

      {/* ── Fixed CTA ── */}
      <div className="adv-fixed-action">
        <button
          type="button"
          className="mp-btn-primary"
          disabled={eligible ? !canSubmit : isWaitingForSetupReview}
          onClick={eligible ? () => setStep("review") : onResolveBlocker}
        >
          {eligible
            ? <>Request advance <ArrowRight size={16} /></>
            : hasMissingSetupAction
              ? <>{blockerActionLabel || "Complete Setup"} <ArrowRight size={16} /></>
              : "Verification in progress…"}
        </button>
        <div className="adv-secure-note">
          <ShieldCheck size={12} /> Encrypted and secure
        </div>
      </div>

      {/* ── Breakdown bottom sheet ── */}
      {showBreakdown && (
        <div
          className="adv-sheet-overlay"
          onClick={() => setShowBreakdown(false)}
        >
          <div className="adv-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="adv-sheet-handle" />
            <div className="adv-sheet-title">How it's calculated</div>
            {preview ? (
              <>
                <div className="adv-sheet-row">
                  <span className="adv-sheet-lbl">Advance amount</span>
                  <span className="adv-sheet-val">{formatMoney(amount)}</span>
                </div>
                {(preview.processingFee ?? 0) > 0 && (
                  <div className="adv-sheet-row">
                    <span className="adv-sheet-lbl">Processing fee</span>
                    <span className="adv-sheet-val adv-sheet-orange">
                      {formatMoney(preview.processingFee)}
                    </span>
                  </div>
                )}
                <div className="adv-sheet-row">
                  <span className="adv-sheet-lbl">
                    Interest
                    {preview.interestDays ? ` · ${preview.interestDays} days` : ""}
                    {preview.interestRate ? ` @ ${preview.interestRate}% p.a.` : ""}
                  </span>
                  <span className="adv-sheet-val adv-sheet-orange">
                    {formatMoney(preview.interest)}
                  </span>
                </div>
                <div className="adv-sheet-row">
                  <span className="adv-sheet-lbl">You receive</span>
                  <span className="adv-sheet-val">{formatMoney(preview.youReceive)}</span>
                </div>
                <div className="adv-sheet-row">
                  <span className="adv-sheet-lbl">Auto-deducted on</span>
                  <span className="adv-sheet-val">
                    {formatShortDate(preview.recoveryDate)}
                  </span>
                </div>
                <div className="adv-sheet-total">
                  <span className="adv-sheet-total-lbl">Total repayable</span>
                  <span className="adv-sheet-total-val">
                    {formatMoney(preview.total)}
                  </span>
                </div>
                {preview.cycleMessage && (
                  <p className="adv-sheet-note">{preview.cycleMessage}</p>
                )}
              </>
            ) : (
              <p className="adv-sheet-empty">
                Select an amount to see the breakdown
              </p>
            )}
            <button
              type="button"
              className="adv-sheet-close"
              onClick={() => setShowBreakdown(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
