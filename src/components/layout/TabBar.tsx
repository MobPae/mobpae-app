import type { View } from "../../types/app";

type TabBarProps = {
  activeView: View;
  onChange: (view: View) => void;
};

/* SVG icons matched to the mockup — outline/inactive, bolder active via CSS */
function IconHome({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "#c4522a" : "none"}
      stroke={active ? "#c4522a" : "#b0b0be"} strokeWidth={active ? 2.2 : 1.8}
      strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
      <path d="M9 21V12h6v9" />
    </svg>
  );
}

function IconWallet({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke={active ? "#c4522a" : "#b0b0be"} strokeWidth={active ? 2.2 : 1.8}
      strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M16 12a1 1 0 1 0 2 0 1 1 0 0 0-2 0z" fill={active ? "#c4522a" : "#b0b0be"} />
      <path d="M2 10h20" />
    </svg>
  );
}

function IconActivity({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke={active ? "#c4522a" : "#b0b0be"} strokeWidth={active ? 2.2 : 1.8}
      strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}

function IconCrown({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke={active ? "#c4522a" : "#b0b0be"} strokeWidth={active ? 2.2 : 1.8}
      strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 20h20" />
      <path d="M5 20V10l7-6 7 6v10" />
      <path d="M12 4L2 10l3 4 7-4 7 4 3-4L12 4z" />
    </svg>
  );
}

function IconUser({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke={active ? "#c4522a" : "#b0b0be"} strokeWidth={active ? 2.2 : 1.8}
      strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  );
}

const TABS: Array<{ id: View; label: string }> = [
  { id: "home",     label: "Home"     },
  { id: "advance",  label: "Advance"  },
  { id: "activity", label: "Activity" },
  { id: "member",   label: "Member"   },
  { id: "profile",  label: "Profile"  },
];

function TabIcon({ id, active }: { id: View; active: boolean }) {
  if (id === "home")     return <IconHome     active={active} />;
  if (id === "advance")  return <IconWallet   active={active} />;
  if (id === "activity") return <IconActivity active={active} />;
  if (id === "member")   return <IconCrown    active={active} />;
  return <IconUser active={active} />;
}

export function TabBar({ activeView, onChange }: TabBarProps) {
  return (
    <nav className="bottom-nav" aria-label="Navigation">
      {TABS.map(tab => {
        const active = activeView === tab.id;
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
