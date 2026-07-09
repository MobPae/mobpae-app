import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Landmark,
  Lock,
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
    .replace(/(.{5})/g, "$1 ")
    .trim();
}

function maskAccount(value: string) {
  const digits = cleanAccount(value);
  const last = digits.slice(-4) || "0000";
  return `••••  ••••  ${last}`;
}

function StatusBadge({ verified }: { verified?: boolean }) {
  return (
    <span className={`bankv2-status ${verified ? "is-verified" : "is-pending"}`}>
      <span />
      {verified ? "Verified" : "Pending"}
    </span>
  );
}

function BankInput({
  label,
  value,
  placeholder,
  onChange,
  autoComplete,
  suffix,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  suffix?: ReactNode;
}) {
  return (
    <label className="bankv2-field">
      <span>{label}</span>
      <div className="bankv2-input-wrap">
        <input
          value={value}
          placeholder={placeholder}
          autoComplete={autoComplete}
          onChange={(event) => onChange(event.target.value)}
        />
        {suffix}
      </div>
    </label>
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
  const [showLinkedAccount, setShowLinkedAccount] = useState(() => Boolean(cleanAccount(bankForm.accountNumber)));

  useEffect(() => {
    if (!bankForm.accountNumber) {
      setConfirmAccount("");
      setShowLinkedAccount(false);
    }
  }, [bankForm.accountNumber]);

  const accountNumber = cleanAccount(bankForm.accountNumber);
  const confirmNumber = cleanAccount(confirmAccount);
  const accountMatches = accountNumber.length > 0 && accountNumber === confirmNumber;
  const nextView: View = kycSubmitted ? "home" : "onboarding-kyc";
  const nextLabel = kycSubmitted ? "Go to Home" : "Continue to KYC";

  const canSubmit = useMemo(() => {
    return Boolean(
      bankForm.bankName.trim() &&
        bankForm.accountHolderName.trim() &&
        accountNumber &&
        accountMatches &&
        bankForm.ifscCode.trim()
    );
  }, [accountMatches, accountNumber, bankForm.accountHolderName, bankForm.bankName, bankForm.ifscCode]);

  const handleSave = async () => {
    if (!canSubmit || savingBank) return;
    try {
      await onSaveBank();
      setShowLinkedAccount(true);
    } catch {
      // The app hook already surfaces the API error through the shared notice.
    }
  };

  if (showLinkedAccount && !savingBank) {
    const heading = kycSubmitted ? "You’re all set" : "Bank linked";
    const message = kycSubmitted
      ? "Identity verified and bank linked. You can now request salary advances."
      : "Your salary account is linked. Finish KYC to unlock salary advances.";

    return (
      <div className="bankv2-screen">
        <section className="bankv2-hero">
          <div>
            <div className="bankv2-kicker">Step 4 of 4</div>
            <h1>Link your bank</h1>
            <p>Where we’ll send advances and auto-recover on payday.</p>
          </div>
          <div className="bankv2-hero-icon">
            <Landmark size={27} strokeWidth={1.8} />
          </div>
        </section>

        <section className="bankv2-account-card">
          <div className="bankv2-account-top">
            <span>Primary account</span>
            <StatusBadge verified={bankForm.verified} />
          </div>
          <h2>{bankForm.bankName || "Bank Account"}</h2>
          <div className="bankv2-card-number">{maskAccount(bankForm.accountNumber)}</div>
          <div className="bankv2-card-rule" />
          <div className="bankv2-card-meta">
            <div>
              <span>Holder</span>
              <span>{bankForm.accountHolderName || "—"}</span>
            </div>
            <div>
              <span>IFSC</span>
              <span>{bankForm.ifscCode || "—"}</span>
            </div>
          </div>
        </section>

        <section className="bankv2-success">
          <div className="bankv2-success-ring">
            <Check size={31} strokeWidth={2.4} />
          </div>
          <h2>{heading}</h2>
          <p>{message}</p>
        </section>

        <div className="bankv2-footer">
          <button type="button" className="bankv2-primary" onClick={() => onContinue(nextView)}>
            <span>{nextLabel}</span>
            <span className="bankv2-primary-icon">
              <ArrowRight size={24} strokeWidth={2.2} />
            </span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bankv2-screen">
      <section className="bankv2-hero">
        <div>
          <div className="bankv2-kicker">Step 4 of 4</div>
          <h1>Link your bank</h1>
          <p>Where we’ll send advances and auto-recover on payday.</p>
        </div>
        <div className="bankv2-hero-icon">
          <Landmark size={27} strokeWidth={1.8} />
        </div>
      </section>

      <section className="bankv2-form">
        <BankInput
          label="Bank name"
          value={bankForm.bankName}
          placeholder="e.g. HDFC Bank"
          autoComplete="organization"
          onChange={(value) => onBankFormChange("bankName", value)}
        />
        <BankInput
          label="Account holder name"
          value={bankForm.accountHolderName}
          placeholder="As per bank records"
          autoComplete="name"
          onChange={(value) => onBankFormChange("accountHolderName", value)}
        />
        <BankInput
          label="Account number"
          value={formatAccount(bankForm.accountNumber)}
          placeholder="Enter account number"
          autoComplete="off"
          onChange={(value) => onBankFormChange("accountNumber", cleanAccount(value))}
        />
        <BankInput
          label="Re-enter account number"
          value={formatAccount(confirmAccount)}
          placeholder="Re-enter to confirm"
          autoComplete="off"
          onChange={(value) => setConfirmAccount(cleanAccount(value))}
          suffix={accountMatches ? <CheckCircle2 className="bankv2-input-check" size={18} /> : null}
        />
        <BankInput
          label="IFSC code"
          value={bankForm.ifscCode}
          placeholder="e.g. HDFC0001234"
          autoComplete="off"
          onChange={(value) => onBankFormChange("ifscCode", value.toUpperCase())}
        />
      </section>

      <div className="bankv2-note">
        <Lock size={15} strokeWidth={1.8} />
        A ₹1 verification deposit confirms the account.
      </div>

      <div className="bankv2-footer bankv2-footer--form">
        <button
          type="button"
          className="bankv2-primary"
          disabled={!canSubmit || savingBank}
          onClick={handleSave}
        >
          <span>{savingBank ? "Linking account..." : "Verify & link account"}</span>
          <span className="bankv2-primary-icon">
            <ArrowRight size={24} strokeWidth={2.2} />
          </span>
        </button>
        <div className="bankv2-secure">
          <ShieldCheck size={13} strokeWidth={1.8} />
          Bank details are encrypted and stored securely
        </div>
      </div>
    </div>
  );
}
