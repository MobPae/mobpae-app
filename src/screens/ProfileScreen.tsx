import { useRef, useState } from "react";
import {
  Bell,
  Building2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  CircleHelp,
  CreditCard,
  Crown,
  FileText,
  IdCard,
  LogOut,
  Search,
  ShieldCheck,
  UploadCloud,
  Wallet,
} from "lucide-react";
import type { AppState, BankAccount, KycDocumentType, View } from "../types/app";
import { formatMoney, maskAccountNumber } from "../utils/format";

type ProfileScreenProps = {
  appState: AppState;
  onLogout: () => void;
  onNavigate: (view: View) => void;
  uploadKycDocument: (type: KycDocumentType, file: File) => void;
  uploadingKycType: KycDocumentType | null;
  bankForm: BankAccount;
  editingBank: boolean;
  savingBank: boolean;
  onStartBankEdit: () => void;
  onCancelBankEdit: () => void;
  onSaveBank: () => void;
  onBankFormChange: (field: keyof BankAccount, value: string) => void;
};

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map((n) => n[0]?.toUpperCase() ?? "").join("");
}

const KYC_DOCS: { type: KycDocumentType; label: string; hint: string }[] = [
  { type: "PAN",         label: "PAN Card",    hint: "PDF or image of your PAN card" },
  { type: "AADHAR",      label: "Aadhaar",     hint: "Front & back of Aadhaar card" },
  { type: "SALARY_SLIP", label: "Salary Slip", hint: "Last 1–3 months salary slip" },
];

const STATUS_COLOR: Record<string, string> = {
  Verified:      "#16a34a",
  "Under Review":"#0369a1",
  Rejected:      "#dc2626",
  "Not Uploaded":"#94a3b8",
};
const STATUS_BG: Record<string, string> = {
  Verified:      "#f0fdf4",
  "Under Review":"#e0f2fe",
  Rejected:      "#fee2e2",
  "Not Uploaded":"#f8fafc",
};

const POPULAR_BANKS = [
  { name: "HDFC Bank",           color: "#e8192c", bg: "#fef2f2", letter: "H" },
  { name: "ICICI Bank",          color: "#f37322", bg: "#fff7ed", letter: "I" },
  { name: "Axis Bank",           color: "#97144d", bg: "#fdf2f8", letter: "A" },
  { name: "State Bank of India", color: "#2563eb", bg: "#eff6ff", letter: "S" },
];

export function ProfileScreen({
  appState,
  onLogout,
  onNavigate,
  uploadKycDocument,
  uploadingKycType,
  bankForm,
  editingBank,
  savingBank,
  onStartBankEdit,
  onCancelBankEdit,
  onSaveBank,
  onBankFormChange,
}: ProfileScreenProps) {
  const { profile, bankAccount, documents, membershipActive } = appState;

  const [empOpen,    setEmpOpen]    = useState(false);
  const [kycOpen,    setKycOpen]    = useState(false);
  const [bankOpen,   setBankOpen]   = useState(false);
  const [bankSearch, setBankSearch] = useState("");
  const [pickedBank, setPickedBank] = useState<string | null>(null);

  const kycVerified = documents.length > 0 && documents.every((d) => d.status === "Verified");
  const bankLabel   = bankAccount
    ? `${bankAccount.bankName || "Bank"} ··· ${maskAccountNumber(bankAccount.accountNumber).slice(-4)}`
    : "Not added";
  const bankStatus  = bankAccount ? (bankAccount.verified ? "Verified" : "Pending") : null;

  const filteredBanks = POPULAR_BANKS.filter(b =>
    b.name.toLowerCase().includes(bankSearch.toLowerCase())
  );

  function handlePickBank(name: string) {
    setPickedBank(name);
    onStartBankEdit();
    // small delay so editingBank flips first
    setTimeout(() => onBankFormChange("bankName", name), 0);
  }

  function handleCancelBank() {
    setPickedBank(null);
    onCancelBankEdit();
  }

  return (
    <div className="profile-screen">

      {/* ── Screen header ─────────────────────────────────────────── */}
      <div className="screen-header">
        <div className="screen-header-text">
          <h2>Profile</h2>
        </div>
      </div>

      {/* ── User card ──────────────────────────────────────────────── */}
      <div className="profile-user-card">
        <div className="profile-avatar-lg">{getInitials(profile.name)}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="profile-user-name">{profile.name || "—"}</div>
          <div className="profile-user-phone">{profile.phone || "—"}</div>
          <div className="profile-user-email">{profile.email || "—"}</div>
          <div style={{ display: "flex", gap: 6, marginTop: 7, flexWrap: "wrap" }}>
            {kycVerified && (
              <span className="profile-kyc-badge">
                <ShieldCheck size={11} /> KYC Verified
              </span>
            )}
            {membershipActive && (
              <span className="profile-mem-badge">
                <Crown size={11} /> Active
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Employment (collapsable) ───────────────────────────────── */}
      <div className="profile-section">
        <div className="profile-section-title">Employment</div>
        <div className="profile-section-cards">
          <button
            type="button"
            className="profile-row"
            style={{ width: "100%", textAlign: "left" }}
            onClick={() => setEmpOpen(o => !o)}
          >
            <div className="profile-row-icon"><Building2 size={16} /></div>
            <div className="profile-row-body">
              <div className="profile-row-label">Employer</div>
              <div className="profile-row-value">{profile.employer || "—"}</div>
            </div>
            <span style={{ marginLeft: 8, color: "var(--t3)" }}>
              {empOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </span>
          </button>

          {empOpen && (
            <div className="profile-emp-expand">
              <div className="profile-emp-row">
                <div className="profile-row-icon"><IdCard size={15} /></div>
                <div className="profile-row-body">
                  <div className="profile-row-label">Employee ID</div>
                  <div className="profile-row-value">{profile.employeeCode || "—"}</div>
                </div>
              </div>
              <div className="profile-emp-divider" />
              <div className="profile-emp-row">
                <div className="profile-row-icon"><Wallet size={15} /></div>
                <div className="profile-row-body">
                  <div className="profile-row-label">Advance limit</div>
                  <div className="profile-row-value">
                    {profile.salaryLimit > 0 ? formatMoney(profile.salaryLimit) : "—"}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── KYC documents (collapsable) ───────────────────────────── */}
      <div className="profile-section">
        <div className="profile-section-title">KYC Documents</div>
        <div className="profile-section-cards">
          <button
            type="button"
            className="profile-row"
            style={{ width: "100%", textAlign: "left" }}
            onClick={() => setKycOpen(o => !o)}
          >
            <div className="profile-row-icon"><ShieldCheck size={16} /></div>
            <div className="profile-row-body">
              <div className="profile-row-label">KYC verification</div>
              <div className="profile-row-value" style={{ fontSize: 12 }}>
                {documents.length === 0
                  ? "No documents uploaded"
                  : `${documents.filter(d => d.status === "Verified").length}/${documents.length} verified`}
              </div>
            </div>
            <span className={`profile-row-right ${kycVerified ? "verified" : "pending"}`}>
              {kycVerified ? "Verified" : "Pending"}
            </span>
            <span style={{ marginLeft: 8, color: "var(--t3)" }}>
              {kycOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </span>
          </button>

          {kycOpen && (
            <div className="profile-kyc-expand">
              {KYC_DOCS.map(({ type, label, hint }) => {
                const doc = documents.find(
                  d => d.documentType === type ||
                    d.label.toUpperCase().replace("AADHAAR", "AADHAR").replaceAll(" ", "_") === type
                );
                const status   = doc?.status ?? "Not Uploaded";
                const uploading = uploadingKycType === type;
                return (
                  <KycUploadCard
                    key={type}
                    type={type}
                    label={label}
                    hint={hint}
                    status={status}
                    note={doc?.note}
                    uploading={uploading}
                    onUpload={uploadKycDocument}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Bank account (collapsable + bank picker) ──────────────── */}
      <div className="profile-section">
        <div className="profile-section-title">Bank Account</div>
        <div className="profile-section-cards">

          {/* Toggle row */}
          <button
            type="button"
            className="profile-row"
            style={{ width: "100%", textAlign: "left" }}
            onClick={() => { setBankOpen(o => !o); setBankSearch(""); }}
          >
            <div className="profile-row-icon"><CreditCard size={16} /></div>
            <div className="profile-row-body">
              <div className="profile-row-label">Bank account</div>
              <div className="profile-row-value">{bankLabel}</div>
            </div>
            {bankStatus && (
              <span className={`profile-row-right ${bankStatus === "Verified" ? "verified" : "pending"}`}>
                {bankStatus}
              </span>
            )}
            <span style={{ marginLeft: 8, color: "var(--t3)" }}>
              {bankOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </span>
          </button>

          {bankOpen && (
            <div className="profile-bank-expand">

              {/* ── Saved bank → read-only or edit form ── */}
              {bankAccount && !editingBank && (
                <div className="profile-bank-detail">
                  <BankDetailRow label="Account holder" value={bankAccount.accountHolderName} />
                  <BankDetailRow label="Bank"           value={bankAccount.bankName} />
                  <BankDetailRow label="Account number" value={maskAccountNumber(bankAccount.accountNumber)} />
                  <BankDetailRow label="IFSC code"      value={bankAccount.ifscCode} />
                  {bankAccount.upiId && <BankDetailRow label="UPI ID" value={bankAccount.upiId} />}
                  <button type="button" className="profile-bank-edit-btn" onClick={() => handlePickBank(bankAccount.bankName)}>
                    Edit bank details
                  </button>
                </div>
              )}

              {/* ── No bank yet → bank picker ── */}
              {!bankAccount && !editingBank && !pickedBank && (
                <div className="bank-picker">
                  <div className="bank-picker-search-wrap">
                    <Search size={15} color="var(--t3)" />
                    <input
                      className="bank-picker-search"
                      type="text"
                      placeholder="Search your bank"
                      value={bankSearch}
                      onChange={e => setBankSearch(e.target.value)}
                    />
                  </div>

                  <div className="bank-picker-section-label">Popular banks</div>

                  <div className="bank-picker-list">
                    {filteredBanks.map(bank => (
                      <button
                        key={bank.name}
                        type="button"
                        className="bank-picker-row"
                        onClick={() => handlePickBank(bank.name)}
                      >
                        <div
                          className="bank-picker-logo"
                          style={{ background: bank.bg, color: bank.color }}
                        >
                          {bank.letter}
                        </div>
                        <span className="bank-picker-name">{bank.name}</span>
                        <ChevronRight size={16} color="var(--t3)" />
                      </button>
                    ))}
                    {filteredBanks.length === 0 && (
                      <div className="bank-picker-empty">No banks found</div>
                    )}
                  </div>

                  <div className="bank-picker-security">
                    <ShieldCheck size={13} color="#16a34a" />
                    Your bank details are 100% secure · We never store your credentials
                  </div>
                </div>
              )}

              {/* ── Bank selected or editing → account form ── */}
              {(editingBank || pickedBank) && (
                <div className="profile-bank-form">
                  {pickedBank && !bankAccount && (
                    <div className="bank-form-selected-bank">
                      {(() => {
                        const b = POPULAR_BANKS.find(b => b.name === pickedBank);
                        return b ? (
                          <>
                            <div className="bank-picker-logo" style={{ background: b.bg, color: b.color }}>{b.letter}</div>
                            <span style={{ fontWeight: 600, fontSize: 14 }}>{b.name}</span>
                          </>
                        ) : <span style={{ fontWeight: 600, fontSize: 14 }}>{pickedBank}</span>;
                      })()}
                      <button type="button" className="bank-form-change-btn" onClick={() => { setPickedBank(null); handleCancelBank(); }}>
                        Change
                      </button>
                    </div>
                  )}

                  <BankField
                    label="Account holder name"
                    value={bankForm.accountHolderName}
                    placeholder="Full name as per bank"
                    onChange={v => onBankFormChange("accountHolderName", v)}
                  />
                  <BankField
                    label="Account number"
                    value={bankForm.accountNumber}
                    placeholder="Enter account number"
                    type="number"
                    onChange={v => onBankFormChange("accountNumber", v)}
                  />
                  <BankField
                    label="IFSC code"
                    value={bankForm.ifscCode}
                    placeholder="e.g. HDFC0001234"
                    onChange={v => onBankFormChange("ifscCode", v.toUpperCase())}
                  />
                  <BankField
                    label="UPI ID (optional)"
                    value={bankForm.upiId ?? ""}
                    placeholder="e.g. name@upi"
                    onChange={v => onBankFormChange("upiId", v)}
                  />

                  <div className="profile-bank-form-actions">
                    <button type="button" className="profile-bank-cancel-btn" onClick={handleCancelBank}>
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="profile-bank-save-btn"
                      disabled={savingBank}
                      onClick={onSaveBank}
                    >
                      {savingBank ? "Saving…" : "Save account"}
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      </div>

      {/* ── Settings ──────────────────────────────────────────────── */}
      <div className="profile-section">
        <div className="profile-section-title">Settings</div>
        <div className="profile-section-cards">
          <div className="profile-row">
            <div className="profile-row-icon"><Bell size={16} /></div>
            <div className="profile-row-body">
              <div className="profile-row-label">Notifications</div>
            </div>
            <span className="profile-row-right" style={{ fontSize: 13, color: "var(--t2)", fontWeight: 500 }}>On</span>
          </div>
          <div className="profile-row">
            <div className="profile-row-icon"><CircleHelp size={16} /></div>
            <div className="profile-row-body">
              <div className="profile-row-label">Help &amp; support</div>
            </div>
            <ChevronRight size={16} className="profile-row-right chevron" />
          </div>
          <button
            type="button"
            className="profile-row danger"
            onClick={onLogout}
            style={{ width: "100%", textAlign: "left" }}
          >
            <div className="profile-row-icon"><LogOut size={16} /></div>
            <div className="profile-row-body">
              <div className="profile-row-label">Sign out</div>
            </div>
            <ChevronRight size={16} className="profile-row-right chevron" />
          </button>
        </div>
      </div>

      <div style={{ textAlign: "center", padding: "20px 0 8px", fontSize: 12, color: "var(--t3)" }}>
        MobPae v1.0 · Made with care in India
      </div>
    </div>
  );
}

/* ── Sub-components ──────────────────────────────────────────────────────── */

function KycUploadCard({
  type, label, hint, status, note, uploading, onUpload,
}: {
  type: KycDocumentType;
  label: string;
  hint: string;
  status: string;
  note?: string;
  uploading: boolean;
  onUpload: (type: KycDocumentType, file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const color = STATUS_COLOR[status] ?? "#94a3b8";
  const bg    = STATUS_BG[status]    ?? "#f8fafc";

  return (
    <div className="kyc-upload-card">
      <div className="kyc-upload-card-left">
        <div className="kyc-upload-card-icon">
          <FileText size={16} color="var(--brand)" />
        </div>
        <div>
          <div className="kyc-upload-card-label">{label}</div>
          <div className="kyc-upload-card-hint">{note || hint}</div>
        </div>
      </div>
      <div className="kyc-upload-card-right">
        <span className="kyc-status-pill" style={{ color, background: bg }}>
          {status}
        </span>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,image/jpeg,image/png,image/jpg"
          style={{ display: "none" }}
          disabled={uploading}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onUpload(type, file);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          className={`kyc-upload-btn ${uploading ? "uploading" : ""}`}
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          <UploadCloud size={13} />
          {uploading ? "Uploading…" : status === "Not Uploaded" ? "Upload" : "Re-upload"}
        </button>
      </div>
    </div>
  );
}

function BankDetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="bank-detail-row">
      <span className="bank-detail-label">{label}</span>
      <span className="bank-detail-value">{value || "—"}</span>
    </div>
  );
}

function BankField({
  label, value, placeholder, type = "text", onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  type?: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="bank-field">
      <label className="bank-field-label">{label}</label>
      <input
        className="bank-field-input"
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
