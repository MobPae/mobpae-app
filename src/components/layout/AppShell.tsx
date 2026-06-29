import { useEffect, useRef, type ReactNode } from "react";
import { Bell, ChevronLeft, RefreshCw } from "lucide-react";
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
  activeView, children, profile, unreadCount, refreshing, onRefresh, onNavigate, onBack,
}: AppShellProps) {
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const isOnboarding = ONBOARDING_VIEWS.includes(activeView);
  const isTabView = HEADER_VIEWS.includes(activeView);
  const showTabHeader = isTabView;
  const isHome = activeView === "home";
  const homeHeaderTitle = profile.employeeCode || "Employee";
  const homeHeaderSub = profile.employerEmail || profile.employer || "MobPae member";

  useEffect(() => {
    const body = bodyRef.current;
    if (!body) return;

    body.scrollTo({ top: 0, left: 0, behavior: "auto" });
    body.querySelectorAll<HTMLElement>(".screen-body, .screen-body-onboarding").forEach((node) => {
      node.scrollTo({ top: 0, left: 0, behavior: "auto" });
    });
  }, [activeView]);

  return (
    <div className="app-root">
      <div className="phone-shell">

        {/* ── Shared header (tab views only) ── */}
        {showTabHeader && (
          <div className={`global-header ${isHome ? "global-header--home" : ""}`}>
            {isHome ? (
              <>
                <button type="button" className="global-header-avatar" onClick={() => onNavigate("profile")} aria-label="Profile">
                  {profile.profilePhotoUrl ? (
                    <img src={getFileUrl(profile.profilePhotoUrl)} alt={profile.name} />
                  ) : (
                    getInitials(profile.name || "M")
                  )}
                </button>
                <div className="global-header-left">
                  <div className="global-header-code">{homeHeaderTitle}</div>
                  <div className="global-header-email">{homeHeaderSub}</div>
                </div>
              </>
            ) : (
              <>
                <button type="button" className="global-header-back" onClick={onBack ?? (() => onNavigate("home"))} aria-label="Back">
                  <ChevronLeft size={25} />
                </button>
                <div className="global-header-title">{getHeaderTitle(activeView)}</div>
                <div className="global-header-spacer" />
              </>
            )}
            <div className="global-header-actions">
              <button type="button" className="mp-topbar-icon-btn" onClick={() => onNavigate("notifications")} aria-label="Notifications">
                <Bell size={21} color="#6B45F4" strokeWidth={2.05} />
                {unreadCount > 0 && <span className="mp-notif-dot" />}
              </button>
              <button type="button" className="mp-topbar-icon-btn" onClick={onRefresh} aria-label="Refresh">
                <RefreshCw size={20} color="#6B45F4" className={refreshing ? "spin" : ""} strokeWidth={2.1} />
              </button>
              {!isHome && (
                <button type="button" className="global-header-avatar" onClick={() => onNavigate("profile")} aria-label="Profile">
                  {profile.profilePhotoUrl ? (
                    <img src={getFileUrl(profile.profilePhotoUrl)} alt={profile.name} />
                  ) : (
                    getInitials(profile.name || "M")
                  )}
                </button>
              )}
            </div>
          </div>
        )}

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
      </div>
    </div>
  );
}
