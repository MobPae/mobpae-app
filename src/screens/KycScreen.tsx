import { useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Clock, FileText, Landmark, ShieldCheck, UploadCloud } from "lucide-react";
import type { KycDocument, KycDocumentType, View } from "../types/app";

type KycScreenProps = {
  bankVerified: boolean;
  documents: KycDocument[];
  onUpload: (documentType: KycDocumentType, file: File) => void;
  onNavigate: (view: View) => void;
  uploadingType: KycDocumentType | null;
};

const documentTypeFrom = (document: KycDocument): KycDocumentType =>
  document.documentType ??
  (document.label.toUpperCase().replace("AADHAAR", "AADHAR").replaceAll(" ", "_") as KycDocumentType);

function KycItemRow({
  document,
  uploading,
  onUpload,
}: {
  document: KycDocument;
  uploading: boolean;
  onUpload: (type: KycDocumentType, file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const type     = documentTypeFrom(document);
  const isDone   = document.status === "Verified";
  const isPending = document.status === "Under Review";
  const isRejected = document.status === "Rejected";

  const statusClass = isDone ? "done" : isPending ? "pending" : isRejected ? "rejected" : "pending";
  const statusText = document.status === "Not Uploaded" ? "Pending" : document.note || document.status;

  return (
    <div className="kyc-item">
      <div className={`kyc-item-icon-wrap${isDone ? " done" : isPending ? " pending" : ""}`}>
        {isDone ? (
          <CheckCircle2 size={18} />
        ) : (
          <Clock size={18} />
        )}
      </div>

      <div className="kyc-item-body">
        <div className="kyc-item-label">{document.label}</div>
        <div className={`kyc-item-status ${statusClass}`}>
          {statusText}
        </div>
      </div>

      {!isDone && (
        <>
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,image/jpeg,image/png,image/webp"
            style={{ display: "none" }}
            disabled={uploading}
            onChange={e => {
              const file = e.target.files?.[0];
              if (file) {
                setFileName(file.name);
                onUpload(type, file);
              }
              e.target.value = "";
            }}
          />
          <button
            type="button"
            className="kyc-upload-btn"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            <UploadCloud size={14} />
            {uploading ? "Uploading…" : document.status === "Not Uploaded" ? "Upload" : fileName ?? "Replace"}
          </button>
        </>
      )}
    </div>
  );
}

export function KycScreen({
  bankVerified,
  documents,
  onNavigate,
  onUpload,
  uploadingType,
}: KycScreenProps) {
  const [whyOpen, setWhyOpen] = useState(false);

  const verifiedCount = documents.filter(d => d.status === "Verified").length;
  const submittedCount = documents.filter(d => d.status !== "Not Uploaded").length;
  const kycComplete   = documents.length > 0 && verifiedCount === documents.length;
  const progressPct = documents.length > 0 ? Math.round((verifiedCount / documents.length) * 100) : 0;

  return (
    <div className="kyc-screen">

      {/* ── Back button + header ──────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "20px 0 12px" }}>
        <button
          type="button"
          className="back-btn"
          onClick={() => onNavigate("profile")}
          aria-label="Go back"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6"/>
          </svg>
        </button>
        <span style={{ fontSize: 12, fontWeight: 500, color: "var(--t1)" }}>Setup &amp; KYC</span>
      </div>

      <div className="kyc-hero-card">
        <div className="kyc-hero-top">
          <div>
            <span>Identity check</span>
            <h2>Verify your KYC</h2>
            <p>Secure your account and unlock salary advance access.</p>
          </div>
          <div className="kyc-hero-icon">
            <ShieldCheck size={24} />
          </div>
        </div>
        <div className="kyc-progress-line">
          <span style={{ width: `${progressPct}%` }} />
        </div>
        <div className="kyc-hero-stats">
          <div>
            <span>{verifiedCount}/{documents.length || 3}</span>
            <span>Verified</span>
          </div>
          <div>
            <span>{submittedCount}</span>
            <span>Submitted</span>
          </div>
          <div>
            <span>{kycComplete ? "Ready" : "Review"}</span>
            <span>Status</span>
          </div>
        </div>
      </div>

      {/* ── Document list ─────────────────────────────────────────── */}
      <div className="kyc-section-head">
        <div>
          <span>Required documents</span>
          <h3>Upload checklist</h3>
        </div>
        <FileText size={18} />
      </div>

      <div className="kyc-list">
        {documents.length === 0 ? (
          <div style={{ padding: "24px 16px", textAlign: "center", color: "var(--t3)", fontSize: 12 }}>
            No documents required.
          </div>
        ) : (
          documents.map(doc => (
            <KycItemRow
              key={doc.id}
              document={doc}
              uploading={uploadingType === documentTypeFrom(doc)}
              onUpload={onUpload}
            />
          ))
        )}
      </div>

      {/* ── Next step (bank) ──────────────────────────────────────── */}
      {kycComplete && !bankVerified && (
        <div className="kyc-next-card">
          <div className="kyc-next-icon"><Landmark size={19} /></div>
          <div>
            <span>KYC verified</span>
            <p>
              Add your bank account to receive salary advance payouts.
            </p>
          </div>
          <button
            type="button"
            className="kyc-next-btn"
            onClick={() => onNavigate("profile-bank")}
          >
            Add bank
          </button>
        </div>
      )}

      {!kycComplete && submittedCount > 0 && (
        <div className="kyc-review-note">
          <AlertCircle size={15} />
          <p>Your submitted documents are checked by the admin team. You can replace a document if something is incorrect.</p>
        </div>
      )}

      {/* ── Why we need this ──────────────────────────────────────── */}
      <div className="kyc-why">
        <button
          type="button"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            background: "none",
            border: "none",
            cursor: "pointer",
            fontFamily: "inherit",
            padding: 0,
          }}
          onClick={() => setWhyOpen(o => !o)}
        >
          <span className="kyc-why-title">Why we need this?</span>
          <svg
            width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="var(--t3)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            style={{ transform: whyOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
          >
            <path d="m6 9 6 6 6-6"/>
          </svg>
        </button>
        {whyOpen && (
          <p className="kyc-why-body">
            We verify your identity to comply with RBI regulations and to ensure
            the security of your salary advance. Your documents are encrypted and
            stored securely. We never share your data with third parties.
          </p>
        )}
      </div>
    </div>
  );
}
