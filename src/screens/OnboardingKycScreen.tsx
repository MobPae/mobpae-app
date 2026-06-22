import { useRef } from "react";
import { FileText, ShieldCheck, UploadCloud } from "lucide-react";
import type { KycDocument, KycDocumentType, View } from "../types/app";

type Props = {
  documents: KycDocument[];
  uploadingKycType: KycDocumentType | null;
  onUpload: (type: KycDocumentType, file: File) => void;
  onContinue: (view: View) => void;
};

const KYC_DOCS: { type: KycDocumentType; label: string; hint: string }[] = [
  { type: "PAN",         label: "PAN Card",    hint: "PDF or image of your PAN card" },
  { type: "AADHAR",      label: "Aadhaar",     hint: "Front & back of your Aadhaar" },
  { type: "SALARY_SLIP", label: "Salary Slip", hint: "Last 1–3 months salary slip" },
];

const STATUS_COLOR: Record<string, string> = {
  Verified:       "#3B6D11",
  "Under Review": "#92600A",
  Rejected:       "#A32D2D",
  "Not Uploaded": "#62657A",
};
const STATUS_BG: Record<string, string> = {
  Verified:       "#EBF6E3",
  "Under Review": "#FEF9EE",
  Rejected:       "#FCEEEE",
  "Not Uploaded": "#F0F0F8",
};

function UploadCard({
  docType, label, hint, doc, uploading, onUpload,
}: {
  docType: KycDocumentType;
  label: string;
  hint: string;
  doc?: KycDocument;
  uploading: boolean;
  onUpload: (type: KycDocumentType, file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const status = doc?.status ?? "Not Uploaded";
  const color  = STATUS_COLOR[status] ?? "#8D90A3";
  const bg     = STATUS_BG[status]    ?? "#F0F0F8";
  const isVerified = status === "Verified";

  return (
    <div className="ob-kyc-card">
      <div className="ob-kyc-card-left">
        <div className="ob-kyc-icon" style={{ background: isVerified ? "#ECEBFF" : "var(--brand-pale)" }}>
          <FileText size={17} color={isVerified ? "#7679FF" : "var(--brand)"} />
        </div>
        <div>
          <div className="ob-kyc-label">{label}</div>
          <div className="ob-kyc-hint">{doc?.note || hint}</div>
        </div>
      </div>

      <div className="ob-kyc-card-right">
        <span className="ob-kyc-status-pill" style={{ color, background: bg }}>
          {status === "Not Uploaded" ? "Pending" : status}
        </span>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,image/jpeg,image/png,image/jpg"
          style={{ display: "none" }}
          disabled={uploading}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onUpload(docType, file);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          className={`ob-kyc-upload-btn ${uploading ? "ob-kyc-upload-btn--loading" : ""}`}
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          <UploadCloud size={13} />
          {uploading ? "Uploading…" : isVerified ? "Re-upload" : "Upload"}
        </button>
      </div>
    </div>
  );
}

export function OnboardingKycScreen({ documents, uploadingKycType, onUpload, onContinue }: Props) {
  // Count how many of the 3 required types have been uploaded.
  // API only returns uploaded docs (no "Not Uploaded" placeholders),
  // so we check per-type rather than array length.
  const uploadedCount = KYC_DOCS.filter(({ type }) => {
    const doc = documents.find(
      (d) =>
        d.documentType === type ||
        d.label?.toUpperCase().replace("AADHAAR", "AADHAR").replaceAll(" ", "_") === type
    );
    return doc && doc.status !== "Not Uploaded";
  }).length;
  const canContinue = uploadedCount === KYC_DOCS.length;

  return (
    <div className="ob-screen">
      {/* Step indicator */}
      <div className="ob-step-bar">
        <div className="ob-step-dot ob-step-dot--active" />
        <div className="ob-step-line" />
        <div className="ob-step-dot" />
      </div>

      {/* Header */}
      <div className="ob-header">
        <div className="ob-header-icon">
          <ShieldCheck size={28} color="var(--brand)" strokeWidth={1.8} />
        </div>
        <div className="ob-step-label">Step 1 of 2</div>
        <h1 className="ob-title">Let's verify you</h1>
        <p className="ob-subtitle">
          Upload your documents so we can set up your account. Verification usually takes 24 hours.
        </p>
      </div>

      {/* Document cards */}
      <div className="ob-kyc-list">
        {KYC_DOCS.map(({ type, label, hint }) => {
          const doc = documents.find(
            (d) =>
              d.documentType === type ||
              d.label.toUpperCase().replace("AADHAAR", "AADHAR").replaceAll(" ", "_") === type
          );
          return (
            <UploadCard
              key={type}
              docType={type}
              label={label}
              hint={hint}
              doc={doc}
              uploading={uploadingKycType === type}
              onUpload={onUpload}
            />
          );
        })}
      </div>

      {uploadedCount > 0 && (
        <div className="ob-progress-note">
          <ShieldCheck size={14} color="#7679FF" />
          {uploadedCount} of {KYC_DOCS.length} documents submitted · pending admin review
        </div>
      )}

      {/* CTA */}
      <div className="ob-cta-area">
        {!canContinue && (
          <p className="ob-cta-gate-note">
            All 3 documents must be uploaded before you can continue
          </p>
        )}
        <button
          type="button"
          className="ob-cta-btn"
          disabled={!canContinue}
          onClick={() => onContinue("onboarding-bank")}
        >
            {canContinue
            ? <>All documents uploaded — Continue
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </>
            : `Upload all 3 documents to continue (${uploadedCount}/${KYC_DOCS.length} done)`
          }
        </button>
      </div>
    </div>
  );
}
