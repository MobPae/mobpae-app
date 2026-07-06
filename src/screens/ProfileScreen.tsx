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
        fontWeight: 700,
        letterSpacing: "0.28em",
        textTransform: "uppercase",
        margin: "30px 4px 14px",
      }}
      className="profile-v2-section-label"
    >
      {children}
    </div>
  );
}

function StatusPill({
  icon,
  label,
  tone = "default",
}: {
  icon: ReactNode;
  label: string;
  tone?: "default" | "green" | "warm";
}) {
  const isGreen = tone === "green";
  const isWarm = tone === "warm";
  const toneColor = isGreen
    ? "var(--profile-green, #20A46A)"
    : isWarm
      ? "var(--profile-warm, #B4591F)"
      : "var(--profile-muted, #8A8892)";

  return (
    <span
      style={{
        height: 34,
        padding: "0 14px",
        borderRadius: 999,
        border: `1px solid ${
          isGreen
            ? "rgba(32,164,106,0.45)"
            : isWarm
              ? "rgba(180,89,31,0.45)"
              : "var(--profile-border, #29292F)"
        }`,
        background: isGreen
          ? "rgba(32,164,106,0.08)"
          : isWarm
            ? "rgba(180,89,31,0.1)"
            : "var(--profile-chip-bg, rgba(20,20,24,0.86))",
        color: toneColor,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        fontSize: 13,
        fontWeight: 700,
        whiteSpace: "nowrap",
      }}
      className={`profile-v2-status-pill profile-v2-status-pill--${tone}`}
    >
      {icon}
      {label}
    </span>
  );
}

function RowGroup({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        border: "1px solid var(--profile-border, #29292F)",
        borderRadius: 20,
        background: "var(--profile-panel, rgba(20,20,24,0.62))",
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
        minHeight: 74,
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
        fontFamily: "'Space Grotesk', sans-serif",
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
            fontWeight: 700,
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
            fontWeight: 600,
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
    (membershipStatus === "PENDING" ||
      membershipStatus === "UNDER_REVIEW" ||
      membershipStatus === "PAYMENT_PENDING" ||
      Boolean(membershipConfig?.paymentScreenshot));
  const membershipRejected = !membershipActive && membershipStatus === "REJECTED";
  const membershipNeedsUpdate =
    membershipRejected || (!membershipActive && membershipPending && Boolean(membershipConfig?.remarks?.trim()));
  const membershipPillLabel = membershipActive
    ? membershipConfig?.planName || "Member"
    : membershipNeedsUpdate
      ? "Update Proof"
      : membershipPending
        ? "In Review"
        : "Free";
  const membershipRowTitle = membershipActive
    ? "Membership Active"
    : membershipNeedsUpdate
      ? "Update Payment Proof"
      : membershipPending
        ? "Membership Review"
        : "Activate Plan";
  const membershipRowSubtitle = membershipActive
    ? membershipConfig?.validityLabel || "Membership active"
    : membershipNeedsUpdate
      ? membershipConfig?.remarks || "Upload a fresh payment screenshot"
      : membershipPending
        ? "Payment proof submitted for admin review"
        : "Required after employer approval";
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
    "--profile-icon": theme === "light" ? "#5B3CE3" : "#C9C7D0",
    "--profile-green": theme === "light" ? "#1F9E67" : GREEN,
    "--profile-warm": WARM,
    "--profile-chip-bg": theme === "light" ? "rgba(91,60,227,0.08)" : "rgba(20,20,24,0.86)",
    "--profile-avatar-border": theme === "light" ? "#E2DEEE" : "#2E2E34",
    "--profile-camera-bg": theme === "light" ? "#5B3CE3" : "#F4F1E8",
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
            onBack={() => onNavigate("profile")}
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
              <strong>{bank!.accountHolderName || "—"}</strong>
            </div>
            <div>
              <span>IFSC</span>
              <strong>{bank!.ifscCode || "—"}</strong>
            </div>
          </div>
        </section>

        <section className="pbv2-note">
          <Info size={17} strokeWidth={1.9} />
          <span>Advances are credited here and auto-recovered from this account on payday.</span>
        </section>

        <SectionLabel>Manage</SectionLabel>
        <section className="pbv2-manage">
          <button type="button" onClick={onStartBankEdit}>
            <span><Plus size={20} strokeWidth={1.8} /></span>
            <strong>Change bank account</strong>
            <small>Link a different account</small>
            <ChevronRight size={19} />
          </button>
        </section>

        <div className="pbv2-security">
          <ShieldCheck size={14} strokeWidth={1.8} />
          Account changes are re-verified for your security
        </div>
      </div>
    );
  }

  const avatarStyle: CSSProperties = {
    width: 116,
    height: 116,
    borderRadius: 999,
    border: "7px solid var(--profile-avatar-border, #2E2E34)",
    background: "var(--profile-bg, #0C0C0E)",
    color: "var(--profile-text, #F2F0EA)",
    display: "grid",
    placeItems: "center",
    fontSize: 28,
    fontWeight: 750,
    letterSpacing: "-0.03em",
    overflow: "hidden",
    boxShadow: "0 20px 60px rgba(0,0,0,0.32)",
  };

  return (
    <div
      className="prof-main-screen"
      style={{
        ...profileThemeVars,
        minHeight: "100%",
        background: "var(--profile-bg, #0C0C0E)",
        color: "var(--profile-text, #F2F0EA)",
        fontFamily: "'Space Grotesk', sans-serif",
        padding: "26px 22px 32px",
      }}
    >
      <section style={{ textAlign: "center", padding: "18px 0 18px" }}>
        <div style={{ position: "relative", width: 130, height: 130, margin: "0 auto 20px" }}>
          <button
            type="button"
            onClick={() => photoRef.current?.click()}
            aria-label="Change profile photo"
            disabled={uploadingPhoto}
            style={{
              ...avatarStyle,
              margin: "0 auto",
              position: "relative",
              cursor: uploadingPhoto ? "wait" : "pointer",
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
                  background: "rgba(12,12,14,0.74)",
                  color: "#F2F0EA",
                  display: "grid",
                  placeItems: "center",
                  fontSize: 11,
                  fontWeight: 750,
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
              right: 11,
              bottom: 13,
              width: 30,
              height: 30,
              borderRadius: 999,
              border: "4px solid var(--profile-bg, #0C0C0E)",
              background: "var(--profile-camera-bg, #F4F1E8)",
              color: "var(--profile-camera-text, #11100D)",
              display: "grid",
              placeItems: "center",
            }}
          >
            <Camera size={15} strokeWidth={2.2} />
          </span>
          {uploadingPhoto && (
            <span
              style={{
                position: "absolute",
                left: 22,
                right: 22,
                bottom: 0,
                height: 4,
                borderRadius: 999,
                  background: "var(--profile-border, #25252B)",
                overflow: "hidden",
                boxShadow: "0 10px 24px rgba(0,0,0,0.28)",
              }}
            >
              <span
                className="profile-photo-upload-bar"
                style={{
                  display: "block",
                  width: "42%",
                  height: "100%",
                  borderRadius: 999,
                  background: "#F2F0EA",
                }}
              />
            </span>
          )}
        </div>

        <h1
          style={{
            margin: 0,
            color: "var(--profile-text, #F2F0EA)",
            fontSize: 23,
            fontWeight: 750,
            letterSpacing: "-0.04em",
            lineHeight: 1.05,
          }}
        >
          {profile.name || "Employee"}
        </h1>
        <div
          style={{
            marginTop: 14,
            color: "var(--profile-muted, #8A8892)",
            fontSize: 13,
            fontWeight: 650,
            lineHeight: 1.45,
          }}
        >
          {[profile.employeeCode, profile.employer].filter(Boolean).join(" · ")}
          {profile.email && (
            <>
              <br />
              {profile.email}
            </>
          )}
        </div>

        <div
          style={{
            display: "flex",
            gap: 9,
            justifyContent: "center",
            flexWrap: "wrap",
            marginTop: 24,
          }}
        >
          <StatusPill
            icon={<Crown size={14} strokeWidth={1.9} />}
            label={membershipPillLabel}
            tone={membershipActive ? "green" : membershipNeedsUpdate ? "warm" : "default"}
          />
          <StatusPill
            icon={<ShieldCheck size={14} strokeWidth={1.9} />}
            label={kycVerified ? "KYC Done" : "KYC Pending"}
            tone={kycVerified ? "green" : "default"}
          />
          <StatusPill
            icon={<CreditCard size={14} strokeWidth={1.9} />}
            label={bankLinked ? "Bank Linked" : "No Bank"}
            tone={bankVerified ? "green" : "default"}
          />
        </div>
      </section>

      {membershipActive && (
        <section
          className="profile-membership-summary"
          onClick={() => onNavigate("profile-membership")}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") onNavigate("profile-membership");
          }}
        >
          <span className="profile-membership-summary-icon">
            <Crown size={23} strokeWidth={1.9} />
          </span>
          <div className="profile-membership-summary-main">
            <div className="profile-membership-summary-title">
              <strong>Membership</strong>
              <span className="profile-membership-summary-status">
                <i /> Active
              </span>
              <span className="profile-membership-summary-term">
                {membershipDurationLabel}
              </span>
            </div>
            <p>
              <b>{membershipDaysText.split(" ")[0]}</b>
              {" "}
              {membershipDaysText.split(" ").slice(1).join(" ") || "days to go"}
            </p>
          </div>
        </section>
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
        <ProfileRow
          icon={<Crown size={18} />}
          title={membershipRowTitle}
          subtitle={membershipRowSubtitle}
          tone={membershipActive ? "green" : membershipNeedsUpdate ? "warm" : "default"}
          onClick={() => onNavigate("profile-membership")}
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
          subtitle={theme === "dark" ? "Dark theme" : "Light theme"}
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
          borderRadius: 18,
          border: "1px solid var(--profile-border, #29292F)",
          background: "var(--profile-panel, rgba(20,20,24,0.62))",
          color: "var(--profile-warm, #B4591F)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 15,
          fontWeight: 700,
        }}
      >
        <LogOut size={18} strokeWidth={2.1} />
        Log out
      </button>

      <div
        style={{
          textAlign: "center",
          color: "#3F3F46",
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 12,
          fontWeight: 600,
          marginTop: 24,
          paddingBottom: 8,
        }}
      >
        MobPae · v{APP_VERSION}
      </div>

      <input
        ref={photoRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(event) => {
          if (event.target.files?.[0]) uploadProfilePhoto(event.target.files[0]);
          event.target.value = "";
        }}
      />
    </div>
  );
}
