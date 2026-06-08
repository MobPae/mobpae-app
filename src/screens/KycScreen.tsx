import { ArrowRight, FileUp, Landmark, UploadCloud } from "lucide-react";
import { Card } from "../components/ui/Card";
import { PrimaryButton } from "../components/ui/PrimaryButton";
import { SectionHeader } from "../components/ui/SectionHeader";
import { StatusPill } from "../components/ui/StatusPill";
import type { KycDocument, KycDocumentType, View } from "../types/app";

type KycScreenProps = {
  documents: KycDocument[];
  onUpload: (documentType: KycDocumentType, file: File) => void;
  onNavigate: (view: View) => void;
  uploadingType: KycDocumentType | null;
};

const documentTypeFrom = (document: KycDocument): KycDocumentType =>
  document.documentType ?? (document.label.toUpperCase().replace("AADHAAR", "AADHAR").replaceAll(" ", "_") as KycDocumentType);

export function KycScreen({ documents, onNavigate, onUpload, uploadingType }: KycScreenProps) {
  const verifiedCount = documents.filter((document) => document.status === "Verified").length;
  const progress = Math.round((verifiedCount / documents.length) * 100);
  const kycComplete = documents.length > 0 && verifiedCount === documents.length;

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
            <div className="document-actions">
              <StatusPill status={document.status} />
              <label className="upload-chip">
                <UploadCloud size={14} />
                <span>{uploadingType === documentTypeFrom(document) ? "Uploading" : "Upload"}</span>
                <input
                  type="file"
                  accept="application/pdf,image/*"
                  disabled={uploadingType === documentTypeFrom(document)}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) onUpload(documentTypeFrom(document), file);
                    event.target.value = "";
                  }}
                />
              </label>
            </div>
          </article>
        ))}
      </div>
      {kycComplete ? (
        <div className="next-step-panel">
          <span>
            <Landmark size={18} />
          </span>
          <div>
            <strong>KYC verified</strong>
            <p>Add your bank account to receive salary advance payouts.</p>
          </div>
          <PrimaryButton icon={<ArrowRight size={16} />} onClick={() => onNavigate("profile")}>
            Add bank account
          </PrimaryButton>
        </div>
      ) : null}
    </Card>
  );
}
