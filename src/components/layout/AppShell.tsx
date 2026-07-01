import { useEffect, useRef, useState, type ReactNode } from "react";
import { Bell, Camera, ChevronLeft, ChevronRight, RefreshCw, User } from "lucide-react";
import { TabBar } from "./TabBar";
import type { EmployeeProfile, View } from "../../types/app";
import { getFileUrl } from "../../services/api";

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
};

const TAB_VIEWS: View[] = ["home", "advance", "repayments", "activity", "profile"];
const ONBOARDING_VIEWS: View[] = ["onboarding-kyc", "onboarding-bank", "onboarding-done"];
const HEADER_VIEWS: View[] = [...TAB_VIEWS, ...ONBOARDING_VIEWS];

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map((n) => n[0]?.toUpperCase() ?? "").join("");
}

function getHeaderTitle(view: View) {
  const titles: Partial<Record<View, string>> = {
    advance: "Advances",
    repayments: "Repayments",
    activity: "Transactions",
    profile: "Profile",
    "onboarding-kyc": "KYC Documents",
    "onboarding-bank": "Bank Account",
    "onboarding-done": "Setup Status",
  };
  return titles[view] ?? "MobPae";
}

export function AppShell({
  activeView, children, profile, unreadCount, refreshing, onRefresh, onNavigate, onBack, uploadProfilePhoto,
}: AppShellProps) {
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const isOnboarding = ONBOARDING_VIEWS.includes(activeView);
  const isTabView = HEADER_VIEWS.includes(activeView);
  const isHome = activeView === "home";
  const isProfile = activeView === "profile";
  const homeHeaderSub = profile.employerEmail || profile.employer || "MobPae member";

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
    <div className="app-root">
      <div className="phone-shell">

        {/* ── Shared header ── */}
        {isTabView && (
          <div className={`global-header ${isHome ? "global-header--home" : ""}`}>

            {isHome ? (
              /* ── Home: MobPae logo + sub text ── */
              <>
                <div className="global-header-logo-wrap">
                  <img src="/logo-icon.svg" alt="MobPae" className="global-header-logo" />
                </div>
                <div className="global-header-left">
                  <div className="global-header-code">
                    {profile.name?.split(" ")[0] || "Employee"}
                    {profile.employeeCode ? <span className="global-header-emp-code"> - {profile.employeeCode}</span> : null}
                  </div>
                  <div className="global-header-email">{homeHeaderSub}</div>
                </div>
              </>
            ) : (
              /* ── Other screens: back + title ── */
              <>
                <button type="button" className="global-header-back" onClick={onBack ?? (() => onNavigate("home"))} aria-label="Back">
                  <ChevronLeft size={25} />
                </button>
                <div className="global-header-title">{getHeaderTitle(activeView)}</div>
                <div className="global-header-spacer" />
              </>
            )}

            {/* ── Right actions ── */}
            <div className="global-header-actions">
              <button type="button" className="mp-topbar-icon-btn" onClick={() => onNavigate("notifications")} aria-label="Notifications">
                <Bell size={21} color="#6B45F4" strokeWidth={2.05} />
                {unreadCount > 0 && <span className="mp-notif-dot" />}
              </button>
              <button type="button" className="mp-topbar-icon-btn" onClick={onRefresh} aria-label="Refresh">
                <RefreshCw size={20} color="#6B45F4" className={refreshing ? "spin" : ""} strokeWidth={2.1} />
              </button>
              {/* Profile avatar — only on Profile screen, opens sheet */}
              {isProfile && (
                <button type="button" className="global-header-avatar global-header-avatar--edit" onClick={openSheet} aria-label="Profile options">
                  {profile.profilePhotoUrl ? (
                    <img src={getFileUrl(profile.profilePhotoUrl)} alt={profile.name} />
                  ) : (
                    getInitials(profile.name || "M")
                  )}
                  <span className="global-header-avatar-cam"><Camera size={8} /></span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── Screen body ── */}
        <div
          ref={bodyRef}
          key={activeView}
          className={isOnboarding ? "screen-body-onboarding" : "screen-body"}
        >
          {children}
        </div>

        {!isOnboarding && (
          <TabBar activeView={activeView} onChange={onNavigate} />
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
