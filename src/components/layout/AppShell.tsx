import type { ReactNode } from "react";
import { TabBar } from "./TabBar";
import type { EmployeeProfile, View } from "../../types/app";

type AppShellProps = {
  activeView: View;
  children: ReactNode;
  profile: EmployeeProfile;
  onNavigate: (view: View) => void;
};

const ONBOARDING_VIEWS: View[] = ["onboarding-kyc", "onboarding-bank", "onboarding-done"];

export function AppShell({ activeView, children, onNavigate }: AppShellProps) {
  const isOnboarding = ONBOARDING_VIEWS.includes(activeView);
  return (
    <div className="app-root">
      <div className="phone-shell">
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
