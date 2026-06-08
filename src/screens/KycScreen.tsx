import { FileUp, UploadCloud } from "lucide-react";
import { Card } from "../components/ui/Card";
import { SectionHeader } from "../components/ui/SectionHeader";
import { StatusPill } from "../components/ui/StatusPill";
import type { KycDocument, KycDocumentType } from "../types/app";

type KycScreenProps = {
  documents: KycDocument[];
  onUpload: (documentType: KycDocumentType, file: File) => void;
  uploadingType: KycDocumentType | null;
};

const documentTypeFrom = (document: KycDocument): KycDocumentType =>
  document.documentType ?? (document.label.toUpperCase().replace("AADHAAR", "AADHAR").replaceAll(" ", "_") as KycDocumentType);

export function KycScreen({ documents, onUpload, uploadingType }: KycScreenProps) {
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
    </Card>
  );
}
