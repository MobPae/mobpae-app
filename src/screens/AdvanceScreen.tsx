// ── AdvanceScreen.tsx ─────────────────────────────────────────────────────────
// Salary advance workflow. Four main states:
//   1. Setup       — KYC / bank account not yet submitted
//   2. Under review — submitted, awaiting admin verification
//   3. Approved    — eligible, no active request
//   4. Calculator  — amount picker + breakdown + review sheet (main redesigned view)
//
// All financial figures come from the backend. Frontend only handles
// amount-picker UX and display formatting.

import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  CheckCircle,
  ChevronRight,
  Clock,
  CreditCard,
  Crown,
  IdCard,
  Landmark,
  Pencil,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { useRef, useState } from "react";
import {
  formatMoney,
  formatReadableDate,
  formatRequestStatus,
  formatShortDate,
} from "../utils/format";
import type {
  AdvanceRequest,
  BankAccount,
  KycDocument,
  PlatformFeeConfig,
  RecoveryPreview,
  View,
} from "../types/app";
import type { Theme } from "../hooks/useTheme";

// ── Constants ─────────────────────────────────────────────────────────────────

const MIN_AMOUNT = 500;

// ── Colorful pill palette (one per quick-amount chip) ─────────────────────────

// ── Purpose category chips ────────────────────────────────────────────────────

const PURPOSE_CHIPS: { value: string; label: string }[] = [
  { value: "EMERGENCY", label: "Emergency" },
  { value: "MEDICAL", label: "Medical" },
  { value: "HOUSE_RENT", label: "Rent" },
  { value: "FAMILY_EXPENSE", label: "Family" },
  { value: "EDUCATION", label: "Education" },
  { value: "UTILITY_BILLS", label: "Bills" },
  { value: "TRAVEL", label: "Travel" },
  { value: "SHOPPING", label: "Shopping" },
  { value: "OTHER", label: "Other" },
];

const PILL_PALETTE = [
  {
    solid: "#f97316",
    soft: "rgba(249,115,22,0.12)",
    border: "rgba(249,115,22,0.35)",
  },
  {
    solid: "#a855f7",
    soft: "rgba(168,85,247,0.12)",
    border: "rgba(168,85,247,0.35)",
  },
  {
    solid: "#315eff",
    soft: "rgba(49,94,255,0.12)",
    border: "rgba(49,94,255,0.35)",
  },
  {
    solid: "#10b981",
    soft: "rgba(16,185,129,0.12)",
    border: "rgba(16,185,129,0.35)",
  },
];

// ── Types ─────────────────────────────────────────────────────────────────────

type AdvanceScreenProps = {
  amount: number;
  eligible: boolean;
  limit: number;
  nextBlocker: string;
  preview: RecoveryPreview | null;
  previewLoading: boolean;
  currentRequest?: AdvanceRequest;
  submitting: boolean;
  salaryInHand?: number;
  payrollDay?: number | null;
  kycComplete: boolean;
  kycSubmitted: boolean;
  bankComplete: boolean;
  bankSubmitted: boolean;
  platformFeeConfig?: PlatformFeeConfig | null;
  platformFeeRequiredAfterEmployerApproval?: boolean;
  payingPlatformFee?: boolean;
  onPayPlatformFee?: (loanApplicationId: string) => Promise<void>;
  interestFreeThreshold?: number;
  bankAccount?: BankAccount | null;
  kycDocumentCount?: number;
  kycDocuments?: KycDocument[];
  onAmountChange: (amount: number) => void;
  onSubmit: (
    purposeCategory?: string,
    purposeNote?: string
  ) => Promise<string | null>;
  onCancelRequest?: (id: string) => Promise<void>;
  cancellingRequest?: boolean;
  blockerActionLabel: string;
  onResolveBlocker: () => void;
  onNavigate?: (view: View) => void;
  theme?: Theme;
};

type AdvanceStep = "ready" | "calculator" | "review" | "submitted";
type VerificationStage = "submitted" | "review" | "approved";

// ── Helpers ───────────────────────────────────────────────────────────────────

function compactBankLabel(bankAccount?: BankAccount | null) {
  if (!bankAccount?.accountNumber) return "Bank details submitted";
  return `${
    bankAccount.bankName || "Bank"
  } ···· ${bankAccount.accountNumber.slice(-4)}`;
}

// ── Theme palette ─────────────────────────────────────────────────────────────

function advancePalette(theme: "light" | "dark") {
  if (theme === "light") {
    return {
      bg: "#FFFFFF",
      text: "#17151F",
      muted: "#6B6878",
      dim: "#9A97A8",
      faint: "#B6B3C2",
      border: "#E9E6F1",
      panel: "#FFFFFF",
      panelSoft: "#F7F5FC",
      panelMuted: "#EEEBF6",
      receiptBg: "#EEF2FF",
      receiptInk: "#0F1740",
      receiptMuted: "#5A6BAA",
      receiptSubtle: "#8294C4",
      receiptDash: "#C4D0F5",
      warm: "#B4591F",
      green: "#1F9E67",
    };
  }
  return {
    bg: "#0C0C0E",
    text: "#F2F0EA",
    muted: "#8A8892",
    dim: "#7C7C85",
    faint: "#5C5C64",
    border: "#29292F",
    panel: "#151519",
    panelSoft: "#17171B",
    panelMuted: "#2A2A30",
    receiptBg: "#F4F1E8",
    receiptInk: "#17150F",
    receiptMuted: "#8A8676",
    receiptSubtle: "#4A473C",
    receiptDash: "#D8D3C2",
    warm: "#B4591F",
    green: "#20A46A",
  };
}

// ── VerificationLifecycleScreen ───────────────────────────────────────────────

function VerificationLifecycleScreen({
  stage,
  bankAccount,
  kycDocumentCount,
  kycDocuments,
  onStartAdvance,
  onNavigate,
}: {
  stage: VerificationStage;
  bankAccount?: BankAccount | null;
  kycDocumentCount?: number;
  kycDocuments?: KycDocument[];
  onStartAdvance?: () => void;
  onNavigate?: (view: View) => void;
}) {
  const rejectedDocs = (kycDocuments ?? []).filter(
    (d) => d.status === "Rejected"
  );
  const hasRejection = rejectedDocs.length > 0;

  const copy = {
    submitted: {
      title: "Documents received",
      body: "Our team will verify your KYC and bank details. This usually takes 1–2 working days.",
      badge: "Estimated 1–2 working days",
      tone: "neutral",
    },
    review: {
      title: "Under review",
      body: "Verification is in progress. You'll be notified once your account is activated.",
      badge: "Verification in progress",
      tone: "warm",
    },
    approved: {
      title: "Account active",
      body: "Your KYC and bank account are verified. You can now request salary advances.",
      badge: null,
      tone: "success",
    },
  } as const;

  const current = copy[stage];

  return (
    <div className="adv-verify-screen">
      <section className={`adv-verify-hero is-${current.tone}`}>
        <div className="adv-verify-orb">
          {current.tone === "warm" ? (
            <Clock size={26} strokeWidth={1.9} />
          ) : (
            <CheckCircle size={26} strokeWidth={1.85} />
          )}
        </div>
        <h1>{current.title}</h1>
        <p>{current.body}</p>
        {current.badge && (
          <div className="adv-verify-pill">
            <Clock size={12} strokeWidth={1.9} />
            {current.badge}
          </div>
        )}
      </section>

      {hasRejection && (
        <div className="adv-verify-reject">
          <div className="adv-verify-reject-head">
            <AlertTriangle size={13} strokeWidth={2} />
            Action required
          </div>
          {rejectedDocs.map((d) => (
            <div key={d.id} className="adv-verify-reject-item">
              <span className="adv-verify-reject-label">{d.label}</span>
              {d.originalFileName && (
                <span className="adv-verify-reject-file">
                  {d.originalFileName}
                </span>
              )}
              <span className="adv-verify-reject-reason">
                {d.note ||
                  "Document was rejected. Please re-upload a clear, valid copy."}
              </span>
            </div>
          ))}
          {onNavigate && (
            <button
              type="button"
              className="adv-verify-reject-btn"
              onClick={() => onNavigate("onboarding-kyc")}
            >
              <RotateCcw size={12} strokeWidth={2.2} />
              Re-upload documents
            </button>
          )}
        </div>
      )}

      <section className="adv-verify-summary">
        <button
          type="button"
          className="adv-verify-summary-card"
          onClick={() => onNavigate?.("onboarding-kyc")}
        >
          <span>
            <IdCard size={13} strokeWidth={1.9} /> KYC
          </span>
          <strong>
            {kycDocumentCount
              ? `${kycDocumentCount} document${
                  kycDocumentCount !== 1 ? "s" : ""
                } submitted`
              : "Submitted"}
          </strong>
        </button>
        <button
          type="button"
          className="adv-verify-summary-card adv-verify-summary-card--bank"
          onClick={() => onNavigate?.("profile-bank")}
        >
          <span>
            <Landmark size={13} strokeWidth={1.9} /> Bank
          </span>
          <strong>{compactBankLabel(bankAccount)}</strong>
          {bankAccount && (
            <span
              className={`adv-verify-bank-status ${
                bankAccount.verified ? "is-verified" : "is-pending"
              }`}
            >
              <i />
              {bankAccount.verified ? "Verified" : "In review"}
            </span>
          )}
        </button>
      </section>

      {stage === "approved" && (
        <div className="adv-verify-footer">
          <button
            type="button"
            className="kycv2-cta-btn"
            onClick={onStartAdvance}
          >
            Request salary advance <ArrowRight size={14} strokeWidth={2.2} />
          </button>
        </div>
      )}
    </div>
  );
}

// ── AdvanceScreen ─────────────────────────────────────────────────────────────

export function AdvanceScreen({
  amount,
  eligible,
  limit,
  preview,
  previewLoading,
  currentRequest,
  submitting,
  salaryInHand,
  payrollDay,
  kycComplete,
  kycSubmitted,
  bankComplete,
  bankSubmitted,
  platformFeeConfig,
  platformFeeRequiredAfterEmployerApproval,
  payingPlatformFee,
  onPayPlatformFee,
  interestFreeThreshold,
  bankAccount,
  kycDocumentCount,
  kycDocuments,
  onAmountChange,
  onSubmit,
  onCancelRequest,
  cancellingRequest,
  onNavigate,
  theme = "dark",
}: AdvanceScreenProps) {
  const [step, setStep] = useState<AdvanceStep>("ready");
  const [submittedAt, setSubmittedAt] = useState<string | null>(null);
  const [agree1, setAgree1] = useState(false);
  const [purposeCategory, setPurposeCategory] = useState<string | null>(null);
  const [purposeNote, setPurposeNote] = useState("");
  const [editingAmount, setEditingAmount] = useState(false);
  const [rawInput, setRawInput] = useState("");
  const amountInputRef = useRef<HTMLInputElement>(null);
  const colors = advancePalette(theme);

  const startAmountEdit = () => {
    setRawInput(String(amount));
    setEditingAmount(true);
    setTimeout(() => {
      amountInputRef.current?.select();
    }, 30);
  };

  const commitAmountEdit = () => {
    const parsed = parseInt(rawInput.replace(/[^0-9]/g, ""), 10);
    if (!isNaN(parsed) && parsed > 0) {
      const snapped = Math.round(parsed / 500) * 500;
      const clamped = Math.max(MIN_AMOUNT, Math.min(sliderMax, snapped));
      onAmountChange(clamped);
    }
    setEditingAmount(false);
  };

  // ── Active request ────────────────────────────────────────────────────────
  const hasActive = Boolean(
    currentRequest &&
      !["Paid", "Recovered", "Rejected", "Cancelled", "Expired"].includes(
        currentRequest.status
      )
  );

  // ── Setup step statuses ───────────────────────────────────────────────────
  const setupSteps = [
    {
      label: "Verify your identity",
      sublabel: "PAN & Aadhaar · about 2 min",
      done: kycComplete,
      submitted: kycSubmitted,
      view: "onboarding-kyc" as View,
      isKyc: true,
    },
    {
      label: "Link bank account",
      sublabel: "Where your advance is credited",
      done: bankComplete,
      submitted: bankSubmitted,
      view: "onboarding-bank" as View,
      isKyc: false,
    },
  ].map(
    (s) =>
      ({
        ...s,
        state: s.done ? "done" : s.submitted ? "review" : "todo",
      } as typeof s & { state: "done" | "review" | "todo" })
  );

  const hasMissingSetupAction = setupSteps.some((s) => s.state === "todo");
  const genuinelyUnderAdminReview =
    (!kycComplete && kycSubmitted) || (!bankComplete && bankSubmitted);
  const isWaitingForSetupReview =
    !eligible && !hasMissingSetupAction && genuinelyUnderAdminReview;

  // ═══════════════════════════════════════════════════════════════════════════
  //  ACTIVE ADVANCE STATES
  // ═══════════════════════════════════════════════════════════════════════════

  if (hasActive && currentRequest) {
    const isPaid = currentRequest.recoveryStatus === "Completed";
    const statusLabel = isPaid
      ? "Repaid"
      : formatRequestStatus(currentRequest.status, currentRequest.statusLabel);
    const principal = currentRequest.principalAmount;
    const totalRepay = currentRequest.totalRecoveryAmount;
    const interest = currentRequest.interestAmount;
    const interestDays = currentRequest.interestDays;
    const interestRate = currentRequest.interestRate;
    const scheduleDate = formatShortDate(
      currentRequest.recoveryDate ||
        currentRequest.disbursalDate ||
        currentRequest.requestDate
    );

    // ── Platform-fee gate ────────────────────────────────────────────────────
    const rawStatus = currentRequest.rawStatus ?? "";
    const platformFeeStatus = currentRequest.platformFee?.status;
    const feeCleared =
      platformFeeStatus === "PAID" || platformFeeStatus === "WAIVED";
    const shouldShowPlatformFeeGate =
      !feeCleared &&
      (rawStatus === "AWAITING_PLATFORM_FEE_PAYMENT" ||
        currentRequest.status === "Awaiting Platform Fee" ||
        currentRequest.nextAction === "PAY_PLATFORM_FEE" ||
        (currentRequest.status === "Employer Approved" &&
          platformFeeRequiredAfterEmployerApproval));

    if (shouldShowPlatformFeeGate) {
      const feeAmount = Number(
        currentRequest.platformFee?.amount ?? platformFeeConfig?.amount ?? 0
      );
      const approvedAmount =
        currentRequest.approvedAmount ||
        currentRequest.principalAmount ||
        currentRequest.requestedAmount;
      const canPay =
        feeAmount > 0 && Boolean(onPayPlatformFee) && !payingPlatformFee;
      const accent = "#315eff";
      const accentSoft =
        theme === "light" ? "rgba(49,94,255,0.06)" : "rgba(49,94,255,0.1)";
      const accentBorder =
        theme === "light" ? "rgba(49,94,255,0.14)" : "rgba(49,94,255,0.22)";

      const benefits = ["Zero processing fees", "Auto-recovery on payday"];

      return (
        <div
          style={{
            background: colors.bg,
            minHeight: "100%",
            display: "flex",
            flexDirection: "column",
            padding: "16px 20px max(22px, env(safe-area-inset-bottom))",
            color: colors.text,
          }}
        >
          {/* Status chip */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: 18,
            }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                padding: "5px 14px",
                borderRadius: 99,
                background: accentSoft,
                border: `1px solid ${accentBorder}`,
                color: accent,
                fontSize: 11,
                fontWeight: 500,
                letterSpacing: "0.02em",
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: accent,
                  display: "inline-block",
                }}
              />
              Employer Approved
            </span>
          </div>

          {/* Icon + heading */}
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div
              style={{
                width: 72,
                height: 72,
                margin: "0 auto 16px",
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                color: accent,
                background: accentSoft,
                border: `1px solid ${accentBorder}`,
              }}
            >
              <Crown size={28} strokeWidth={1.8} />
            </div>
            <h1
              style={{
                margin: 0,
                fontSize: 20,
                lineHeight: 1.18,
                fontWeight: 500,
                color: colors.text,
                letterSpacing: "-0.03em",
              }}
            >
              One step away
            </h1>
            <p
              style={{
                margin: "10px auto 0",
                maxWidth: 290,
                color: colors.muted,
                fontSize: 14,
                lineHeight: 1.5,
                fontWeight: 400,
              }}
            >
              Your employer approved your advance. Pay the platform fee and the
              funds move to MobPae review.
            </p>
          </div>

          {/* Amount / fee card — blue tint */}
          <section
            style={{
              border: `1px solid ${accentBorder}`,
              borderRadius: 16,
              background: accentSoft,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 18,
                padding: "13px 18px",
                borderBottom: `1px solid ${accentBorder}`,
                color: colors.muted,
                fontSize: 14,
              }}
            >
              <span>Amount approved</span>
              <strong
                style={{ color: colors.text, fontSize: 14, fontWeight: 500 }}
              >
                {formatMoney(approvedAmount)}
              </strong>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 18,
                padding: "13px 18px",
                color: colors.muted,
                fontSize: 14,
              }}
            >
              <span>Platform fee</span>
              <strong
                style={{ color: colors.text, fontSize: 14, fontWeight: 500 }}
              >
                {feeAmount > 0 ? formatMoney(feeAmount) : "Not configured"}
              </strong>
            </div>
          </section>

          {/* Benefit pills */}
          <div
            style={{
              display: "flex",
              gap: 8,
              marginTop: 12,
              flexWrap: "wrap",
            }}
          >
            {benefits.map((benefit) => (
              <span
                key={benefit}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "5px 12px",
                  borderRadius: 99,
                  background: accentSoft,
                  border: `1px solid ${accentBorder}`,
                  color: accent,
                  fontSize: 12,
                  fontWeight: 400,
                }}
              >
                <CheckCircle size={12} strokeWidth={2.2} />
                {benefit}
              </span>
            ))}
          </div>

          <div style={{ flex: 1, minHeight: 20 }} />

          {/* CTA */}
          <div style={{ display: "grid", gap: 8 }}>
            <button
              type="button"
              disabled={!canPay}
              onClick={() => void onPayPlatformFee?.(currentRequest.id)}
              style={{
                width: "100%",
                height: 48,
                borderRadius: 12,
                border: 0,
                background: canPay ? accent : colors.panelMuted,
                color: canPay ? "#FFFFFF" : colors.dim,
                fontSize: 15,
                fontWeight: 500,
                fontFamily: "inherit",
                cursor: canPay ? "pointer" : "not-allowed",
                letterSpacing: "-0.01em",
                boxShadow:
                  canPay && theme === "light"
                    ? "0 6px 20px rgba(49,94,255,0.28)"
                    : "none",
              }}
            >
              {payingPlatformFee
                ? "Opening payment..."
                : feeAmount > 0
                ? `Pay ${formatMoney(feeAmount)} platform fee`
                : "Platform fee unavailable"}
            </button>
            <div
              style={{
                color: colors.dim,
                fontSize: 12,
                textAlign: "center",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <ShieldCheck size={13} strokeWidth={1.8} />
              Secured by Razorpay · one-time fee
            </div>
          </div>
        </div>
      );
    }

    // ── Cancelled / Expired ──
    if (
      currentRequest.status === "Cancelled" ||
      currentRequest.status === "Expired"
    ) {
      const isCancelled = currentRequest.status === "Cancelled";
      return (
        <div className="adv-screen">
          <div className="screen-body adv-active-body adv-inprogress-body">
            <div className="adv-ip-icon-wrap">
              <Clock
                size={32}
                color={isCancelled ? "#6B7280" : "#F59E0B"}
                strokeWidth={1.5}
              />
            </div>
            <div className="adv-ip-headline">
              {isCancelled ? "Request Cancelled" : "Request Expired"}
            </div>
            <div className="adv-ip-sub">
              {isCancelled
                ? "Your advance request was cancelled."
                : "Your request expired after 3 days without employer approval."}
            </div>
            <div className="adv-ip-card">
              <div className="adv-ip-row">
                <span>Amount requested</span>
                <span>{formatMoney(currentRequest.requestedAmount)}</span>
              </div>
              <div className="adv-ip-row">
                <span>Submitted on</span>
                <span>{formatReadableDate(currentRequest.requestDate)}</span>
              </div>
            </div>
          </div>
          <div className="adv-sticky-btn">
            <button
              type="button"
              className="mp-btn-primary"
              onClick={() => onNavigate?.("advance")}
            >
              Request Again <ChevronRight size={16} />
            </button>
          </div>
        </div>
      );
    }

    // ── In progress ──
    const earlyStatuses = [
      "Submitted",
      "Employer Approved",
      "Admin Approved",
      "Under Review",
      "Approved",
    ];
    if (earlyStatuses.includes(currentRequest.status)) {
      const blue = "#315eff";
      const blueSoft = "rgba(49,94,255,0.07)";
      const blueBorder = "rgba(49,94,255,0.16)";
      const blueMuted = "rgba(49,94,255,0.45)";

      // Which timeline step is currently active (0-based)
      const activeStep =
        currentRequest.status === "Submitted"
          ? 1
          : currentRequest.status === "Employer Approved"
          ? 2
          : currentRequest.status === "Under Review"
          ? 2
          : 3; // Admin Approved / Approved

      const bankLabel = bankAccount?.accountNumber
        ? `${
            bankAccount.bankName || "Bank"
          } •••• ${bankAccount.accountNumber.slice(-4)}`
        : "Verified salary account";

      const timelineSteps: { label: string; sub: string }[] = [
        {
          label: "Request submitted",
          sub: formatReadableDate(currentRequest.requestDate),
        },
        {
          label: "Employer review",
          sub:
            activeStep > 1
              ? "Approved by employer"
              : "Your Employer is reviewing your request",
        },
        {
          label: "Admin approval",
          sub:
            activeStep > 2
              ? "Approved · preparing disbursal"
              : "Once approved, funds will be disbursed.",
        },
        {
          label: "Funds credited",
          sub: bankLabel,
        },
      ];

      return (
        <div
          style={{
            background: colors.bg,
            minHeight: "100%",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Hero */}
          <div style={{ padding: "32px 24px 20px", textAlign: "center" }}>
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: "50%",
                background: blueSoft,
                border: `1.5px solid ${blueBorder}`,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 18,
              }}
            >
              <Clock size={26} color={blue} strokeWidth={1.5} />
            </div>
            <div
              style={{
                fontSize: 34,
                fontWeight: 300,
                letterSpacing: "-0.04em",
                color: colors.text,
                lineHeight: 1,
                marginBottom: 6,
              }}
            >
              {formatMoney(currentRequest.requestedAmount)}
            </div>
            <div
              style={{
                fontSize: 14,
                color: colors.muted,
                letterSpacing: "-0.01em",
              }}
            >
              Advance under review
            </div>
          </div>

          {/* Status pill */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: 22,
            }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                padding: "6px 14px",
                borderRadius: 99,
                background: blueSoft,
                border: `1px solid ${blueBorder}`,
                color: blue,
                fontSize: 12,
                fontWeight: 500,
                letterSpacing: "-0.01em",
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: blue,
                  display: "inline-block",
                  flexShrink: 0,
                }}
              />
              {statusLabel}
            </span>
          </div>

          <div
            style={{
              flex: 1,
              padding: "0 18px 24px",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            {/* Meta pills — submitted date + bank */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "5px 11px",
                  borderRadius: 99,
                  border: `1px solid rgba(49,94,255,0.25)`,
                  background: "rgba(49,94,255,0.1)",
                  fontSize: 11,
                  color: blue,
                  fontWeight: 500,
                }}
              >
                <CalendarDays size={10} strokeWidth={2} />
                {formatShortDate(currentRequest.requestDate)}
              </span>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "5px 11px",
                  borderRadius: 99,
                  border: `1px solid rgba(99,60,255,0.25)`,
                  background: "rgba(99,60,255,0.08)",
                  fontSize: 11,
                  color: "#6330ff",
                  fontWeight: 500,
                }}
              >
                <Landmark size={10} strokeWidth={2} />
                {bankLabel}
              </span>
            </div>

            {/* Timeline card */}
            <div
              style={{
                borderRadius: 18,
                border: `1px solid ${blueBorder}`,
                background: colors.panelSoft,
                padding: "18px 18px 16px",
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: blueMuted,
                  marginBottom: 18,
                  fontWeight: 500,
                }}
              >
                Progress
              </div>
              {timelineSteps.map((step, i) => {
                const done = i < activeStep;
                const active = i === activeStep;
                return (
                  <div key={step.label} style={{ display: "flex", gap: 14 }}>
                    {/* Dot + connector line */}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        flexShrink: 0,
                        width: 20,
                      }}
                    >
                      <div
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: "50%",
                          flexShrink: 0,
                          background: done ? blue : "transparent",
                          border: done
                            ? "none"
                            : active
                            ? `2px solid ${blue}`
                            : `1.5px solid ${blueBorder}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: active
                            ? `0 0 0 4px rgba(49,94,255,0.1)`
                            : "none",
                        }}
                      >
                        {done && (
                          <CheckCircle
                            size={14}
                            color="#fff"
                            strokeWidth={2.5}
                          />
                        )}
                        {active && (
                          <div
                            style={{
                              width: 7,
                              height: 7,
                              borderRadius: "50%",
                              background: blue,
                            }}
                          />
                        )}
                      </div>
                      {i < timelineSteps.length - 1 && (
                        <div
                          style={{
                            width: 1.5,
                            flex: 1,
                            minHeight: 18,
                            background: done ? blue : blueBorder,
                            margin: "3px 0",
                            opacity: done ? 1 : 0.4,
                          }}
                        />
                      )}
                    </div>
                    {/* Text */}
                    <div
                      style={{
                        paddingBottom: i < timelineSteps.length - 1 ? 16 : 0,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: done || active ? 450 : 400,
                          color: done || active ? colors.text : colors.dim,
                          lineHeight: 1.2,
                          marginBottom: 3,
                        }}
                      >
                        {step.label}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: active ? blue : blueMuted,
                          lineHeight: 1.3,
                        }}
                      >
                        {step.sub}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer actions */}
          <div
            style={{
              padding: "0 18px",
              paddingBottom: "max(24px, env(safe-area-inset-bottom))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
            }}
          >
            <button
              type="button"
              onClick={() => onNavigate?.("activity")}
              style={{
                height: 38,
                padding: "0 20px",
                borderRadius: 99,
                background: blue,
                color: "#fff",
                border: 0,
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
                letterSpacing: "-0.01em",
                boxShadow: "0 3px 12px rgba(49,94,255,0.3)",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontFamily: "inherit",
                flexShrink: 0,
              }}
            >
              Track in Activity <ArrowRight size={13} strokeWidth={2} />
            </button>
            {currentRequest.allowedActions?.cancel && onCancelRequest && (
              <button
                type="button"
                disabled={cancellingRequest}
                onClick={() => void onCancelRequest(currentRequest.id)}
                style={{
                  height: 38,
                  padding: "0 18px",
                  borderRadius: 99,
                  background: "transparent",
                  color: blueMuted,
                  border: `1px solid ${blueBorder}`,
                  fontSize: 13,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  opacity: cancellingRequest ? 0.5 : 1,
                  flexShrink: 0,
                }}
              >
                {cancellingRequest ? "Cancelling…" : "Withdraw"}
              </button>
            )}
          </div>
        </div>
      );
    }

    // ── Post-disbursal breakdown ──
    return (
      <div className="adv-screen">
        <div className="screen-body adv-active-body">
          {/* ── Blue gradient hero card ── */}
          <div className="adv-hero-card">
            <div className="adv-hero-dots" />
            <div className="adv-hero-top">
              <div className="adv-hero-eyebrow">
                {currentRequest.disbursalStatus === "Disbursed"
                  ? "Credited"
                  : "Advance"}
              </div>
              <span
                className={
                  isPaid
                    ? "adv-hero-chip adv-hero-chip--green"
                    : "adv-hero-chip adv-hero-chip--amber"
                }
              >
                {statusLabel}
              </span>
            </div>
            <div className="adv-hero-amount">
              {principal ? formatMoney(principal) : "—"}
            </div>
            <div className="adv-hero-stats">
              <div className="adv-hero-stat">
                <span className="adv-hero-stat-label">Requested</span>
                <span className="adv-hero-stat-val">
                  {formatReadableDate(currentRequest.requestDate)}
                </span>
              </div>
              <div className="adv-hero-stat">
                <span className="adv-hero-stat-label">Due by</span>
                <span className="adv-hero-stat-val">{scheduleDate}</span>
              </div>
              <div className="adv-hero-stat">
                <span className="adv-hero-stat-label">Total payable</span>
                <span className="adv-hero-stat-val adv-hero-stat-val--amber">
                  {totalRepay ? formatMoney(totalRepay) : "—"}
                </span>
              </div>
            </div>
          </div>

          {/* View schedule link */}
          <button
            type="button"
            className="adv-inline-link adv-repay-link"
            onClick={() => onNavigate?.("repayments")}
          >
            View repayment schedule <ChevronRight size={13} />
          </button>

          <div className="adv-calc-head">
            <h2>How we calculate</h2>
            <span>
              {interestRate ? `${interestRate}% p.a.` : "Flat interest"}
            </span>
          </div>
          <div className="adv-calc-list">
            <div className="adv-calc-row">
              <span className="adv-calc-icon">1</span>
              <div>
                <strong>Advance amount</strong>
                <small>Principal you receive</small>
              </div>
              <b>{principal ? formatMoney(principal) : "—"}</b>
            </div>
            <div className="adv-calc-row">
              <span className="adv-calc-icon adv-calc-icon--warm">+</span>
              <div>
                <strong>Interest</strong>
                <small>
                  {principal ? formatMoney(principal) : "—"} ×{" "}
                  {interestRate ? `${interestRate}% p.a.` : "rate"} ×{" "}
                  {interestDays ?? "—"} days
                </small>
              </div>
              <b className="orange">{interest ? formatMoney(interest) : "—"}</b>
            </div>
            <div className="adv-calc-total">
              <span className="adv-calc-check">
                <CheckCircle size={18} strokeWidth={2} />
              </span>
              <div>
                <strong>Total repayable</strong>
                <small>Auto-deducted on payday</small>
              </div>
              <b>{totalRepay ? formatMoney(totalRepay) : "—"}</b>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  1. SETUP STATE
  // ═══════════════════════════════════════════════════════════════════════════

  if (!eligible && hasMissingSetupAction) {
    const completedCount = setupSteps.filter((s) => s.state !== "todo").length;

    return (
      <div
        style={{
          background: colors.bg,
          minHeight: "100%",
          color: colors.text,
          padding: "20px 22px 32px",
        }}
      >
        <div style={{ marginBottom: 24 }}>
          <div
            style={{
              fontSize: 22,
              fontWeight: 400,
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
              marginBottom: 8,
            }}
          >
            Complete your setup
          </div>
          <div style={{ fontSize: 14, color: colors.muted, lineHeight: 1.5 }}>
            Advances unlock as soon as we verify your identity and bank details.
            One-time setup.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 22,
          }}
        >
          {setupSteps.map((s) => (
            <div
              key={s.label}
              style={{
                flex: 1,
                height: 5,
                borderRadius: 99,
                background:
                  s.state !== "todo" ? "#315eff" : "rgba(49,94,255,0.15)",
                transition: "background 0.25s ease",
              }}
            />
          ))}
          <span
            style={{
              color: colors.muted,
              fontSize: 12,
              fontWeight: 500,
              whiteSpace: "nowrap",
              letterSpacing: "-0.02em",
            }}
          >
            {completedCount} / {setupSteps.length}
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {setupSteps.map((s) => {
            const isDone = s.state === "done";
            const isReview = s.state === "review";
            const isTodo = s.state === "todo";
            const Icon = s.isKyc ? IdCard : Landmark;
            return (
              <div
                key={s.label}
                style={{
                  display: "grid",
                  gridTemplateColumns: "44px 1fr auto",
                  alignItems: "center",
                  gap: 14,
                  padding: "18px 16px",
                  borderRadius: 18,
                  border: `1px solid ${
                    isTodo ? "rgba(49,94,255,0.25)" : colors.border
                  }`,
                  background: isTodo ? "rgba(49,94,255,0.04)" : colors.panel,
                }}
              >
                <span
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    display: "grid",
                    placeItems: "center",
                    background: isDone
                      ? "rgba(49,94,255,0.12)"
                      : isReview
                      ? "rgba(217,119,6,0.12)"
                      : "rgba(49,94,255,0.10)",
                    color: isDone
                      ? "#315eff"
                      : isReview
                      ? "#D97706"
                      : "#315eff",
                  }}
                >
                  {isDone ? (
                    <CheckCircle size={18} strokeWidth={1.9} />
                  ) : (
                    <Icon size={18} strokeWidth={1.9} />
                  )}
                </span>
                <span>
                  <span
                    style={{
                      display: "block",
                      fontSize: 15,
                      fontWeight: 450,
                      color: isDone ? colors.dim : colors.text,
                    }}
                  >
                    {s.label}
                  </span>
                  <span
                    style={{
                      display: "block",
                      marginTop: 4,
                      fontSize: 12,
                      color: colors.dim,
                    }}
                  >
                    {isReview
                      ? "Submitted · pending review"
                      : isDone
                      ? "Verified"
                      : s.sublabel}
                  </span>
                </span>
                {isTodo && (
                  <button
                    type="button"
                    onClick={() => onNavigate?.(s.view)}
                    style={{
                      height: 36,
                      padding: "0 16px",
                      borderRadius: 12,
                      border: 0,
                      background: "#315eff",
                      color: "#FFFFFF",
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {s.isKyc ? "Start" : "Add"}
                  </button>
                )}
                {isReview && (
                  <span
                    style={{
                      color: "#D97706",
                      fontSize: 12,
                      fontWeight: 500,
                      whiteSpace: "nowrap",
                    }}
                  >
                    In review
                  </span>
                )}
                {isDone && (
                  <CheckCircle size={18} strokeWidth={1.9} color="#315eff" />
                )}
              </div>
            );
          })}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 7,
            color: colors.faint,
            fontSize: 12,
            marginTop: 28,
          }}
        >
          <ShieldCheck size={13} strokeWidth={1.9} />
          Your details are encrypted and never shared
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  2. UNDER REVIEW
  // ═══════════════════════════════════════════════════════════════════════════

  if (!eligible && isWaitingForSetupReview) {
    const reviewStage: VerificationStage =
      kycComplete || bankComplete ? "review" : "submitted";
    return (
      <VerificationLifecycleScreen
        stage={reviewStage}
        bankAccount={bankAccount}
        kycDocumentCount={kycDocumentCount}
        kycDocuments={kycDocuments}
        onNavigate={onNavigate}
      />
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  3. CALCULATOR — minimal fintech layout, no top card, no slider
  // ═══════════════════════════════════════════════════════════════════════════

  const sliderMax = Math.max(limit, MIN_AMOUNT);
  const canSubmit =
    !hasActive &&
    amount >= MIN_AMOUNT &&
    amount <= sliderMax &&
    !previewLoading;
  const canConfirm = agree1 && !submitting;

  const quickAmounts = Array.from(
    new Set(
      [0.25, 0.5, 0.75, 1]
        .map((r) => Math.round((limit * r) / 500) * 500)
        .filter((v) => v >= MIN_AMOUNT && v <= limit)
    )
  ).slice(0, 4);

  const maskedBank = bankAccount?.accountNumber
    ? `${bankAccount.bankName || "Bank"} •••• ${bankAccount.accountNumber.slice(
        -4
      )}`
    : "Verified salary account";

  const isInterestFree = Boolean(
    interestFreeThreshold &&
      interestFreeThreshold > 0 &&
      amount <= interestFreeThreshold
  );

  // ── SUBMITTED — full-page redesign ───────────────────────────────────────────
  if (step === "submitted") {
    const dateStr = submittedAt
      ? new Date(submittedAt).toLocaleString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
      : null;

    return (
      <div className="adv-sub2-root">
        {/* Blue hero */}
        <div className="adv-sub2-hero">
          <div className="adv-sub2-check-wrap">
            <div className="adv-sub2-ripple" />
            <div className="adv-sub2-ripple adv-sub2-ripple--2" />
            <div className="adv-sub2-check-circle">
              <CheckCircle size={30} strokeWidth={1.8} color="#fff" />
            </div>
          </div>
          <div className="adv-sub2-amount">{formatMoney(amount)}</div>
          <div className="adv-sub2-lbl">Request submitted</div>
          {dateStr && <div className="adv-sub2-date">{dateStr}</div>}
        </div>

        {/* White card */}
        <div className="adv-sub2-card">
          {preview && (
            <div className="adv-sub2-cols">
              <div className="adv-sub2-col">
                <span className="adv-sub2-col-lbl">You receive</span>
                <span className="adv-sub2-col-val adv-sub2-col-val--blue">
                  {formatMoney(preview.youReceive)}
                </span>
              </div>
              <span className="adv-sub2-vdiv" />
              <div className="adv-sub2-col">
                <span className="adv-sub2-col-lbl">Interest</span>
                <span className="adv-sub2-col-val">
                  {formatMoney(preview.interest)}
                </span>
              </div>
              <span className="adv-sub2-vdiv" />
              <div className="adv-sub2-col">
                <span className="adv-sub2-col-lbl">Repay on</span>
                <span className="adv-sub2-col-val">
                  {formatShortDate(preview.recoveryDate)}
                </span>
              </div>
            </div>
          )}

          <div className="adv-sub2-sep" />

          <div className="adv-sub2-tl-hdr">What happens next</div>
          {(
            [
              {
                label: "Employer review",
                sub: "They'll approve or ask questions",
              },
              {
                label: "Admin approval",
                sub: "MobPae team gives final green light",
              },
              {
                label: "Funds credited",
                sub: "Directly to your linked bank account",
              },
              {
                label: "Auto-deducted",
                sub: preview
                  ? `On ${formatShortDate(
                      preview.recoveryDate
                    )} from your salary`
                  : "On your next payday",
              },
            ] as { label: string; sub: string }[]
          ).map((item, i, arr) => (
            <div key={item.label} className="adv-sub2-tl-row">
              <div className="adv-sub2-tl-aside">
                <div className="adv-sub2-tl-dot" />
                {i < arr.length - 1 && <div className="adv-sub2-tl-line" />}
              </div>
              <div className="adv-sub2-tl-body">
                <div className="adv-sub2-tl-label">{item.label}</div>
                <div className="adv-sub2-tl-sub">{item.sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Sticky CTA */}
        <div className="adv-sub2-footer">
          <button
            type="button"
            className="mp-btn-primary"
            onClick={() => {
              setStep("calculator");
              onNavigate?.("activity");
            }}
          >
            Track in Activity <ArrowRight size={16} />
          </button>
          <div className="adv-secure-note">
            <ShieldCheck size={13} strokeWidth={1.8} /> We'll notify you at
            every step
          </div>
        </div>
      </div>
    );
  }

  // ── Review — full page (no slide) ──────────────────────────────────────────
  if (step === "review") {
    return (
      <div
        style={{
          background: colors.bg,
          minHeight: "100%",
          display: "flex",
          flexDirection: "column",
          padding: "16px 20px max(24px, env(safe-area-inset-bottom))",
          color: colors.text,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 22,
          }}
        >
          <button
            type="button"
            onClick={() => setStep("calculator")}
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              border: `1px solid ${colors.border}`,
              background: colors.panelSoft,
              color: colors.text,
              display: "grid",
              placeItems: "center",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            ←
          </button>
          <span
            style={{
              fontSize: 16,
              fontWeight: 450,
              color: colors.text,
              letterSpacing: "-0.025em",
            }}
          >
            Confirm your advance
          </span>
        </div>

        {/* Amount summary card */}
        <div
          style={{
            borderRadius: 14,
            border: `1px solid rgba(49,94,255,0.14)`,
            background: "rgba(49,94,255,0.05)",
            padding: "14px 16px",
            marginBottom: 14,
          }}
        >
          <div
            style={{
              fontSize: 28,
              fontWeight: 300,
              letterSpacing: "-0.04em",
              color: "#315eff",
              marginBottom: 6,
            }}
          >
            {preview ? formatMoney(preview.youReceive) : formatMoney(amount)}
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {preview?.recoveryDate && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "4px 10px",
                  borderRadius: 99,
                  background: colors.panelSoft,
                  border: `1px solid ${colors.border}`,
                  color: colors.muted,
                  fontSize: 12,
                }}
              >
                <CalendarDays size={11} /> Repay{" "}
                {formatShortDate(preview.recoveryDate)}
              </span>
            )}
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "4px 10px",
                borderRadius: 99,
                background: colors.panelSoft,
                border: `1px solid ${colors.border}`,
                color: colors.muted,
                fontSize: 12,
              }}
            >
              <Landmark size={11} /> {maskedBank}
            </span>
            {preview?.interest != null && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "4px 10px",
                  borderRadius: 99,
                  background: colors.panelSoft,
                  border: `1px solid ${colors.border}`,
                  color: colors.muted,
                  fontSize: 12,
                }}
              >
                +{formatMoney(preview.interest)} interest
              </span>
            )}
          </div>
        </div>

        {/* Purpose */}
        <div style={{ marginBottom: 14 }}>
          <span
            style={{
              display: "block",
              fontSize: 11,
              color: colors.dim,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            Purpose · optional
          </span>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 6,
            }}
          >
            {PURPOSE_CHIPS.map(({ value, label }) => {
              const sel = purposeCategory === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setPurposeCategory(sel ? null : value)}
                  style={{
                    padding: "7px 0",
                    borderRadius: 10,
                    border: sel
                      ? "1.5px solid #315eff"
                      : `1.5px solid ${colors.border}`,
                    background: sel ? "rgba(49,94,255,0.08)" : colors.panelSoft,
                    color: sel ? "#315eff" : colors.muted,
                    fontSize: 12,
                    fontWeight: 450,
                    cursor: "pointer",
                    textAlign: "center",
                    fontFamily: "inherit",
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <input
            type="text"
            placeholder="Add a note (optional)"
            value={purposeNote}
            className="adv-note-input"
            onChange={(e) => setPurposeNote(e.target.value)}
            maxLength={200}
            style={{
              marginTop: 8,
              width: "100%",
              height: 44,
              padding: "0 12px",
              borderRadius: 12,
              border: `1.5px solid ${colors.border}`,
              background: colors.panelSoft,
              color: colors.text,
              fontSize: 13,
              outline: "none",
              fontFamily: "inherit",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Consent */}
        <label
          style={{
            display: "grid",
            gridTemplateColumns: "20px 1fr",
            gap: 12,
            color: colors.dim,
            fontSize: 13,
            lineHeight: 1.55,
            marginBottom: 18,
          }}
        >
          <input
            type="checkbox"
            checked={agree1}
            onChange={(e) => setAgree1(e.target.checked)}
            style={{
              width: 18,
              height: 18,
              marginTop: 2,
              accentColor: "#315eff",
            }}
          />
          <span>
            I authorise a one-time salary auto-debit of{" "}
            <span style={{ color: colors.text }}>
              {preview ? formatMoney(preview.total) : formatMoney(amount)}
            </span>{" "}
            on my payday and accept the{" "}
            <button
              type="button"
              onClick={() => onNavigate?.("legal")}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                color: colors.text,
                textDecoration: "underline",
                textUnderlineOffset: 3,
                fontSize: "inherit",
                fontFamily: "inherit",
                cursor: "pointer",
              }}
            >
              advance terms
            </button>
            .
          </span>
        </label>

        <div style={{ flex: 1 }} />

        {/* Confirm CTA */}
        <button
          type="button"
          disabled={!canConfirm}
          onClick={async () => {
            const requestDate = await onSubmit(
              purposeCategory ?? undefined,
              purposeNote.trim() || undefined
            );
            if (requestDate !== null) {
              setSubmittedAt(requestDate);
              setStep("submitted");
            }
          }}
          style={{
            width: "100%",
            height: 48,
            borderRadius: 12,
            background: canConfirm ? "#315eff" : colors.panelMuted,
            color: canConfirm ? "#fff" : colors.faint,
            border: 0,
            fontSize: 15,
            fontWeight: 500,
            opacity: canConfirm ? 1 : 0.5,
            cursor: canConfirm ? "pointer" : "not-allowed",
            letterSpacing: "-0.01em",
            boxShadow: canConfirm ? "0 6px 20px rgba(49,94,255,0.30)" : "none",
          }}
        >
          {submitting ? "Confirming…" : `Confirm & get ${formatMoney(amount)}`}
        </button>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            marginTop: 10,
            color: colors.dim,
            fontSize: 12,
          }}
        >
          <ShieldCheck size={13} strokeWidth={1.8} /> Employer-verified · repaid
          from salary
        </div>
      </div>
    );
  }

  // ── Calculator ───────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        background: colors.bg,
        minHeight: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ── Stats strip — limit left, salary·payday right ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "14px 20px",
          borderBottom: `1px solid ${colors.border}`,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 10,
              color: colors.dim,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBottom: 3,
            }}
          >
            Max Limit
          </div>
          <div
            style={{
              fontSize: 16,
              fontWeight: 450,
              color: "#315eff",
              letterSpacing: "-0.02em",
            }}
          >
            {formatMoney(limit)}
          </div>
        </div>
        {(salaryInHand || payrollDay) && (
          <div style={{ textAlign: "right" }}>
            <div
              style={{
                fontSize: 10,
                color: colors.dim,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                marginBottom: 3,
              }}
            >
              Salary{payrollDay ? ` · Day ${payrollDay}` : ""}
            </div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 450,
                color: colors.text,
                letterSpacing: "-0.02em",
              }}
            >
              {salaryInHand ? formatMoney(salaryInHand) : "—"}
            </div>
          </div>
        )}
      </div>

      {/* ── Main content + CTA in one scrollable flex column ── */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          padding: "0 20px",
          overflowY: "auto",
        }}
      >
        {/* Label */}
        <div style={{ textAlign: "center", paddingTop: 24, marginBottom: 14 }}>
          <span
            style={{
              fontSize: 10,
              letterSpacing: "0.32em",
              textTransform: "uppercase",
              color: colors.dim,
            }}
          >
            You're requesting
          </span>
        </div>

        {/* Amount hero — tap to type */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 14,
            marginBottom: 6,
          }}
        >
          <button
            type="button"
            onClick={() => onAmountChange(Math.max(MIN_AMOUNT, amount - 500))}
            disabled={amount <= MIN_AMOUNT}
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              border: `1.5px solid ${colors.border}`,
              background: "transparent",
              color: colors.text,
              fontSize: 20,
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
              cursor: "pointer",
              opacity: amount <= MIN_AMOUNT ? 0.22 : 1,
              transition: "opacity 0.15s",
            }}
          >
            −
          </button>

          {editingAmount ? (
            <input
              ref={amountInputRef}
              type="number"
              inputMode="numeric"
              value={rawInput}
              onChange={(e) => setRawInput(e.target.value)}
              onBlur={commitAmountEdit}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.currentTarget.blur();
              }}
              style={
                {
                  fontSize: 46,
                  fontWeight: 300,
                  letterSpacing: "-0.05em",
                  width: 190,
                  border: "none",
                  outline: "none",
                  borderBottom: "2px solid #315eff",
                  textAlign: "center",
                  background: "transparent",
                  color: colors.text,
                  lineHeight: 1,
                } as React.CSSProperties
              }
            />
          ) : (
            <div
              role="button"
              tabIndex={0}
              onClick={startAmountEdit}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") startAmountEdit();
              }}
              style={{
                fontSize: 46,
                fontWeight: 300,
                letterSpacing: "-0.05em",
                color: colors.text,
                lineHeight: 1,
                textAlign: "center",
                minWidth: 160,
                cursor: "text",
                userSelect: "none",
              }}
            >
              {formatMoney(amount)}
            </div>
          )}

          <button
            type="button"
            onClick={() => onAmountChange(Math.min(sliderMax, amount + 500))}
            disabled={amount >= sliderMax}
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              border: 0,
              background: "#315eff",
              color: "#fff",
              fontSize: 20,
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
              cursor: "pointer",
              opacity: amount >= sliderMax ? 0.28 : 1,
              boxShadow:
                amount >= sliderMax
                  ? "none"
                  : "0 2px 10px rgba(49,94,255,0.45)",
              transition: "opacity 0.15s, box-shadow 0.15s",
            }}
          >
            +
          </button>
        </div>

        {/* Tap-to-type hint */}
        {!editingAmount && (
          <div style={{ textAlign: "center", marginBottom: 10 }}>
            <button
              type="button"
              onClick={startAmountEdit}
              style={{
                background: "none",
                border: "none",
                padding: "2px 10px",
                cursor: "pointer",
                fontSize: 11,
                color: colors.faint,
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <Pencil size={10} strokeWidth={1.8} />
              Type amount
            </button>
          </div>
        )}

        {/* Range */}
        <div
          style={{
            textAlign: "center",
            fontSize: 11,
            color: colors.faint,
            marginBottom: 14,
          }}
        >
          ₹500 – {formatMoney(limit)}
        </div>

        {/* Interest-free chip */}
        {interestFreeThreshold && interestFreeThreshold > 0 && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: 14,
            }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "4px 12px",
                borderRadius: 99,
                fontSize: 11,
                fontWeight: 500,
                background: isInterestFree
                  ? "rgba(34,197,94,0.1)"
                  : "transparent",
                border: `1px solid ${
                  isInterestFree ? "rgba(34,197,94,0.3)" : colors.border
                }`,
                color: isInterestFree ? "#22c55e" : colors.faint,
                transition: "all 0.2s",
              }}
            >
              <Sparkles size={10} strokeWidth={2} />
              {isInterestFree
                ? "Interest-free"
                : `Free up to ${formatMoney(interestFreeThreshold)}`}
            </span>
          </div>
        )}

        {/* 4 colorful pills */}
        <div style={{ display: "flex", gap: 6, marginBottom: 18 }}>
          {quickAmounts.map((v, i) => {
            const p = PILL_PALETTE[i % PILL_PALETTE.length];
            const sel = amount === v;
            return (
              <button
                key={v}
                type="button"
                onClick={() => onAmountChange(v)}
                style={{
                  flex: 1,
                  padding: "9px 0",
                  borderRadius: 99,
                  border: `1.5px solid ${sel ? p.solid : p.border}`,
                  background: sel ? p.solid : p.soft,
                  color: sel ? "#fff" : p.solid,
                  fontSize: 12,
                  fontWeight: sel ? 500 : 400,
                  cursor: "pointer",
                  boxShadow: sel ? `0 2px 8px ${p.solid}35` : "none",
                  transition: "all 0.15s",
                  whiteSpace: "nowrap",
                }}
              >
                {formatMoney(v)}
              </button>
            );
          })}
        </div>

        {/* Breakdown */}
        {preview ? (
          <div
            style={{
              border: `1px solid ${colors.border}`,
              borderRadius: 12,
              overflow: "hidden",
              marginBottom: 16,
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1px 1fr 1px 1fr",
              }}
            >
              <div style={{ padding: "12px 8px", textAlign: "center" }}>
                <div
                  style={{
                    fontSize: 10,
                    color: colors.dim,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    marginBottom: 4,
                  }}
                >
                  Receive
                </div>
                <div
                  style={{ fontSize: 14, fontWeight: 450, color: colors.text }}
                >
                  {formatMoney(preview.youReceive)}
                </div>
              </div>
              <div style={{ background: colors.border }} />
              <div style={{ padding: "12px 8px", textAlign: "center" }}>
                <div
                  style={{
                    fontSize: 10,
                    color: colors.dim,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    marginBottom: 4,
                  }}
                >
                  Interest
                </div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 450,
                    color: preview.interest > 0 ? colors.warm : colors.green,
                  }}
                >
                  +{formatMoney(preview.interest)}
                </div>
              </div>
              <div style={{ background: colors.border }} />
              <div style={{ padding: "12px 8px", textAlign: "center" }}>
                <div
                  style={{
                    fontSize: 10,
                    color: colors.dim,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    marginBottom: 4,
                  }}
                >
                  Pay back
                </div>
                <div
                  style={{ fontSize: 14, fontWeight: 450, color: colors.text }}
                >
                  {formatMoney(preview.total)}
                </div>
              </div>
            </div>
            <div
              style={{
                borderTop: `1px solid ${colors.border}`,
                padding: "8px 14px",
                display: "flex",
                alignItems: "center",
                gap: 5,
                color: colors.dim,
                fontSize: 11,
              }}
            >
              <CalendarDays size={11} strokeWidth={1.8} />
              Auto-deducted on{" "}
              {preview.recoveryDate
                ? formatShortDate(preview.recoveryDate)
                : `Day ${payrollDay ?? "payday"}`}
              {preview.interestRate ? ` · ${preview.interestRate}% p.a.` : ""}
            </div>
          </div>
        ) : (
          <div
            style={{
              textAlign: "center",
              color: colors.faint,
              fontSize: 12,
              marginBottom: 16,
            }}
          >
            {previewLoading
              ? "Calculating…"
              : "Tap an amount or type to see the breakdown"}
          </div>
        )}

        {/* Spacer — CTA floats to bottom */}
        <div style={{ flex: 1, minHeight: 16 }} />

        {/* CTA */}
        <div
          style={{ paddingBottom: "max(24px, env(safe-area-inset-bottom))" }}
        >
          <button
            type="button"
            disabled={!canSubmit}
            onClick={canSubmit ? () => setStep("review") : undefined}
            style={{
              width: "100%",
              height: 48,
              borderRadius: 12,
              border: 0,
              background: canSubmit
                ? "linear-gradient(135deg, #315eff 0%, #5b78ff 100%)"
                : colors.panelMuted,
              color: canSubmit ? "#fff" : colors.faint,
              fontSize: 15,
              fontWeight: 500,
              letterSpacing: "-0.01em",
              cursor: canSubmit ? "pointer" : "not-allowed",
              boxShadow: canSubmit ? "0 6px 20px rgba(49,94,255,0.35)" : "none",
              transition: "all 0.2s",
            }}
          >
            Request {formatMoney(amount)}
          </button>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 5,
              marginTop: 10,
              fontSize: 11,
              color: colors.faint,
            }}
          >
            <ShieldCheck size={11} strokeWidth={2} />
            256-bit encrypted · RBI compliant
          </div>
        </div>
      </div>
    </div>
  );
}
