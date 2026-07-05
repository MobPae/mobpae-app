import { useRef } from "react";
import {
  ArrowRight,
  Check,
  CreditCard,
  FileText,
  IdCard,
  Loader2,
  ShieldCheck,
  Upload,
} from "lucide-react";
import type { ReactNode } from "react";
import type { KycDocument, KycDocumentType, View } from "../types/app";

type Props = {
  documents: KycDocument[];
  uploadingKycType: KycDocumentType | null;
  onUpload: (type: KycDocumentType, file: File) => void;
  onContinue: (view: View) => void;
  bankConnected: boolean;
  mode?: "setup" | "profile";
};

type KycDocConfig = {
  type: KycDocumentType;
  label: string;
  hint: string;
  icon: ReactNode;
};

const KYC_DOCS: KycDocConfig[] = [
  {
    type: "PAN",
    label: "PAN Card",
    hint: "Clear image of front side",
    icon: <CreditCard size={17} strokeWidth={1.9} />,
  },
  {
    type: "AADHAR",
    label: "Aadhaar Card",
    hint: "Front & back of Aadhaar",
    icon: <IdCard size={17} strokeWidth={1.9} />,
  },
  {
    type: "SALARY_SLIP",
    label: "Salary Slip",
    hint: "Last 1-3 months slip",
    icon: <FileText size={17} strokeWidth={1.9} />,
  },
];

function isUploaded(status?: string) {
  return status === "Under Review" || status === "Verified";
}

function isRejected(status?: string) {
  return status === "Rejected";
}

function DocStatus({ status }: { status?: string }) {
  if (isUploaded(status)) {
    return (
      <span className="kycv2-chip kycv2-chip--uploaded">
        <span /> Uploaded
      </span>
    );
  }

  if (isRejected(status)) {
    return (
      <span className="kycv2-chip kycv2-chip--rejected">
        <span /> Rejected
      </span>
    );
  }

  return (
    <span className="kycv2-chip">
      <span /> Not uploaded
    </span>
  );
}

export function OnboardingKycScreen({
  documents,
  uploadingKycType,
  onUpload,
  onContinue,
  bankConnected,
  mode = "setup",
}: Props) {
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  function getDoc(type: KycDocumentType) {
    return documents.find((document) => document.documentType === type);
  }

  const uploadedCount = KYC_DOCS.filter(({ type }) => isUploaded(getDoc(type)?.status)).length;
  const allUploaded = uploadedCount === KYC_DOCS.length;
  const progress = Math.round((uploadedCount / KYC_DOCS.length) * 100);
  const nextView: View = bankConnected ? "home" : "onboarding-bank";
  const ctaLabel = allUploaded
    ? bankConnected
      ? "Go to home"
      : "Continue to bank account"
    : "Upload all documents to continue";
  const isProfileMode = mode === "profile";

  return (
    <div className={`kycv2-screen${isProfileMode ? " kycv2-screen--profile" : ""}`}>
      <section className="kycv2-hero">
        <div>
          <div className="kycv2-kicker">{isProfileMode ? "KYC documents" : "Step 3 of 4"}</div>
          <h1>Verify your identity</h1>
          <p>
            {isProfileMode
              ? "View or replace your submitted documents whenever required."
              : "Upload your documents to unlock salary advances."}
          </p>
        </div>
        <div className="kycv2-hero-icon">
          <ShieldCheck size={25} strokeWidth={1.9} />
        </div>
        <div className="kycv2-progress">
          <span style={{ width: `${progress}%` }} />
        </div>
        <div className="kycv2-progress-count">{uploadedCount}/3</div>
      </section>

      <section className="kycv2-docs">
        {KYC_DOCS.map((config) => {
          const document = getDoc(config.type);
          const status = document?.status ?? "Not Uploaded";
          const uploaded = isUploaded(status);
          const rejected = isRejected(status);
          const isUploading = uploadingKycType === config.type;
          const actionLabel = uploaded ? "Replace" : rejected ? "Re-upload" : "Upload";

          return (
            <article
              key={config.type}
              className={[
                "kycv2-doc-card",
                uploaded ? "is-uploaded" : "",
                rejected ? "is-rejected" : "",
              ].filter(Boolean).join(" ")}
            >
              <span className="kycv2-doc-icon">
                {isUploading ? <Loader2 size={18} className="spin" /> : config.icon}
              </span>

              <div className="kycv2-doc-text">
                <h2>{config.label}</h2>
                <p>{document?.note && rejected ? document.note : config.hint}</p>
                <DocStatus status={status} />
              </div>

              <button
                type="button"
                className={uploaded ? "kycv2-doc-action kycv2-doc-action--ghost" : "kycv2-doc-action"}
                disabled={isUploading}
                onClick={() => fileRefs.current[config.type]?.click()}
              >
                {uploaded ? <Check size={14} /> : <Upload size={14} />}
                {isUploading ? "Uploading" : actionLabel}
              </button>

              <input
                ref={(element) => { fileRefs.current[config.type] = element; }}
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                hidden
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) onUpload(config.type, file);
                  event.currentTarget.value = "";
                }}
              />
            </article>
          );
        })}
      </section>

      <section className="kycv2-tips">
        <div className="kycv2-tips-title">
          <FileText size={14} />
          Document tips
        </div>
        <div className="kycv2-tip-grid">
          <span>Clear photos</span>
          <span>Readable text</span>
          <span>No cropped edges</span>
          <span>Under 5 MB</span>
        </div>
      </section>

      {!isProfileMode && (
        <div className="kycv2-footer">
          <button
            type="button"
            className="kycv2-primary"
            disabled={!allUploaded}
            onClick={() => onContinue(nextView)}
          >
            <span>{ctaLabel}</span>
            <span className="kycv2-primary-icon">
              <ArrowRight size={21} strokeWidth={2.4} />
            </span>
          </button>
          <div className="kycv2-secure">
            <ShieldCheck size={13} />
            Documents are encrypted and stored securely
          </div>
        </div>
      )}
    </div>
  );
}
