import { useEffect, useRef, useState } from "react";
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
import { getFileUrl } from "../services/api";
import type { KycDocument, KycDocumentType, SelfieStatus, View } from "../types/app";

type Props = {
  documents: KycDocument[];
  uploadingKycType: KycDocumentType | null;
  onUpload: (type: KycDocumentType, file: File) => void;
  onContinue: (view: View) => void;
  showProgress?: boolean;
  selfieStatus?: SelfieStatus;
  selfieUrl?: string;
  uploadingSelfie?: boolean;
  onUploadSelfie?: (file: File) => void;
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

function selfieLabel(status?: SelfieStatus) {
  if (status === "VERIFIED") return "Verified";
  if (status === "PENDING") return "Under Review";
  if (status === "REJECTED") return "Rejected";
  return "Not Uploaded";
}

export function OnboardingKycScreen({
  documents,
  uploadingKycType,
  onUpload,
  onContinue,
  showProgress = true,
  selfieStatus,
  selfieUrl,
  uploadingSelfie = false,
  onUploadSelfie,
}: Props) {
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const selfieRef = useRef<HTMLInputElement | null>(null);
  const [selfiePreview, setSelfiePreview] = useState("");
  const normalizedSelfieStatus = selfieLabel(selfieStatus);
  const allDocsVerified = documents.length > 0 && documents.every((d) => d.status === "Verified");
  const allVerified = allDocsVerified && selfieStatus === "VERIFIED";
  const docDoneCount = documents.filter((d) => d.status !== "Not Uploaded").length;
  const doneCount = docDoneCount + (selfieStatus ? 1 : 0);
  const totalRequirements = KYC_DOCS.length + 1;

  useEffect(() => {
    return () => {
      if (selfiePreview) URL.revokeObjectURL(selfiePreview);
    };
  }, [selfiePreview]);

  function getDoc(type: KycDocumentType) {
    return documents.find((d) => d.documentType === type);
  }

  return (
    <div className="onb-screen">

      {/* Progress bar */}
      {showProgress && (
        <div style={{ display: "flex", alignItems: "center", padding: "14px 16px 0", background: "white" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 0, flex: 1 }}>
            {["KYC", "Bank", "Done"].map((label, i) => (
              <div key={label} style={{ flex: 1, display: "flex", alignItems: "center" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                    background: i === 0 ? "#5B3CE3" : "#F3F1FF",
                    color: i === 0 ? "white" : "#9CA3AF",
                    fontSize: 12, fontWeight: 800, border: i === 0 ? "none" : "1.5px solid #E5E7EB",
                  }}>
                    {i + 1}
                  </div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: i === 0 ? "#5B3CE3" : "#9CA3AF", textTransform: "uppercase" }}>{label}</div>
                </div>
                {i < 2 && <div style={{ flex: 1, height: 2, background: "#F3F1FF", margin: "0 4px", marginBottom: 16 }} />}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hero */}
      <div className="onb-hero" style={{ background: "white" }}>
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
          <ShieldCheck size={36} color="#5B3CE3" />
        </div>
      </div>

      <div className="screen-body onb-body" style={{ padding: "12px 16px" }}>

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
                  <StatusChip status={status} />
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

        {/* Selfie verification */}
        <div className="onb-selfie-card">
          <div className="onb-selfie-main">
            <div className="onb-selfie-preview">
              {uploadingSelfie ? (
                <Loader2 size={22} className="spin" />
              ) : selfiePreview || selfieUrl ? (
                <img src={selfiePreview || getFileUrl(selfieUrl)} alt="Selfie preview" />
              ) : (
                <ShieldCheck size={24} />
              )}
            </div>
            <div className="onb-selfie-body">
              <div className="onb-doc-title">Selfie Verification</div>
              <div className="onb-doc-sub">
                Open camera and capture a clear selfie for identity verification.
              </div>
              <StatusChip status={normalizedSelfieStatus} />
            </div>
          </div>
          {selfieStatus !== "VERIFIED" && (
            <div className="onb-selfie-actions">
              <button
                type="button"
                className="mp-btn-secondary"
                disabled={uploadingSelfie || !onUploadSelfie}
                onClick={() => selfieRef.current?.click()}
              >
                {uploadingSelfie ? <Loader2 size={14} className="spin" /> : <UploadCloud size={14} />}
                {selfieStatus === "REJECTED" ? "Retake Selfie" : selfieUrl || selfiePreview ? "Retake Selfie" : "Open Camera"}
              </button>
              <input
                ref={selfieRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                capture="user"
                style={{ display: "none" }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file || !onUploadSelfie) return;
                  if (selfiePreview) URL.revokeObjectURL(selfiePreview);
                  setSelfiePreview(URL.createObjectURL(file));
                  onUploadSelfie(file);
                  e.currentTarget.value = "";
                }}
              />
            </div>
          )}
        </div>

        {/* Tips */}
        <div className="onb-tips-card">
          <div className="onb-tips-hdr"><FileText size={14} /> Document tips</div>
          {[
            "Use clear, well-lit photos",
            "All text must be readable",
            "No blurry or cropped images",
            "Selfie should show your face clearly",
            "Max file size: 5 MB",
          ].map((tip) => (
            <div key={tip} className="onb-tip-row">
              <CheckCircle size={12} className="onb-tip-check" color="#16A34A" />
              {tip}
            </div>
          ))}
        </div>

        <div className="mp-bottom-space" />
      </div>

      {/* Footer */}
      <div className="onb-footer">
        <button
          type="button"
          className="mp-btn-primary"
          onClick={() => onContinue("onboarding-bank")}
        >
          {allVerified ? (
            <><BadgeCheck size={16} /> All Verified — Continue</>
          ) : (
            <>Continue to Bank Account <ArrowRight size={16} /></>
          )}
        </button>
        <div className="onb-secure-note">
          <ShieldCheck size={12} /> Documents are encrypted and stored securely
        </div>
      </div>
    </div>
  );
}
