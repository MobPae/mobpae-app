import {
  ArrowRight,
  AlertTriangle,
  BadgeCheck,
  CalendarDays,
  CheckCircle,
  ChevronRight,
  Clock,
  CreditCard,
  Crown,
  IdCard,
  Landmark,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import {
  formatReadableDate,
  formatMoney,
  formatRequestStatus,
  formatShortDate,
} from "../utils/format";
import type { AdvanceRequest, BankAccount, MembershipConfig, RecoveryPreview, View } from "../types/app";
import type { Theme } from "../hooks/useTheme";

const MIN_AMOUNT = 500;

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
  membershipConfig?: MembershipConfig;
  membershipActive?: boolean;
  membershipRequiredAfterEmployerApproval?: boolean;
  bankAccount?: BankAccount | null;
  kycDocumentCount?: number;
  onAmountChange: (amount: number) => void;
  onSubmit: () => void;
  onCancelRequest?: (id: string) => Promise<void>;
  cancellingRequest?: boolean;
  blockerActionLabel: string;
  onResolveBlocker: () => void;
  onNavigate?: (view: View) => void;
  theme?: Theme;
};

type AdvanceStep = "ready" | "calculator" | "review" | "submitted";
type VerificationStage = "submitted" | "review" | "approved";

function nextPaydayDate(payrollDay?: number | null) {
  if (!payrollDay) return null;
  const today = new Date();
  const offset = today.getDate() > payrollDay ? 1 : 0;
  return new Date(today.getFullYear(), today.getMonth() + offset, payrollDay);
}
function formatPayday(d: Date | null) {
  if (!d) return "—";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function formatBackendMoney(value?: number | null) {
  return value && value > 0 ? formatMoney(value) : "—";
}

function compactBankLabel(bankAccount?: BankAccount | null) {
  if (!bankAccount?.accountNumber) return "Bank details submitted";
  return `${bankAccount.bankName || "Bank"} ···· ${bankAccount.accountNumber.slice(-4)}`;
}

function advancePalette(theme: Theme) {
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
      receiptBg: "#F1EDFC",
      receiptInk: "#1E1636",
      receiptMuted: "#6E6786",
      receiptSubtle: "#8B849F",
      receiptDash: "#DCD5F2",
      receiptNotch: "#FFFFFF",
      ctaBg: "#5B3CE3",
      ctaText: "#FFFFFF",
      ctaIconBg: "#FFFFFF",
      ctaIconText: "#5B3CE3",
      glow: "rgba(91,60,227,0.06)",
      disabledBg: "#EEEBF6",
      disabledText: "#B6B3C2",
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
    border: "#26262B",
    panel: "#151519",
    panelSoft: "#17171B",
    panelMuted: "#2A2A30",
    receiptBg: "#F4F1E8",
    receiptInk: "#17150F",
    receiptMuted: "#8A8676",
    receiptSubtle: "#4A473C",
    receiptDash: "#D8D3C2",
    receiptNotch: "#0C0C0E",
    ctaBg: "#F2F0EA",
    ctaText: "#0C0C0E",
    ctaIconBg: "#17150F",
    ctaIconText: "#F2F0EA",
    glow: "rgba(242,240,234,0.025)",
    disabledBg: "#1A1A1E",
    disabledText: "#3A3A40",
    warm: "#B4591F",
    green: "#20A46A",
  };
}

function VerificationLifecycleScreen({
  stage,
  bankAccount,
  kycDocumentCount,
  onStartAdvance,
}: {
  stage: VerificationStage;
  bankAccount?: BankAccount | null;
  kycDocumentCount?: number;
  onStartAdvance?: () => void;
}) {
  const copy: Record<VerificationStage, {
    title: string;
    body: string;
    badge: string;
    tone: "neutral" | "warm" | "success";
  }> = {
    submitted: {
      title: "Submitted",
      body: "We’ve received your documents. They’ll enter review shortly.",
      badge: "Review starts within a few hours",
      tone: "neutral",
    },
    review: {
      title: "Under review",
      body: "Our team is reviewing your KYC and bank details. This usually takes 1–2 business days.",
      badge: "Usually 1–2 business days",
      tone: "warm",
    },
    approved: {
      title: "You’re approved",
      body: "Your account is active. Request a salary advance whenever you need one.",
      badge: "Ready for advances",
      tone: "success",
    },
  };

  const current = copy[stage];
  const submittedDone = stage !== "submitted";

  const timeline = [
    {
      label: "Documents submitted",
      detail: "KYC & bank details received",
      status: submittedDone ? "Done" : "Done",
      state: submittedDone ? "done" : "current",
    },
    {
      label: "Under review",
      detail: stage === "approved" ? "Verification complete" : "Waiting in queue",
      status: stage === "submitted" ? "Pending" : stage === "review" ? "In progress" : "Done",
      state: stage === "submitted" ? "pending" : stage === "review" ? "current" : "done",
    },
    {
      label: "Account activated",
      detail: stage === "approved" ? "You can now request advances" : "Pending verification",
      status: stage === "approved" ? "Active" : "—",
      state: stage === "approved" ? "done" : "pending",
    },
  ] as const;

  return (
    <div className="adv-verify-screen">
      <section className={`adv-verify-hero is-${current.tone}`}>
        <div className="adv-verify-orb">
          {current.tone === "warm" ? (
            <Clock size={33} strokeWidth={1.9} />
          ) : (
            <CheckCircle size={34} strokeWidth={1.85} />
          )}
        </div>
        <h1>{current.title}</h1>
        <p>{current.body}</p>
        {stage !== "approved" && (
          <div className="adv-verify-pill">
            <Clock size={13} strokeWidth={1.9} />
            {current.badge}
          </div>
        )}
      </section>

      <section className="adv-verify-timeline">
        {timeline.map((item, index) => (
          <div className={`adv-verify-step is-${item.state}`} key={item.label}>
            <div className="adv-verify-step-rail">
              <span>
                {item.state === "pending" ? "·" : <CheckCircle size={14} strokeWidth={2} />}
              </span>
              {index < timeline.length - 1 && <i />}
            </div>
            <div className="adv-verify-step-copy">
              <strong>{item.label}</strong>
              <small>{item.detail}</small>
            </div>
            <em>{item.status}</em>
          </div>
        ))}
      </section>

      <section className="adv-verify-summary">
        <div>
          <span><IdCard size={13} strokeWidth={1.9} /> KYC</span>
          <strong>{kycDocumentCount ? `${kycDocumentCount} documents` : "Documents submitted"}</strong>
        </div>
        <div>
          <span><Landmark size={13} strokeWidth={1.9} /> Bank</span>
          <strong>{compactBankLabel(bankAccount)}</strong>
        </div>
      </section>

      {stage === "approved" && (
        <div className="adv-verify-footer">
          <button type="button" className="adv-verify-cta" onClick={onStartAdvance}>
            <span>Request your first advance</span>
            <span><ArrowRight size={23} strokeWidth={2.2} /></span>
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Page heading shared across all advance states ── */

export function AdvanceScreen({
  amount,
  eligible,
  limit,
  nextBlocker,
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
  membershipConfig,
  membershipActive,
  membershipRequiredAfterEmployerApproval,
  bankAccount,
  kycDocumentCount,
  onAmountChange,
  onSubmit,
  onCancelRequest,
  cancellingRequest,
  blockerActionLabel,
  onResolveBlocker,
  onNavigate,
  theme = "dark",
}: AdvanceScreenProps) {
  const [step, setStep] = useState<AdvanceStep>("ready");
  const [agree1, setAgree1] = useState(false);
  const colors = advancePalette(theme);

  const hasActive = Boolean(
    currentRequest &&
      !["Paid", "Recovered", "Rejected", "Cancelled", "Expired"].includes(currentRequest.status)
  );
  const canSubmit =
    eligible &&
    !hasActive &&
    amount >= MIN_AMOUNT &&
    amount <= limit &&
    !previewLoading;

  const nextPayday = nextPaydayDate(payrollDay);
  const salary = salaryInHand ?? 0;
  const sliderMax = Math.max(limit, MIN_AMOUNT);
  const quickAmounts = Array.from(
    new Set(
      [0.25, 0.5, 0.75, 1]
        .map((ratio) => Math.round((limit * ratio) / 500) * 500)
        .filter((value) => value >= MIN_AMOUNT && value <= limit)
    )
  );
  const maskedBankAccount = bankAccount?.accountNumber
    ? `${bankAccount.bankName || "Bank account"} •••• ${bankAccount.accountNumber.slice(-4)}`
    : "Verified salary account";
  const membershipPlanAmounts = (membershipConfig?.plans ?? [])
    .map((plan) => Number(plan.amount))
    .filter((value) => Number.isFinite(value) && value > 0);
  const membershipStartingAmount = membershipPlanAmounts.length
    ? Math.min(...membershipPlanAmounts)
    : null;
  const membershipGateFootnote = membershipStartingAmount
    ? `Plans from ${formatMoney(membershipStartingAmount)}`
    : "Choose a plan to continue";
  const membershipGateBenefits = (membershipConfig?.membershipBenefits ?? [])
    .filter(Boolean)
    .slice(0, 2);

  // Show net salary only for the month the recovery actually hits
  const recoveryDate =
    hasActive && currentRequest?.recoveryDate
      ? new Date(currentRequest.recoveryDate)
      : null;
  const today = new Date();
  const recoveryIsThisMonth =
    recoveryDate &&
    recoveryDate.getMonth() === today.getMonth() &&
    recoveryDate.getFullYear() === today.getFullYear();
  const activeRecovery =
    hasActive &&
    currentRequest?.disbursalStatus === "Disbursed" &&
    recoveryIsThisMonth
      ? currentRequest.totalRecoveryAmount || 0
      : 0;
  const salaryThisMonth = Math.max(0, salary - activeRecovery);
  // Sub-label for the hero card
  const recoveryMonthName = recoveryDate
    ? recoveryDate.toLocaleDateString("en-IN", { month: "long" })
    : null;
  const salarySubLabel =
    hasActive && currentRequest?.disbursalStatus === "Disbursed" && recoveryDate
      ? recoveryIsThisMonth
        ? `After −${formatMoney(
            currentRequest.totalRecoveryAmount || 0
          )} deduction`
        : `Full pay · deduction in ${recoveryMonthName}`
      : "Updated just now";
  const setupSteps = [
    { label: "KYC Verification", done: kycComplete, submitted: kycSubmitted, view: "onboarding-kyc" as View },
    { label: "Bank Account", done: bankComplete, submitted: bankSubmitted, view: "onboarding-bank" as View },
  ].map((step) => {
    if (step.done) return { ...step, status: "Completed", tone: "done" };
    if (step.submitted) return { ...step, status: "Completed · Pending review", tone: "review" };
    return { ...step, status: "Action required", tone: "todo" };
  });
  const hasMissingSetupAction = setupSteps.some((setupStep) => setupStep.tone === "todo");
  const isWaitingForSetupReview = !eligible && !hasMissingSetupAction;

  // ── Active advance overview ───────────────────────────────
  if (hasActive && currentRequest) {
    const isPaid = currentRequest.recoveryStatus === "Completed";
    const statusLabel = isPaid
      ? "Repaid"
      : formatRequestStatus(currentRequest.status, currentRequest.statusLabel);
    const principal = currentRequest.principalAmount;
    const totalRepayment = currentRequest.totalRecoveryAmount;
    const interest = currentRequest.interestAmount;
    const interestDays = currentRequest.interestDays;
    const interestRate = currentRequest.interestRate;
    const rateLabel = interestRate ? `${interestRate}% p.a.` : "Flat interest";
    const scheduleDate = formatShortDate(
      currentRequest.recoveryDate ||
        currentRequest.disbursalDate ||
        currentRequest.requestDate
    );

    // ── "One Step Away" — AWAITING_MEMBERSHIP_PAYMENT ──
    const shouldShowMembershipGate =
      !membershipActive &&
      (currentRequest.status === "Awaiting Membership" ||
        (currentRequest.status === "Employer Approved" && membershipRequiredAfterEmployerApproval));

    if (shouldShowMembershipGate) {
      return (
        <div className="adv-screen adv-osa-screen">
          <div className="adv-active-body">
            <div className="adv-osa-status">
              <span />
              Employer approved
            </div>
            <div className="adv-osa-hero">
              <div className="adv-osa-crown-ring">
                <Crown size={28} />
              </div>
              <div className="adv-osa-headline">One Step Away</div>
              <div className="adv-osa-sub">
                Your employer approved your advance. Activate a membership and the
                funds are on their way.
              </div>
            </div>
            <div className="adv-osa-card">
              <div className="adv-osa-card-row">
                <span className="adv-osa-card-lbl">Amount approved</span>
                <span className="adv-osa-card-val">{formatBackendMoney(principal)}</span>
              </div>
              <div className="adv-osa-card-row">
                <span className="adv-osa-card-lbl">Next step</span>
                <span className="adv-osa-card-val">{currentRequest.nextActionLabel || "Choose your plan"}</span>
              </div>
            </div>
            {membershipGateBenefits.length > 0 && (
              <section className="adv-osa-benefits" aria-label="Membership benefits">
                <h2>What you get</h2>
                {membershipGateBenefits.map((benefit) => (
                  <div key={benefit} className="adv-osa-benefit-row">
                    <CheckCircle size={14} />
                    <span>{benefit}</span>
                  </div>
                ))}
              </section>
            )}
            <div className="adv-osa-action">
              <button type="button" className="mp-btn-primary adv-osa-cta" onClick={() => onNavigate?.("profile-membership")}>
                <span>Choose your plan</span>
                <ArrowRight size={16} />
              </button>
              <div className="adv-secure-note">
                <ShieldCheck size={12} /> {membershipGateFootnote}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // ── Terminal: CANCELLED / EXPIRED — let user start fresh ──
    if (currentRequest.status === "Cancelled" || currentRequest.status === "Expired") {
      const isCancelled = currentRequest.status === "Cancelled";
      return (
        <div className="adv-screen">
          <div className="screen-body adv-active-body adv-inprogress-body">
            <div className="adv-ip-icon-wrap">
              <Clock size={32} color={isCancelled ? "#6B7280" : "#F59E0B"} strokeWidth={1.5} />
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
                <strong>{formatMoney(currentRequest.requestedAmount)}</strong>
              </div>
              <div className="adv-ip-row">
                <span>Submitted on</span>
                <strong>{formatReadableDate(currentRequest.requestDate)}</strong>
              </div>
            </div>
          </div>
          <div className="adv-sticky-btn">
            <button type="button" className="mp-btn-primary" onClick={() => onNavigate?.("advance")}>
              Request Again <ChevronRight size={16} />
            </button>
          </div>
        </div>
      );
    }

    // ── "Request in Progress" — early statuses (not yet disbursed) ──
    const earlyStatuses: string[] = ["Submitted", "Employer Approved", "Admin Approved", "Under Review", "Approved"];
    if (earlyStatuses.includes(currentRequest.status)) {
      const statusHint: Record<string, string> = {
        "Submitted":        "Sent to your employer for approval",
        "Employer Approved":"Employer approved · awaiting admin review",
        "Under Review":     "Under review by admin",
        "Admin Approved":   "Approved · processing disbursal",
        "Approved":         "Approved · processing disbursal",
      };
      const hint = statusHint[currentRequest.status] ?? "Being processed";
      return (
        <div className="adv-screen">
          <div className="screen-body adv-active-body adv-inprogress-body">
            <div className="adv-ip-icon-wrap">
              <Clock size={32} color="#7B64FF" strokeWidth={1.5} />
            </div>
            <div className="adv-ip-headline">Request in Progress</div>
            <div className="adv-ip-sub">Please wait while we process your advance.</div>

            <div className="adv-ip-card">
              <div className="adv-ip-row">
                <span>Amount requested</span>
                <strong>{formatMoney(currentRequest.requestedAmount)}</strong>
              </div>
              <div className="adv-ip-row adv-ip-row--status">
                <span>Status</span>
                <span className="chip chip-amber">{statusLabel}</span>
              </div>
              <div className="adv-ip-row">
                <span>Submitted on</span>
                <strong>{formatReadableDate(currentRequest.requestDate)}</strong>
              </div>
            </div>

            <div className="adv-ip-hint">
              <Clock size={13} color="#7B64FF" />
              <span>{hint}</span>
            </div>
          </div>

          <div className="adv-sticky-btn">
            <button type="button" className="mp-btn-secondary" onClick={() => onNavigate?.("activity")}>
              View in Activity <ChevronRight size={16} />
            </button>
            {currentRequest.allowedActions?.cancel && onCancelRequest && (
              <button
                type="button"
                className="mp-btn-ghost"
                style={{ marginTop: 8, color: "#EF4444", fontSize: 13 }}
                disabled={cancellingRequest}
                onClick={() => void onCancelRequest(currentRequest.id)}
              >
                {cancellingRequest ? "Cancelling…" : "Cancel Request"}
              </button>
            )}
          </div>
        </div>
      );
    }

    // ── Post-disbursal breakdown (Disbursed / Payment Scheduled / etc.) ──
    return (
      <div className="adv-screen">
        <div className="screen-body adv-active-body">
          <div className="adv-inline-hero">
            <div className="adv-inline-top">
              <div className="adv-inline-eyebrow">
                {currentRequest.disbursalStatus === "Disbursed" ? "Credited" : "Advance"}
              </div>
              <span className={isPaid ? "chip chip-green" : "chip chip-amber"}>{statusLabel}</span>
            </div>
            <div className="adv-inline-amount">{formatBackendMoney(principal)}</div>
            <button type="button" className="adv-inline-link" onClick={() => onNavigate?.("repayments")}>
              View repayment schedule <ChevronRight size={13} />
            </button>
            <div className="adv-inline-divider" />
            <div className="adv-inline-stats">
              <div className="adv-inline-stat">
                <span>Requested</span>
                <strong>{formatReadableDate(currentRequest.requestDate)}</strong>
              </div>
              <div className="adv-inline-stat">
                <span>Due by</span>
                <strong>{scheduleDate}</strong>
              </div>
              <div className="adv-inline-stat">
                <span>Total payable</span>
                <strong className="amber">{formatBackendMoney(totalRepayment)}</strong>
              </div>
            </div>
          </div>

          <div className="adv-calc-head">
            <h2>How we calculate</h2>
            <span>{rateLabel}</span>
          </div>
          <div className="adv-calc-list">
            <div className="adv-calc-row">
              <span className="adv-calc-icon">1</span>
              <div>
                <strong>Advance amount</strong>
                <small>Principal you receive</small>
              </div>
              <b>{formatBackendMoney(principal)}</b>
            </div>
            <div className="adv-calc-row">
              <span className="adv-calc-icon adv-calc-icon--warm">+</span>
              <div>
                <strong>Interest</strong>
                <small>{formatBackendMoney(principal)} × {interestRate ? `${interestRate}% p.a.` : "rate"} × {interestDays || "—"} days</small>
              </div>
              <b className="orange">{formatBackendMoney(interest)}</b>
            </div>
            <div className="adv-calc-total">
              <span className="adv-calc-check">✓</span>
              <div>
                <strong>Total repayable</strong>
                <small>Auto-deducted on payday</small>
              </div>
              <b>{formatBackendMoney(totalRepayment)}</b>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // canConfirm lives here so the review sheet can read it
  const canConfirm = agree1 && !submitting;

  // ── Onboarding task guide (new user, actions to take) ──
  if (!eligible && hasMissingSetupAction) {
    const completedSetup = setupSteps.filter((s) => s.done).length;
    const lockedTicks = 40;

    return (
      <div
        style={{
          background: colors.bg,
          minHeight: "100%",
          display: "flex",
          flexDirection: "column",
          fontFamily: "'Space Grotesk', sans-serif",
          color: colors.text,
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -80,
            left: "50%",
            transform: "translateX(-50%)",
            width: 360,
            height: 250,
            background:
              `radial-gradient(ellipse at center top, ${colors.glow}, transparent 70%)`,
            pointerEvents: "none",
          }}
        />

        <div style={{ position: "relative", zIndex: 1, flex: 1, padding: "4px 22px 26px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "17px 18px",
              borderRadius: 18,
              border: "1px solid rgba(180, 89, 31, 0.55)",
              background:
                "linear-gradient(135deg, rgba(180,89,31,0.18), rgba(180,89,31,0.06))",
              color: colors.text,
              marginBottom: 30,
            }}
          >
            <AlertTriangle size={20} color="#C66C2B" strokeWidth={1.9} />
            <div>
              <div style={{ fontSize: 15, fontWeight: 650, lineHeight: 1.1 }}>
                Verification required
              </div>
              <div
                style={{
                  marginTop: 5,
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#B68C72",
                  letterSpacing: "0.03em",
                }}
              >
                Finish setup to unlock instant advances.
              </div>
            </div>
          </div>

          <div style={{ textAlign: "center", opacity: 0.34, pointerEvents: "none" }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.32em",
                color: colors.faint,
                textTransform: "uppercase",
                marginBottom: 20,
              }}
            >
              Up to
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: 54,
                marginBottom: 22,
              }}
            >
              <span
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  border: `1px solid ${colors.border}`,
                  display: "grid",
                  placeItems: "center",
                  fontSize: 22,
                  color: colors.faint,
                }}
              >
                −
              </span>
              <span
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 30,
                  fontWeight: 600,
                  letterSpacing: "-0.04em",
                  color: colors.text,
                  minWidth: 120,
                }}
              >
                {formatMoney(limit || amount || MIN_AMOUNT)}
              </span>
              <span
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  border: `1px solid ${colors.border}`,
                  display: "grid",
                  placeItems: "center",
                  fontSize: 22,
                  color: colors.faint,
                }}
              >
                +
              </span>
            </div>
            <div style={{ height: 32, display: "flex", alignItems: "center", gap: 4 }}>
              {Array.from({ length: lockedTicks }, (_, i) => (
                <span
                  key={i}
                  style={{
                    flex: "1 0 0",
                    height: i % 4 === 0 ? 14 : 8,
                    borderRadius: 1,
                    background: colors.panelMuted,
                  }}
                />
              ))}
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "center", marginTop: -94, marginBottom: 112 }}>
            <div
              style={{
                height: 37,
                padding: "0 22px",
                borderRadius: 999,
                border: `1px solid ${colors.border}`,
                background: colors.panel,
                boxShadow: "0 12px 28px rgba(0,0,0,0.36)",
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                color: colors.text,
                fontSize: 13,
                fontWeight: 650,
                letterSpacing: "0.03em",
              }}
            >
              <LockKeyhole size={15} strokeWidth={1.9} />
              Locked until verified
            </div>
          </div>

          <div
            style={{
              borderRadius: 22,
              border: `1px solid ${colors.border}`,
              background: colors.panel,
              padding: "22px 20px",
              marginBottom: 26,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                paddingBottom: 18,
                borderBottom: `1px solid ${colors.border}`,
              }}
            >
              <span
                style={{
                  color: colors.muted,
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: "0.28em",
                  textTransform: "uppercase",
                }}
              >
                Complete your setup
              </span>
              <span
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  color: colors.muted,
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                {completedSetup} / {setupSteps.length}
              </span>
            </div>

            {setupSteps.map((s, index) => {
              const isKyc = s.label.toLowerCase().includes("kyc");
              const Icon = isKyc ? IdCard : Landmark;
              const action =
                s.tone === "done"
                  ? "Done"
                  : s.tone === "review"
                    ? "Review"
                    : isKyc
                      ? "Start"
                      : "Add";

              return (
                <button
                  key={s.label}
                  type="button"
                  disabled={s.tone === "done" || s.tone === "review"}
                  onClick={() => s.tone === "todo" && onNavigate?.(s.view)}
                  style={{
                    width: "100%",
                    display: "grid",
                    gridTemplateColumns: "48px 1fr auto",
                    alignItems: "center",
                    gap: 14,
                    padding: index === 0 ? "22px 0 20px" : "20px 0 0",
                    borderTop: index === 0 ? "none" : `1px solid ${colors.border}`,
                    color: s.tone === "todo" ? colors.text : colors.dim,
                    background: "transparent",
                    textAlign: "left",
                    cursor: s.tone === "todo" ? "pointer" : "default",
                  }}
                >
                  <span
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: "50%",
                      border: `1px solid ${colors.border}`,
                      display: "grid",
                      placeItems: "center",
                      color: s.tone === "todo" ? colors.text : colors.faint,
                    }}
                  >
                    {s.tone === "done" ? (
                      <CheckCircle size={17} strokeWidth={1.8} />
                    ) : (
                      <Icon size={17} strokeWidth={1.8} />
                    )}
                  </span>
                  <span style={{ minWidth: 0 }}>
                    <span
                      style={{
                        display: "block",
                        fontSize: 15,
                        lineHeight: 1.1,
                        fontWeight: 650,
                        color: s.tone === "todo" ? colors.text : colors.dim,
                      }}
                    >
                      {isKyc ? "Verify your identity" : "Link bank account"}
                    </span>
                    <span
                      style={{
                        display: "block",
                        marginTop: 6,
                        fontSize: 12,
                        lineHeight: 1.25,
                        fontWeight: 600,
                        color: colors.dim,
                      }}
                    >
                      {s.tone === "review"
                        ? "Submitted · pending review"
                        : s.tone === "done"
                          ? "Verified and ready"
                          : isKyc
                            ? "PAN & Aadhaar · about 2 min"
                            : "Where your advance is credited"}
                    </span>
                  </span>
                  <span
                    style={{
                      minWidth: 68,
                      height: 36,
                      borderRadius: 14,
                      border: s.tone === "todo" ? "none" : `1px solid ${colors.border}`,
                      background: s.tone === "todo" ? colors.ctaBg : "transparent",
                      color: s.tone === "todo" ? colors.ctaText : colors.faint,
                      display: "grid",
                      placeItems: "center",
                      fontSize: 13,
                      fontWeight: 700,
                    }}
                  >
                    {action}
                  </span>
                </button>
              );
            })}
          </div>

          <div
            style={{
              textAlign: "center",
              color: colors.dim,
              fontSize: 12,
              fontWeight: 600,
              marginBottom: 26,
            }}
          >
            One-time setup · your details are encrypted
          </div>

          <button
            type="button"
            disabled
            style={{
              width: "100%",
              height: 58,
              borderRadius: 18,
              border: `1px solid ${colors.border}`,
              background: colors.panel,
              color: colors.faint,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 11,
              fontSize: 15,
              fontWeight: 650,
              marginBottom: 14,
            }}
          >
            <LockKeyhole size={16} strokeWidth={1.9} />
            Complete setup to request
          </button>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 7,
              color: colors.faint,
              fontSize: 11.5,
              fontWeight: 600,
            }}
          >
            <ShieldCheck size={12} color={colors.faint} strokeWidth={1.9} />
            Advances unlock instantly after verification
          </div>
        </div>
      </div>
    );
  }

  // ── Under review (all submitted, waiting for admin) ──
  if (!eligible && isWaitingForSetupReview) {
    const reviewStage: VerificationStage =
      kycComplete || bankComplete ? "review" : "submitted";

    return (
      <VerificationLifecycleScreen
        stage={reviewStage}
        bankAccount={bankAccount}
        kycDocumentCount={kycDocumentCount}
      />
    );
  }

  if (eligible && kycComplete && bankComplete && !hasActive && step === "ready") {
    return (
      <VerificationLifecycleScreen
        stage="approved"
        bankAccount={bankAccount}
        kycDocumentCount={kycDocumentCount}
        onStartAdvance={() => setStep("calculator")}
      />
    );
  }

  // ── Redesigned calculator (eligible completed user) ──
  const rulerProgress = sliderMax > MIN_AMOUNT
    ? (Math.min(amount, sliderMax) - MIN_AMOUNT) / (sliderMax - MIN_AMOUNT)
    : 0;
  const TOTAL_TICKS = 40;
  const activeTicks = Math.round(rulerProgress * TOTAL_TICKS);

  return (
    <div style={{
      background: colors.bg,
      minHeight: "100%",
      display: "flex",
      flexDirection: "column",
      fontFamily: "'Space Grotesk', sans-serif",
      position: "relative",
    }}>

      {/* Radial glow */}
      <div style={{
        position: "absolute",
        top: -40,
        left: "50%",
        transform: "translateX(-50%)",
        width: 340,
        height: 220,
        background: `radial-gradient(ellipse at center top, ${colors.glow} 0%, transparent 70%)`,
        pointerEvents: "none",
        zIndex: 0,
      }} />

      <div style={{ position: "relative", zIndex: 1, flex: 1, display: "flex", flexDirection: "column" }}>

        {/* ── Stats row ── */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          padding: "20px 22px 18px",
          borderBottom: `1px solid ${colors.border}`,
        }}>
          <div>
            <div style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.22em",
              color: colors.dim,
              textTransform: "uppercase",
              marginBottom: 5,
            }}>Eligible today</div>
            <div style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 15,
              fontWeight: 600,
              color: colors.text,
            }}>
              {formatMoney(MIN_AMOUNT)} – {formatMoney(limit)}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.22em",
              color: colors.dim,
              textTransform: "uppercase",
              marginBottom: 5,
            }}>Salary · Payday</div>
            <div style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 15,
              fontWeight: 600,
              color: colors.text,
            }}>
              {salary > 0 ? formatMoney(salary) : "—"} · {formatPayday(nextPayday)}
            </div>
          </div>
        </div>

        {/* ── YOU'RE TAKING + hero amount ── */}
        <div style={{ padding: "24px 22px 0", textAlign: "center" }}>
          <div style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.32em",
            color: colors.faint,
            textTransform: "uppercase",
            marginBottom: 20,
          }}>
            YOU&rsquo;RE TAKING
          </div>

          {/* Amount with ± buttons */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 28,
            marginBottom: 28,
          }}>
            <button
              type="button"
              onClick={() => onAmountChange(Math.max(MIN_AMOUNT, amount - 500))}
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                border: `1px solid ${colors.border}`,
                background: "transparent",
                color: colors.text,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
                lineHeight: 1,
                flexShrink: 0,
              }}
            >−</button>

            <div style={{
              fontSize: 30,
              fontWeight: 600,
              letterSpacing: "-0.03em",
              color: colors.text,
              minWidth: 120,
            }}>
              {formatMoney(amount)}
            </div>

            <button
              type="button"
              onClick={() => onAmountChange(Math.min(sliderMax, amount + 500))}
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                border: `1px solid ${colors.border}`,
                background: "transparent",
                color: colors.text,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
                lineHeight: 1,
                flexShrink: 0,
              }}
            >+</button>
          </div>

          {/* Ruler gauge */}
          {limit >= MIN_AMOUNT && (
            <div style={{ position: "relative", height: 32, marginBottom: 18, margin: "0 2px 18px" }}>
              {/* Tick row */}
              <div style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}>
                {Array.from({ length: TOTAL_TICKS }, (_, i) => {
                  const isMajor = i % 4 === 0;
                  const isActive = i < activeTicks;
                  return (
                    <div
                      key={i}
                      style={{
                        flex: "1 0 0",
                        height: isMajor ? 14 : 8,
                        background: isActive ? colors.text : colors.panelMuted,
                        borderRadius: 1,
                      }}
                    />
                  );
                })}
              </div>

              {/* Knob */}
              <div style={{
                position: "absolute",
                top: "50%",
                left: `clamp(0px, calc(${rulerProgress * 100}% - 10px), calc(100% - 20px))`,
                transform: "translateY(-50%)",
                width: 20,
                height: 20,
                borderRadius: "50%",
                background: colors.text,
                pointerEvents: "none",
                zIndex: 2,
                boxShadow: "0 0 10px rgba(242,240,234,0.35)",
              }} />

              {/* Invisible range input on top */}
              <input
                type="range"
                min={MIN_AMOUNT}
                max={sliderMax}
                step={500}
                value={Math.min(amount, sliderMax)}
                onChange={(e) => onAmountChange(Number(e.target.value))}
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  opacity: 0,
                  cursor: "pointer",
                  zIndex: 3,
                  margin: 0,
                }}
              />
            </div>
          )}

          {/* Quick-select chips */}
          <div style={{
            display: "flex",
            gap: 8,
            justifyContent: "center",
            marginBottom: 22,
            flexWrap: "nowrap",
          }}>
            {quickAmounts.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => onAmountChange(v)}
                style={{
                  padding: "7px 14px",
                  borderRadius: 13,
                  border: `1px solid ${amount === v ? "transparent" : colors.border}`,
                  background: amount === v ? colors.ctaBg : "transparent",
                  color: amount === v ? colors.ctaText : colors.dim,
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              >
                {formatMoney(v)}
              </button>
            ))}
          </div>
        </div>

        {/* ── Receipt / breakdown card ── */}
        <div style={{ padding: "0 22px", flex: 1 }}>
          <div style={{
            position: "relative",
            background: colors.receiptBg,
            borderRadius: 20,
            padding: "18px 22px 20px",
          }}>
            {preview ? (
              <>
                {/* Header row */}
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 16,
                }}>
                  <span style={{
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: "0.22em",
                    color: colors.receiptMuted,
                    textTransform: "uppercase",
                  }}>BREAKDOWN</span>
                  <span style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 12,
                    color: colors.receiptMuted,
                  }}>
                    {preview.interestDays != null ? `${preview.interestDays} days` : ""}
                    {preview.interestRate ? ` @ ${preview.interestRate}%` : ""}
                  </span>
                </div>

                {/* Credited to bank */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 14, fontWeight: 500, color: colors.receiptInk }}>Credited to bank</span>
                  <span style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 15,
                    fontWeight: 600,
                    color: colors.receiptInk,
                  }}>
                    {formatMoney(preview.youReceive)}
                  </span>
                </div>

                {/* Dashed separator + notches */}
                <div style={{ position: "relative", margin: "14px 0" }}>
                  <div style={{ borderTop: `1px dashed ${colors.receiptDash}` }} />
                  <div style={{
                    position: "absolute", left: -34, top: 0,
                    transform: "translateY(-50%)",
                    width: 22, height: 22, borderRadius: "50%", background: colors.receiptNotch,
                  }} />
                  <div style={{
                    position: "absolute", right: -34, top: 0,
                    transform: "translateY(-50%)",
                    width: 22, height: 22, borderRadius: "50%", background: colors.receiptNotch,
                  }} />
                </div>

                {/* Interest */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 14, fontWeight: 500, color: colors.receiptInk }}>Interest</span>
                  <span style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 15,
                    fontWeight: 600,
                    color: colors.warm,
                  }}>
                    + {formatMoney(preview.interest)}
                  </span>
                </div>

                {/* Dashed separator + notches */}
                <div style={{ position: "relative", margin: "14px 0" }}>
                  <div style={{ borderTop: `1px dashed ${colors.receiptDash}` }} />
                  <div style={{
                    position: "absolute", left: -34, top: 0,
                    transform: "translateY(-50%)",
                    width: 22, height: 22, borderRadius: "50%", background: colors.receiptNotch,
                  }} />
                  <div style={{
                    position: "absolute", right: -34, top: 0,
                    transform: "translateY(-50%)",
                    width: 22, height: 22, borderRadius: "50%", background: colors.receiptNotch,
                  }} />
                </div>

                {/* Total repayment */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                  <div>
                    <div style={{
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: 11,
                      color: colors.receiptMuted,
                      marginBottom: 3,
                    }}>
                      Auto-deducted {formatShortDate(preview.recoveryDate)}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: colors.receiptSubtle }}>
                      Total repayment
                    </div>
                  </div>
                  <span style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 20,
                    fontWeight: 600,
                    color: colors.receiptInk,
                  }}>
                    {formatMoney(preview.total)}
                  </span>
                </div>
              </>
            ) : (
              <div style={{
                textAlign: "center",
                padding: "20px 0",
                color: colors.receiptMuted,
                fontSize: 13,
              }}>
                {previewLoading ? "Calculating…" : "Adjust the amount to see a breakdown"}
              </div>
            )}
          </div>
        </div>

        {/* ── CTA + caption ── */}
        <div style={{ padding: "20px 22px 28px" }}>
          <button
            type="button"
            disabled={!canSubmit}
            onClick={canSubmit ? () => setStep("review") : undefined}
            style={{
              width: "100%",
              height: 60,
              borderRadius: 18,
              background: canSubmit ? colors.ctaBg : colors.disabledBg,
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 8px 0 22px",
              cursor: canSubmit ? "pointer" : "not-allowed",
              boxShadow: canSubmit ? "0 12px 32px -14px rgba(91,60,227,0.36)" : "none",
            }}
          >
            <span style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 15,
              fontWeight: 600,
              color: canSubmit ? colors.ctaText : colors.disabledText,
            }}>
              Request {formatMoney(amount)}
            </span>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              background: canSubmit ? colors.ctaIconBg : colors.panelMuted,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}>
              <ArrowRight size={18} color={canSubmit ? colors.ctaIconText : colors.disabledText} strokeWidth={2} />
            </div>
          </button>

          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            marginTop: 12,
            fontSize: 11.5,
            color: colors.faint,
          }}>
            <ShieldCheck size={12} color={colors.faint} strokeWidth={2} />
            256-bit encrypted · RBI compliant
          </div>
        </div>

      </div>

      {/* ═══════════════════════════════════════════════════════
          BOTTOM SHEET — slides up for Review / Membership / Done
         ═══════════════════════════════════════════════════════ */}
      {(step === "review" || step === "submitted") && (
        <>
          {/* Backdrop */}
          <div
            className="adv-sheet-backdrop"
            style={step === "review" ? {
              position: "fixed",
              inset: 0,
              zIndex: 900,
              background: "rgba(0, 0, 0, 0.72)",
            } : undefined}
            onClick={() => {
              if (step === "submitted") return;
              setStep("calculator");
            }}
          />

          {/* ══ REVIEW + SUBMITTED — shared sheet ══ */}
          {(step === "review" || step === "submitted") && (
            <div
              className={`adv-sheet${step === "submitted" ? " adv-sheet--full" : " adv-sheet--auto"}`}
              style={step === "review" ? {
                position: "fixed",
                top: 128,
                right: "auto",
                bottom: 0,
                left: "50%",
                width: "min(390px, 100vw)",
                height: "auto",
                maxHeight: "none",
                minHeight: "calc(100dvh - 128px)",
                transform: "translateX(-50%)",
                zIndex: 901,
                overflowY: "auto",
                WebkitOverflowScrolling: "touch",
                animation: "none",
                background: colors.panel,
                border: `1px solid ${colors.border}`,
                borderBottom: 0,
                borderRadius: "24px 24px 0 0",
                boxShadow: "0 -22px 60px rgba(0, 0, 0, 0.58)",
                paddingBottom: "max(12px, env(safe-area-inset-bottom))",
                display: "block",
              } : undefined}
            >

              {/* Drag handle — only on review */}
              {step === "review" && (
                <div className="adv-sheet-drag">
                  <div className="adv-sheet-pill" />
                  <button className="adv-sheet-x" onClick={() => setStep("calculator")}>✕</button>
                </div>
              )}

              {/* ── REVIEW ── */}
              {step === "review" && (
                <>
                  <div
                    style={{
                      padding: "4px 22px 0",
                      color: colors.muted,
                      fontSize: 12,
                      fontWeight: 700,
                      letterSpacing: "0.28em",
                      textTransform: "uppercase",
                    }}
                  >
                    Review request
                  </div>
                  <div
                    style={{
                      padding: "8px 22px 14px",
                      color: colors.text,
                      fontSize: 19,
                      lineHeight: 1.05,
                      fontWeight: 650,
                      letterSpacing: "-0.035em",
                    }}
                  >
                    Confirm your advance
                  </div>

                  <div
                    style={{
                      position: "relative",
                      margin: "0 22px 14px",
                      padding: "18px 22px 18px",
                      borderRadius: 20,
                      background: colors.receiptBg,
                      color: colors.receiptInk,
                      overflow: "visible",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 18,
                        color: colors.receiptMuted,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          letterSpacing: "0.28em",
                          textTransform: "uppercase",
                        }}
                      >
                        Breakdown
                      </span>
                      <span
                        style={{
                          fontFamily: "'IBM Plex Mono', monospace",
                          fontSize: 12,
                          letterSpacing: "-0.03em",
                        }}
                      >
                        {preview?.interestDays != null ? `${preview.interestDays} days` : "Payday"}
                        {preview?.interestRate ? ` @ ${preview.interestRate}%` : ""}
                      </span>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 15, fontWeight: 550 }}>Credited to bank</span>
                      <strong
                        style={{
                          fontFamily: "'IBM Plex Mono', monospace",
                          fontSize: 16,
                          fontWeight: 650,
                          letterSpacing: "-0.04em",
                        }}
                      >
                        {preview ? formatMoney(preview.youReceive) : formatMoney(amount)}
                      </strong>
                    </div>

                    <div style={{ position: "relative", margin: "13px 0" }}>
                      <div style={{ borderTop: `1px dashed ${colors.receiptDash}` }} />
                      {["left", "right"].map((side) => (
                        <span
                          key={`credit-${side}`}
                          style={{
                            position: "absolute",
                            top: 0,
                            [side]: -34,
                            transform: "translateY(-50%)",
                            width: 22,
                            height: 22,
                            borderRadius: 999,
                            background: colors.panel,
                          }}
                        />
                      ))}
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 15, fontWeight: 550 }}>Interest</span>
                      <strong
                        style={{
                          fontFamily: "'IBM Plex Mono', monospace",
                          fontSize: 16,
                          fontWeight: 650,
                          letterSpacing: "-0.04em",
                          color: colors.warm,
                        }}
                      >
                        + {preview ? formatMoney(preview.interest) : "—"}
                      </strong>
                    </div>

                    <div style={{ position: "relative", margin: "13px 0" }}>
                      <div style={{ borderTop: `1px dashed ${colors.receiptDash}` }} />
                      {["left", "right"].map((side) => (
                        <span
                          key={`interest-${side}`}
                          style={{
                            position: "absolute",
                            top: 0,
                            [side]: -34,
                            transform: "translateY(-50%)",
                            width: 22,
                            height: 22,
                            borderRadius: 999,
                            background: colors.panel,
                          }}
                        />
                      ))}
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16 }}>
                      <span style={{ display: "grid", gap: 4 }}>
                        <small
                          style={{
                            color: colors.receiptMuted,
                            fontFamily: "'IBM Plex Mono', monospace",
                            fontSize: 12,
                            fontWeight: 500,
                            letterSpacing: "-0.03em",
                          }}
                        >
                          Auto-deducted {preview ? formatShortDate(preview.recoveryDate) : "on payday"}
                        </small>
                        <span style={{ color: colors.receiptSubtle, fontSize: 15, fontWeight: 650 }}>
                          Total repayment
                        </span>
                      </span>
                      <strong
                        style={{
                          color: colors.receiptInk,
                          fontFamily: "'IBM Plex Mono', monospace",
                          fontSize: 22,
                          fontWeight: 650,
                          letterSpacing: "-0.05em",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {preview ? formatMoney(preview.total) : formatMoney(amount)}
                      </strong>
                    </div>
                  </div>

                  <div
                    style={{
                      margin: "0 22px 15px",
                      border: `1px solid ${colors.border}`,
                      borderRadius: 18,
                      overflow: "hidden",
                      background: colors.panelSoft,
                    }}
                  >
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "42px 1fr auto",
                        alignItems: "center",
                        gap: 12,
                        padding: "14px 16px",
                        minHeight: 86,
                        borderBottom: `1px solid ${colors.border}`,
                        color: colors.text,
                      }}
                    >
                      <span
                        style={{
                          width: 36,
                          height: 36,
                          border: `1px solid ${colors.border}`,
                          borderRadius: 12,
                          display: "grid",
                          placeItems: "center",
                        }}
                      >
                        <Landmark size={16} />
                      </span>
                      <span style={{ minWidth: 0, fontSize: 15, lineHeight: 1.25, fontWeight: 650 }}>
                        <small
                          style={{
                            display: "block",
                            marginBottom: 4,
                            color: colors.muted,
                            fontSize: 11,
                            fontWeight: 700,
                            letterSpacing: "0.18em",
                            textTransform: "uppercase",
                          }}
                        >
                          Deposit to
                        </small>
                        {maskedBankAccount}
                      </span>
                      <button
                        type="button"
                        onClick={() => onNavigate?.("profile-bank")}
                        style={{
                          background: "transparent",
                          border: `1px solid ${colors.border}`,
                          borderRadius: 8,
                          color: colors.muted,
                          fontSize: 12,
                          fontWeight: 700,
                          padding: "5px 10px",
                          cursor: "pointer",
                          fontFamily: "'Space Grotesk', sans-serif",
                        }}
                      >
                        Change
                      </button>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "42px 1fr auto",
                        alignItems: "center",
                        gap: 12,
                        padding: "14px 16px",
                        minHeight: 86,
                        color: colors.text,
                      }}
                    >
                      <span
                        style={{
                          width: 36,
                          height: 36,
                          border: `1px solid ${colors.border}`,
                          borderRadius: 12,
                          display: "grid",
                          placeItems: "center",
                        }}
                      >
                        <CalendarDays size={16} />
                      </span>
                      <span style={{ minWidth: 0, fontSize: 15, lineHeight: 1.28, fontWeight: 650 }}>
                        <small
                          style={{
                            display: "block",
                            marginBottom: 4,
                            color: colors.muted,
                            fontSize: 11,
                            fontWeight: 700,
                            letterSpacing: "0.18em",
                            textTransform: "uppercase",
                          }}
                        >
                          Repayment
                        </small>
                        Auto-debit (from salary)
                        {preview?.recoveryDate ? ` · ${formatReadableDate(preview.recoveryDate)}` : ""}
                      </span>
                      <span style={{ color: colors.dim, fontSize: 12, fontWeight: 700, whiteSpace: "nowrap" }}>
                        1 payment
                      </span>
                    </div>
                  </div>

                  <label
                    style={{
                      margin: "0 22px 18px",
                      display: "grid",
                      gridTemplateColumns: "22px 1fr",
                      gap: 12,
                      color: colors.dim,
                      fontSize: 13,
                      fontWeight: 600,
                      lineHeight: 1.55,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={agree1}
                      onChange={(e) => setAgree1(e.target.checked)}
                      style={{
                        width: 20,
                        height: 20,
                        marginTop: 1,
                        accentColor: colors.ctaBg,
                      }}
                    />
                    <span>
                      I authorise a one-time salary auto-debit of{" "}
                      <strong style={{ color: colors.text }}>
                        {preview ? formatMoney(preview.total) : formatMoney(amount)}
                      </strong>{" "}
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
                          fontWeight: "inherit",
                          fontFamily: "inherit",
                          cursor: "pointer",
                        }}
                      >
                        advance terms
                      </button>.
                    </span>
                  </label>

                  <div style={{ padding: "0 22px 24px" }}>
                    <button
                      type="button"
                      disabled={!canConfirm}
                      onClick={async () => {
                        await onSubmit();
                        setStep("submitted");
                      }}
                      style={{
                        width: "100%",
                        height: 60,
                        borderRadius: 18,
                        background: colors.ctaBg,
                        color: colors.ctaText,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "0 10px 0 24px",
                        fontSize: 16,
                        fontWeight: 700,
                        opacity: canConfirm ? 1 : 0.45,
                        cursor: canConfirm ? "pointer" : "not-allowed",
                      }}
                    >
                      <span>{submitting ? "Confirming..." : `Confirm & get ${formatMoney(amount)}`}</span>
                      {!submitting && (
                        <span
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: 14,
                            background: colors.ctaIconBg,
                            color: colors.ctaIconText,
                            display: "grid",
                            placeItems: "center",
                          }}
                        >
                          <ArrowRight size={18} />
                        </span>
                      )}
                    </button>
                    <div
                      style={{
                        height: 42,
                        marginTop: 12,
                        marginBottom: 2,
                        borderRadius: 14,
                        border: `1px solid ${colors.border}`,
                        background: colors.panelSoft,
                        color: colors.dim,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        fontSize: 12,
                        fontWeight: 650,
                      }}
                    >
                      <ShieldCheck size={13} color={colors.text} /> Employer-verified · repaid from salary
                    </div>
                  </div>
                </>
              )}

              {/* ── SUBMITTED (full-height celebration) ── */}
              {step === "submitted" && (
                <>
                  <div className="adv-submitted-body">
                    <div className="adv-submitted-check-wrap">
                      <div className="adv-submitted-ripple" />
                      <div className="adv-submitted-ripple adv-submitted-ripple--2" />
                      <div className="adv-submitted-check-circle">
                        <CheckCircle size={36} strokeWidth={2} />
                      </div>
                    </div>
                    <div className="adv-submitted-title">Request Submitted!</div>
                    <div className="adv-submitted-sub">
                      We've notified your employer. You'll get an update as soon as they approve.
                    </div>
                    <div className="adv-submitted-slip">
                      <div className="adv-submitted-slip-top">
                        <span className="adv-submitted-slip-lbl">Amount requested</span>
                        <span className="adv-submitted-slip-amt">{formatMoney(amount)}</span>
                      </div>
                      {preview && (
                        <div className="adv-submitted-slip-cols">
                          <div className="adv-submitted-slip-col">
                            <div className="adv-submitted-slip-col-lbl">You receive</div>
                            <div className="adv-submitted-slip-col-val green">{formatMoney(preview.youReceive)}</div>
                          </div>
                          <div className="adv-submitted-slip-divider" />
                          <div className="adv-submitted-slip-col">
                            <div className="adv-submitted-slip-col-lbl">Interest</div>
                            <div className="adv-submitted-slip-col-val">{formatMoney(preview.interest)}</div>
                          </div>
                          <div className="adv-submitted-slip-divider" />
                          <div className="adv-submitted-slip-col">
                            <div className="adv-submitted-slip-col-lbl">Repay on</div>
                            <div className="adv-submitted-slip-col-val">{formatShortDate(preview.recoveryDate)}</div>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="adv-submitted-timeline">
                      <div className="adv-submitted-timeline-title">What happens next</div>
                      {[
                        { icon: <Clock size={14} />, label: "Employer review", sub: "They'll approve or ask questions" },
                        { icon: <BadgeCheck size={14} />, label: "Admin approval", sub: "MobPae team gives final green light" },
                        { icon: <CreditCard size={14} />, label: "Funds credited", sub: "Directly to your linked bank account" },
                        { icon: <CalendarDays size={14} />, label: "Auto-deducted", sub: preview ? `On ${formatShortDate(preview.recoveryDate)} from your salary` : "On your next payday" },
                      ].map((item, i, arr) => (
                        <div key={item.label} className="adv-submitted-tl-row">
                          <div className="adv-submitted-tl-left">
                            <div className="adv-submitted-tl-dot">{item.icon}</div>
                            {i < arr.length - 1 && <div className="adv-submitted-tl-line" />}
                          </div>
                          <div className="adv-submitted-tl-body">
                            <div className="adv-submitted-tl-label">{item.label}</div>
                            <div className="adv-submitted-tl-sub">{item.sub}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="adv-sticky-btn">
                    <button
                      type="button"
                      className="mp-btn-primary"
                      onClick={() => { setStep("calculator"); onNavigate?.("activity"); }}
                    >
                      Track in Activity <ArrowRight size={16} />
                    </button>
                    <div className="adv-secure-note">
                      <ShieldCheck size={12} /> We'll notify you at every step
                    </div>
                  </div>
                </>
              )}

            </div>
          )}
        </>
      )}
    </div>
  );
}
