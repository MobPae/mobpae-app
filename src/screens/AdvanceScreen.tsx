import { useState } from "react";
import { AlertCircle, Info, Pencil } from "lucide-react";
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

/** Generate 4 evenly spaced chips: limit/4, limit/2, limit*3/4, limit.
 *  Rounded to nearest 500, minimum chip is MIN_AMOUNT. */
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
  const [editing, setEditing] = useState(false);
  const [inputVal, setInputVal] = useState("");

  const chips = makeChips(limit);
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

  // Fee / preview figures — all from API, no local calculation
  const processingFee = preview?.processingFee;
  const interest      = preview?.interest;
  const youReceive    = preview?.youReceive;
  const toRecover     = preview?.total;
  const recoveryDate  = preview?.recoveryDate ?? currentRequest?.recoveryDate ?? "";
  const interestRate  = preview?.interestRate;
  const interestDays  = preview?.interestDays;
  const fmtFee = (v: number | undefined) =>
    previewLoading ? "…" : v !== undefined ? formatMoney(v) : "—";
  const interestLabel =
    interestRate !== undefined && interestDays !== undefined
      ? `Interest (${interestRate}% p.a. · ${interestDays}d)`
      : interestRate !== undefined
      ? `Interest (${interestRate}% p.a.)`
      : "Interest";

  // Manual input handlers
  const commitInput = () => {
    const parsed = Number(inputVal.replace(/[^\d]/g, ""));
    if (!Number.isNaN(parsed) && parsed >= MIN_AMOUNT && parsed <= limit) {
      onAmountChange(parsed);
    }
    setEditing(false);
  };

  return (
    <div className="advance-screen">
      {/* Header */}
      <div className="advance-screen-header">
        <h2>Request advance</h2>
        <p>Money you've already earned</p>
      </div>

      {/* Available card */}
      <div className="advance-avail-card">
        <div className="advance-avail-label">Available to access</div>
        <div className="advance-avail-amount">
          {limit > 0 ? formatMoney(limit) : "N/A"}
        </div>
      </div>

      {/* Active advance warning */}
      {hasActive && (
        <div className="active-adv-banner">
          <AlertCircle size={16} />
          <div className="active-adv-banner-body">
            <div className="active-adv-banner-title">
              You have an active advance
            </div>
            <div className="active-adv-banner-sub">
              {formatMoney(
                currentRequest!.approvedAmount ||
                  currentRequest!.requestedAmount
              )}{" "}
              — recovery on{" "}
              {formatShortDate(currentRequest!.recoveryDate)}. New
              requests unlock after recovery.
            </div>
          </div>
        </div>
      )}

      {/* Amount selector */}
      {!hasActive && limit > 0 && (
        <div className="advance-amount-box">
          {/* Amount display / manual input */}
          <div className="adv-amount-row">
            <div className="adv-amount-label">You want</div>
            {editing ? (
              <div className="adv-manual-wrap">
                <span className="adv-manual-prefix">₹</span>
                <input
                  className="adv-manual-input"
                  type="number"
                  min={MIN_AMOUNT}
                  max={limit}
                  value={inputVal}
                  autoFocus
                  onChange={(e) => setInputVal(e.target.value)}
                  onBlur={commitInput}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitInput();
                    if (e.key === "Escape") setEditing(false);
                  }}
                />
              </div>
            ) : (
              <button
                type="button"
                className="adv-amount-display-btn"
                onClick={() => {
                  setInputVal(String(amount));
                  setEditing(true);
                }}
                title="Tap to edit amount"
              >
                <span className="adv-amount-display-value">
                  {formatMoney(amount)}
                </span>
                <span className="adv-amount-edit-hint">
                  <Pencil size={13} />
                  Edit
                </span>
              </button>
            )}
          </div>

          {/* 4 dynamic chips */}
          <div className="adv-chips">
            {chips.map((chip) => (
              <button
                key={chip}
                type="button"
                className={`adv-chip ${amount === chip ? "active" : ""}`}
                onClick={() => {
                  onAmountChange(chip);
                  setEditing(false);
                }}
              >
                {formatMoney(chip)}
              </button>
            ))}
          </div>

          {/* Validation hint */}
          {amount < MIN_AMOUNT || amount > limit ? (
            <p className="adv-hint-err">
              Enter an amount between {formatMoney(MIN_AMOUNT)} and{" "}
              {formatMoney(limit)}
            </p>
          ) : null}
        </div>
      )}

      {/* Breakdown */}
      {!hasActive && limit > 0 && (
        <div className="adv-breakdown">
          <div className="adv-breakdown-title">Breakdown</div>
          <div className="adv-breakdown-row">
            <span>Requested amount</span>
            <strong>{formatMoney(amount)}</strong>
          </div>

          <div className="adv-breakdown-row">
            <span>{interestLabel}</span>
            <strong>{fmtFee(interest)}</strong>
          </div>
          <div className="adv-breakdown-row highlight">
            <span>You receive instantly</span>
            <strong>{fmtFee(youReceive)}</strong>
          </div>
          <div
            className="adv-breakdown-row recovery-row"
            style={{
              borderTop: "1px solid var(--b1)",
              paddingTop: 10,
              marginTop: 4,
            }}
          >
            <span>
              To be recovered on{" "}
              {recoveryDate ? formatShortDate(recoveryDate) : "paydate"}
            </span>
            <strong>{fmtFee(toRecover)}</strong>
          </div>
        </div>
      )}

      {/* Info */}
      {!hasActive && limit > 0 && (
        <div className="adv-info">
          <Info size={14} />
          <p>
            Auto-debited from your next salary. No impact on your CIBIL
            score.
          </p>
        </div>
      )}

      {/* Not eligible */}
      {!eligible && nextBlocker && (
        <div
          style={{
            margin: "10px 16px 0",
            background: "#fef3c7",
            border: "1px solid #fde68a",
            borderRadius: "var(--r-md)",
            padding: "10px 14px",
            fontSize: 13,
            color: "#78350f",
          }}
        >
          {nextBlocker}
        </div>
      )}

      {/* CTA */}
      <div className="adv-submit-bar">
        <button
          type="button"
          className="adv-submit"
          disabled={!canSubmit}
          onClick={onSubmit}
        >
          {submitting ? (
            <span
              className="cta-spinner"
              style={{
                borderTopColor: "white",
                borderColor: "rgba(255,255,255,0.3)",
              }}
            />
          ) : (
            <>
              Request {amount >= MIN_AMOUNT && amount <= limit ? formatMoney(amount) : "—"}{" "}
              <span>→</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
