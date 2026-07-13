// ── OnboardingBankScreen.tsx ──────────────────────────────────────────────────
// Bank account linking — compact redesign.
// Colors: bank card = deep emerald · membership card (elsewhere) = deep violet

import { useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Landmark,
  ShieldCheck,
} from "lucide-react";
import type { BankAccount, View } from "../types/app";

type Props = {
  bankForm: BankAccount;
  savingBank: boolean;
  onBankFormChange: (field: keyof BankAccount, value: string) => void;
  onSaveBank: () => Promise<void> | void;
  onContinue: (view: View) => void;
  kycSubmitted: boolean;
};

function cleanAccount(value: string) {
  return value.replace(/\s+/g, "");
}

function formatAccount(value: string) {
  return cleanAccount(value)
    .replace(/\D/g, "")
    .replace(/(.{4})/g, "$1 ")
    .trim();
}

function maskAccount(value: string) {
  const digits = cleanAccount(value).replace(/\D/g, "");
  if (!digits) return "•••• •••• ••••";
  const last4 = digits.slice(-4);
  return `••••  ••••  ${last4}`;
}

function StatusBadge({ verified }: { verified?: boolean }) {
  return (
    <span className={`bankv2-status ${verified ? "is-verified" : "is-pending"}`}>
      <span />
      {verified ? "Verified" : "In review"}
    </span>
  );
}

export function OnboardingBankScreen({
  bankForm,
  savingBank,
  onBankFormChange,
  onSaveBank,
  onContinue,
  kycSubmitted,
}: Props) {
  const [confirmAccount, setConfirmAccount] = useState("");
  const [showLinked, setShowLinked] = useState(() =>
    Boolean(cleanAccount(bankForm.accountNumber))
  );
  const [ctaError, setCtaError] = useState("");

  const accountNumber  = cleanAccount(bankForm.accountNumber);
  const confirmNumber  = cleanAccount(confirmAccount);
  const accountMatches = accountNumber.length > 0 && accountNumber === confirmNumber;
  const nextView: View = kycSubmitted ? "home" : "onboarding-kyc";
  const nextLabel      = kycSubmitted ? "Go to home" : "Continue to KYC";

  const canSubmit = useMemo(() =>
    Boolean(
      bankForm.bankName.trim() &&
      bankForm.accountHolderName.trim() &&
      accountNumber &&
      accountMatches &&
      bankForm.ifscCode.trim()
    ),
    [accountMatches, accountNumber, bankForm]
  );

  const handleSave = async () => {
    if (savingBank) return;
    if (!canSubmit) {
      setCtaError("Please fill in all fields correctly.");
      setTimeout(() => setCtaError(""), 3000);
      return;
    }
    setCtaError("");
    try {
      await onSaveBank();
      setShowLinked(true);
    } catch { /* error surfaced by app hook */ }
  };

  // ── Linked / success view ──────────────────────────────────────────────────
  if (showLinked && !savingBank) {
    return (
      <div className="bnk2-screen">
        <div className="bnk2-hero">
          <div className="bnk2-hero-icon"><Landmark size={18} strokeWidth={1.8} /></div>
          <div className="bnk2-hero-copy">
            <h1>Link your bank</h1>
            <p>Where we'll send advances and auto-recover on payday.</p>
          </div>
        </div>

        {/* Colored bank card */}
        <div className="bnk2-card">
          <div className="bnk2-card-top">
            <span className="bnk2-card-bank">{bankForm.bankName || "Bank Account"}</span>
            <StatusBadge verified={bankForm.verified} />
          </div>
          <div className="bnk2-card-number">{maskAccount(bankForm.accountNumber)}</div>
          <div className="bnk2-card-divider" />
          <div className="bnk2-card-meta">
            <div>
              <span>Holder</span>
              <span>{bankForm.accountHolderName || "—"}</span>
            </div>
            <div>
              <span>IFSC</span>
              <span>{bankForm.ifscCode || "—"}</span>
            </div>
          </div>
        </div>

        <div className="bnk2-success">
          <Clock size={16} strokeWidth={1.8} style={{ flexShrink: 0, marginTop: 1, opacity: 0.6 }} />
          <span>{kycSubmitted
            ? "Bank account added. Once our team verifies it, you can request salary advances."
            : "Bank account added. Complete KYC and wait for admin verification to unlock advances."}
          </span>
        </div>

        <div className="bnk2-footer">
          <button className="kycv2-cta-btn" onClick={() => onContinue(nextView)}>
            {nextLabel} <ArrowRight size={14} strokeWidth={2.2} />
          </button>
        </div>
      </div>
    );
  }

  // ── Form view ──────────────────────────────────────────────────────────────
  // Live card preview
  const previewBank   = bankForm.bankName   || "Bank Name";
  const previewHolder = bankForm.accountHolderName || "Account Holder";
  const previewIfsc   = bankForm.ifscCode   || "IFSC";

  return (
    <div className="bnk2-screen">
      <div className="bnk2-hero">
        <div className="bnk2-hero-icon"><Landmark size={18} strokeWidth={1.8} /></div>
        <div className="bnk2-hero-copy">
          <h1>Link your bank</h1>
          <p>Where we'll send advances and auto-recover on payday.</p>
        </div>
      </div>

      {/* Live colored card preview */}
      <div className="bnk2-card">
        <div className="bnk2-card-top">
          <span className="bnk2-card-bank">{previewBank}</span>
          <Landmark size={16} strokeWidth={1.6} color="rgba(255,255,255,0.55)" />
        </div>
        <div className="bnk2-card-number">{maskAccount(bankForm.accountNumber)}</div>
        <div className="bnk2-card-divider" />
        <div className="bnk2-card-meta">
          <div>
            <span>Holder</span>
            <span>{previewHolder}</span>
          </div>
          <div>
            <span>IFSC</span>
            <span>{previewIfsc}</span>
          </div>
        </div>
      </div>

      {/* Compact form */}
      <div className="bnk2-form">
        <label className="bnk2-field">
          <span>Bank name</span>
          <input
            value={bankForm.bankName}
            placeholder="e.g. HDFC Bank"
            autoComplete="organization"
            onChange={(e) => onBankFormChange("bankName", e.target.value)}
          />
        </label>

        <label className="bnk2-field">
          <span>Account holder name</span>
          <input
            value={bankForm.accountHolderName}
            placeholder="As per bank records"
            autoComplete="name"
            onChange={(e) => onBankFormChange("accountHolderName", e.target.value)}
          />
        </label>

        <label className="bnk2-field">
          <span>Account number</span>
          <input
            value={formatAccount(bankForm.accountNumber)}
            placeholder="Enter account number"
            autoComplete="off"
            inputMode="numeric"
            onChange={(e) => onBankFormChange("accountNumber", cleanAccount(e.target.value))}
          />
        </label>

        <label className="bnk2-field">
          <span>Re-enter account number</span>
          <div className="bnk2-input-row">
            <input
              value={formatAccount(confirmAccount)}
              placeholder="Re-enter to confirm"
              autoComplete="off"
              inputMode="numeric"
              onChange={(e) => setConfirmAccount(cleanAccount(e.target.value))}
            />
            {accountMatches && (
              <CheckCircle2 size={16} strokeWidth={2} color="#20A46A" className="bnk2-check" />
            )}
          </div>
        </label>

        <label className="bnk2-field">
          <span>IFSC code</span>
          <input
            value={bankForm.ifscCode}
            placeholder="e.g. HDFC0001234"
            autoComplete="off"
            onChange={(e) => onBankFormChange("ifscCode", e.target.value.toUpperCase())}
          />
        </label>
      </div>

      <div className="bnk2-footer">
        <button className="kycv2-cta-btn" onClick={handleSave}>
          {savingBank ? "Linking account…" : "Link bank account"}
          <ArrowRight size={14} strokeWidth={2.2} />
        </button>
        {ctaError && <p className="kycv2-cta-error">{ctaError}</p>}
        <div className="bnk2-secure">
          <ShieldCheck size={12} strokeWidth={1.8} />
          Bank details are encrypted and stored securely
        </div>
      </div>
    </div>
  );
}
