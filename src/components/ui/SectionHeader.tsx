import type { ReactNode } from "react";

type SectionHeaderProps = {
  icon?: ReactNode;
  eyebrow?: string;
  title: string;
  action?: ReactNode;
};

export function SectionHeader({ icon, eyebrow, title, action }: SectionHeaderProps) {
  return (
    <div className="section-header">
      <div className="section-heading">
        {icon}
        <div>
          {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
          <h2>{title}</h2>
        </div>
      </div>
      {action}
    </div>
  );
}
