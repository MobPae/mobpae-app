import { BadgeIndianRupee, Home, Landmark, UserRound } from "lucide-react";
import type { ReactNode } from "react";
import type { View } from "../../types/app";

type TabBarProps = {
  activeView: View;
  onChange: (view: View) => void;
};

const tabs = [
  { id: "dashboard", label: "Home", icon: <Home size={19} /> },
  { id: "advance", label: "Advance", icon: <BadgeIndianRupee size={19} /> },
  { id: "tracking", label: "Track", icon: <Landmark size={19} /> },
  { id: "profile", label: "Profile", icon: <UserRound size={19} /> }
] satisfies Array<{ id: View; label: string; icon: ReactNode }>;

export function TabBar({ activeView, onChange }: TabBarProps) {
  return (
    <nav className="tabbar" aria-label="Employee app navigation">
      {tabs.map((tab) => (
        <button key={tab.id} className={`tab ${activeView === tab.id ? "active" : ""}`} type="button" onClick={() => onChange(tab.id)}>
          {tab.icon}
          <span>{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
