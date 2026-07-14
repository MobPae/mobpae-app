import { ChevronLeft } from "lucide-react";

type SubPageHeaderProps = {
  title: string;
  onBack: () => void;
};

export function SubPageHeader({ title, onBack }: SubPageHeaderProps) {
  return (
    <div className="sub-page-header">
      <button type="button" className="sub-page-back" onClick={onBack}>
        <ChevronLeft size={20} strokeWidth={2.2} />
      </button>
      <div className="sub-page-title">{title}</div>
    </div>
  );
}
