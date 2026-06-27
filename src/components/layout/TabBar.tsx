import type { View } from "../../types/app";

type TabBarProps = {
  activeView: View;
  onChange: (view: View) => void;
};

const ACTIVE = "#171715";
const INACTIVE = "#A8A096";

function IconHome({ active }: { active: boolean }) {
  const color = active ? ACTIVE : INACTIVE;
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M2 11L12 3l10 8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 10v9a1 1 0 0 0 1 1h4v-5h6v5h4a1 1 0 0 0 1-1V10"
        stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconAdvances({ active }: { active: boolean }) {
  const color = active ? ACTIVE : INACTIVE;
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="2" y="5" width="20" height="14" rx="2"
        stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2 10h20" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <circle cx="17" cy="14" r="1.2" fill={color} />
    </svg>
  );
}

function IconRepayments({ active }: { active: boolean }) {
  const color = active ? ACTIVE : INACTIVE;
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M21 8v13H3V8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M23 3H1v5h22V3z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        fill="none" />
      <path d="M10 12h4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconHistory({ active }: { active: boolean }) {
  const color = active ? ACTIVE : INACTIVE;
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <path d="M12 7v5l3 3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconProfile({ active }: { active: boolean }) {
  const color = active ? ACTIVE : INACTIVE;
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="7.5" r="4" stroke={color} strokeWidth="2" />
      <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

const TABS: Array<{ id: View; label: string }> = [
  { id: "home",       label: "Home"       },
  { id: "advance",    label: "Advances"   },
  { id: "repayments", label: "Repay" },
  { id: "activity",   label: "Activity" },
  { id: "profile",    label: "Profile"    },
];

function TabIcon({ id, active }: { id: View; active: boolean }) {
  if (id === "home")       return <IconHome       active={active} />;
  if (id === "advance")    return <IconAdvances   active={active} />;
  if (id === "repayments") return <IconRepayments active={active} />;
  if (id === "activity")   return <IconHistory    active={active} />;
  return <IconProfile active={active} />;
}

export function TabBar({ activeView, onChange }: TabBarProps) {
  return (
    <nav className="bottom-nav" aria-label="Navigation">
      {TABS.map(tab => {
        const active =
          activeView === tab.id ||
          (tab.id === "profile" && ["profile-kyc","profile-bank","profile-membership"].includes(activeView));
        return (
          <button
            key={tab.id}
            type="button"
            className={`nav-tab ${active ? "active" : ""}`}
            onClick={() => onChange(tab.id)}
            aria-current={active ? "page" : undefined}
          >
            <div className="nav-tab-icon">
              <TabIcon id={tab.id} active={active} />
            </div>
            <span className="nav-tab-label">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
