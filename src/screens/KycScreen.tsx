import { FileUp, RotateCcw } from "lucide-react";
import { Card } from "../components/ui/Card";
import { PrimaryButton } from "../components/ui/PrimaryButton";
import { SectionHeader } from "../components/ui/SectionHeader";
import { StatusPill } from "../components/ui/StatusPill";
import type { KycDocument } from "../types/app";

type KycScreenProps = {
  documents: KycDocument[];
  onCompleteDemoKyc: () => void;
};

export function KycScreen({ documents, onCompleteDemoKyc }: KycScreenProps) {
  const verifiedCount = documents.filter((document) => document.status === "Verified").length;
  const progress = Math.round((verifiedCount / documents.length) * 100);

  return (
    <Card>
      <SectionHeader title="KYC documents" eyebrow="Verification" icon={<FileUp size={19} />} />
      <div className="progress-track">
        <span style={{ width: `${progress}%` }} />
      </div>
      <div className="list">
        {documents.map((document) => (
          <article className="document-row" key={document.id}>
            <div>
              <strong>{document.label}</strong>
              <p>{document.note}</p>
            </div>
            <StatusPill status={document.status} />
          </article>
        ))}
      </div>
      <PrimaryButton variant="secondary" icon={<RotateCcw size={17} />} onClick={onCompleteDemoKyc}>
        Mark KYC verified
      </PrimaryButton>
    </Card>
  );
}
