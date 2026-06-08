import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

type ActionRowProps = {
  icon: ReactNode;
  title: string;
  description: string;
  onClick: () => void;
};

export function ActionRow({ icon, title, description, onClick }: ActionRowProps) {
  return (
    <button className="action-row" type="button" onClick={onClick}>
      <span>{icon}</span>
      <div>
        <strong>{title}</strong>
        <p>{description}</p>
      </div>
      <ChevronRight size={18} />
    </button>
  );
}
