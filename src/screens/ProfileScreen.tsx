import { useEffect, useRef, useState } from "react";
import {
  Bell,
  Building2,
  CalendarCheck,
  Camera,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  CircleHelp,
  CreditCard,
  Crown,
  FileText,
  IdCard,
  KeyRound,
  LogOut,
  Search,
  ShieldCheck,
  UploadCloud,
  UserRoundCheck,
  Wallet,
} from "lucide-react";
import { getFileUrl } from "../services/api";
import type { AppState, BankAccount, KycDocumentType, View } from "../types/app";
import { formatMoney, maskAccountNumber } from "../utils/format";

type ProfileScreenProps = {
  appState: AppState;
  onLogout: () => void;
  onNavigate: (view: View) => void;
  uploadKycDocument: (type: KycDocumentType, file: File) => void;
  uploadingKycType: KycDocumentType | null;
  uploadProfilePhoto: (file: File) => void;
  uploadingPhoto: boolean;
  uploadSelfie: (file: File) => void;
  uploadingSelfie: boolean;
  bankForm: BankAccount;
  editingBank: boolean;
  savingBank: boolean;
  onStartBankEdit: () => void;
  onCancelBankEdit: () => void;
  onSaveBank: () => void;
  onBankFormChange: (field: keyof BankAccount, value: string) => void;
  initialSection?: "kyc" | "bank" | "membership";
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
  { name: "State Bank of India", color: "#059669", bg: "#eff6ff", letter: "S" },
];

export function ProfileScreen({
  appState,
  onLogout,
  onNavigate,
  uploadKycDocument,
  uploadingKycType,
  uploadProfilePhoto,
  uploadingPhoto,
  uploadSelfie,
  uploadingSelfie,
  bankForm,
  editingBank,
  savingBank,
  onStartBankEdit,
  onCancelBankEdit,
  onSaveBank,
  onBankFormChange,
  initialSection,
}: ProfileScreenProps) {
  const { profile, bankAccount, documents, membershipActive } = appState;

  const [empOpen,    setEmpOpen]    = useState(false);
  const [kycOpen,    setKycOpen]    = useState(initialSection === "kyc");
  const [bankOpen,   setBankOpen]   = useState(initialSection === "bank");

  const kycRef        = useRef<HTMLDivElement>(null);
  const bankRef       = useRef<HTMLDivElement>(null);
  const membershipRef = useRef<HTMLDivElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const selfieVideoRef = useRef<HTMLVideoElement>(null);
  const selfieCanvasRef = useRef<HTMLCanvasElement>(null);
  const selfieStreamRef = useRef<MediaStream | null>(null);
  const selfieFileInputRef = useRef<HTMLInputElement>(null);
  const [selfieCameraOpen, setSelfieCameraOpen] = useState(false);
  const [selfiePreview, setSelfiePreview] = useState("");
  const [selfieError, setSelfieError] = useState("");

  useEffect(() => {
    if (!initialSection) return;
    const target =
      initialSection === "kyc"        ? kycRef.current :
      initialSection === "bank"       ? bankRef.current :
      initialSection === "membership" ? membershipRef.current : null;
    if (target) setTimeout(() => target.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  }, [initialSection]);
  const [bankSearch, setBankSearch] = useState("");
  const [pickedBank, setPickedBank] = useState<string | null>(null);

  const kycVerified    = documents.length > 0 && documents.every((d) => d.status === "Verified") && profile.selfieStatus === "VERIFIED";
  const selfieStatus   = profile.selfieStatus;
  const selfieVerified = selfieStatus === "VERIFIED";
  const selfieRejected = selfieStatus === "REJECTED";
  const bankLabel   = bankAccount
    ? `${bankAccount.bankName || "Bank"} ··· ${maskAccountNumber(bankAccount.accountNumber).slice(-4)}`
    : "Not added";
  const bankStatus  = bankAccount ? (bankAccount.verified ? "Verified" : "Pending") : null;
  const profileStatusItems = [
    { label: "KYC", value: kycVerified ? "Verified" : "Pending", tone: kycVerified ? "ok" : "wait" },
    { label: "Bank", value: bankAccount?.verified ? "Verified" : bankAccount ? "Review" : "Add", tone: bankAccount?.verified ? "ok" : "wait" },
    { label: "Plan", value: membershipActive ? "Active" : "Inactive", tone: membershipActive ? "ok" : "wait" },
  ];

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

  async function openSelfieCamera() {
    setSelfieError("");
    setSelfiePreview("");
    setSelfieCameraOpen(true);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setSelfieCameraOpen(false);
        selfieFileInputRef.current?.click();
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      selfieStreamRef.current = stream;
      setTimeout(() => {
        if (selfieVideoRef.current) {
          selfieVideoRef.current.srcObject = stream;
          void selfieVideoRef.current.play();
        }
      }, 50);
    } catch {
      setSelfieCameraOpen(false);
      selfieFileInputRef.current?.click();
    }
  }

  function closeSelfieCamera() {
    selfieStreamRef.current?.getTracks().forEach((track) => track.stop());
    selfieStreamRef.current = null;
    setSelfieCameraOpen(false);
    setSelfiePreview("");
    setSelfieError("");
  }

  function captureSelfie() {
    const video = selfieVideoRef.current;
    const canvas = selfieCanvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth || 720;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    setSelfiePreview(canvas.toDataURL("image/jpeg", 0.92));
  }

  async function submitSelfie() {
    const canvas = selfieCanvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) {
        setSelfieError("Could not capture selfie. Please try again.");
        return;
      }
      const file = new File([blob], `mobpae-selfie-${Date.now()}.jpg`, {
        type: "image/jpeg",
      });
      uploadSelfie(file);
      closeSelfieCamera();
    }, "image/jpeg", 0.92);
  }

  function handleSelfieFile(file?: File) {
    if (!file) return;
    uploadSelfie(file);
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
        {/* Avatar with camera overlay */}
        <div className="profile-avatar-wrap">
          {profile.profilePhotoUrl ? (
            <img
              src={getFileUrl(profile.profilePhotoUrl)}
              alt={profile.name}
              className="profile-avatar-lg profile-avatar-photo"
            />
          ) : (
            <div className="profile-avatar-lg">{getInitials(profile.name)}</div>
          )}
          <button
            type="button"
            className={`profile-avatar-camera${uploadingPhoto ? " uploading" : ""}`}
            aria-label="Change photo"
            disabled={uploadingPhoto}
            onClick={() => photoInputRef.current?.click()}
          >
            {uploadingPhoto ? (
              <span className="profile-avatar-spinner" />
            ) : (
              <Camera size={13} />
            )}
          </button>
          <input
            ref={photoInputRef}
            type="file"
            accept="image/jpeg,image/png,image/jpg,image/webp"
            style={{ display: "none" }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) uploadProfilePhoto(file);
              e.target.value = "";
            }}
          />
        </div>
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
            {selfieVerified && (
              <span className="profile-kyc-badge">
                <ShieldCheck size={11} /> Selfie ✓
              </span>
            )}
            {selfieRejected && (
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                background: "#fff1f2", color: "#e11d48",
                borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 600,
              }}>
                Selfie Rejected
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

      <div className="profile-status-strip">
        {profileStatusItems.map((item) => (
          <div className="profile-status-item" key={item.label}>
            <span>{item.label}</span>
            <strong className={item.tone}>{item.value}</strong>
          </div>
        ))}
      </div>

      {/* ── Membership card ───────────────────────────────────────── */}
      <div className="profile-section" ref={membershipRef}>
        <div className="profile-section-title">Membership</div>
        <div className="profile-section-cards">
          {membershipActive ? (
            <div className="profile-mem-card">
              <div className="profile-mem-card-bg" />
              <div className="profile-mem-card-top">
                <div className="profile-mem-card-icon">
                  <Crown size={16} color="#fbbf24" />
                </div>
                <div>
                  <div className="profile-mem-card-plan">{appState.membershipConfig.planName || "Annual Access Plan"}</div>
                  <div className="profile-mem-card-since">
                    Since {appState.membershipConfig.memberSince
                      ? new Date(appState.membershipConfig.memberSince).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                      : "—"}
                  </div>
                </div>
                <span className="profile-mem-card-badge">Active</span>
              </div>
              <div className="profile-mem-card-divider" />
              <div className="profile-mem-card-bottom">
                <div className="profile-mem-card-stat">
                  <CalendarCheck size={13} />
                  <span>
                    Valid till{" "}
                    {appState.membershipConfig.validTill
                      ? new Date(appState.membershipConfig.validTill).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                      : "—"}
                  </span>
                </div>
                {appState.membershipConfig.daysRemaining != null && (
                  <div className="profile-mem-card-days">
                    {appState.membershipConfig.daysRemaining} days left
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="profile-mem-inactive">
              <div className="profile-mem-inactive-left">
                <div className="profile-mem-inactive-icon">
                  <Crown size={16} color="var(--t3)" />
                </div>
                <div>
                  <div className="profile-row-label">Membership</div>
                  <div className="profile-row-value" style={{ fontSize: 12 }}>Not activated</div>
                </div>
              </div>
              <button
                type="button"
                className="profile-mem-activate-btn"
                onClick={() => onNavigate("profile-membership")}
              >
                Activate
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Employment (collapsable) ───────────────────────────────── */}
      <div className="profile-section">
        <div className="profile-section-title">Work</div>
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
      <div className="profile-section" ref={kycRef}>
        <div className="profile-section-title">Verification</div>
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
              <div className="profile-kyc-summary">
                <div>
                  <span>Verification progress</span>
                  <strong>{kycVerified ? "All checks verified" : "Action may be required"}</strong>
                </div>
                <b>{documents.filter(d => d.status === "Verified").length}/{documents.length || KYC_DOCS.length}</b>
              </div>
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
              <div className="kyc-upload-card profile-selfie-card">
                <div className="kyc-upload-card-left">
                  {profile.selfieUrl ? (
                    <img
                      className="profile-selfie-thumb"
                      src={getFileUrl(profile.selfieUrl)}
                      alt="Selfie"
                    />
                  ) : (
                    <div className="kyc-upload-card-icon selfie">
                      <UserRoundCheck size={16} />
                    </div>
                  )}
                  <div>
                    <div className="kyc-upload-card-label">Selfie verification</div>
                    <div className="kyc-upload-card-hint">
                      {selfieVerified
                        ? "Identity selfie approved"
                        : selfieRejected
                          ? "Selfie rejected by admin"
                          : "Selfie verification is pending"}
                    </div>
                  </div>
                </div>
                <span className={`profile-selfie-status ${
                  selfieVerified ? "verified" : selfieRejected ? "rejected" : "pending"
                }`}>
                  {selfieVerified ? "Verified" : selfieRejected ? "Rejected" : "Pending"}
                </span>
                {!selfieVerified && (
                  <>
                    <input
                      ref={selfieFileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      capture="user"
                      style={{ display: "none" }}
                      disabled={uploadingSelfie}
                      onChange={(event) => {
                        handleSelfieFile(event.target.files?.[0]);
                        event.target.value = "";
                      }}
                    />
                    <button
                      type="button"
                      className="profile-selfie-capture-btn"
                      disabled={uploadingSelfie}
                      onClick={openSelfieCamera}
                    >
                      <Camera size={13} />
                      {uploadingSelfie ? "Uploading..." : selfieRejected ? "Retake" : "Capture"}
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Bank account (collapsable + bank picker) ──────────────── */}
      <div className="profile-section" ref={bankRef}>
        <div className="profile-section-title">Money</div>
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
                  <div className="profile-bank-card">
                    <div className="profile-bank-card-top">
                      <div className="profile-bank-card-icon">
                        <CreditCard size={18} />
                      </div>
                      <div>
                        <span>Salary account</span>
                        <strong>{bankAccount.bankName || "Bank account"}</strong>
                      </div>
                      <b className={bankAccount.verified ? "verified" : "pending"}>
                        {bankAccount.verified ? "Verified" : "Pending"}
                      </b>
                    </div>
                    <div className="profile-bank-number">
                      {maskAccountNumber(bankAccount.accountNumber)}
                    </div>
                  </div>
                  <div className="profile-bank-detail-grid">
                    <BankDetailRow label="Account holder" value={bankAccount.accountHolderName} />
                    <BankDetailRow label="IFSC code"      value={bankAccount.ifscCode} />
                    {bankAccount.upiId && <BankDetailRow label="UPI ID" value={bankAccount.upiId} />}
                  </div>
                  <button type="button" className="profile-bank-edit-btn" onClick={() => handlePickBank(bankAccount.bankName)}>
                    Replace bank account
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
            className="profile-row"
            onClick={() => onNavigate("change-password")}
            style={{ width: "100%", textAlign: "left" }}
          >
            <div className="profile-row-icon"><KeyRound size={16} /></div>
            <div className="profile-row-body">
              <div className="profile-row-label">Change Password</div>
            </div>
            <ChevronRight size={16} className="profile-row-right chevron" />
          </button>
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

      {selfieCameraOpen && (
        <div className="selfie-modal" role="dialog" aria-modal="true" aria-label="Capture selfie">
          <div className="selfie-sheet">
            <div className="selfie-sheet-head">
              <div>
                <span>Identity selfie</span>
                <strong>Capture your photo</strong>
              </div>
              <button type="button" onClick={closeSelfieCamera}>Close</button>
            </div>

            <div className="selfie-camera-frame">
              {selfiePreview ? (
                <img src={selfiePreview} alt="Selfie preview" />
              ) : (
                <video ref={selfieVideoRef} playsInline muted />
              )}
              <canvas ref={selfieCanvasRef} style={{ display: "none" }} />
            </div>

            {selfieError && <div className="selfie-error">{selfieError}</div>}

            <div className="selfie-actions">
              {selfiePreview ? (
                <>
                  <button type="button" className="selfie-secondary" onClick={() => setSelfiePreview("")}>
                    Retake
                  </button>
                  <button type="button" className="selfie-primary" onClick={() => void submitSelfie()}>
                    Use photo
                  </button>
                </>
              ) : (
                <button type="button" className="selfie-primary" disabled={Boolean(selfieError)} onClick={captureSelfie}>
                  Capture selfie
                </button>
              )}
            </div>
          </div>
        </div>
      )}
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
