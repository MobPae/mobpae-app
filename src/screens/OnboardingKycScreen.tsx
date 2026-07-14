// ── OnboardingKycScreen.tsx ───────────────────────────────────────────────────
// KYC document upload — flat-row layout (4 rows, no cards).
// Rows: PAN · Aadhaar Front · Aadhaar Back · Salary Slip
//
// Aadhaar: front + back rows are independent. Both selected → auto-merge via
// canvas → single AADHAR upload. After backend upload, both rows show "Uploaded".
//
// After file picked: shows real filename immediately (before backend responds).

import { useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  CreditCard,
  FileText,
  IdCard,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Upload,
} from "lucide-react";
import type { KycDocument, KycDocumentType, View } from "../types/app";

// ── Types ──────────────────────────────────────────────────────────────────────

type Props = {
  documents: KycDocument[];
  uploadingKycType: KycDocumentType | null;
  onUpload: (type: KycDocumentType, file: File) => void;
  onContinue: (view: View) => void;
  bankConnected: boolean;
  mode?: "setup" | "profile";
  step?: number;
  totalSteps?: number;
};

// ── Status helpers ─────────────────────────────────────────────────────────────

function isVerified(status?: string)    { return status === "Verified"; }
function isUnderReview(status?: string) { return status === "Under Review"; }
function isSubmitted(status?: string)   { return isVerified(status) || isUnderReview(status); }
function isRejected(status?: string)    { return status === "Rejected"; }

// ── Client-side Aadhaar merge ──────────────────────────────────────────────────

function mergeAadhaarSides(front: File, back: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const fUrl = URL.createObjectURL(front);
    const bUrl = URL.createObjectURL(back);
    const fImg = new Image();
    const bImg = new Image();
    const cleanup = () => { URL.revokeObjectURL(fUrl); URL.revokeObjectURL(bUrl); };

    fImg.onload = () => {
      bImg.onload = () => {
        const W = Math.max(fImg.naturalWidth, bImg.naturalWidth);
        const GAP = 12;
        const H = fImg.naturalHeight + bImg.naturalHeight + GAP;
        const canvas = document.createElement("canvas");
        canvas.width = W; canvas.height = H;
        const ctx = canvas.getContext("2d");
        if (!ctx) { cleanup(); return reject(new Error("Canvas unavailable")); }
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, W, H);
        ctx.drawImage(fImg, Math.round((W - fImg.naturalWidth) / 2), 0);
        ctx.drawImage(bImg, Math.round((W - bImg.naturalWidth) / 2), fImg.naturalHeight + GAP);
        cleanup();
        canvas.toBlob(
          (blob) => blob
            ? resolve(new File([blob], "aadhaar-combined.jpg", { type: "image/jpeg" }))
            : reject(new Error("Blob generation failed")),
          "image/jpeg", 0.93,
        );
      };
      bImg.onerror = () => { cleanup(); reject(new Error("Back image load failed")); };
      bImg.src = bUrl;
    };
    fImg.onerror = () => { cleanup(); reject(new Error("Front image load failed")); };
    fImg.src = fUrl;
  });
}

// ── DocRow ─────────────────────────────────────────────────────────────────────
// A single flat row: icon · label+sublabel · status+action

type DocRowProps = {
  icon: React.ReactNode;
  label: string;
  /** Shown below the label — filename, hint text, or status detail */
  sub: string;
  verified: boolean;
  underReview: boolean;
  rejected: boolean;
  uploading: boolean;
  onUploadClick: () => void;
  accept?: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onFileChange: (file: File) => void;
};

function DocRow({
  icon, label, sub, verified, underReview, rejected, uploading,
  onUploadClick, accept = "image/jpeg,image/png,image/webp,application/pdf",
  inputRef, onFileChange,
}: DocRowProps) {
  const submitted = verified || underReview;
  return (
    <div className="kyc-row">
      {/* Left: icon */}
      <span className={`kyc-row-icon${verified ? " is-done" : underReview ? " is-review" : rejected ? " is-bad" : ""}`}>
        {uploading
          ? <Loader2 size={16} className="spin" />
          : submitted
            ? <CheckCircle size={16} strokeWidth={1.9} />
            : icon}
      </span>

      {/* Middle: label · sub · status chip */}
      <span className="kyc-row-copy">
        <span className="kyc-row-label">{label}</span>
        {!uploading && sub && (
          <span className={`kyc-row-sub${rejected ? " is-bad" : ""}`}>{sub}</span>
        )}
        {uploading && (
          <span className="kyc-row-sub">Uploading…</span>
        )}
        {verified && (
          <span className="kyc-row-chip kyc-row-chip--done">Verified</span>
        )}
        {underReview && (
          <span className="kyc-row-chip kyc-row-chip--review">Under review</span>
        )}
        {rejected && (
          <span className="kyc-row-chip kyc-row-chip--bad">Rejected</span>
        )}
      </span>

      {/* Right: button — hidden when verified */}
      <span className="kyc-row-right">
        {!verified && (
          <button
            type="button"
            className={`kyc-row-btn${underReview ? " kyc-row-btn--replace" : ""}`}
            disabled={uploading}
            onClick={onUploadClick}
          >
            {underReview
              ? <><RefreshCw size={11} strokeWidth={2} /> Replace</>
              : rejected
                ? <><Upload size={11} strokeWidth={2} /> Re-upload</>
                : <><Upload size={11} strokeWidth={2} /> Upload</>}
          </button>
        )}
      </span>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFileChange(f);
          e.currentTarget.value = "";
        }}
      />
    </div>
  );
}

// ── OnboardingKycScreen ────────────────────────────────────────────────────────

export function OnboardingKycScreen({
  documents,
  uploadingKycType,
  onUpload,
  onContinue,
  bankConnected,
  mode = "setup",
  step,
  totalSteps,
}: Props) {
  // Local filenames shown immediately after pick (before backend responds)
  const [fileNames, setFileNames] = useState<Record<string, string>>({});
  // Aadhaar local sides
  const [aadharFront, setAadharFront] = useState<File | null>(null);
  const [aadharBack,  setAadharBack]  = useState<File | null>(null);
  const [merging,     setMerging]     = useState(false);
  const [mergeError,  setMergeError]  = useState("");
  const [ctaError,    setCtaError]    = useState("");

  // Input refs
  const panRef    = useRef<HTMLInputElement | null>(null);
  const frontRef  = useRef<HTMLInputElement | null>(null);
  const backRef   = useRef<HTMLInputElement | null>(null);
  const slipRef   = useRef<HTMLInputElement | null>(null);

  function getDoc(type: KycDocumentType) {
    return documents.find((d) => d.documentType === type);
  }

  const panDoc    = getDoc("PAN");
  const aadharDoc = getDoc("AADHAR");
  const slipDoc   = getDoc("SALARY_SLIP");

  const panDone         = isSubmitted(panDoc?.status);
  const aadharDone      = isSubmitted(aadharDoc?.status);
  const slipDone        = isSubmitted(slipDoc?.status);
  // Aadhaar counts as 2 rows — front done when either side merged+uploaded OR file picked this session
  const aadharFrontDone = aadharDone || !!aadharFront;
  const aadharBackDone  = aadharDone || !!aadharBack;
  const doneCount  = [panDone, aadharFrontDone, aadharBackDone, slipDone].filter(Boolean).length;
  const allDone    = doneCount === 4;

  const isProfileMode = mode === "profile";
  const nextView: View = bankConnected ? "home" : "onboarding-bank";

  // Short filename for display
  function shortName(name: string) {
    return name.length > 22 ? name.slice(0, 19) + "…" : name;
  }

  // Aadhaar side handler
  async function handleAadharSide(side: "front" | "back", file: File) {
    setMergeError("");

    if (file.type === "application/pdf") {
      setMergeError("Please upload a JPG or PNG, not a PDF.");
      return;
    }

    const nextFront = side === "front" ? file : aadharFront;
    const nextBack  = side === "back"  ? file : aadharBack;

    if (side === "front") {
      setAadharFront(file);
      setFileNames((p) => ({ ...p, AADHAR_FRONT: file.name }));
    } else {
      setAadharBack(file);
      setFileNames((p) => ({ ...p, AADHAR_BACK: file.name }));
    }

    if (nextFront && nextBack) {
      setMerging(true);
      try {
        const merged = await mergeAadhaarSides(nextFront, nextBack);
        // Encode both original filenames so they persist after refresh
        // Format: "front.jpg||back.jpg" — parsed on display, invisible to user
        const namedMerge = new File(
          [merged],
          `${nextFront.name}||${nextBack.name}`,
          { type: "image/jpeg" },
        );
        onUpload("AADHAR", namedMerge);
      } catch {
        setMergeError("Couldn't combine images. Please try again.");
      } finally {
        setMerging(false);
      }
    }
  }

  // Sublabels — priority: local pick (current session) → backend originalFileName → fallback
  const panSub = panDone
    ? shortName(fileNames["PAN"] || panDoc?.originalFileName || "")
    : isRejected(panDoc?.status)
      ? shortName(fileNames["PAN"] || panDoc?.originalFileName || "")
      : shortName(fileNames["PAN"] || "") || "JPG, PNG or PDF · under 5 MB";

  // Parse stored "front.jpg||back.jpg" back into individual names for display
  const [storedFrontName, storedBackName] = (aadharDoc?.originalFileName ?? "").split("||");

  const aadharFrontSub = shortName(fileNames["AADHAR_FRONT"] || storedFrontName || "")
    || (aadharFrontDone ? "" : "Front side image");

  const aadharBackSub = mergeError
    ? mergeError
    : shortName(fileNames["AADHAR_BACK"] || storedBackName || "")
      || (aadharBackDone ? "" : "Back side image");

  const slipSub = slipDone || isRejected(slipDoc?.status)
    ? shortName(fileNames["SALARY_SLIP"] || slipDoc?.originalFileName || "")
    : shortName(fileNames["SALARY_SLIP"] || "") || "Last 1–3 months · PDF or image";

  const isUploadingAadhar = uploadingKycType === "AADHAR" || merging;

  return (
    <div className={`kycv2-screen${isProfileMode ? " kycv2-screen--profile" : ""}`}>

      {/* ── Hero ── */}
      <section className="kycv2-hero">
        <div className="kycv2-kicker">
          {isProfileMode
            ? "KYC Documents"
            : step && totalSteps
              ? `Step ${step} of ${totalSteps}`
              : "Identity verification"}
        </div>
        <div className="kycv2-hero-icon">
          <ShieldCheck size={20} strokeWidth={1.9} />
        </div>
        <h1>Verify your identity</h1>
        <p>
          {isProfileMode
            ? "View or replace your submitted documents."
            : "Upload your documents to unlock salary advances."}
        </p>

        {/* Segmented progress */}
        <div className="kycv2-progress-row">
          <div className="kycv2-progress-segs">
            {[panDone, aadharFrontDone, aadharBackDone, slipDone].map((done, i) => (
              <span key={i} className={`kycv2-seg${done ? " kycv2-seg--on" : ""}`} />
            ))}
          </div>
          <span className="kycv2-progress-count">{doneCount} / 4</span>
        </div>
      </section>

      {/* ── 4 Flat rows ── */}
      <section className="kycv2-docs kyc-rows">

        {/* PAN */}
        <DocRow
          icon={<CreditCard size={16} strokeWidth={1.9} />}
          label="PAN Card"
          sub={panSub}
          verified={isVerified(panDoc?.status)}
          underReview={isUnderReview(panDoc?.status)}
          rejected={isRejected(panDoc?.status)}
          uploading={uploadingKycType === "PAN"}
          inputRef={panRef}
          onUploadClick={() => panRef.current?.click()}
          onFileChange={(f) => {
            setFileNames((p) => ({ ...p, PAN: f.name }));
            onUpload("PAN", f);
          }}
        />

        {/* Aadhaar Front */}
        <DocRow
          icon={<IdCard size={16} strokeWidth={1.9} />}
          label="Aadhaar — Front"
          sub={aadharFrontSub}
          verified={isVerified(aadharDoc?.status)}
          underReview={isUnderReview(aadharDoc?.status) || !!aadharFront}
          rejected={false}
          uploading={isUploadingAadhar}
          inputRef={frontRef}
          accept="image/jpeg,image/png,image/webp"
          onUploadClick={() => frontRef.current?.click()}
          onFileChange={(f) => void handleAadharSide("front", f)}
        />

        {/* Aadhaar Back */}
        <DocRow
          icon={<IdCard size={16} strokeWidth={1.9} />}
          label="Aadhaar — Back"
          sub={aadharBackSub}
          verified={isVerified(aadharDoc?.status)}
          underReview={isUnderReview(aadharDoc?.status) || !!aadharBack}
          rejected={isRejected(aadharDoc?.status)}
          uploading={isUploadingAadhar}
          inputRef={backRef}
          accept="image/jpeg,image/png,image/webp"
          onUploadClick={() => backRef.current?.click()}
          onFileChange={(f) => void handleAadharSide("back", f)}
        />

        {/* Salary Slip */}
        <DocRow
          icon={<FileText size={16} strokeWidth={1.9} />}
          label="Salary Slip"
          sub={slipSub}
          verified={isVerified(slipDoc?.status)}
          underReview={isUnderReview(slipDoc?.status)}
          rejected={isRejected(slipDoc?.status)}
          uploading={uploadingKycType === "SALARY_SLIP"}
          inputRef={slipRef}
          onUploadClick={() => slipRef.current?.click()}
          onFileChange={(f) => {
            setFileNames((p) => ({ ...p, SALARY_SLIP: f.name }));
            onUpload("SALARY_SLIP", f);
          }}
        />
      </section>

      {/* ── Tips ── */}
      <div className="kycv2-tips">
        <AlertTriangle size={12} strokeWidth={2} />
        Clear photos · Readable text · No cropped edges · Under 5 MB
      </div>

      {/* ── Footer CTA — onboarding only ── */}
      {!isProfileMode && (
        <div className="kycv2-footer">
          <button
            type="button"
            className="kycv2-cta-btn"
            onClick={() => {
              if (allDone) {
                setCtaError("");
                onContinue(nextView);
              } else {
                setCtaError("Please upload all 4 documents first.");
                setTimeout(() => setCtaError(""), 3000);
              }
            }}
          >
            {allDone
              ? bankConnected ? "Go to home" : "Continue to bank account"
              : "Continue"}
            <ArrowRight size={14} strokeWidth={2.2} />
          </button>
          {ctaError && <p className="kycv2-cta-error">{ctaError}</p>}
          <div className="kycv2-secure">
            <ShieldCheck size={13} strokeWidth={1.8} />
            Documents are encrypted and stored securely
          </div>
        </div>
      )}
    </div>
  );
}
