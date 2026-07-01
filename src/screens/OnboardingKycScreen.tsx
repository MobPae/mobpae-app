import { useRef } from "react";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle,
  Clock,
  FileText,
  Loader2,
  ShieldCheck,
  UploadCloud,
  XCircle,
} from "lucide-react";
import type { KycDocument, KycDocumentType, View } from "../types/app";

type Props = {
  documents: KycDocument[];
  uploadingKycType: KycDocumentType | null;
  onUpload: (type: KycDocumentType, file: File) => void;
  onContinue: (view: View) => void;
  bankConnected: boolean;
};

const KYC_DOCS: { type: KycDocumentType; label: string; hint: string }[] = [
  { type: "PAN",         label: "PAN Card",    hint: "Clear image of front side" },
  { type: "AADHAR",      label: "Aadhaar Card", hint: "Front & back of Aadhaar" },
  { type: "SALARY_SLIP", label: "Salary Slip",  hint: "Last 1–3 months slip" },
];

function StatusChip({ status }: { status: string }) {
  if (status === "Verified")
    return <span className="chip chip-green"><span className="chip-dot" /> Verified</span>;
  if (status === "Under Review")
    return <span className="chip chip-amber"><span className="chip-dot" /> Under Review</span>;
  if (status === "Rejected")
    return <span className="chip chip-red"><span className="chip-dot" /> Rejected</span>;
  return <span className="chip chip-gray">Not Uploaded</span>;
}

function StatusIcon({ status }: { status: string }) {
  if (status === "Verified") return <CheckCircle size={18} color="#16A34A" />;
  if (status === "Under Review") return <Clock size={18} color="#D97706" />;
  if (status === "Rejected") return <XCircle size={18} color="#DC2626" />;
  return <UploadCloud size={18} color="#5B3CE3" />;
}

export function OnboardingKycScreen({
  documents,
  uploadingKycType,
  onUpload,
  onContinue,
  bankConnected,
}: Props) {
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const allDocsVerified = documents.length > 0 && documents.every((d) => d.status === "Verified");
  const allVerified = allDocsVerified;
  const docDoneCount = documents.filter((d) => d.status !== "Not Uploaded").length;
  const doneCount = docDoneCount;
  const totalRequirements = KYC_DOCS.length;

  function getDoc(type: KycDocumentType) {
    return documents.find((d) => d.documentType === type);
  }

  const nextView: View = bankConnected ? "advance" : "onboarding-bank";
  const ctaLabel = bankConnected ? "Continue to Advance" : "Continue to Bank Account";

  return (
    <div className="onb-screen">

      {/* Hero */}
      <div className="onb-hero">
        <div className="onb-hero-text">
          <div className="onb-hero-title">KYC Verification</div>
          <div className="onb-hero-sub">
            Upload your documents to verify your identity and unlock salary advances.
          </div>
          {doneCount > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
              <span className="chip chip-purple">{doneCount}/{totalRequirements} uploaded</span>
            </div>
          )}
        </div>
        <div className="onb-hero-illus-box">
          <ShieldCheck size={32} />
        </div>
      </div>

      <div className="onb-body">

        {/* Document list */}
        <div className="onb-doc-card">
          {KYC_DOCS.map(({ type, label, hint }) => {
            const doc = getDoc(type);
            const status = doc?.status ?? "Not Uploaded";
            const isUploading = uploadingKycType === type;
            const canUpload = status !== "Verified";
            return (
              <div key={type} className="onb-doc-row">
                <div className="onb-doc-icon">
                  {isUploading ? <Loader2 size={18} className="spin" /> : <StatusIcon status={status} />}
                </div>
                <div className="onb-doc-body">
                  <div className="onb-doc-title">{label}</div>
                  <div className="onb-doc-sub">{doc?.note || hint}</div>
                  <div className="onb-status-line">
                    {status === "Under Review" && <span className="onb-uploaded-label">Uploaded</span>}
                    <StatusChip status={status} />
                  </div>
                </div>
                {canUpload && !isUploading && (
                  <button
                    type="button"
                    className="mp-link-btn"
                    onClick={() => fileRefs.current[type]?.click()}
                    style={{ fontSize: 12, flexShrink: 0 }}
                  >
                    <UploadCloud size={14} /> Upload
                  </button>
                )}
                <input
                  ref={(el) => { fileRefs.current[type] = el; }}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  style={{ display: "none" }}
                  onChange={(e) => { if (e.target.files?.[0]) onUpload(type, e.target.files[0]); }}
                />
              </div>
            );
          })}
        </div>

        {/* Tips */}
        <div className="onb-tips-card">
          <div className="onb-tips-hdr"><FileText size={14} /> Document tips</div>
          {[
            "Use clear, well-lit photos",
            "All text must be readable",
            "No blurry or cropped images",
            "Max file size: 5 MB",
          ].map((tip) => (
            <div key={tip} className="onb-tip-row">
              <CheckCircle size={12} className="onb-tip-check" color="#16A34A" />
              {tip}
            </div>
          ))}
        </div>

      </div>

      {/* Footer */}
      <div className="onb-footer">
        <button
          type="button"
          className="mp-btn-primary"
          onClick={() => onContinue(nextView)}
        >
          {allVerified ? (
            <><BadgeCheck size={16} /> All Verified — {ctaLabel}</>
          ) : (
            <>{ctaLabel} <ArrowRight size={16} /></>
          )}
        </button>
        <div className="onb-secure-note">
          <ShieldCheck size={12} /> Documents are encrypted and stored securely
        </div>
      </div>
    </div>
  );
}
