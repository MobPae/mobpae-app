import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Bell, Camera, ChevronLeft, ChevronRight, RefreshCw, User } from "lucide-react";
import { TabBar } from "./TabBar";
import type { EmployeeProfile, View } from "../../types/app";
import { getFileUrl } from "../../services/api";
import type { Theme } from "../../hooks/useTheme";

type AppShellProps = {
  activeView: View;
  children: ReactNode;
  profile: EmployeeProfile;
  unreadCount: number;
  refreshing?: boolean;
  onRefresh: () => void;
  onNavigate: (view: View) => void;
  onBack?: () => void;
  uploadProfilePhoto?: (file: File) => void;
  theme?: Theme;
};

const TAB_VIEWS: View[] = ["home", "advance", "repayments", "activity", "profile"];
const ONBOARDING_VIEWS: View[] = ["onboarding-kyc", "onboarding-bank", "onboarding-done"];
const FULLSCREEN_DARK_VIEWS: View[] = [
  "profile-membership",
  "profile-bank",
  "profile-kyc",
  "change-password",
];
const HEADER_VIEWS: View[] = [...TAB_VIEWS, ...ONBOARDING_VIEWS];
const DARK_SURFACE = "#0C0C0E";
const LIGHT_SURFACE = "#FFFFFF";

const themePalette = {
  dark: {
    bg: DARK_SURFACE,
    text: "#F2F0EA",
    muted: "#8A8892",
    dim: "#7C7C85",
    border: "#26262B",
    iconBg: DARK_SURFACE,
    avatarBorder: "#3A3A40",
    unread: "#B4591F",
  },
  light: {
    bg: LIGHT_SURFACE,
    text: "#17151F",
    muted: "#6B6878",
    dim: "#9A97A8",
    border: "#E9E6F1",
    iconBg: LIGHT_SURFACE,
    avatarBorder: "#E2DEEE",
    unread: "#B4591F",
  },
} satisfies Record<Theme, Record<string, string>>;

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map((n) => n[0]?.toUpperCase() ?? "").join("");
}

function getHeaderTitle(view: View) {
  const titles: Partial<Record<View, string>> = {
    advance: "Advance",
    repayments: "Repay",
    activity: "Activity",
    profile: "Profile",
    "onboarding-kyc": "KYC",
    "onboarding-bank": "Bank Account",
    "onboarding-done": "Setup",
    notifications: "Alerts",
    "change-password": "Security",
    help: "Help",
  };
  return titles[view] ?? "MobPae";
}

function iconButtonStyle(palette: (typeof themePalette)[Theme]): CSSProperties {
  return {
    width: 40,
    height: 40,
    borderRadius: "50%",
    border: `1px solid ${palette.border}`,
    background: palette.iconBg,
    color: palette.text,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  };
}

export function AppShell({
  activeView, children, profile, unreadCount, refreshing, onRefresh, onNavigate, onBack, uploadProfilePhoto,
  theme = "dark",
}: AppShellProps) {
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const isOnboarding = ONBOARDING_VIEWS.includes(activeView);
  const isFullscreenDark = FULLSCREEN_DARK_VIEWS.includes(activeView);
  const isTabView = HEADER_VIEWS.includes(activeView);
  const isHome = activeView === "home";
  const homeHeaderSub = profile.employerEmail || profile.employer || "MobPae member";
  const palette = themePalette[theme];
  const themedIconButton = iconButtonStyle(palette);
  const rootClassName = `app-root app-root--${theme}`;
  const shellClassName = `phone-shell phone-shell--${theme}`;

  useEffect(() => {
    const body = bodyRef.current;
    if (!body) return;
    body.scrollTo({ top: 0, left: 0, behavior: "auto" });
    body.querySelectorAll<HTMLElement>(".screen-body, .screen-body-onboarding").forEach((node) => {
      node.scrollTo({ top: 0, left: 0, behavior: "auto" });
    });
  }, [activeView]);

  // Close sheet whenever the view changes
  useEffect(() => { setSheetOpen(false); }, [activeView]);

  const openSheet = () => setSheetOpen(true);
  const closeSheet = () => setSheetOpen(false);

  const handlePhotoChange = () => {
    closeSheet();
    setTimeout(() => photoInputRef.current?.click(), 200);
  };

  const handleViewProfile = () => {
    closeSheet();
    onNavigate("profile");
  };

  return (
    <div
      className={rootClassName}
      data-theme={theme}
      style={{
        background: palette.bg,
      }}
    >
      <div
        className={shellClassName}
        data-theme={theme}
        style={{
          background: palette.bg,
        }}
      >

        {/* ── Shared app header ── */}
        {isTabView && (
          <div
            style={{
              background: palette.bg,
              padding: "max(54px, calc(env(safe-area-inset-top, 0px) + 22px)) 22px 18px",
              display: "flex",
              alignItems: "center",
              gap: 16,
              flexShrink: 0,
              color: palette.text,
              fontFamily: "'Space Grotesk', sans-serif",
              position: "relative",
              zIndex: 25,
            }}
          >
            {isHome ? (
              <button
                type="button"
                onClick={() => onNavigate("profile")}
                aria-label="Open profile"
                style={{
                  ...themedIconButton,
                  overflow: "hidden",
                  borderColor: profile.profilePhotoUrl ? palette.avatarBorder : palette.border,
                }}
              >
                {profile.profilePhotoUrl ? (
                  <img
                    src={getFileUrl(profile.profilePhotoUrl)}
                    alt={profile.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <span
                    style={{
                      color: palette.text,
                      fontSize: 13,
                      fontWeight: 750,
                      letterSpacing: "-0.03em",
                    }}
                  >
                    {getInitials(profile.name || "M")}
                  </span>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={onBack ?? (() => onNavigate("home"))}
                aria-label="Back"
                style={themedIconButton}
              >
                <ChevronLeft size={24} strokeWidth={2.2} />
              </button>
            )}

            <div style={{ flex: 1, minWidth: 0 }}>
              {isHome ? (
                <>
                  <div
                    style={{
                      color: palette.text,
                      fontSize: 13,
                      lineHeight: 1,
                      fontWeight: 600,
                      letterSpacing: "0.22em",
                      textTransform: "uppercase",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {profile.employeeCode || "Employee"}
                  </div>
                  <div
                    style={{
                      marginTop: 6,
                      color: palette.dim,
                      fontSize: 12,
                      lineHeight: 1.15,
                      fontWeight: 500,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {homeHeaderSub}
                  </div>
                </>
              ) : (
                <div
                  style={{
                    color: palette.muted,
                    fontSize: 13,
                    lineHeight: 1,
                    fontWeight: 700,
                    letterSpacing: "0.32em",
                    textTransform: "uppercase",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {getHeaderTitle(activeView)}
                </div>
              )}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
              <button
                type="button"
                style={{ ...themedIconButton, position: "relative" }}
                onClick={() => onNavigate("notifications")}
                aria-label="Notifications"
              >
                <Bell size={20} strokeWidth={1.95} />
                {unreadCount > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: 7,
                      right: 8,
                      width: 6,
                      height: 6,
                      borderRadius: 99,
                      background: palette.unread,
                    }}
                  />
                )}
              </button>
              <button
                type="button"
                style={themedIconButton}
                onClick={onRefresh}
                aria-label="Refresh"
              >
                <RefreshCw
                  size={21}
                  color={palette.text}
                  className={refreshing ? "spin" : ""}
                  strokeWidth={2.05}
                />
              </button>
            </div>
          </div>
        )}

        {/* ── Screen body ── */}
        <div
          ref={bodyRef}
          key={activeView}
          className={isOnboarding ? "screen-body-onboarding" : `screen-body${isFullscreenDark ? " screen-body--fullscreen" : ""}`}
          style={{
            background: palette.bg,
            overscrollBehaviorY: "contain",
          }}
        >
          {children}
        </div>

        {!isOnboarding && !isFullscreenDark && (
          <TabBar activeView={activeView} onChange={onNavigate} theme={theme} />
        )}

        {/* ── Profile bottom sheet ── */}
        {sheetOpen && (
          <>
            <div className="psheet-backdrop" onClick={closeSheet} />
            <div className="psheet">
              <div className="psheet-handle" />

              {/* Avatar — tap to change photo */}
              <div className="psheet-avatar-area">
                <button
                  type="button"
                  className="psheet-avatar"
                  onClick={uploadProfilePhoto ? handlePhotoChange : undefined}
                  aria-label="Change profile photo"
                  disabled={!uploadProfilePhoto}
                >
                  {profile.profilePhotoUrl ? (
                    <img src={getFileUrl(profile.profilePhotoUrl)} alt={profile.name} />
                  ) : (
                    <span className="psheet-avatar-initials">{getInitials(profile.name || "M")}</span>
                  )}
                  {uploadProfilePhoto && (
                    <span className="psheet-avatar-cam"><Camera size={13} /></span>
                  )}
                </button>
                {uploadProfilePhoto && (
                  <p className="psheet-avatar-hint">Tap photo to change</p>
                )}
              </div>

              {/* Name + meta */}
              <div className="psheet-name">{profile.name || "Employee"}</div>
              {(profile.employeeCode || profile.employer) && (
                <div className="psheet-meta">
                  {[profile.employeeCode, profile.employer].filter(Boolean).join(" · ")}
                </div>
              )}

              {/* Action rows */}
              <div className="psheet-actions">
                <button type="button" className="psheet-action-row" onClick={handleViewProfile}>
                  <span className="psheet-action-icon"><User size={16} /></span>
                  <span className="psheet-action-label">View Full Profile</span>
                  <ChevronRight size={15} className="psheet-action-chevron" />
                </button>
                {uploadProfilePhoto && (
                  <button type="button" className="psheet-action-row" onClick={handlePhotoChange}>
                    <span className="psheet-action-icon"><Camera size={16} /></span>
                    <span className="psheet-action-label">Change Profile Photo</span>
                    <ChevronRight size={15} className="psheet-action-chevron" />
                  </button>
                )}
              </div>

              <button type="button" className="psheet-dismiss" onClick={closeSheet}>
                Dismiss
              </button>
            </div>
          </>
        )}

        {/* Hidden file input */}
        {uploadProfilePhoto && (
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => {
              if (e.target.files?.[0]) uploadProfilePhoto(e.target.files[0]);
              e.target.value = "";
            }}
          />
        )}
      </div>
    </div>
  );
}
