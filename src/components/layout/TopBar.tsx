import { Bell } from "lucide-react";
import type { EmployeeProfile } from "../../types/app";

type TopBarProps = {
  profile: EmployeeProfile;
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

export function TopBar({ profile }: TopBarProps) {
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
        <button className="icon-btn" type="button" aria-label="Notifications">
          <Bell size={16} />
        </button>
      </div>
    </header>
  );
}
