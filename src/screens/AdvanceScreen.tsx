import { BadgeIndianRupee, CalendarClock, IndianRupee, Send, Sparkles } from "lucide-react";
import { Card } from "../components/ui/Card";
import { Field } from "../components/ui/Field";
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
  notice: string;
  preview: RecoveryPreview | null;
  previewLoading: boolean;
  submitting: boolean;
  onAmountChange: (amount: number) => void;
  onSubmit: () => void;
};

export function AdvanceScreen({ amount, eligible, limit, nextBlocker, notice, preview, previewLoading, submitting, onAmountChange, onSubmit }: AdvanceScreenProps) {
  const amountReady = amount > 0 && amount <= limit;
  const quickAmounts = [1000, 3000, 5000, 10000].filter((value) => value <= limit);

  return (
    <>
      <Card className="advance-hero-card">
        <SectionHeader title="How much would you like to withdraw?" eyebrow="Salary advance" icon={<BadgeIndianRupee size={19} />} />
        <div className="limit-pill">Available limit: {formatMoney(limit)}</div>
        <div className="advance-amount-display">
          <IndianRupee size={24} />
          <strong>{formatMoney(amount).replace("₹", "")}</strong>
        </div>
        <Field label="Selected amount" type="text" value={formatMoney(amount)} disabled onChange={() => undefined} />
        <div className="advance-range-wrap">
          <input className="range" type="range" min={1000} max={limit} step={500} value={amount} onChange={(event) => onAmountChange(Number(event.target.value))} />
          <div className="range-labels">
            <span>{formatMoney(1000)}</span>
            <span>{formatMoney(limit)}</span>
          </div>
        </div>
        <div className="quick-amounts" aria-label="Quick amount options">
          {quickAmounts.map((value) => (
            <button className={value === amount ? "active" : ""} type="button" key={value} onClick={() => onAmountChange(value)}>
              {formatMoney(value)}
            </button>
          ))}
        </div>
        <InlineAlert message={eligible ? "Eligible for salary advance. Payment preview is shown below." : nextBlocker} tone={eligible ? "success" : "warning"} />
      </Card>

      <Card>
        <SectionHeader title="Payment preview" eyebrow="Payroll deduction" icon={<CalendarClock size={19} />} />
        {preview ? (
          <div className="preview-grid">
            <div>
              <p>Principal</p>
              <strong>{formatMoney(preview.principal)}</strong>
            </div>
            <div>
              <p>Interest</p>
              <strong>{formatMoney(preview.interest)}</strong>
            </div>
            <div>
              <p>Total payment</p>
              <strong>{formatMoney(preview.total)}</strong>
            </div>
            <div>
              <p>Payment date</p>
              <strong>{formatDate(preview.recoveryDate)}</strong>
            </div>
          </div>
        ) : (
          <p className="muted">{previewLoading ? "Calculating preview..." : "Enter an amount to preview payment."}</p>
        )}
        <InlineAlert message={notice} tone={eligible ? "info" : "warning"} />
        <div className="savings-note">
          <Sparkles size={15} />
          <span>Transparent charges before you submit.</span>
        </div>
        <PrimaryButton icon={<Send size={17} />} disabled={!eligible || !amountReady || previewLoading || submitting} onClick={onSubmit}>
          {submitting ? "Submitting" : "Submit request"}
        </PrimaryButton>
      </Card>
    </>
  );
}
