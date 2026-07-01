import { useEffect, useRef, useState } from "react";
import {
  Bell,
  BookOpen,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  CreditCard,
  Crown,
  FileText,
  HelpCircle,
  Info,
  KeyRound,
  LogOut,
  MessageSquare,
  ScrollText,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { employeeApi, getFileUrl, type AppInfoItem } from "../services/api";
import type { AppState, BankAccount, KycDocumentType, View } from "../types/app";
import { maskAccountNumber } from "../utils/format";
import { SubPageHeader } from "../components/layout/SubPageHeader";
import { OnboardingKycScreen } from "./OnboardingKycScreen";
import { OnboardingBankScreen } from "./OnboardingBankScreen";

type ProfileScreenProps = {
  appState: AppState;
  onLogout: () => void;
  onNavigate: (view: View) => void;
  uploadKycDocument: (type: KycDocumentType, file: File) => void;
  uploadingKycType: KycDocumentType | null;
  uploadProfilePhoto: (file: File) => void;
  uploadingPhoto: boolean;
  bankForm: BankAccount;
  editingBank: boolean;
  savingBank: boolean;
  onStartBankEdit: () => void;
  onCancelBankEdit: () => void;
  onSaveBank: () => void;
  onUpdateUpiId: () => void;
  onBankFormChange: (field: keyof BankAccount, value: string) => void;
  initialSection?: "kyc" | "bank" | "membership";
};

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map((n) => n[0]?.toUpperCase() ?? "").join("");
}

// Render markdown-like bold (**text**) as inline spans
function RenderContent({ text }: { text: string }) {
  return (
    <div className="prof-info-content">
      {text.split("\n").map((line, i) => {
        const parts = line.split(/\*\*(.*?)\*\*/g);
        return (
          <p key={i}>
            {parts.map((part, j) =>
              j % 2 === 1 ? <strong key={j}>{part}</strong> : part
            )}
          </p>
        );
      })}
    </div>
  );
}

// Expandable info accordion row
function InfoRow({ icon, title, content }: { icon: React.ReactNode; title: string; content: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="prof-info-row">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="prof-info-button"
      >
        <div className="prof-row-icon" style={{ background: "#F0ECFF", color: "#6B45F4" }}>
          {icon}
        </div>
        <div className="prof-row-main">
          <div className="prof-row-title">{title}</div>
        </div>
        {open
          ? <ChevronUp size={15} color="var(--border)" style={{ flexShrink: 0 }} />
          : <ChevronDown size={15} color="var(--border)" style={{ flexShrink: 0 }} />
        }
      </button>
      {open && (
        <div className="prof-info-panel">
          <RenderContent text={content} />
        </div>
      )}
    </div>
  );
}

// Card wrapper — same width/style as the salary card
function ProfileCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div className="prof-card-wrap">
      <div className="prof-card" style={style}>
        {children}
      </div>
    </div>
  );
}

// Section header label — purple theme color
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="prof-section-label">{children}</div>
  );
}

// Settings row inside a card
function SettingsRow({ icon, iconBg, iconColor, label, sub, onClick, danger }: {
  icon: React.ReactNode; iconBg?: string; iconColor?: string; label: string; sub?: string; onClick?: () => void; danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`prof-row ${danger ? "prof-row--danger" : ""}`}
    >
      <div
        className="prof-row-icon"
        style={{
          background: danger ? "#FFF0EE" : (iconBg ?? "#F0ECFF"),
          color: danger ? "#D74715" : (iconColor ?? "#6B45F4"),
        }}
      >
        {icon}
      </div>
      <div className="prof-row-main">
        <div className="prof-row-title">{label}</div>
        {sub && <div className="prof-row-sub">{sub}</div>}
      </div>
      <ChevronRight size={15} color="var(--border)" style={{ flexShrink: 0 }} />
    </button>
  );
}

const INFO_ICONS: Record<string, React.ReactNode> = {
  ABOUT: <Info size={16} />,
  HOW_IT_WORKS: <Sparkles size={16} />,
  FAQ: <HelpCircle size={16} />,
  WHATS_NEW: <BookOpen size={16} />,
  PRIVACY_POLICY: <ShieldCheck size={16} />,
  TERMS_CONDITIONS: <ScrollText size={16} />,
  CONTACT: <MessageSquare size={16} />,
};

export function ProfileScreen({
  appState,
  onLogout,
  onNavigate,
  uploadProfilePhoto,
  uploadKycDocument,
  uploadingKycType,
  bankForm,
  savingBank,
  onSaveBank,
  onUpdateUpiId,
  onBankFormChange,
  initialSection,
}: ProfileScreenProps) {
  const { profile, membershipActive, membershipConfig } = appState;
  const _photoRef = useRef<HTMLInputElement>(null); // photo upload moved to AppShell header avatar
  const [appInfo, setAppInfo] = useState<AppInfoItem[]>([]);

  useEffect(() => {
    employeeApi.getAppInformation().then(setAppInfo).catch(() => {});
  }, []);

  const kycVerified =
    appState.documents.every((d) => d.status === "Verified") &&
    appState.documents.length > 0;
  const bankLinked = !!appState.bankAccount?.accountNumber;

  // ── KYC sub-page ──────────────────────────────────────────
  if (initialSection === "kyc") {
    return (
      <div className="prof-screen">
        <SubPageHeader title="KYC Documents" onBack={() => onNavigate("profile")} />
        <div className="screen-body profile-subpage-body profile-kyc-subpage" style={{ background: "var(--bg)" }}>
          <OnboardingKycScreen
            documents={appState.documents}
            uploadingKycType={uploadingKycType}
            onUpload={uploadKycDocument}
            onContinue={() => onNavigate("profile")}
            bankConnected={!!appState.bankAccount?.accountNumber}
          />
        </div>
      </div>
    );
  }

  // ── Bank sub-page ──────────────────────────────────────────
  if (initialSection === "bank") {
    const bank = appState.bankAccount;
    const hasBankAccount = !!bank?.accountNumber;
    const isVerified = !!bank?.verified;
    return (
      <div className="prof-screen">
        <SubPageHeader title="Bank Account" onBack={() => onNavigate("profile")} />
        <div className="screen-body profile-subpage-body" style={{ background: "var(--bg)", padding: "0 0 24px" }}>
          {hasBankAccount ? (
            // ── Show existing bank details ────────────────────────────
            <>
              <div className="profile-bank-content">
                {/* Status badge */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 0 6px" }}>
                  <span className={`chip ${isVerified ? "chip-green" : "chip-amber"}`}><span className="chip-dot" /> {isVerified ? "Verified" : "Pending review"}</span>
                  <span style={{ fontSize: 11, color: "#9CA3AF" }}>{isVerified ? "Linked salary account" : "Submitted for verification"}</span>
                </div>
                {/* Bank card */}
                <div className="profile-bank-card">
                  <div className="profile-bank-name">{bank!.bankName || "Bank Account"}</div>
                  <div className="profile-bank-number">
                    {maskAccountNumber(bank!.accountNumber)}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                    <div>
                      <div className="profile-bank-mini-label">Account Holder</div>
                      <div className="profile-bank-mini-value">{bank!.accountHolderName || "—"}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div className="profile-bank-mini-label">IFSC</div>
                      <div className="profile-bank-mini-value">{bank!.ifscCode || "—"}</div>
                    </div>
                  </div>
                </div>
                {/* Info rows */}
                <div className="profile-bank-list-card">
                  {[
                    { label: "Bank Name", value: bank!.bankName },
                    { label: "Account Number", value: maskAccountNumber(bank!.accountNumber) },
                    { label: "IFSC Code", value: bank!.ifscCode },
                    { label: "Account Holder", value: bank!.accountHolderName },
                    ...(bank!.upiId ? [{ label: "UPI ID", value: bank!.upiId }] : []),
                  ].map((row, i, arr) => (
                    <div key={row.label}>
                      <div className="profile-bank-info-row">
                        <span style={{ fontSize: 12, color: "#9CA3AF", fontWeight: 600 }}>{row.label}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#0F0A3C" }}>{row.value || "—"}</span>
                      </div>
                      {i < arr.length - 1 && <div className="profile-subpage-row-gap" />}
                    </div>
                  ))}
                  <div className="profile-bank-upi-inline">
                    <div className="profile-bank-upi-title">UPI ID</div>
                    <div className="mp-field">
                      <input
                        className="mp-input"
                        value={bankForm.upiId ?? ""}
                        placeholder="name@bank"
                        onChange={(event) => onBankFormChange("upiId", event.target.value)}
                      />
                    </div>
                    <button
                      type="button"
                      className="mp-btn-secondary"
                      disabled={savingBank}
                      onClick={onUpdateUpiId}
                    >
                      {savingBank ? "Saving..." : "Update UPI ID"}
                    </button>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: "#9CA3AF", display: "flex", alignItems: "center", gap: 6, marginBottom: 16 }}>
                  <ShieldCheck size={12} color={isVerified ? "#16A34A" : "#D97706"} /> {isVerified ? "Account verified and linked for salary advances" : "Your bank account is pending admin verification"}
                </div>
                <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 14, padding: "12px 14px", color: "#92400E", fontSize: 12, lineHeight: 1.55 }}>
                  To change your verified bank account, contact MobPae support. A new account will need verification before future advances.
                </div>
              </div>
            </>
          ) : (
            // ── No bank linked — show add form ────────────────────────
            <OnboardingBankScreen
              bankForm={bankForm}
              savingBank={savingBank}
              onBankFormChange={onBankFormChange}
              onSaveBank={onSaveBank}
              onContinue={() => onNavigate("profile")}
              kycSubmitted={appState.documents.length > 0}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="prof-screen">
      <div className="screen-body prof-v5-body">

        {/* ── Dark hero ── */}
        <section className="prof-v5-hero">
          {/* Avatar */}
          <div className="prof-v5-avatar">
            {profile.profilePhotoUrl
              ? <img src={getFileUrl(profile.profilePhotoUrl)} alt={profile.name} />
              : getInitials(profile.name || "M")
            }
          </div>

          {/* Name */}
          <div className="prof-v5-name">{profile.name || "Employee"}</div>

          {/* Employer · code */}
          {(profile.employeeCode || profile.employer) && (
            <div className="prof-v5-meta">
              {[profile.employeeCode, profile.employer].filter(Boolean).join(" · ")}
            </div>
          )}

          {/* Email */}
          {profile.email && (
            <div className="prof-v5-email">{profile.email}</div>
          )}

          {/* Status badges */}
          <div className="prof-v5-badges">
            <span className={`prof-v5-badge${membershipActive ? " prof-v5-badge--g" : ""}`}>
              <Crown size={10} />{membershipActive ? "Active Plan" : "Free"}
            </span>
            <span className={`prof-v5-badge${kycVerified ? " prof-v5-badge--g" : " prof-v5-badge--a"}`}>
              <ShieldCheck size={10} />{kycVerified ? "KYC Done" : "KYC Pending"}
            </span>
            <span className={`prof-v5-badge${bankLinked ? " prof-v5-badge--b" : ""}`}>
              <CreditCard size={10} />{bankLinked ? "Bank Linked" : "No Bank"}
            </span>
          </div>
        </section>

        {/* ── White settings sheet ── */}
        <div className="prof-v5-sheet">

          {/* Single card — all rows */}
          <div className="prof-v5-group">
            <SettingsRow
              icon={<CreditCard size={16} />}
              iconBg="#E8EDF8" iconColor="#2D5BE3"
              label="Bank Account"
              sub={bankLinked ? `${appState.bankAccount!.bankName} · ${maskAccountNumber(appState.bankAccount!.accountNumber)}` : "Add your salary account"}
              onClick={() => onNavigate("profile-bank")}
            />
            <SettingsRow
              icon={<FileText size={16} />}
              iconBg="#E8F6EE" iconColor="#1A8A4A"
              label="KYC Documents"
              sub={kycVerified ? "All verified ✓" : "View & upload docs"}
              onClick={() => onNavigate("profile-kyc")}
            />
            <SettingsRow
              icon={<Crown size={16} />}
              iconBg={membershipActive ? "#E8F6EE" : "#EDE8FF"}
              iconColor={membershipActive ? "#1A8A4A" : "#6B45F4"}
              label={membershipActive ? "My Membership" : "Activate Plan"}
              sub={membershipActive ? (membershipConfig?.planName || "Active plan") : "Enable salary advance access"}
              onClick={() => onNavigate("profile-membership")}
            />
            <SettingsRow
              icon={<Bell size={16} />}
              iconBg="#FFF8E8" iconColor="#C97C15"
              label="Notifications"
              sub="Manage your alerts"
              onClick={() => onNavigate("notifications")}
            />
            <SettingsRow
              icon={<KeyRound size={16} />}
              iconBg="#EDE8FF" iconColor="#6B45F4"
              label="Change Password"
              sub="Update your login password"
              onClick={() => onNavigate("change-password")}
            />
            {appInfo.map((item) => (
              <InfoRow
                key={item.id}
                icon={INFO_ICONS[item.type] ?? <Info size={16} />}
                title={item.title}
                content={item.content}
              />
            ))}
            <SettingsRow
              icon={<LogOut size={16} />}
              label="Sign Out"
              sub="Log out of MobPae"
              danger
              onClick={onLogout}
            />
          </div>

          <div className="prof-v5-footer">MobPae v2.0</div>
        </div>

      </div>
    </div>
  );
}
