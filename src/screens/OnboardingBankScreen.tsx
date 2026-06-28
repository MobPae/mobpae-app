import { useState } from "react";
import { ArrowRight, Building2, ChevronRight, Landmark, Search, ShieldCheck } from "lucide-react";
import type { BankAccount, View } from "../types/app";

type Props = {
  bankForm: BankAccount;
  savingBank: boolean;
  onBankFormChange: (field: keyof BankAccount, value: string) => void;
  onSaveBank: () => Promise<void> | void;
  onContinue: (view: View) => void;
  showProgress?: boolean;
};

const POPULAR_BANKS = [
  { name: "HDFC Bank",           letter: "H", color: "#e8192c" },
  { name: "ICICI Bank",          letter: "I", color: "#f37322" },
  { name: "Axis Bank",           letter: "A", color: "#97144d" },
  { name: "SBI",                 letter: "S", color: "#1a3c8f" },
  { name: "Kotak Bank",          letter: "K", color: "#ed1c24" },
  { name: "Yes Bank",            letter: "Y", color: "#00599d" },
  { name: "IndusInd Bank",       letter: "I", color: "#006fba" },
  { name: "Punjab National",     letter: "P", color: "#e31837" },
  { name: "Bank of Baroda",      letter: "B", color: "#f58220" },
  { name: "Canara Bank",         letter: "C", color: "#006a4e" },
];

type Step = "pick" | "form";

export function OnboardingBankScreen({ bankForm, savingBank, onBankFormChange, onSaveBank, onContinue, showProgress = true }: Props) {
  const [step, setStep] = useState<Step>("pick");
  const [search, setSearch] = useState("");

  const filtered = POPULAR_BANKS.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase())
  );

  function pickBank(name: string) {
    onBankFormChange("bankName", name);
    setStep("form");
  }

  return (
    <div className="onb-screen">
      {/* Progress */}
      {showProgress && (
        <div className="onb-progress-inline">
          <div className="onb-progress-track">
            {["KYC", "Bank", "Done"].map((label, i) => (
              <div key={label} style={{ flex: 1, display: "flex", alignItems: "center" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                    background: i <= 1 ? "#5B3CE3" : "#F3F1FF",
                    color: i <= 1 ? "white" : "#9CA3AF",
                    fontSize: 12, fontWeight: 800, border: i <= 1 ? "none" : "1.5px solid #E5E7EB",
                  }}>
                    {i + 1}
                  </div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: i <= 1 ? "#5B3CE3" : "#9CA3AF", textTransform: "uppercase" }}>{label}</div>
                </div>
                {i < 2 && <div style={{ flex: 1, height: 2, background: i < 1 ? "#5B3CE3" : "#F3F1FF", margin: "0 4px", marginBottom: 16 }} />}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hero */}
      <div className="onb-hero" style={{ background: "white" }}>
        <div className="onb-hero-text">
          <div className="onb-hero-title">Bank Account</div>
          <div className="onb-hero-sub">
            Add your salary account to receive advances and for auto-repayment.
          </div>
        </div>
        <div className="onb-hero-illus-box">
          <Landmark size={36} color="#5B3CE3" />
        </div>
      </div>

      <div className="screen-body onb-body" style={{ padding: "12px 16px" }}>

        {step === "pick" ? (
          <>
            {/* Search */}
            <div className="mp-input-wrap" style={{ marginBottom: 12 }}>
              <span className="mp-input-icon"><Search size={16} /></span>
              <input
                className="mp-input"
                type="text"
                placeholder="Search your bank..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            {/* Bank grid */}
            <div style={{ background: "white", borderRadius: 16, border: "1px solid #F0EEFF", overflow: "hidden", marginBottom: 12 }}>
              {filtered.map((bank) => (
                <button
                  key={bank.name}
                  type="button"
                  onClick={() => pickBank(bank.name)}
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 16px", borderBottom: "1px solid #F3F1FF", width: "100%", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", textAlign: "left", borderBottomWidth: 1, borderBottomStyle: "solid", borderBottomColor: "#F3F1FF" }}
                >
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: bank.color + "1a", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 15, color: bank.color, flexShrink: 0 }}>
                    {bank.letter}
                  </div>
                  <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: "#0F0A3C" }}>{bank.name}</span>
                  <ChevronRight size={16} color="#9CA3AF" />
                </button>
              ))}
              {filtered.length === 0 && (
                <div style={{ padding: "20px 16px", textAlign: "center", color: "#9CA3AF", fontSize: 13 }}>No banks found</div>
              )}
            </div>

            {/* Manual entry */}
            <button
              type="button"
              onClick={() => setStep("form")}
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: "white", borderRadius: 12, border: "1.5px dashed #C4BBFF", width: "100%", cursor: "pointer", fontFamily: "inherit", marginBottom: 12 }}
            >
              <Building2 size={20} color="#5B3CE3" />
              <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: "#5B3CE3", textAlign: "left" }}>Enter bank details manually</span>
              <ChevronRight size={16} color="#5B3CE3" />
            </button>
          </>
        ) : (
          <>
            {/* Manual form */}
            {bankForm.bankName && (
              <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#F9F8FF", borderRadius: 12, padding: "10px 14px", marginBottom: 12 }}>
                <Landmark size={16} color="#5B3CE3" />
                <span style={{ fontSize: 14, fontWeight: 600, color: "#5B3CE3" }}>{bankForm.bankName}</span>
                <button type="button" onClick={() => { onBankFormChange("bankName", ""); setStep("pick"); }} style={{ marginLeft: "auto", fontSize: 11, color: "#9CA3AF", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>Change</button>
              </div>
            )}

            {[
              { field: "bankName" as keyof BankAccount, label: "Bank Name", placeholder: "e.g. HDFC Bank", type: "text" },
              { field: "accountHolderName" as keyof BankAccount, label: "Account Holder Name", placeholder: "As per bank records", type: "text" },
              { field: "accountNumber" as keyof BankAccount, label: "Account Number", placeholder: "Enter account number", type: "text" },
              { field: "ifscCode" as keyof BankAccount, label: "IFSC Code", placeholder: "e.g. HDFC0001234", type: "text" },
              { field: "upiId" as keyof BankAccount, label: "UPI ID (Optional)", placeholder: "e.g. name@upi", type: "text" },
            ].map(({ field, label, placeholder, type }) => (
              <div key={field} className="mp-field">
                <label className="mp-label">{label}</label>
                <div className="mp-input-wrap">
                  <input
                    className="mp-input"
                    type={type}
                    placeholder={placeholder}
                    value={(bankForm[field] as string) || ""}
                    onChange={e => onBankFormChange(field, e.target.value)}
                  />
                </div>
              </div>
            ))}

            <div style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
              <ShieldCheck size={12} color="#16A34A" /> Your bank details are encrypted and never shared.
            </div>
          </>
        )}

        <div className="mp-bottom-space" />
      </div>

      {/* Footer */}
      <div className="onb-footer">
        {step === "form" && (
          <button
            type="button"
            className="mp-btn-primary"
            disabled={savingBank || !bankForm.accountNumber || !bankForm.ifscCode || !bankForm.accountHolderName}
            style={{ marginBottom: 8 }}
            onClick={async () => { await onSaveBank(); onContinue("onboarding-done"); }}
          >
            {savingBank ? <span className="mp-spinner" /> : <>Save & Continue <ArrowRight size={16} /></>}
          </button>
        )}
        <button
          type="button"
          className={step === "form" ? "mp-btn-outline" : "mp-btn-primary"}
          onClick={() => onContinue("onboarding-done")}
        >
          {step === "pick" ? <>Skip for now <ArrowRight size={16} /></> : "Skip"}
        </button>
        <div className="onb-secure-note" style={{ marginTop: 8 }}>
          <ShieldCheck size={12} /> 256-bit encrypted · RBI compliant
        </div>
      </div>
    </div>
  );
}
