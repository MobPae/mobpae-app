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
  membershipActive: boolean;
  membershipSubmitted: boolean;
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
  membershipActive,
  membershipSubmitted,
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
  const setupSteps = [
    { label: "KYC Verification", done: kycComplete, submitted: kycSubmitted, view: "onboarding-kyc" as View },
    { label: "Bank Account", done: bankComplete, submitted: bankSubmitted, view: "onboarding-bank" as View },
    { label: "Activate Membership", done: membershipActive, submitted: membershipSubmitted, view: "profile-membership" as View },
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

  // ── Setup required (not eligible, no active) ──────────────
  if (!eligible && hasMissingSetupAction) {
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
            {setupSteps.map((r, i) => (
              <button
                key={r.label}
                type="button"
                className="adv-step-row"
                onClick={() => onNavigate?.(r.view)}
              >
                <div className={`adv-step-num ${r.tone}`}>
                  {r.done || r.submitted ? <CheckCircle size={14} /> : i + 1}
                </div>
                <div className="adv-step-body">
                  <div className="adv-step-title">{r.label}</div>
                  <div className={`adv-step-sub ${r.tone}`}>
                    {r.status}
                  </div>
                </div>
                {r.done && <BadgeCheck size={16} color="#16A34A" />}
                {!r.done && r.submitted && <Clock size={16} color="#D97706" />}
              </button>
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

  // ── Calculator ────────────────────────────────────────────
  return (
    <div className="adv-screen adv-new-screen">
      <div className="adv-new-body">
        <section className="adv-new-hero">
          <div className="adv-new-hero-top">
            <div>
              <span>Available access</span>
              <strong>{formatMoney(limit)}</strong>
              <small>from {salary > 0 ? formatMoney(salary) : "your"} monthly salary</small>
            </div>
            <div className={eligible ? "adv-new-status is-ready" : "adv-new-status is-waiting"}>
              {eligible ? <CheckCircle size={13} /> : <Clock size={13} />}
              {eligible ? "Ready" : "Pending"}
            </div>
          </div>
          <div className="adv-new-hero-grid">
            <div>
              <span>Salary</span>
              <strong>{salary > 0 ? formatMoney(salary) : "—"}</strong>
            </div>
            <div>
              <span>Payday</span>
              <strong>{formatPayday(nextPayday)}</strong>
            </div>
            <div>
              <span>Status</span>
              <strong className={eligible ? "is-success" : "is-pending"}>{eligible ? "Active" : "Review"}</strong>
            </div>
          </div>
        </section>

        <section className="adv-new-card adv-new-amount-card">
          <div className="adv-new-section-head">
            <div>
              <span>Request amount</span>
              <strong>{formatMoney(amount)}</strong>
            </div>
            <small>Limit {formatMoney(limit)}</small>
          </div>
          <input
            type="range"
            className="adv-range"
            min={MIN_AMOUNT}
            max={sliderMax}
            step={500}
            value={Math.min(amount, sliderMax)}
            disabled={isWaitingForSetupReview || limit < MIN_AMOUNT}
            onChange={(e) => onAmountChange(Number(e.target.value))}
          />
          <div className="adv-range-labels">
            <span className="adv-range-lbl">{formatMoney(MIN_AMOUNT)}</span>
            <span className="adv-range-lbl">{formatMoney(limit)}</span>
          </div>
          <div className="adv-new-quick-row">
            {quickAmounts.map((v) => (
              <button
                key={v}
                type="button"
                className={amount === v ? "active" : ""}
                disabled={isWaitingForSetupReview}
                onClick={() => onAmountChange(v)}
              >
                {formatMoney(v)}
              </button>
            ))}
          </div>
        </section>

        <section className="adv-new-card adv-new-summary">
          <div className="adv-new-card-title">
            <span>Repayment preview</span>
            {previewLoading && <RefreshCw size={13} className="spin" />}
          </div>
          <div className="adv-new-summary-grid">
            <div>
              <span>You receive</span>
              <strong>{preview ? formatMoney(preview.youReceive) : "—"}</strong>
            </div>
            <div>
              <span>Tenure</span>
              <strong>{preview ? `${preview.interestDays} days` : "—"}</strong>
            </div>
            <div>
              <span>Interest</span>
              <strong>{preview ? formatMoney(preview.interest) : "—"}</strong>
            </div>
            <div>
              <span>Total due</span>
              <strong className="purple">{preview ? formatMoney(preview.total) : "—"}</strong>
            </div>
          </div>
          <div className="adv-new-due-row">
            <CalendarDays size={15} />
            <div>
              <span>Deducts on payday</span>
              <strong>{preview ? formatShortDate(preview.recoveryDate) : "—"}</strong>
            </div>
          </div>
          {preview?.cycleMessage && (
            <div className={`adv-new-cycle-note ${preview.isNextCycleRecovery ? "is-next-cycle" : ""}`}>
              {preview.cycleMessage}
            </div>
          )}
        </section>

        <section className="adv-new-card adv-new-flow">
          <div className="adv-new-card-title">
            <span>Request flow</span>
          </div>
          {preview && (
            <div className="adv-new-flow-row">
              <div>
                <i>1</i>
                <span>Request</span>
                <strong>{formatMoney(amount)}</strong>
              </div>
              <div>
                <i>2</i>
                <span>Receive</span>
                <strong>{formatMoney(preview.youReceive)}</strong>
              </div>
              <div>
                <i>3</i>
                <span>Repay</span>
                <strong>{formatShortDate(preview.recoveryDate)}</strong>
              </div>
            </div>
          )}
        </section>

        <div className="adv-new-benefits">
          <span><ShieldCheck size={13} /> Secure</span>
          <span><CheckCircle size={13} /> No hidden fees</span>
          <span><CreditCard size={13} /> Auto-deducted</span>
        </div>

        {isWaitingForSetupReview && (
          <div className="adv-new-review-card">
            <span><Clock size={15} /></span>
            <div>
              <strong>Verification under review</strong>
              <span>{nextBlocker || "Your submitted setup details are pending approval. Advance requests will unlock once verification is complete."}</span>
            </div>
          </div>
        )}
      </div>

      <div className="adv-fixed-action">
        <button
          type="button"
          className="mp-btn-primary"
          disabled={!canSubmit}
          onClick={() => setStep("review")}
        >
          {isWaitingForSetupReview ? "Waiting for verification" : <>Continue <ArrowRight size={16} /></>}
        </button>
        <div className="adv-secure-note">
          <ShieldCheck size={12} /> Your request is encrypted and secure
        </div>
      </div>
    </div>
  );
}
