import { UserRound } from "lucide-react";
import type { EmployeeProfile } from "../../types/app";

type TopBarProps = {
  profile: EmployeeProfile;
};

export function TopBar({ profile }: TopBarProps) {
  return (
    <header className="topbar">
      <span className="profile-avatar">
        <UserRound size={19} />
      </span>
      <div>
        <p className="eyebrow">{profile.employer}</p>
        <h1>Hi, {profile.name.split(" ")[0]}</h1>
      </div>
    </header>
  );
}
