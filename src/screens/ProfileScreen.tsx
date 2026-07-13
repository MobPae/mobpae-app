import { useRef, type CSSProperties, type ReactNode } from "react";
import {
  Bell,
  Camera,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Crown,
  FileText,
  HelpCircle,
  Info,
  KeyRound,
  Landmark,
  LogOut,
  Moon,
  Plus,
  RefreshCw,
  ShieldCheck,
  Sun,
} from "lucide-react";
import { useSignedUrl } from "../hooks/useSignedUrl";
import { APP_VERSION } from "../config";
import type { AppState, BankAccount, KycDocumentType, View } from "../types/app";
import type { Theme } from "../hooks/useTheme";
import { maskAccountNumber } from "../utils/format";
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
  onRefresh?: () => void;
  refreshing?: boolean;
  onBankFormChange: (field: keyof BankAccount, value: string) => void;
  initialSection?: "kyc" | "bank" | "membership";
  theme?: Theme;
  onThemeChange?: (theme: Theme) => void;
};

const DARK = "#0C0C0E";
const PANEL = "#141418";
const PANEL_SOFT = "#17171B";
const BORDER = "#29292F";
const TEXT = "#F2F0EA";
const MUTED = "#8A8892";
const DIM = "#5C5C64";
const GREEN = "#20A46A";
const WARM = "#B4591F";

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("");
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        color: "var(--profile-muted, #8A8892)",
        fontSize: 12,
        fontWeight: 500,
        letterSpacing: "0.28em",
        textTransform: "uppercase",
        margin: "22px 4px 12px",
      }}
      className="profile-v2-section-label"
    >
      {children}
    </div>
  );
}

function RowGroup({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        border: "1px solid var(--profile-border, #29292F)",
        borderRadius: 20,
        overflow: "hidden",
      }}
      className="profile-v2-row-group"
    >
      {children}
    </div>
  );
}

function ProfileRow({
  icon,
  title,
  subtitle,
  tone = "default",
  onClick,
  trailing,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  tone?: "default" | "green" | "warm";
  onClick?: () => void;
  trailing?: ReactNode;
}) {
  const toneColor =
    tone === "green"
      ? "var(--profile-green, #20A46A)"
      : tone === "warm"
        ? "var(--profile-warm, #B4591F)"
        : "var(--profile-icon, #C9C7D0)";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      style={{
        width: "100%",
        minHeight: 68,
        display: "grid",
        gridTemplateColumns: "44px 1fr auto",
        alignItems: "center",
        gap: 14,
        padding: "16px 20px",
        background: "transparent",
        border: 0,
        borderBottom: "1px solid var(--profile-rule, #29292F)",
        color: "var(--profile-text, #F2F0EA)",
        textAlign: "left",
        
        opacity: onClick ? 1 : 0.88,
      }}
      className="profile-v2-row"
    >
      <span
        style={{
          width: 40,
          height: 40,
          borderRadius: 14,
          border: "1px solid var(--profile-border, #29292F)",
          background: "var(--profile-panel-soft, #17171B)",
          color: toneColor,
          display: "grid",
          placeItems: "center",
        }}
        className="profile-v2-row-icon"
      >
        {icon}
      </span>
      <span style={{ minWidth: 0 }}>
        <span
          style={{
            display: "block",
            color: "var(--profile-text, #F2F0EA)",
            fontSize: 15,
            fontWeight: 500,
            letterSpacing: "-0.02em",
            lineHeight: 1.12,
          }}
          className="profile-v2-row-title"
        >
          {title}
        </span>
        <span
          style={{
            display: "block",
            color: "var(--profile-muted, #8A8892)",
            fontSize: 13,
            fontWeight: 400,
            lineHeight: 1.2,
            marginTop: 7,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          className="profile-v2-row-subtitle"
        >
          {subtitle}
        </span>
      </span>
      {trailing ?? (
        onClick ? (
          <ChevronRight
            size={19}
            color="var(--profile-dim, #5C5C64)"
            strokeWidth={2.3}
          />
        ) : (
          <span />
        )
      )}
    </button>
  );
}

function LegalRow({ onClick }: { onClick: () => void }) {
  return (
    <ProfileRow
      icon={<FileText size={18} />}
      title="Terms & Privacy"
      subtitle="Legal and data policy"
      onClick={onClick}
    />
  );
}

function ProfileDarkHeader({
  title,
  onBack,
  onNotifications,
  onRefresh,
  refreshing,
}: {
  title: string;
  onBack: () => void;
  onNotifications: () => void;
  onRefresh?: () => void;
  refreshing?: boolean;
}) {
  return (
    <div className="pbv2-header">
      <button type="button" className="pbv2-round-btn" onClick={onBack} aria-label="Back">
        <ChevronLeft size={20} strokeWidth={2.2} />
      </button>
      <div className="pbv2-header-title">{title}</div>
      <div className="pbv2-header-actions">
        <button
          type="button"
          className="pbv2-round-btn"
          onClick={onNotifications}
          aria-label="Notifications"
        >
          <Bell size={18} strokeWidth={2.1} />
        </button>
        <button
          type="button"
          className="pbv2-round-btn"
          onClick={onRefresh}
          disabled={!onRefresh || refreshing}
          aria-label="Refresh"
        >
          <RefreshCw size={18} strokeWidth={2.1} className={refreshing ? "spin" : ""} />
        </button>
      </div>
    </div>
  );
}

export function ProfileScreen({
  appState,
  onLogout,
  onNavigate,
  uploadProfilePhoto,
  uploadingPhoto,
  uploadKycDocument,
  uploadingKycType,
  bankForm,
  savingBank,
  editingBank,
  onStartBankEdit,
  onCancelBankEdit,
  onSaveBank,
  onRefresh,
  refreshing,
  onBankFormChange,
  initialSection,
  theme = "dark",
  onThemeChange,
}: ProfileScreenProps) {
  const { profile, membershipActive, membershipConfig } = appState;
  const membershipStatus = (membershipConfig?.status || "").toUpperCase();
  const membershipPending =
    !membershipActive &&
    Boolean(membershipConfig?.membershipId) &&
    (membershipStatus === "PENDING" ||
      membershipStatus === "UNDER_REVIEW" ||
      membershipStatus === "PAYMENT_PENDING");
  const membershipRejected = !membershipActive && membershipStatus === "REJECTED";
  const membershipNeedsUpdate =
    membershipRejected || (!membershipActive && membershipPending && Boolean(membershipConfig?.remarks?.trim()));
  const membershipPillLabel = membershipActive
    ? membershipConfig?.planName || "Member"
    : membershipNeedsUpdate
      ? "Rejected"
      : membershipPending
        ? "In Review"
        : "Free";
  const membershipDaysText =
    typeof membershipConfig?.daysRemaining === "number"
      ? `${Math.max(0, membershipConfig.daysRemaining)} days to go`
      : membershipConfig?.validTill
        ? `${Math.max(
            0,
            Math.ceil((new Date(membershipConfig.validTill).getTime() - Date.now()) / 86_400_000),
          )} days to go`
        : membershipConfig?.validityLabel || "Active plan";
  const membershipDurationLabel =
    membershipConfig?.planName ||
    (membershipConfig?.planType === "MONTHLY"
      ? "Monthly"
      : membershipConfig?.planType === "BIANNUAL"
        ? "6 Months"
        : "Member");
  // Short value for the hero stat cell — first word of plan name (e.g. "Annual" not "Annual Membership")
  const membershipStatValue = membershipActive
    ? (membershipConfig?.planName?.split(" ")[0] || "Active")
    : membershipPillLabel;
  const photoRef = useRef<HTMLInputElement>(null);
  const profilePhotoUrl = useSignedUrl(profile.profilePhotoUrl);

  const kycVerified =
    appState.documents.every((d) => d.status === "Verified") &&
    appState.documents.length > 0;
  const bankLinked = !!appState.bankAccount?.accountNumber;
  const bankVerified = !!appState.bankAccount?.verified;
  const maskedBank = bankLinked
    ? `${appState.bankAccount!.bankName || "Bank"} · ${maskAccountNumber(appState.bankAccount!.accountNumber)}`
    : "Add your salary account";
  const oppositeTheme: Theme = theme === "dark" ? "light" : "dark";
  const profileThemeVars = {
    "--profile-bg": theme === "light" ? "#FFFFFF" : DARK,
    "--profile-panel": theme === "light" ? "#FFFFFF" : "rgba(20,20,24,0.62)",
    "--profile-panel-soft": theme === "light" ? "#F5F3FB" : PANEL_SOFT,
    "--profile-border": theme === "light" ? "#E9E6F1" : BORDER,
    "--profile-rule": theme === "light" ? "#F1EEF7" : BORDER,
    "--profile-text": theme === "light" ? "#17151F" : TEXT,
    "--profile-muted": theme === "light" ? "#6B6878" : MUTED,
    "--profile-dim": theme === "light" ? "#9A97A8" : DIM,
    "--profile-icon": theme === "light" ? "#315eff" : "#C9C7D0",
    "--profile-green": theme === "light" ? "#1F9E67" : GREEN,
    "--profile-warm": WARM,
    "--profile-chip-bg": theme === "light" ? "rgba(49,94,255,0.08)" : "rgba(20,20,24,0.86)",
    "--profile-avatar-border": theme === "light" ? "#E2DEEE" : "#2E2E34",
    "--profile-camera-bg": theme === "light" ? "#315eff" : "#F4F1E8",
    "--profile-camera-text": theme === "light" ? "#FFFFFF" : "#11100D",
  } as CSSProperties;

  if (initialSection === "kyc") {
    return (
      <div className="prof-screen prof-screen--full-dark">
        <ProfileDarkHeader
          title="KYC Documents"
          onBack={() => onNavigate("profile")}
          onNotifications={() => onNavigate("notifications")}
          onRefresh={onRefresh}
          refreshing={refreshing}
        />
        <OnboardingKycScreen
          documents={appState.documents}
          uploadingKycType={uploadingKycType}
          onUpload={uploadKycDocument}
          onContinue={(view) => onNavigate(view === "onboarding-bank" ? "profile-bank" : view)}
          bankConnected={!!appState.bankAccount?.accountNumber}
          mode="profile"
        />
      </div>
    );
  }

  if (initialSection === "bank") {
    const bank = appState.bankAccount;
    const hasBankAccount = !!bank?.accountNumber;
    const isVerified = !!bank?.verified;

    if (!hasBankAccount || editingBank) {
      return (
        <div className="prof-screen prof-screen--full-dark">
          <ProfileDarkHeader
            title="Bank Account"
            onBack={editingBank && hasBankAccount ? onCancelBankEdit : () => onNavigate("profile")}
            onNotifications={() => onNavigate("notifications")}
            onRefresh={onRefresh}
            refreshing={refreshing}
          />
          <OnboardingBankScreen
            bankForm={bankForm}
            savingBank={savingBank}
            onBankFormChange={onBankFormChange}
            onSaveBank={onSaveBank}
            onContinue={(view) => {
              if (view === "onboarding-kyc") {
                onNavigate("profile-kyc");
                return;
              }
              onNavigate("profile");
            }}
            kycSubmitted={appState.documents.some((document) => document.status !== "Not Uploaded")}
          />
        </div>
      );
    }

    return (
      <div className="pbv2-screen">
        <ProfileDarkHeader
          title="Bank Account"
          onBack={() => onNavigate("profile")}
          onNotifications={() => onNavigate("notifications")}
          onRefresh={onRefresh}
          refreshing={refreshing}
        />

        <SectionLabel>Linked account</SectionLabel>

        <section className="pbv2-card">
          <div className="pbv2-card-top">
            <span className="pbv2-bank-icon"><Landmark size={22} strokeWidth={1.8} /></span>
            <h1>{bank!.bankName || "Bank Account"}</h1>
            <span className={`pbv2-status ${isVerified ? "is-verified" : "is-pending"}`}>
              <span />
              {isVerified ? "Verified" : "Pending"}
            </span>
          </div>

          <div className="pbv2-number">{maskAccountNumber(bank!.accountNumber)}</div>
          <div className="pbv2-line" />
          <div className="pbv2-meta">
            <div>
              <span>Holder</span>
              <span>{bank!.accountHolderName || "—"}</span>
            </div>
            <div>
              <span>IFSC</span>
              <span>{bank!.ifscCode || "—"}</span>
            </div>
          </div>

          <div className="pbv2-line" />
          <button type="button" className="pbv2-card-row" onClick={onStartBankEdit}>
            <RefreshCw size={16} strokeWidth={1.8} />
            <span>Link a different account</span>
            <ChevronRight size={16} />
          </button>
        </section>

        <section className="pbv2-note">
          <Info size={15} strokeWidth={1.9} />
          <p className="pbv2-note-body">
            Advances are credited to this account. Repayment is auto-deducted from your salary account on payday by your employer.
          </p>
        </section>

        <div className="pbv2-security">
          <ShieldCheck size={14} strokeWidth={1.8} />
          Account changes are re-verified for your security
        </div>
      </div>
    );
  }

  return (
    <div
      className="prof-main-screen"
      style={{
        ...profileThemeVars,
        minHeight: "100%",
        background: "var(--profile-bg, #0C0C0E)",
        color: "var(--profile-text, #F2F0EA)",
        
        padding: "8px 22px 32px",
      }}
    >
      {/* ── Profile Hero Card ── */}
      <div
        className="profile-hero-card"
        style={{
          border: "none",
          borderRadius: 24,
          background: "linear-gradient(160deg, #3A65FF 0%, #315eff 55%, #2549DA 100%)",
          overflow: "hidden",
          position: "relative",
          marginBottom: 6,
          boxShadow: "0 12px 40px rgba(49,94,255,0.32)",
        }}
      >
        {/* Subtle dot pattern */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.11) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
          pointerEvents: "none",
        }} />
        {/* Sheen overlay */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 120,
          background: "radial-gradient(ellipse at 40% 0%, rgba(255,255,255,0.16) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        {/* Avatar + name + subtitle */}
        <div style={{ textAlign: "center", padding: "22px 20px 18px", position: "relative" }}>
          <div style={{ position: "relative", width: 82, height: 82, margin: "0 auto 14px" }}>
            <button
              type="button"
              onClick={() => photoRef.current?.click()}
              aria-label="Change profile photo"
              disabled={uploadingPhoto}
              style={{
                width: 82,
                height: 82,
                borderRadius: 999,
                border: "3px solid rgba(255,255,255,0.28)",
                background: "rgba(255,255,255,0.15)",
                color: "#FFFFFF",
                display: "grid",
                placeItems: "center",
                fontSize: 22,
                fontWeight: 400,
                overflow: "hidden",
                boxShadow: "0 8px 24px rgba(0,0,0,0.22)",
                cursor: uploadingPhoto ? "wait" : "pointer",
                position: "relative",
              }}
            >
              {profilePhotoUrl ? (
                <img
                  src={profilePhotoUrl}
                  alt={profile.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                getInitials(profile.name || "M")
              )}
              {uploadingPhoto && (
                <span
                  aria-live="polite"
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "rgba(0,0,0,0.5)",
                    color: "#FFFFFF",
                    display: "grid",
                    placeItems: "center",
                    fontSize: 11,
                    fontWeight: 500,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    backdropFilter: "blur(5px)",
                  }}
                >
                  Uploading
                </span>
              )}
            </button>
            <span
              style={{
                position: "absolute",
                right: -2,
                bottom: 2,
                width: 26,
                height: 26,
                borderRadius: 999,
                border: "3px solid #315eff",
                background: "#FFFFFF",
                color: "#315eff",
                display: "grid",
                placeItems: "center",
              }}
            >
              <Camera size={13} strokeWidth={2.2} />
            </span>
            {uploadingPhoto && (
              <span
                style={{
                  position: "absolute",
                  left: 14,
                  right: 14,
                  bottom: 0,
                  height: 3,
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.2)",
                  overflow: "hidden",
                }}
              >
                <span
                  className="profile-photo-upload-bar"
                  style={{
                    display: "block",
                    width: "42%",
                    height: "100%",
                    borderRadius: 999,
                    background: "#FFFFFF",
                  }}
                />
              </span>
            )}
          </div>

          <h1
            style={{
              margin: 0,
              color: "#FFFFFF",
              fontSize: 20,
              fontWeight: 400,
              letterSpacing: "-0.025em",
              lineHeight: 1.1,
            }}
          >
            {profile.name || "Employee"}
          </h1>
          <div
            style={{
              marginTop: 6,
              color: "rgba(255,255,255,0.65)",
              fontSize: 12,
              fontWeight: 400,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              padding: "0 12px",
            }}
          >
            {[profile.employeeCode, profile.employer].filter(Boolean).join(" · ")}
          </div>
        </div>

        {/* 3-column status stats row */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.14)", display: "grid", gridTemplateColumns: "1fr 1fr 1fr" }}>
          {([
            {
              icon: <Crown size={15} strokeWidth={1.8} />,
              label: "Plan",
              value: membershipStatValue,
              tone: membershipActive ? "green" : membershipNeedsUpdate ? "warm" : "default",
            },
            {
              icon: <ShieldCheck size={15} strokeWidth={1.8} />,
              label: "KYC",
              value: kycVerified ? "Done" : "Pending",
              tone: kycVerified ? "green" : "default",
            },
            {
              icon: <CreditCard size={15} strokeWidth={1.8} />,
              label: "Bank",
              value: bankVerified ? "Verified" : bankLinked ? "Pending" : "Add",
              tone: bankVerified ? "green" : "default",
            },
          ] as const).map(({ icon, label, value, tone }, i) => {
            const toneColor = tone === "green" ? "#5BEBA0" : tone === "warm" ? "#FFB47A" : "rgba(255,255,255,0.55)";
            return (
              <div
                key={label}
                style={{
                  padding: "14px 8px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 5,
                  borderRight: i < 2 ? "1px solid rgba(255,255,255,0.14)" : "none",
                  overflow: "hidden",
                  minWidth: 0,
                }}
              >
                <span style={{ color: toneColor, flexShrink: 0 }}>{icon}</span>
                <span style={{ color: "#FFFFFF", fontSize: 11, fontWeight: 500, lineHeight: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "calc(100% - 4px)", display: "block" }}>{value}</span>
                <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 10, fontWeight: 400, lineHeight: 1, letterSpacing: "0.06em", textTransform: "uppercase" }}>{label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {membershipActive && (
        <button
          type="button"
          className="profile-membership-summary"
          onClick={() => onNavigate("profile-membership")}
        >
          <span className="profile-membership-summary-icon">
            <Crown size={23} strokeWidth={1.9} />
          </span>
          <div className="profile-membership-summary-main">
            <div className="profile-membership-summary-title">
              <span>Membership</span>
              <span className="profile-membership-summary-status">
                <i /> Active
              </span>
              <span className="profile-membership-summary-term">
                {membershipDurationLabel}
              </span>
            </div>
            <p>
              {membershipDaysText}
            </p>
          </div>
        </button>
      )}

      <SectionLabel>Account</SectionLabel>
      <RowGroup>
        <ProfileRow
          icon={<CreditCard size={18} />}
          title="Bank Account"
          subtitle={maskedBank}
          onClick={() => onNavigate("profile-bank")}
        />
        <ProfileRow
          icon={<FileText size={18} />}
          title="KYC Documents"
          subtitle={kycVerified ? "All verified" : "Upload PAN, Aadhaar and salary slip"}
          tone={kycVerified ? "green" : "default"}
          onClick={() => onNavigate("profile-kyc")}
        />
      </RowGroup>

      <SectionLabel>Preferences</SectionLabel>
      <RowGroup>
        <ProfileRow
          icon={<Bell size={18} />}
          title="Notifications"
          subtitle="Manage your alerts"
          onClick={() => onNavigate("notifications")}
        />
        <ProfileRow
          icon={<KeyRound size={18} />}
          title="Security & PIN"
          subtitle="Change password"
          onClick={() => onNavigate("change-password")}
        />
        <ProfileRow
          icon={theme === "dark" ? <Moon size={18} /> : <Sun size={18} />}
          title="Appearance"
          subtitle={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
          onClick={() => onThemeChange?.(oppositeTheme)}
          trailing={
            <span className="profile-v2-theme-chip">
              {theme === "dark" ? "Dark" : "Light"}
            </span>
          }
        />
      </RowGroup>

      <SectionLabel>Support</SectionLabel>
      <RowGroup>
        <ProfileRow
          icon={<HelpCircle size={18} />}
          title="Help & Support"
          subtitle="FAQs and contact us"
          onClick={() => onNavigate("help")}
        />
        <LegalRow onClick={() => onNavigate("legal")} />
      </RowGroup>

      <button
        type="button"
        onClick={onLogout}
        style={{
          width: "100%",
          minHeight: 58,
          marginTop: 28,
          borderRadius: 16,
          border: "1px solid var(--profile-border, #29292F)",
          background: "var(--profile-panel, rgba(20,20,24,0.62))",
          color: "var(--profile-warm, #B4591F)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          cursor: "pointer",
          fontSize: 15,
          fontWeight: 500,
        }}
      >
        <LogOut size={18} strokeWidth={2.1} />
        Log out
      </button>

      <div
        style={{
          textAlign: "center",
          color: "var(--profile-dim, #5C5C64)",
          fontSize: 12,
          fontWeight: 400,
          marginTop: 24,
          paddingBottom: 8,
        }}
      >
        MobPae · v{APP_VERSION}
      </div>

      <input
        ref={photoRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: "none" }}
        onChange={(event) => {
          if (event.target.files?.[0]) uploadProfilePhoto(event.target.files[0]);
          event.target.value = "";
        }}
      />
    </div>
  );
}
