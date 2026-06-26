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
    <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.75 }}>
      {text.split("\n").map((line, i) => {
        const parts = line.split(/\*\*(.*?)\*\*/g);
        return (
          <p key={i} style={{ margin: "2px 0" }}>
            {parts.map((part, j) =>
              j % 2 === 1 ? <strong key={j} style={{ color: "#0F0A3C", fontWeight: 700 }}>{part}</strong> : part
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
    <div style={{ borderBottom: "1px solid #F3F1FF" }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: 12,
          padding: "14px 16px", background: "none", border: "none", cursor: "pointer", textAlign: "left", fontFamily: "inherit"
        }}
      >
        <div style={{ width: 36, height: 36, borderRadius: 10, background: "#F5F3FF", display: "flex", alignItems: "center", justifyContent: "center", color: "#5B3CE3", flexShrink: 0 }}>
          {icon}
        </div>
        <div style={{ flex: 1, fontSize: 13, fontWeight: 700, color: "#0F0A3C" }}>{title}</div>
        {open ? <ChevronUp size={16} color="#9CA3AF" /> : <ChevronDown size={16} color="#9CA3AF" />}
      </button>
      {open && (
        <div style={{ padding: "0 16px 16px 64px" }}>
          <RenderContent text={content} />
        </div>
      )}
    </div>
  );
}

// Card wrapper — same width/style as the salary card
function ProfileCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ padding: "0 16px 10px" }}>
      <div style={{ background: "white", borderRadius: 16, border: "1px solid #F0EEFF", boxShadow: "0 2px 12px rgba(91,60,227,.08)", overflow: "hidden", ...style }}>
        {children}
      </div>
    </div>
  );
}

// Section header label — purple theme color
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 800, color: "#5B3CE3", textTransform: "uppercase", letterSpacing: ".08em", padding: "12px 16px 4px" }}>
      {children}
    </div>
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
      style={{
        width: "100%", display: "flex", alignItems: "center", gap: 12,
        padding: "13px 16px", background: "none", border: "none", cursor: "pointer", textAlign: "left", fontFamily: "inherit"
      }}
    >
      <div style={{
        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
        background: danger ? "#FEF2F2" : (iconBg || "#F5F3FF"),
        display: "flex", alignItems: "center", justifyContent: "center",
        color: danger ? "#EF4444" : "#5B3CE3"
      }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: danger ? "#EF4444" : "#0F0A3C" }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 1 }}>{sub}</div>}
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
        <div style={{ padding: "14px 16px 4px" }}>
          <div style={{
            position: "relative", overflow: "hidden",
            background: "linear-gradient(135deg, #EDE9FE 0%, #F5F3FF 55%, #EEF2FF 100%)",
            borderRadius: 20, border: "1px solid #DDD6FE",
            padding: "20px 18px 18px",
            boxShadow: "0 4px 16px rgba(91,60,227,.10)",
          }}>
            {/* Decorative circles */}
            <div style={{ position: "absolute", top: -24, right: -24, width: 110, height: 110, borderRadius: "50%", background: "rgba(91,60,227,.08)", pointerEvents: "none" }} />
            <div style={{ position: "absolute", bottom: -28, right: 30, width: 80, height: 80, borderRadius: "50%", background: "rgba(91,60,227,.05)", pointerEvents: "none" }} />
            <div style={{ position: "absolute", top: 18, right: 64, width: 36, height: 36, borderRadius: "50%", background: "rgba(91,60,227,.07)", pointerEvents: "none" }} />

            <div style={{ display: "flex", alignItems: "center", gap: 14, position: "relative" }}>

              {/* Avatar */}
              <div style={{ position: "relative", flexShrink: 0 }}>
                <div style={{
                  width: 64, height: 64, borderRadius: "50%",
                  background: "#DDD6FE", border: "2.5px solid #7C3AED",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 22, fontWeight: 800, color: "#5B3CE3", overflow: "hidden"
                }}>
                  {profile.profilePhotoUrl ? (
                    <img src={getFileUrl(profile.profilePhotoUrl)} alt={profile.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : getInitials(profile.name || "M")}
                </div>
                <button
                  type="button"
                  onClick={() => photoRef.current?.click()}
                  style={{
                    position: "absolute", bottom: 1, right: 1, width: 22, height: 22,
                    borderRadius: "50%", background: "#5B3CE3", border: "2px solid white", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: "0 2px 6px rgba(91,60,227,.35)"
                  }}
                >
                  <Camera size={11} color="white" />
                </button>
                <input ref={photoRef} type="file" accept="image/*" style={{ display: "none" }}
                  onChange={e => { if (e.target.files?.[0]) uploadProfilePhoto(e.target.files[0]); }} />
              </div>

              {/* Name + badge + details */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 2 }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#0F0A3C", lineHeight: 1.2 }}>
                    {profile.name || "Employee"}
                  </div>
                  {membershipActive && (
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: 3,
                      background: "#16A34A", color: "white",
                      fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 20,
                      letterSpacing: ".02em"
                    }}>
                      <Crown size={9} /> Member
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: "#5B3CE3", fontWeight: 700, marginTop: 1 }}>
                  {profile.employer || "MobPae"}
                </div>
                {profile.employeeCode && (
                  <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>
                    ID: {profile.employeeCode}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Your Details (normal card, below hero) ── */}
        <SectionLabel>Your Details</SectionLabel>
        <ProfileCard>
          {profile.employer && (
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 16px" }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "#F5F3FF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Building2 size={16} color="#5B3CE3" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, color: "#9CA3AF", marginBottom: 1 }}>Employer</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0F0A3C" }}>{profile.employer}</div>
              </div>
            </div>
          )}
          {profile.employer && profile.email && <div style={{ height: 1, background: "#F3F1FF", margin: "0 16px" }} />}
          {profile.email && (
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 16px" }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "#F0FDF4", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Mail size={16} color="#16A34A" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, color: "#9CA3AF", marginBottom: 1 }}>Email</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0F0A3C" }}>{profile.email}</div>
              </div>
            </div>
          )}
          {(profile as unknown as Record<string, string>).phone && (
            <>
              <div style={{ height: 1, background: "#F3F1FF", margin: "0 16px" }} />
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 16px" }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "#FFFBEB", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Phone size={16} color="#D97706" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, color: "#9CA3AF", marginBottom: 1 }}>Phone</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#0F0A3C" }}>{(profile as unknown as Record<string, string>).phone}</div>
                </div>
              </div>
            </>
          )}
        </ProfileCard>

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
