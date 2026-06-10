import { BadgeIndianRupee, CalendarClock, IndianRupee, Send } from "lucide-react";
import { Card } from "../components/ui/Card";
import { InlineAlert } from "../components/ui/InlineAlert";
import { PrimaryButton } from "../components/ui/PrimaryButton";
import { SectionHeader } from "../components/ui/SectionHeader";
import { formatDate, formatMoney } from "../utils/format";
import type { RecoveryPreview } from "../types/app";

type AdvanceScreenProps = {
  amount: number;
  eligible: boolean;
  limit: number;
  nextBlocker: string;
  preview: RecoveryPreview | null;
  previewLoading: boolean;
  submitting: boolean;
  onAmountChange: (amount: number) => void;
  onSubmit: () => void;
};

export function AdvanceScreen({ amount, eligible, limit, nextBlocker, preview, previewLoading, submitting, onAmountChange, onSubmit }: AdvanceScreenProps) {
  const amountReady = amount > 0 && amount <= limit;
  const quickAmounts = [1000, 3000, 5000, 10000].filter((value) => value <= limit);
  const lowAvailableLimit = limit > 0 && limit < 1000;
  const displayAmount = Math.min(amount, limit);
  const alertMessage = lowAvailableLimit ? "Your available limit is currently on hold. You can withdraw again after the current due is cleared." : eligible ? "Eligible for salary advance. Payment preview is shown below." : nextBlocker;

  return (
    <>
      <Card className="advance-request-card">
        <SectionHeader title="How much would you like to withdraw?" eyebrow="Salary advance" icon={<BadgeIndianRupee size={19} />} />
        <div className="advance-limit-row">
          <span>Available limit</span>
          <strong>{formatMoney(limit)}</strong>
        </div>
        <div className="advance-amount-display">
          <IndianRupee size={23} />
          <strong>{formatMoney(displayAmount).replace("₹", "")}</strong>
        </div>
        {!lowAvailableLimit ? (
          <>
            <div className="advance-range-wrap">
              <input className="range" type="range" min={1000} max={limit} step={500} value={displayAmount} onChange={(event) => onAmountChange(Number(event.target.value))} />
              <div className="range-labels">
                <span>{formatMoney(1000)}</span>
                <span>{formatMoney(limit)}</span>
              </div>
            </div>
            <div className="quick-amounts" aria-label="Quick amount options">
              {quickAmounts.map((value) => (
                <button className={value === displayAmount ? "active" : ""} type="button" key={value} onClick={() => onAmountChange(value)}>
                  {formatMoney(value)}
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="advance-hold-card">
            <span>Current available limit</span>
            <strong>{formatMoney(limit)}</strong>
          </div>
        )}
        <InlineAlert message={alertMessage} tone={eligible && !lowAvailableLimit ? "success" : "warning"} />

        <div className="advance-calculator">
          <div className="calculator-title">
            <CalendarClock size={17} />
            <strong>Interest calculator</strong>
          </div>
          {preview ? (
            <div>
              <DetailLine label="Advance amount" value={formatMoney(preview.principal)} />
              <DetailLine label="Tenure" value={`${preview.interestDays} days`} />
              <DetailLine label="Interest" value={formatMoney(preview.interest)} />
              <DetailLine label="Total payment" value={formatMoney(preview.total)} />
              <DetailLine label="Payment date" value={formatDate(preview.recoveryDate)} />
            </div>
          ) : (
            <p className="muted">{previewLoading ? "Calculating preview..." : "Move the slider to preview payment."}</p>
          )}
        </div>
        <PrimaryButton icon={<Send size={17} />} disabled={!eligible || lowAvailableLimit || !amountReady || previewLoading || submitting} onClick={onSubmit}>
          {submitting ? "Submitting" : "Continue"}
        </PrimaryButton>
      </Card>
    </>
  );
}

function DetailLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="calculator-line">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
