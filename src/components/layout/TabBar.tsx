import { Archive, Clock3, CreditCard, Home, UserRound } from "lucide-react";
import type { View } from "../../types/app";
import type { Theme } from "../../hooks/useTheme";

type TabBarProps = {
  activeView: View;
  onChange: (view: View) => void;
  theme?: Theme;
};

const DARK_SURFACE = "#0C0C0E";
const LIGHT_SURFACE = "#FFFFFF";

const palette = {
  dark: {
    bg: DARK_SURFACE,
    border: "#1A1A1E",
    active: "#F2F0EA",
    inactive: "#5C5C64",
    shadow: "0 -18px 30px rgba(0,0,0,0.22)",
  },
  light: {
    bg: LIGHT_SURFACE,
    border: "#E9E6F1",
    active: "#5B3CE3",
    inactive: "#9A97A8",
    shadow: "0 -18px 36px rgba(30,22,54,0.08)",
  },
} satisfies Record<Theme, Record<string, string>>;

const tabs: Array<{
  id: View;
  label: string;
  icon: typeof Home;
}> = [
  { id: "home", label: "Home", icon: Home },
  { id: "advance", label: "Advance", icon: CreditCard },
  { id: "repayments", label: "Repay", icon: Archive },
  { id: "activity", label: "Activity", icon: Clock3 },
  { id: "profile", label: "Profile", icon: UserRound },
];

export function TabBar({ activeView, onChange, theme = "dark" }: TabBarProps) {
  const colors = palette[theme];

  return (
    <nav
      className="app-tabbar"
      aria-label="Navigation"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(5, 1fr)",
        alignItems: "flex-start",
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        height: "calc(64px + env(safe-area-inset-bottom, 0px))",
        boxSizing: "border-box",
        background: colors.bg,
        borderTop: `1px solid ${colors.border}`,
        padding: "0 12px env(safe-area-inset-bottom, 0px)",
        flexShrink: 0,
        zIndex: 60,
        boxShadow: colors.shadow,
      }}
    >
      {tabs.map(({ id, label, icon: Icon }) => {
        const active =
          activeView === id ||
          (id === "profile" &&
            ["profile-kyc", "profile-bank", "profile-membership"].includes(
              activeView,
            ));
        const color = active ? colors.active : colors.inactive;

        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            aria-current={active ? "page" : undefined}
            style={{
              minWidth: 0,
              height: 64,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: 3,
              padding: "0 0 4px",
              color,
              background: "transparent",
              border: "none",
              fontFamily: "'Space Grotesk', sans-serif",
            }}
          >
            <Icon size={22} strokeWidth={active ? 2.15 : 1.9} />
            <span
              style={{
                fontSize: 11,
                lineHeight: 1,
                fontWeight: active ? 600 : 500,
                letterSpacing: "-0.01em",
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
