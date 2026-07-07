import { Archive, Clock3, CreditCard, Home, UserRound } from "lucide-react";
import type { View } from "../../types/app";
import type { Theme } from "../../hooks/useTheme";

type TabBarProps = {
  activeView: View;
  onChange: (view: View) => void;
  theme?: Theme;
};

const palette = {
  dark: {
    bg: "#0C0C0E",
    topLine: "#1E1E22",
    active: "#7C6AF5",
    inactive: "#FFFFFF",
  },
  light: {
    bg: "#FFFFFF",
    topLine: "#E8E6F0",
    active: "#5B3CE3",
    inactive: "#111111",
  },
} satisfies Record<Theme, Record<string, string>>;

const tabs: Array<{ id: View; label: string; icon: typeof Home }> = [
  { id: "home",       label: "Home",     icon: Home       },
  { id: "advance",    label: "Advance",  icon: CreditCard },
  { id: "repayments", label: "Repay",    icon: Archive    },
  { id: "activity",   label: "Activity", icon: Clock3     },
  { id: "profile",    label: "Profile",  icon: UserRound  },
];

export function TabBar({ activeView, onChange, theme = "dark" }: TabBarProps) {
  const colors = palette[theme];

  const isActive = (id: View) =>
    activeView === id ||
    (id === "profile" &&
      ["profile-kyc", "profile-bank", "profile-membership"].includes(activeView));

  return (
    <nav
      className="app-tabbar"
      aria-label="Navigation"
      style={{
        flexShrink: 0,
        width: "100%",
        height: 54,
        minHeight: 54,
        maxHeight: 54,
        display: "flex",
        flexDirection: "row",
        alignItems: "stretch",
        background: colors.bg,
        borderTop: `1px solid ${colors.topLine}`,
        zIndex: 60,
        margin: 0,
        padding: 0,
        borderRadius: 0,
        boxShadow: "none",
      }}
    >
      {tabs.map(({ id, label, icon: Icon }) => {
        const active = isActive(id);
        const color = active ? colors.active : colors.inactive;

        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            aria-current={active ? "page" : undefined}
            style={{
              flex: 1,
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 3,
              border: "none",
              background: "transparent",
              color,
              fontFamily: "'Inter', system-ui, sans-serif",
              cursor: "pointer",
              padding: 0,
              margin: 0,
            }}
          >
            <Icon size={22} strokeWidth={active ? 2.2 : 1.7} />
            <span
              style={{
                fontSize: 10,
                lineHeight: 1,
                fontWeight: active ? 600 : 400,
              }}
            >
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
