import type { ReactNode } from "react";
import { Bell, RefreshCw } from "lucide-react";
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
};

const TAB_VIEWS: View[] = ["home", "advance", "repayments", "activity", "profile"];
const ONBOARDING_VIEWS: View[] = ["onboarding-kyc", "onboarding-bank", "onboarding-done"];

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map((n) => n[0]?.toUpperCase() ?? "").join("");
}

export function AppShell({
  activeView, children, profile, unreadCount, refreshing, onRefresh, onNavigate,
}: AppShellProps) {
  const isOnboarding = ONBOARDING_VIEWS.includes(activeView);
  const isTabView = TAB_VIEWS.includes(activeView);
  const headerTitle = profile.employeeCode || "Employee";
  const headerSub = profile.employer || "MobPae member";

  return (
    <div className="app-root">
      <div className="phone-shell">

        {/* ── Shared header (tab views only) ── */}
        {isTabView && (
          <div className="global-header">
            <button type="button" className="global-header-avatar" onClick={() => onNavigate("profile")}>
              {profile.profilePhotoUrl ? (
                <img src={getFileUrl(profile.profilePhotoUrl)} alt={profile.name} />
              ) : (
                getInitials(profile.name || "M")
              )}
            </button>
            <div className="global-header-left">
              <div className="global-header-title">{headerTitle}</div>
              <div className="global-header-sub">{headerSub}</div>
            </div>
            <div className="global-header-actions">
              <button type="button" className="mp-topbar-icon-btn" onClick={() => onNavigate("notifications")} aria-label="Notifications">
                <Bell size={18} color="#171715" strokeWidth={2.05} />
                {unreadCount > 0 && <span className="mp-notif-dot" />}
              </button>
              <button type="button" className="mp-topbar-icon-btn" onClick={onRefresh} aria-label="Refresh">
                <RefreshCw size={17} color="#8A847B" className={refreshing ? "spin" : ""} strokeWidth={2.1} />
              </button>
            </div>
          </div>
        )}

        <div className={isOnboarding ? "screen-body-onboarding" : "screen-body"}>
          {children}
        </div>

        {!isOnboarding && (
          <TabBar activeView={activeView} onChange={onNavigate} />
        )}
      </div>
    </div>
  );
}
