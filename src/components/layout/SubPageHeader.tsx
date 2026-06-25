import { ChevronLeft } from "lucide-react";

type SubPageHeaderProps = {
  title: string;
  onBack: () => void;
};

export function SubPageHeader({ title, onBack }: SubPageHeaderProps) {
  return (
    <div className="sub-page-header">
      <button type="button" className="sub-page-back" onClick={onBack}>
        <ChevronLeft size={22} />
      </button>
      <div className="sub-page-title">{title}</div>
      <div style={{ width: 36 }} /> {/* spacer to center title */}
    </div>
  );
}
