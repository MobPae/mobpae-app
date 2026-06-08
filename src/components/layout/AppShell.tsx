import type { ReactNode } from "react";
import { TabBar } from "./TabBar";
import { TopBar } from "./TopBar";
import type { EmployeeProfile, View } from "../../types/app";

type AppShellProps = {
  activeView: View;
  children: ReactNode;
  profile: EmployeeProfile;
  onLogout: () => void;
  onNavigate: (view: View) => void;
};

export function AppShell({ activeView, children, profile, onLogout, onNavigate }: AppShellProps) {
  return (
    <main className="app-shell">
      <div className="phone-shell">
        <TopBar profile={profile} onLogout={onLogout} />
        <div className="screen-content">{children}</div>
        <TabBar activeView={activeView} onChange={onNavigate} />
      </div>
    </main>
  );
}
