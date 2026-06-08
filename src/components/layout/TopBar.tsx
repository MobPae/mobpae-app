import { Bell, LogOut } from "lucide-react";
import type { EmployeeProfile } from "../../types/app";

type TopBarProps = {
  profile: EmployeeProfile;
  onLogout: () => void;
};

export function TopBar({ profile, onLogout }: TopBarProps) {
  return (
    <header className="topbar">
      <span className="profile-avatar">{profile.name.charAt(0)}</span>
      <div>
        <p className="eyebrow">{profile.employer}</p>
        <h1>Hi, {profile.name.split(" ")[0]}</h1>
      </div>
      <div className="top-actions">
        <button className="icon-button" type="button" aria-label="Notifications" title="Notifications">
          <Bell size={19} />
        </button>
        <button className="icon-button" type="button" aria-label="Logout" title="Logout" onClick={onLogout}>
          <LogOut size={19} />
        </button>
      </div>
    </header>
  );
}
