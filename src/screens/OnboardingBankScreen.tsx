import { useState } from "react";
import { ChevronRight, Landmark, Search, ShieldCheck } from "lucide-react";
import type { BankAccount, View } from "../types/app";

type Props = {
  bankForm: BankAccount;
  savingBank: boolean;
  onBankFormChange: (field: keyof BankAccount, value: string) => void;
  onSaveBank: () => Promise<void> | void;
  onContinue: (view: View) => void;
};

const POPULAR_BANKS = [
  { name: "HDFC Bank",           color: "#e8192c", bg: "#fef2f2", letter: "H" },
  { name: "ICICI Bank",          color: "#f37322", bg: "#fff7ed", letter: "I" },
  { name: "Axis Bank",           color: "#97144d", bg: "#fdf2f8", letter: "A" },
  { name: "State Bank of India", color: "#10B981", bg: "#ECFDF5", letter: "S" },
];

type Step = "pick" | "form";

export function OnboardingBankScreen({ bankForm, savingBank, onBankFormChange, onSaveBank, onContinue }: Props) {
  const [step, setStep]         = useState<Step>("pick");
  const [search, setSearch]     = useState("");
  const [pickedBank, setPickedBank] = useState("");

  const filtered = POPULAR_BANKS.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase())
  );

  function handlePickBank(name: string) {
    setPickedBank(name);
    onBankFormChange("bankName", name);
    setStep("form");
  }

  const canSave =
    bankForm.accountHolderName.trim() &&
    bankForm.accountNumber.trim() &&
    bankForm.ifscCode.trim() &&
    bankForm.bankName.trim();

  const handleSaveAndContinue = async () => {
    await onSaveBank();
    onContinue("onboarding-done");
  };

  return (
    <div className="ob-screen">
      {/* Step indicator */}
      <div className="ob-step-bar">
        <div className="ob-step-dot ob-step-dot--done" />
        <div className="ob-step-line ob-step-line--done" />
        <div className="ob-step-dot ob-step-dot--active" />
      </div>

      {/* Header */}
      <div className="ob-header">
        <div className="ob-header-icon">
          <Landmark size={28} color="var(--brand)" strokeWidth={1.8} />
        </div>
        <div className="ob-step-label">Step 2 of 2</div>
        <h1 className="ob-title">Connect your salary account</h1>
        <p className="ob-subtitle">
          Your salary advance will be disbursed directly to this account.
        </p>
      </div>

      {step === "pick" && (
        <div className="ob-bank-pick">
          {/* Search */}
          <div className="ob-bank-search-wrap">
            <Search size={15} color="var(--t3)" />
            <input
              className="ob-bank-search"
              type="text"
              placeholder="Search your bank"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="ob-bank-section-label">Popular banks</div>

          <div className="ob-bank-list">
            {filtered.map((bank) => (
              <button
                key={bank.name}
                type="button"
                className="ob-bank-row"
                onClick={() => handlePickBank(bank.name)}
              >
                <div className="ob-bank-logo" style={{ background: bank.bg, color: bank.color }}>
                  {bank.letter}
                </div>
                <span className="ob-bank-name">{bank.name}</span>
                <ChevronRight size={16} color="var(--t3)" />
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="ob-bank-empty">No banks found — enter details manually below</div>
            )}
          </div>

          <button
            type="button"
            className="ob-bank-manual-btn"
            onClick={() => setStep("form")}
          >
            Enter bank details manually
          </button>
        </div>
      )}

      {step === "form" && (
        <div className="ob-bank-form">
          {pickedBank && (
            <div className="ob-bank-selected">
              {(() => {
                const b = POPULAR_BANKS.find((x) => x.name === pickedBank);
                return b ? (
                  <>
                    <div className="ob-bank-logo" style={{ background: b.bg, color: b.color }}>{b.letter}</div>
                    <span className="ob-bank-selected-name">{b.name}</span>
                  </>
                ) : <span className="ob-bank-selected-name">{pickedBank}</span>;
              })()}
              <button
                type="button"
                className="ob-bank-change-btn"
                onClick={() => { setStep("pick"); setPickedBank(""); onBankFormChange("bankName", ""); }}
              >
                Change
              </button>
            </div>
          )}

          <ObBankField label="Account holder name"  value={bankForm.accountHolderName} placeholder="Full name as per bank"    onChange={(v) => onBankFormChange("accountHolderName", v)} />
          <ObBankField label="Account number"        value={bankForm.accountNumber}      placeholder="Enter account number"     onChange={(v) => onBankFormChange("accountNumber", v)}      type="number" />
          <ObBankField label="IFSC code"             value={bankForm.ifscCode}           placeholder="e.g. HDFC0001234"         onChange={(v) => onBankFormChange("ifscCode", v.toUpperCase())} />
          <ObBankField label="UPI ID (optional)"     value={bankForm.upiId ?? ""}        placeholder="e.g. name@upi"            onChange={(v) => onBankFormChange("upiId", v)} />

          <div className="ob-bank-security">
            <ShieldCheck size={13} color="#16a34a" />
            Your bank details are 100% secure · We never store credentials
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="ob-cta-area">
        {step === "form" ? (
          <button
            type="button"
            className="ob-cta-btn"
            disabled={!canSave || savingBank}
            onClick={handleSaveAndContinue}
          >
            {savingBank ? (
              <span className="ob-spinner" />
            ) : (
              <>
                Save &amp; Continue
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </>
            )}
          </button>
        ) : (
          /* Still on bank-picker step — show a disabled CTA so user knows they must pick a bank */
          <button type="button" className="ob-cta-btn" disabled>
            Select a bank to continue
          </button>
        )}
        <p className="ob-mandatory-note">
          A bank account is required to receive salary advance disbursements.
        </p>
      </div>
    </div>
  );
}

function ObBankField({
  label, value, placeholder, type = "text", onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  type?: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="ob-bank-field">
      <label className="ob-bank-field-label">{label}</label>
      <input
        className="ob-bank-field-input"
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
