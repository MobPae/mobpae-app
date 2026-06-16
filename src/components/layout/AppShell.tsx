import type { ReactNode } from "react";
import { TabBar } from "./TabBar";
import type { EmployeeProfile, View } from "../../types/app";

type AppShellProps = {
  activeView: View;
  children: ReactNode;
  profile: EmployeeProfile;
  onNavigate: (view: View) => void;
};

export function AppShell({ activeView, children, onNavigate }: AppShellProps) {
  return (
    <div className="app-root">
      <div className="phone-shell">
        <div className="screen-body">
          {children}
        </div>
        <TabBar activeView={activeView} onChange={onNavigate} />
      </div>
    </div>
  );
}
