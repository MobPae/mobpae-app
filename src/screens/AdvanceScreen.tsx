import { BadgeIndianRupee, CalendarClock, Send } from "lucide-react";
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
  preview: RecoveryPreview | null;
  previewLoading: boolean;
  onAmountChange: (amount: number) => void;
};

export function AdvanceScreen({ amount, eligible, limit, nextBlocker, preview, previewLoading, onAmountChange }: AdvanceScreenProps) {
  return (
    <>
      <Card>
        <SectionHeader title="Salary advance" eyebrow="Request" icon={<BadgeIndianRupee size={19} />} />
        <Field
          label="Amount"
          type="number"
          min={1000}
          max={limit}
          value={amount}
          onChange={(event) => onAmountChange(Math.min(limit, Number(event.target.value)))}
        />
        <input className="range" type="range" min={1000} max={limit} step={500} value={amount} onChange={(event) => onAmountChange(Number(event.target.value))} />
        <InlineAlert message={eligible ? "Eligible for salary advance. Recovery preview is shown below." : nextBlocker} tone={eligible ? "success" : "warning"} />
      </Card>

      <Card>
        <SectionHeader title="Recovery preview" eyebrow="Payroll deduction" icon={<CalendarClock size={19} />} />
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
              <p>Total recovery</p>
              <strong>{formatMoney(preview.total)}</strong>
            </div>
            <div>
              <p>Recovery date</p>
              <strong>{formatDate(preview.recoveryDate)}</strong>
            </div>
          </div>
        ) : (
          <p className="muted">{previewLoading ? "Calculating preview..." : "Enter an amount to preview recovery."}</p>
        )}
        <PrimaryButton icon={<Send size={17} />} disabled={!eligible || previewLoading}>
          Submit request
        </PrimaryButton>
      </Card>
    </>
  );
}
