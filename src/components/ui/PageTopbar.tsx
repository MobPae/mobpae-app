import { Bell } from "lucide-react";
import { getFileUrl } from "../../services/api";
import type { EmployeeProfile, View } from "../../types/app";

type Props = {
  title: string;
  profile: Pick<EmployeeProfile, "name" | "profilePhotoUrl">;
  unreadCount: number;
  onNavigate: (view: View) => void;
  /** Override avatar click — defaults to navigating to "profile" */
  onAvatarClick?: () => void;
};

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map(n => n[0]?.toUpperCase() ?? "").join("");
}

export function PageTopbar({
  title,
  profile,
  unreadCount,
  onNavigate,
  onAvatarClick,
}: Props) {
  return (
    <div className="dash-v5-topbar">
      <div className="page-topbar-title">{title}</div>
      <div className="dash-v5-topbar-actions">
        <button
          type="button"
          className="dash-v5-icon-btn mp-bell-btn"
          aria-label="Notifications"
          onClick={() => onNavigate("notifications")}
        >
          <Bell size={20} />
          {unreadCount > 0 && <span className="mp-bell-badge" />}
        </button>
        <button
          type="button"
          className="dash-v5-avatar-btn"
          aria-label="Profile"
          onClick={onAvatarClick ?? (() => onNavigate("profile"))}
        >
          {getInitials(profile.name || "M")}
          {profile.profilePhotoUrl && (
            <img src={getFileUrl(profile.profilePhotoUrl)} alt={profile.name}
              onError={(e) => { e.currentTarget.style.display = "none"; }} />
          )}
        </button>
      </div>
    </div>
  );
}
