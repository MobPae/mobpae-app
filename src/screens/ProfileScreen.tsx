import { useEffect, useRef, useState } from "react";
import {
  Bell,
  BookOpen,
  Building2,
  Camera,
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
  Mail,
  MessageSquare,
  Phone,
  ScrollText,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react";
import { getFileUrl, employeeApi, type AppInfoItem } from "../services/api";
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
  uploadSelfie: (file: File) => void;
  uploadingSelfie: boolean;
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
        <div className="prof-row-icon prof-row-icon--purple">
          {icon}
        </div>
        <div className="prof-row-main">
          <div className="prof-row-title">{title}</div>
        </div>
        {open ? <ChevronUp size={16} color="#9CA3AF" /> : <ChevronDown size={16} color="#9CA3AF" />}
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
function SettingsRow({ icon, iconBg, label, sub, onClick, danger }: {
  icon: React.ReactNode; iconBg?: string; label: string; sub?: string; onClick?: () => void; danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`prof-row ${danger ? "prof-row--danger" : ""}`}
    >
      <div
        className="prof-row-icon"
        style={{ background: danger ? "#FEF2F2" : iconBg }}
      >
        {icon}
      </div>
      <div className="prof-row-main">
        <div className="prof-row-title">{label}</div>
        {sub && <div className="prof-row-sub">{sub}</div>}
      </div>
      <ChevronRight size={16} color="#D1D5DB" />
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
  uploadSelfie,
  uploadingKycType,
  uploadingSelfie,
  bankForm,
  savingBank,
  onSaveBank,
  onUpdateUpiId,
  onBankFormChange,
  initialSection,
}: ProfileScreenProps) {
  const { profile, membershipActive, membershipConfig } = appState;
  const photoRef = useRef<HTMLInputElement>(null);
  const [appInfo, setAppInfo] = useState<AppInfoItem[]>([]);

  useEffect(() => {
    employeeApi.getAppInformation().then(setAppInfo).catch(() => {});
  }, []);

  const kycVerified =
    appState.documents.every((d) => d.status === "Verified") &&
    appState.documents.length > 0 &&
    appState.profile.selfieStatus === "VERIFIED";
  const bankLinked = !!appState.bankAccount?.accountNumber;

  // ── KYC sub-page ──────────────────────────────────────────
  if (initialSection === "kyc") {
    return (
      <div className="prof-screen">
        <SubPageHeader title="KYC Documents" onBack={() => onNavigate("profile")} />
        <div className="screen-body" style={{ background: "var(--bg)" }}>
          <OnboardingKycScreen
            documents={appState.documents}
            uploadingKycType={uploadingKycType}
            onUpload={uploadKycDocument}
            selfieStatus={appState.profile.selfieStatus}
            selfieUrl={appState.profile.selfieUrl}
            uploadingSelfie={uploadingSelfie}
            onUploadSelfie={uploadSelfie}
            onContinue={() => onNavigate("profile")}
            showProgress={false}
          />
        </div>
      </div>
    );
  }

  // ── Bank sub-page ──────────────────────────────────────────
  if (initialSection === "bank") {
    const bank = appState.bankAccount;
    const isVerified = !!bank?.accountNumber;
    return (
      <div className="prof-screen">
        <SubPageHeader title="Bank Account" onBack={() => onNavigate("profile")} />
        <div className="screen-body" style={{ background: "var(--bg)", padding: "0 0 24px" }}>
          {isVerified ? (
            // ── Show existing bank details ────────────────────────────
            <>
              <div style={{ margin: "8px 16px 0" }}>
                {/* Status badge */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 0 6px" }}>
                  <span className="chip chip-green"><span className="chip-dot" /> Verified</span>
                  <span style={{ fontSize: 11, color: "#9CA3AF" }}>Linked salary account</span>
                </div>
                {/* Bank card */}
                <div style={{ background: "linear-gradient(135deg, #5B3CE3 0%, #7B5CF0 100%)", borderRadius: 16, padding: "18px 18px 16px", marginBottom: 12, color: "white" }}>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,.65)", marginBottom: 8, fontWeight: 600, letterSpacing: ".03em" }}>{bank!.bankName || "Bank Account"}</div>
                  <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: ".12em", marginBottom: 14 }}>
                    {maskAccountNumber(bank!.accountNumber)}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                    <div>
                      <div style={{ fontSize: 9, color: "rgba(255,255,255,.55)", marginBottom: 2, textTransform: "uppercase" }}>Account Holder</div>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{bank!.accountHolderName || "—"}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 9, color: "rgba(255,255,255,.55)", marginBottom: 2, textTransform: "uppercase" }}>IFSC</div>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{bank!.ifscCode || "—"}</div>
                    </div>
                  </div>
                </div>
                {/* Info rows */}
                <div style={{ background: "white", borderRadius: 16, border: "1px solid #F0EEFF", overflow: "hidden", marginBottom: 16 }}>
                  {[
                    { label: "Bank Name", value: bank!.bankName },
                    { label: "Account Number", value: maskAccountNumber(bank!.accountNumber) },
                    { label: "IFSC Code", value: bank!.ifscCode },
                    { label: "Account Holder", value: bank!.accountHolderName },
                    ...(bank!.upiId ? [{ label: "UPI ID", value: bank!.upiId }] : []),
                  ].map((row, i, arr) => (
                    <div key={row.label}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px" }}>
                        <span style={{ fontSize: 12, color: "#9CA3AF", fontWeight: 600 }}>{row.label}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#0F0A3C" }}>{row.value || "—"}</span>
                      </div>
                      {i < arr.length - 1 && <div style={{ height: 1, background: "#F3F1FF", margin: "0 16px" }} />}
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: 11, color: "#9CA3AF", display: "flex", alignItems: "center", gap: 6, marginBottom: 16 }}>
                  <ShieldCheck size={12} color="#16A34A" /> Account verified and linked for salary advances
                </div>
                <div style={{ background: "white", borderRadius: 16, border: "1px solid #F0EEFF", padding: 14, marginBottom: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#0F0A3C", marginBottom: 8 }}>UPI ID</div>
                  <div className="mp-field" style={{ marginBottom: 10 }}>
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
                    style={{ width: "100%", height: 42, fontSize: 13, fontWeight: 800 }}
                  >
                    {savingBank ? "Saving..." : "Update UPI ID"}
                  </button>
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
              showProgress={false}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="prof-screen">
      <div className="screen-body" style={{ background: "var(--bg)" }}>

        {/* ── Profile hero card ── */}
        <section className="prof-hero-v2">
          <div className="prof-hero-ink-v2" />
          <div className="prof-hero-main-v2">
            <div className="prof-avatar-wrap-v2">
              <div className="prof-avatar-v2">
                {profile.profilePhotoUrl ? (
                  <img src={getFileUrl(profile.profilePhotoUrl)} alt={profile.name} />
                ) : getInitials(profile.name || "M")}
              </div>
              <button
                type="button"
                className="prof-avatar-camera-v2"
                onClick={() => photoRef.current?.click()}
                aria-label="Update profile photo"
              >
                <Camera size={13} />
              </button>
              <input
                ref={photoRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={(e) => {
                  if (e.target.files?.[0]) uploadProfilePhoto(e.target.files[0]);
                }}
              />
            </div>
            <div className="prof-hero-copy-v2">
              <h2>{profile.name || "Employee"}</h2>
              <p>{profile.employer || "MobPae"}</p>
            </div>
          </div>
          <div className="prof-hero-stats-v2">
            <div>
              <span>Employee ID</span>
              <strong>{profile.employeeCode || "—"}</strong>
            </div>
            <div>
              <span>Plan</span>
              <strong className={membershipActive ? "green" : ""}>
                <Crown size={16} /> {membershipActive ? "Member" : "Inactive"}
              </strong>
            </div>
          </div>
        </section>

        {/* ── Your Details (normal card, below hero) ── */}
        <SectionLabel>Your Details</SectionLabel>
        <div className="prof-list">
          {profile.employer && (
            <div className="prof-detail-row">
              <div className="prof-row-icon prof-row-icon--purple">
                <Building2 size={16} color="#5B3CE3" />
              </div>
              <div className="prof-row-main">
                <div className="prof-row-sub">Employer</div>
                <div className="prof-row-title">{profile.employer}</div>
              </div>
            </div>
          )}
          {profile.email && (
            <div className="prof-detail-row">
              <div className="prof-row-icon prof-row-icon--green">
                <Mail size={16} color="#16A34A" />
              </div>
              <div className="prof-row-main">
                <div className="prof-row-sub">Email</div>
                <div className="prof-row-title">{profile.email}</div>
              </div>
            </div>
          )}
          {(profile as unknown as Record<string, string>).phone && (
            <div className="prof-detail-row">
              <div className="prof-row-icon prof-row-icon--warm">
                <Phone size={16} color="#D97706" />
              </div>
              <div className="prof-row-main">
                <div className="prof-row-sub">Phone</div>
                <div className="prof-row-title">{(profile as unknown as Record<string, string>).phone}</div>
              </div>
            </div>
          )}
        </div>

        {/* ── Account ── */}
        <SectionLabel>Account</SectionLabel>
        <ProfileCard>
          <SettingsRow icon={<CreditCard size={16} />} label="Bank Account"
            sub={bankLinked ? `${appState.bankAccount!.bankName} · ${maskAccountNumber(appState.bankAccount!.accountNumber)}` : "Add your salary account"}
            onClick={() => onNavigate("profile-bank")} />
          <div style={{ height: 1, background: "#F3F1FF", margin: "0 16px" }} />
          <SettingsRow icon={<FileText size={16} />} label="KYC Documents"
            sub={kycVerified ? "All verified ✓" : "View & upload docs"}
            onClick={() => onNavigate("profile-kyc")} />
          <div style={{ height: 1, background: "#F3F1FF", margin: "0 16px" }} />
          <SettingsRow
            icon={<Crown size={16} />}
            iconBg={membershipActive ? "#F0FDF4" : "#F5F3FF"}
            label={membershipActive ? "My Membership" : "Activate Plan"}
            sub={membershipActive ? (membershipConfig?.planName || "Active plan") : "Enable salary advance access"}
            onClick={() => onNavigate("profile-membership")}
          />
          <div style={{ height: 1, background: "#F3F1FF", margin: "0 16px" }} />
          <SettingsRow icon={<Bell size={16} />} label="Notifications" sub="Manage your alerts"
            onClick={() => onNavigate("notifications")} />
        </ProfileCard>

        {/* ── Security & Account ── */}
        <SectionLabel>Security</SectionLabel>
        <ProfileCard>
          <SettingsRow icon={<KeyRound size={16} />} label="Change Password" sub="Update your login password"
            onClick={() => onNavigate("change-password")} />
        </ProfileCard>

        {/* ── MobPae Info ── */}
        {appInfo.length > 0 && (
          <>
            <SectionLabel>About</SectionLabel>
            <ProfileCard>
              {appInfo.map((item, i) => (
                <div key={item.id}>
                  {i > 0 && <div style={{ height: 1, background: "#F3F1FF" }} />}
                  <InfoRow
                    icon={INFO_ICONS[item.type] ?? <Info size={16} />}
                    title={item.title}
                    content={item.content}
                  />
                </div>
              ))}
            </ProfileCard>
          </>
        )}

        {/* ── Sign Out ── */}
        <SectionLabel>Account</SectionLabel>
        <ProfileCard>
          <SettingsRow icon={<LogOut size={16} />} label="Sign Out" sub="Log out of MobPae"
            danger onClick={onLogout} />
        </ProfileCard>

        {/* ── Version footer ── */}
        <div style={{ textAlign: "center", color: "#C4B5FD", fontSize: 11, padding: "12px 0 28px", fontWeight: 500 }}>
          MobPae v2.0 · Employee App
        </div>

      </div>
    </div>
  );
}
