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

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map((n) => n[0]?.toUpperCase() ?? "").join("");
}

function pageTitle(view: View, profile: EmployeeProfile) {
  if (view === "home") {
    const firstName = (profile.name || "there").split(" ")[0];
    return { primary: `${getGreeting()}, ${firstName} 👋`, sub: profile.employer || "" };
  }
  const titles: Partial<Record<View, string>> = {
    advance: "Advances",
    repayments: "Repayments",
    activity: "Transactions",
    profile: "Profile",
  };
  return { primary: titles[view] ?? "", sub: "" };
}

export function AppShell({
  activeView, children, profile, unreadCount, refreshing, onRefresh, onNavigate,
}: AppShellProps) {
  const isOnboarding = ONBOARDING_VIEWS.includes(activeView);
  const isTabView = TAB_VIEWS.includes(activeView);
  const { primary, sub } = pageTitle(activeView, profile);

  return (
    <div className="app-root">
      <div className="phone-shell">

        {/* ── Shared header (tab views only) ── */}
        {isTabView && (
          <div className="global-header">
            <div className="global-header-left">
              <div className="global-header-title">{primary}</div>
              {sub && <div className="global-header-sub">{sub}</div>}
            </div>
            <div className="global-header-actions">
              <button type="button" className="mp-topbar-icon-btn" onClick={() => onNavigate("notifications")}>
                <Bell size={20} color="#0F0A3C" />
                {unreadCount > 0 && <span className="mp-notif-dot" />}
              </button>
              <button type="button" className="mp-topbar-icon-btn" onClick={onRefresh}>
                <RefreshCw size={18} color="#6B7280" className={refreshing ? "spin" : ""} />
              </button>
              <button type="button" className="mp-topbar-avatar" onClick={() => onNavigate("profile")}>
                {profile.profilePhotoUrl ? (
                  <img src={getFileUrl(profile.profilePhotoUrl)} alt={profile.name} />
                ) : (
                  getInitials(profile.name || "M")
                )}
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
