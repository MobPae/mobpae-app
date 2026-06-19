import { AlertCircle, CalendarDays, IndianRupee, ReceiptText, ShieldCheck, WalletCards } from "lucide-react";
import { formatMoney, formatShortDate } from "../utils/format";
import type { AdvanceRequest, RecoveryPreview } from "../types/app";

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
  onAmountChange: (amount: number) => void;
  onSubmit: () => void;
};

function makeChips(limit: number): number[] {
  const step = Math.max(Math.round(limit / 4 / 500) * 500, MIN_AMOUNT);
  return [step, step * 2, step * 3, limit];
}

export function AdvanceScreen({
  amount,
  eligible,
  limit,
  nextBlocker,
  preview,
  previewLoading,
  currentRequest,
  submitting,
  onAmountChange,
  onSubmit,
}: AdvanceScreenProps) {
  const chips    = makeChips(limit);
  const hasActive = Boolean(
    currentRequest &&
    ["Disbursed", "Payment Scheduled"].includes(currentRequest.status)
  );
  const canSubmit =
    eligible &&
    !hasActive &&
    amount >= MIN_AMOUNT &&
    amount <= limit &&
    !submitting;

  const processingFee = preview?.processingFee;
  const interest      = preview?.interest;
  const youReceive    = preview?.youReceive;
  const toRecover     = preview?.total;
  const recoveryDate  = preview?.recoveryDate ?? currentRequest?.recoveryDate ?? "";
  const interestRate  = preview?.interestRate;
  const interestDays  = preview?.interestDays;
  const activeAmount = currentRequest?.approvedAmount || currentRequest?.requestedAmount || 0;
  const activeInterest = currentRequest?.interestAmount ?? 0;
  const activeTotal = currentRequest?.totalRecoveryAmount || activeAmount + activeInterest;
  const activeTenure = currentRequest?.interestDays;
  const activeStatus = currentRequest?.statusLabel ?? currentRequest?.status;

  const fmtFee = (v: number | undefined) =>
    previewLoading ? "…" : v !== undefined ? formatMoney(v) : "—";

  const interestLabel =
    interestRate !== undefined && interestDays !== undefined
      ? `Interest (${interestRate}% p.a. · ${interestDays}d)`
      : interestRate !== undefined
        ? `Interest (${interestRate}% p.a.)`
        : "Interest (1.5%)";

  return (
    <div className="advance-screen">

      {/* ── Back header ───────────────────────────────────────────── */}
      <div className="advance-page-header">
        <div>
          <span>Salary access</span>
          <h2>Request advance</h2>
        </div>
      </div>

      {/* ── Available limit card ──────────────────────────────────── */}
      <div className="advance-avail-card">
        <div className="advance-avail-topline">
          <div>
            <div className="advance-avail-label">Available advance</div>
            <div className="advance-avail-amount">
              {limit > 0 ? formatMoney(limit) : "N/A"}
            </div>
          </div>
          <div className="advance-card-icon">
            <WalletCards size={22} />
          </div>
        </div>
        <div className="advance-avail-meta-grid">
          <span><IndianRupee size={14} /> Instant request</span>
          <span><CalendarDays size={14} /> Payroll recovery</span>
        </div>
      </div>

      {/* ── Active advance summary ────────────────────────────────── */}
      {hasActive && (
        <div className="adv-current-card">
          <div className="adv-current-head">
            <div>
              <span>Current advance</span>
              <h3>{formatMoney(activeAmount)}</h3>
            </div>
            <strong>{activeStatus}</strong>
          </div>

          <div className="adv-current-grid">
            <div>
              <span>Amount</span>
              <strong>{formatMoney(activeAmount)}</strong>
            </div>
            <div>
              <span>Tenure</span>
              <strong>{activeTenure ? `${activeTenure} days` : "—"}</strong>
            </div>
            <div>
              <span>Interest</span>
              <strong>{formatMoney(activeInterest)}</strong>
            </div>
            <div>
              <span>Total payment</span>
              <strong>{formatMoney(activeTotal)}</strong>
            </div>
          </div>

          <div className="adv-current-date">
            <CalendarDays size={15} />
            <span>Payment scheduled</span>
            <strong>{recoveryDate ? formatShortDate(recoveryDate) : "—"}</strong>
          </div>

          <div className="adv-current-note">
            <AlertCircle size={14} />
            <p>You can withdraw more after this payment is cleared.</p>
          </div>
        </div>
      )}

      {/* ── Amount selector ───────────────────────────────────────── */}
      {!hasActive && limit > 0 && (
        <div className="advance-amount-box">
          <div className="adv-amount-stack">
            <div className="adv-amount-label">How much would you like to withdraw?</div>
            <div className="adv-amount-display-value">{formatMoney(amount)}</div>
            <div className="adv-range-wrap">
              <input
                className="adv-range"
                type="range"
                min={MIN_AMOUNT}
                max={limit}
                step={100}
                value={amount}
                onChange={(event) => onAmountChange(Number(event.target.value))}
              />
              <div className="adv-range-labels">
                <span>{formatMoney(MIN_AMOUNT)}</span>
                <span>{formatMoney(limit)}</span>
              </div>
            </div>
          </div>

          <div className="adv-chips">
            {chips.map(chip => (
              <button
                key={chip}
                type="button"
                className={`adv-chip${amount === chip ? " active" : ""}`}
                onClick={() => onAmountChange(chip)}
              >
                {formatMoney(chip)}
              </button>
            ))}
          </div>

          {(amount < MIN_AMOUNT || amount > limit) && (
            <p className="adv-hint-err">
              Enter an amount between {formatMoney(MIN_AMOUNT)} and {formatMoney(limit)}
            </p>
          )}
        </div>
      )}

      {/* ── Repayment preview card ────────────────────────────────── */}
      {!hasActive && limit > 0 && (
        <div className="adv-breakdown">
          <div className="adv-breakdown-head">
            <div>
              <div className="adv-breakdown-title">Repayment preview</div>
              <p>Based on your selected amount</p>
            </div>
            <span><ReceiptText size={16} /></span>
          </div>

          <div className="adv-preview-grid">
            <div>
              <span>Amount</span>
              <strong>{formatMoney(amount)}</strong>
            </div>
            <div>
              <span>Tenure</span>
              <strong>{previewLoading ? "…" : interestDays ? `${interestDays} days` : "—"}</strong>
            </div>
          </div>

          <div className="adv-breakdown-row highlight">
            <span>You receive</span>
            <strong>{fmtFee(youReceive)}</strong>
          </div>

          <div className="adv-breakdown-row">
            <span>{interestLabel}</span>
            <strong>{fmtFee(interest)}</strong>
          </div>

          {processingFee !== undefined && (
            <div className="adv-breakdown-row">
              <span>Processing fee</span>
              <strong>{fmtFee(processingFee)}</strong>
            </div>
          )}

          <div style={{ height: 1, background: "var(--b1)", margin: "8px 0" }} />

          <div className="adv-breakdown-row" style={{ fontWeight: 700, color: "var(--t1)" }}>
            <span style={{ fontWeight: 700, color: "var(--t1)" }}>Total repayment</span>
            <strong style={{ fontSize: 16 }}>{fmtFee(toRecover)}</strong>
          </div>

          <div className="adv-breakdown-row">
            <span>Repayment date</span>
            <strong>{recoveryDate ? formatShortDate(recoveryDate) : "—"}</strong>
          </div>
        </div>
      )}

      {/* ── Note ──────────────────────────────────────────────────── */}
      {!hasActive && limit > 0 && (
        <div className="adv-info">
          <ShieldCheck size={14} />
          <p>Auto-debited from your next salary. No impact on your CIBIL score.</p>
        </div>
      )}

      {/* ── Not eligible ──────────────────────────────────────────── */}
      {!eligible && nextBlocker && (
        <div className="adv-blocker">
          {nextBlocker}
        </div>
      )}

      {/* ── CTA ───────────────────────────────────────────────────── */}
      <div className="adv-submit-bar">
        <button
          type="button"
          className="adv-submit"
          disabled={!canSubmit}
          onClick={onSubmit}
        >
          {submitting ? (
            <span className="cta-spinner" style={{ borderTopColor: "white", borderColor: "rgba(255,255,255,0.3)" }} />
          ) : (
            <>Preview &amp; Submit {amount >= MIN_AMOUNT && amount <= limit ? formatMoney(amount) : ""}</>
          )}
        </button>
      </div>
    </div>
  );
}
