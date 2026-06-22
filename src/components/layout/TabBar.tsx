import type { View } from "../../types/app";

type TabBarProps = {
  activeView: View;
  onChange: (view: View) => void;
};

/* SVG icons matched to the mockup — filled active, outline inactive */
function IconHome({ active }: { active: boolean }) {
  const c = active ? "#7679FF" : "#b0b0be";
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      {/* Roof */}
      <path d="M2 11L12 3l10 8" stroke={c} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      {/* Body */}
      <path d="M4 10v9a1 1 0 0 0 1 1h4v-5h6v5h4a1 1 0 0 0 1-1V10"
        stroke={c} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"
        fill={active ? "rgba(118,121,255,0.14)" : "none"} />
    </svg>
  );
}

function IconWallet({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke={active ? "#7679FF" : "#b0b0be"} strokeWidth={active ? 2.2 : 1.8}
      strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M16 12a1 1 0 1 0 2 0 1 1 0 0 0-2 0z" fill={active ? "#7679FF" : "#b0b0be"} />
      <path d="M2 10h20" />
    </svg>
  );
}

function IconActivity({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke={active ? "#7679FF" : "#b0b0be"} strokeWidth={active ? 2.2 : 1.8}
      strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}

function IconUser({ active }: { active: boolean }) {
  const c = active ? "#7679FF" : "#b0b0be";
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="7.5" r="4"
        fill={active ? "rgba(118,121,255,0.14)" : "none"}
        stroke={c} strokeWidth="1.9" />
      <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"
        stroke={c} strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  );
}

const TABS: Array<{ id: View; label: string }> = [
  { id: "home",     label: "Home"     },
  { id: "advance",  label: "Advance"  },
  { id: "activity", label: "History" },
  { id: "profile",  label: "Profile"  },
];

function TabIcon({ id, active }: { id: View; active: boolean }) {
  if (id === "home")     return <IconHome     active={active} />;
  if (id === "advance")  return <IconWallet   active={active} />;
  if (id === "activity") return <IconActivity active={active} />;
  return <IconUser active={active} />;
}

export function TabBar({ activeView, onChange }: TabBarProps) {
  return (
    <nav className="bottom-nav" aria-label="Navigation">
      {TABS.map(tab => {
        const active = activeView === tab.id ||
          (tab.id === "profile" && ["profile-kyc", "profile-bank", "profile-membership"].includes(activeView));
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
