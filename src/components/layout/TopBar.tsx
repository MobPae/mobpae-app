import { Bell } from "lucide-react";
import type { EmployeeProfile } from "../../types/app";

type TopBarProps = {
  profile: EmployeeProfile;
  notifCount?: number;
  onNotificationsClick?: () => void;
};

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export function TopBar({ profile, notifCount = 0, onNotificationsClick }: TopBarProps) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="topbar-avatar">{initials(profile.name)}</div>
        <div>
          <p className="topbar-greet">{profile.employer}</p>
          <p className="topbar-name">Hi, {profile.name.split(" ")[0]}</p>
        </div>
      </div>
      <div className="topbar-actions">
        <button
          className="icon-btn topbar-bell-btn"
          type="button"
          aria-label="Notifications"
          onClick={onNotificationsClick}
        >
          <Bell size={16} />
          {notifCount > 0 && (
            <span className="topbar-bell-badge">
              {notifCount > 9 ? "9+" : notifCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
