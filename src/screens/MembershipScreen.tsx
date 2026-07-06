import { useEffect, useRef, useState, useMemo, type CSSProperties } from "react";
import {
  ArrowRight,
  Bell,
  Check,
  ChevronLeft,
  Clock3,
  Copy,
  Crown,
  FileImage,
  RefreshCw,
  Upload,
  X,
} from "lucide-react";
import type { AppState, CouponValidation, MembershipPlan, View } from "../types/app";
import { getFileUrl } from "../services/api";
import type { Theme } from "../hooks/useTheme";

type Props = {
  appState: AppState;
  activatingMembership: boolean;
  couponValidation: CouponValidation | null;
  couponError: string;
  validatingCoupon: boolean;
  onActivateMembership: (
    paymentScreenshot?: File,
    paymentReference?: string,
    planType?: "MONTHLY" | "BIANNUAL"
  ) => Promise<void>;
  onValidateCoupon: (code: string) => Promise<void>;
  onClearCoupon: () => void;
  onNavigate: (view: View) => void;
  onRefresh?: () => void;
  refreshing?: boolean;
  showHeader?: boolean;
  theme?: Theme;
};

type MembershipStep = "plan" | "scan" | "proof" | "submitted" | "pending" | "active";

const FALLBACK_QR = "uploads/payment/googlepay-membership-qr.png";

// ── Design tokens ────────────────────────────────────────────────────────────
const BG        = "var(--mem-bg, #0C0C0E)";
const TEXT      = "var(--mem-text, #F2F0EA)";
const MUTED     = "var(--mem-muted, #7C7C85)";
const MUTED_DIM = "var(--mem-dim, #5C5C64)";
const BORDER    = "var(--mem-border, #26262B)";
const DIM_BG    = "var(--mem-panel, #2A2A30)";
const WARN      = "var(--mem-warm, #B4591F)";
const PAPER_BG  = "var(--mem-paper, #F4F1E8)";
const PAPER_INK = "var(--mem-paper-ink, #17150F)";
const PAPER_MUT = "var(--mem-paper-muted, #8A8676)";
const PAPER_DAS = "var(--mem-paper-dash, #D8D3C2)";
const ICON_BOX  = "var(--mem-icon-box, #17150F)";
const GREEN     = "var(--mem-green, #5AB370)";
const GREEN_BG  = "var(--mem-green-bg, rgba(90,179,112,0.10))";
const CTA_BG    = "var(--mem-cta-bg, #F4F1E8)";
const CTA_LABEL = "var(--mem-cta-label, #17150F)";
const CTA_ICON_BG = "var(--mem-cta-icon-bg, #17150F)";
const CTA_ARROW = "var(--mem-cta-arrow, #F4F1E8)";
const CTA_SHADOW= "var(--mem-cta-shadow, 0 4px 20px rgba(242,240,234,0.12))";
const DIS_ICON  = "var(--mem-dis-icon, #3A3A40)";
const SEL_BG    = "var(--mem-sel-bg, rgba(242,240,234,0.04))";
const RADIO_DOT = "var(--mem-radio-dot, #17150F)";
const MONO      = "'IBM Plex Mono', monospace";
const SANS      = "'Space Grotesk', sans-serif";

// ── Helpers ──────────────────────────────────────────────────────────────────
function fmt(value: number | undefined | null, dec = 0) {
  return Number(value ?? 0).toLocaleString("en-IN", {
    style: "currency", currency: "INR",
    maximumFractionDigits: dec, minimumFractionDigits: dec,
  });
}
function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
function fmtSize(file: File) {
  const mb = file.size / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.max(1, Math.round(file.size / 1024))} KB`;
}
function timeAgo(iso?: string): string {
  if (!iso) return "—";
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return "Just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}
function mbRef(id?: string) {
  return id ? `#MBR-${id.slice(-4).toUpperCase()}` : "—";
}
function normStatus(s?: string) {
  return (s || "").trim().toUpperCase();
}

const DEFAULT_PLANS: MembershipPlan[] = [
  {
    planType: "BIANNUAL",
    planName: "6 Months",
    amount: 499,
    validityDays: 180,
    billingLabel: "Billed every 6 months",
    perMonthLabel: "= ₹83 / month",
    preferred: true,
    savingsVsMonthly: 551,
    savingsPercent: 52,
  },
  {
    planType: "MONTHLY",
    planName: "Monthly",
    amount: 175,
    validityDays: 30,
    billingLabel: "Billed every month",
    perMonthLabel: null,
    preferred: false,
    savingsVsMonthly: null,
    savingsPercent: null,
  },
];

function membershipVars(theme: Theme): CSSProperties {
  if (theme === "light") {
    return {
      "--mem-bg": "#FFFFFF",
      "--mem-text": "#17151F",
      "--mem-muted": "#6B6878",
      "--mem-dim": "#9A97A8",
      "--mem-border": "#E9E6F1",
      "--mem-panel": "#F7F5FC",
      "--mem-warm": "#B4591F",
      "--mem-paper": "#F1EDFC",
      "--mem-paper-ink": "#1E1636",
      "--mem-paper-muted": "#6E6786",
      "--mem-paper-dash": "#DCD5F2",
      "--mem-icon-box": "#5B3CE3",
      "--mem-green": "#1F9E67",
      "--mem-green-bg": "rgba(31,158,103,0.10)",
      // CTA-specific tokens
      "--mem-cta-bg":     "#5B3CE3",
      "--mem-cta-label":  "#FFFFFF",
      "--mem-cta-icon-bg":"#FFFFFF",
      "--mem-cta-arrow":  "#5B3CE3",
      "--mem-cta-shadow": "0 18px 42px rgba(91,60,227,0.24)",
      "--mem-dis-icon":   "#C4BBE8",
      "--mem-sel-bg":     "rgba(91,60,227,0.06)",
      "--mem-radio-dot":  "#FFFFFF",
    } as CSSProperties;
  }

  return {
    "--mem-bg": "#0C0C0E",
    "--mem-text": "#F2F0EA",
    "--mem-muted": "#7C7C85",
    "--mem-dim": "#5C5C64",
    "--mem-border": "#26262B",
    "--mem-panel": "#2A2A30",
    "--mem-warm": "#B4591F",
    "--mem-paper": "#F4F1E8",
    "--mem-paper-ink": "#17150F",
    "--mem-paper-muted": "#8A8676",
    "--mem-paper-dash": "#D8D3C2",
    "--mem-icon-box": "#17150F",
    "--mem-green": "#5AB370",
    "--mem-green-bg": "rgba(90,179,112,0.10)",
    // CTA-specific tokens
    "--mem-cta-bg":     "#F4F1E8",
    "--mem-cta-label":  "#17150F",
    "--mem-cta-icon-bg":"#17150F",
    "--mem-cta-arrow":  "#F4F1E8",
    "--mem-cta-shadow": "0 4px 20px rgba(242,240,234,0.12)",
    "--mem-dis-icon":   "#3A3A40",
    "--mem-sel-bg":     "rgba(242,240,234,0.04)",
    "--mem-radio-dot":  "#17150F",
  } as CSSProperties;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Header({
  title,
  onBack,
  onNotifications,
  onRefresh,
  refreshing,
}: {
  title: string;
  onBack: () => void;
  onNotifications: () => void;
  onRefresh?: () => void;
  refreshing?: boolean;
}) {
  const btn = {
    width: 40, height: 40, borderRadius: "50%", border: `1px solid ${BORDER}`,
    background: "transparent", display: "flex", alignItems: "center",
    justifyContent: "center", flexShrink: 0, cursor: "pointer",
  } as const;
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "max(16px, env(safe-area-inset-top, 0px)) 22px 0" }}>
      <button type="button" onClick={onBack} aria-label="Back" style={{ ...btn, color: TEXT }}>
        <ChevronLeft size={20} strokeWidth={2} />
      </button>
      <span style={{ fontFamily: SANS, fontSize: 12, fontWeight: 600, letterSpacing: "0.32em", color: MUTED, textTransform: "uppercase" }}>
        {title}
      </span>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
        <button type="button" onClick={onNotifications} aria-label="Notifications" style={{ ...btn, color: TEXT }}>
          <Bell size={18} strokeWidth={2.05} />
        </button>
        <button type="button" onClick={onRefresh} disabled={!onRefresh || refreshing} aria-label="Refresh"
          style={{ ...btn, color: TEXT, opacity: refreshing ? 0.55 : 1, cursor: onRefresh ? "pointer" : "default" }}>
          <RefreshCw size={18} strokeWidth={2.05} className={refreshing ? "spin" : ""} />
        </button>
      </div>
    </div>
  );
}

function Cta({ label, onClick, disabled, loading }: {
  label: string; onClick: () => void; disabled?: boolean; loading?: boolean;
}) {
  const on = !disabled && !loading;
  return (
    <div style={{ padding: "12px 22px 28px" }}>
      <button type="button" onClick={onClick} disabled={!on} style={{
        width: "100%", height: 60, background: on ? CTA_BG : DIM_BG, border: "none", borderRadius: 18,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 8px 0 22px", cursor: on ? "pointer" : "not-allowed",
        boxShadow: on ? CTA_SHADOW : "none",
      }}>
        <span style={{ fontFamily: SANS, fontSize: 15, fontWeight: 600, color: on ? CTA_LABEL : MUTED }}>
          {loading ? "Please wait…" : label}
        </span>
        <span style={{
          width: 44, height: 44, borderRadius: 14, background: on ? CTA_ICON_BG : DIS_ICON,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          {loading
            ? <span className="spin" style={{ width: 18, height: 18, border: `2px solid ${MUTED}`, borderTopColor: "transparent", borderRadius: "50%", display: "block" }} />
            : <ArrowRight size={20} strokeWidth={2.4} color={on ? CTA_ARROW : MUTED} />}
        </span>
      </button>
    </div>
  );
}

function Orb({ children, warn }: { children: React.ReactNode; warn?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
      <div style={{
        width: 64, height: 64, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
        background: warn ? "rgba(180,89,31,0.10)" : "rgba(242,240,234,0.06)",
        border: `1px solid ${warn ? "rgba(180,89,31,0.3)" : BORDER}`,
      }}>
        {children}
      </div>
    </div>
  );
}

function ReceiptCard({ rows }: {
  rows: Array<{ label: string; value: React.ReactNode; mono?: boolean; warn?: boolean; green?: boolean }>;
}) {
  return (
    <div style={{ background: PAPER_BG, borderRadius: 20, overflow: "visible", margin: "0 22px", position: "relative" }}>
      {rows.map((row, i) => (
        <div key={row.label}>
          {i > 0 && (
            <div style={{ position: "relative", height: 0, overflow: "visible", margin: "0 20px" }}>
              <div style={{ borderTop: `1px dashed ${PAPER_DAS}` }} />
              <div style={{ position: "absolute", left: -34, top: -11, width: 22, height: 22, borderRadius: "50%", background: BG }} />
              <div style={{ position: "absolute", right: -34, top: -11, width: 22, height: 22, borderRadius: "50%", background: BG }} />
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px" }}>
            <span style={{ fontFamily: SANS, fontSize: 13, color: PAPER_MUT }}>{row.label}</span>
            <span style={{
              fontFamily: row.mono ? MONO : SANS, fontSize: row.mono ? 13 : 13,
              fontWeight: 600,
              color: row.warn ? WARN : row.green ? GREEN : PAPER_INK,
            }}>
              {row.value}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function MembershipScreen({
  appState, activatingMembership, onActivateMembership, onNavigate, onRefresh, refreshing,
  theme = "dark",
}: Props) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { membershipActive, membershipConfig } = appState;

  const status     = normStatus(membershipConfig.status);
  const isPending  = status === "PENDING" || status === "UNDER_REVIEW" || status === "PAYMENT_PENDING";
  const isRejected = status === "REJECTED";
  const needsProofUpdate = isRejected || (isPending && Boolean(membershipConfig.remarks?.trim()));

  const plans: MembershipPlan[] = useMemo(() => {
    const cfg = membershipConfig.plans;
    if (cfg && cfg.length >= 2) return [...cfg].sort((a, b) => (b.preferred ? 1 : 0) - (a.preferred ? 1 : 0));
    return DEFAULT_PLANS;
  }, [membershipConfig.plans]);

  const benefits = useMemo(() => {
    const cfg = membershipConfig.membershipBenefits?.filter(Boolean) ?? [];
    return (cfg.length ? cfg : [
      "Advances up to 50% of salary, instantly",
      "Zero processing fees on every advance",
      "Auto-recovery on payday — no EMIs",
      "Priority chat support",
    ]).slice(0, 4);
  }, [membershipConfig.membershipBenefits]);

  const [selectedPlanType, setSelectedPlanType] = useState<"MONTHLY" | "BIANNUAL">(() => {
    return (membershipConfig.planType as "MONTHLY" | "BIANNUAL") || "BIANNUAL";
  });

  const selectedPlan = plans.find(p => p.planType === selectedPlanType) ?? plans[0];
  const selectedAmount = selectedPlan?.amount ?? 499;

  // Amount for pending/active state (what was actually submitted)
  const existingAmount = membershipConfig.amountPayable || membershipConfig.fee || 499;

  const qrUrl = getFileUrl(membershipConfig.payment?.qrUrl || FALLBACK_QR);
  const upiId = membershipConfig.payment?.upiId || "";
  const membershipId = membershipConfig.membershipId;

  const [step, setStep] = useState<MembershipStep>(() => {
    if (membershipActive) return "active";
    if (isPending || isRejected) return "pending";
    return "plan";
  });
  const [selectedProof, setSelectedProof] = useState<File | null>(null);
  const [paymentReference, setPaymentReference] = useState(membershipConfig.paymentReference?.trim() || "");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (membershipActive && step !== "scan" && step !== "proof" && step !== "submitted") {
      setStep("active");
      return;
    }
    if ((isPending || isRejected) && step !== "submitted") setStep("pending");
  }, [isPending, isRejected, membershipActive, step]);

  useEffect(() => {
    rootRef.current?.closest<HTMLElement>(".screen-body")?.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [step]);

  const goBack = () => {
    if (step === "proof") { setStep("scan"); return; }
    if (step === "scan")  { setStep("plan"); return; }
    onNavigate("profile");
  };

  const submitProof = async () => {
    setError("");
    if (!selectedProof) { setError("Upload the payment screenshot to continue."); return; }
    try {
      await onActivateMembership(selectedProof, paymentReference, selectedPlanType);
      setStep("submitted");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to submit payment proof.");
    }
  };

  const copyUpi = () => {
    if (!upiId || !navigator.clipboard) return;
    void navigator.clipboard.writeText(upiId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const screen = {
    minHeight: "100%",
    flex: 1,
    background: BG,
    fontFamily: SANS,
    color: TEXT,
    display: "flex",
    flexDirection: "column" as const,
  };
  const themedScreen = { ...screen, ...membershipVars(theme) };
  const scroll = { flex: 1, overflowY: "visible" as const, padding: "0 0 8px" };

  const eyebrow = {
    fontFamily: SANS, fontSize: 11, fontWeight: 600,
    letterSpacing: "0.32em", color: MUTED_DIM, textTransform: "uppercase" as const,
    marginBottom: 12,
  };

  // ── ACTIVE ──────────────────────────────────────────────────────────────────
  if (step === "active") {
    const total = Math.max(1, membershipConfig.membershipValidityDays || 180);
    const days = typeof membershipConfig.daysRemaining === "number"
      ? Math.max(0, membershipConfig.daysRemaining)
      : membershipConfig.validTill
        ? Math.max(0, Math.ceil((new Date(membershipConfig.validTill).getTime() - Date.now()) / 86_400_000))
        : total;
    const usedPct = Math.min(100, Math.max(3, ((total - days) / total) * 100));

    return (
      <div ref={rootRef} style={themedScreen}>
        <Header title="Membership" onBack={() => onNavigate("profile")}
          onNotifications={() => onNavigate("notifications")}
          onRefresh={onRefresh}
          refreshing={refreshing} />
        <div style={scroll}>
          <div style={{ padding: "32px 22px 0" }}>
            <Orb>
              <Crown size={26} strokeWidth={1.8} color={TEXT} />
            </Orb>

            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 10 }}>
                <span style={{ fontFamily: SANS, fontSize: 16, fontWeight: 600 }}>
                  {membershipConfig.planName || "Advance Membership"}
                </span>
                <span style={{
                  fontFamily: SANS, fontSize: 9, fontWeight: 700, letterSpacing: "0.12em",
                  padding: "2px 8px", borderRadius: 20, background: "rgba(90,179,112,0.12)",
                  color: GREEN, textTransform: "uppercase",
                }}>
                  Active
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "center", alignItems: "stretch", gap: 20 }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontFamily: SANS, fontSize: 11, color: MUTED, marginBottom: 4 }}>Activated</div>
                  <div style={{ fontFamily: MONO, fontSize: 13, fontWeight: 500 }}>{fmtDate(membershipConfig.memberSince)}</div>
                </div>
                <div style={{ width: 1, background: BORDER }} />
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontFamily: SANS, fontSize: 11, color: MUTED, marginBottom: 4 }}>Renews on</div>
                  <div style={{ fontFamily: MONO, fontSize: 13, fontWeight: 500 }}>{fmtDate(membershipConfig.validTill)}</div>
                </div>
              </div>
            </div>

            {/* Days bar */}
            <div style={{ background: DIM_BG, borderRadius: 12, padding: "14px 16px", marginBottom: 28 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ fontFamily: SANS, fontSize: 12, color: MUTED }}>Days remaining</span>
                <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 600 }}>{days} days</span>
              </div>
              <div style={{ height: 4, background: "#3A3A40", borderRadius: 4, overflow: "hidden" }}>
                <div style={{ width: `${100 - usedPct}%`, height: "100%", background: TEXT, borderRadius: 4 }} />
              </div>
            </div>

            {/* Benefits */}
            <div style={eyebrow}>YOUR BENEFITS</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {benefits.map(b => (
                <div key={b} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: "50%", flexShrink: 0, marginTop: 1,
                    background: "rgba(90,179,112,0.08)", border: `1px solid rgba(90,179,112,0.2)`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Check size={12} strokeWidth={2.5} color={GREEN} />
                  </div>
                  <span style={{ fontFamily: SANS, fontSize: 14, lineHeight: 1.55 }}>{b}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── PENDING ─────────────────────────────────────────────────────────────────
  if (step === "pending") {
    return (
      <div ref={rootRef} style={themedScreen}>
        <Header title="Membership" onBack={() => onNavigate("profile")}
          onNotifications={() => onNavigate("notifications")}
          onRefresh={onRefresh}
          refreshing={refreshing} />
        <div style={scroll}>
          <div style={{ padding: "32px 22px 0" }}>
            <Orb warn>
              <Clock3 size={26} strokeWidth={1.8} color={WARN} />
            </Orb>
            <h1 style={{ fontFamily: SANS, fontSize: 20, fontWeight: 600, textAlign: "center", margin: "0 0 10px" }}>
              {needsProofUpdate ? "Payment proof needs update" : "Activation already in review"}
            </h1>
            <p style={{ fontFamily: SANS, fontSize: 14, color: MUTED, textAlign: "center", lineHeight: 1.65, margin: "0 0 28px" }}>
              {needsProofUpdate
                ? (membershipConfig.remarks || "Upload a clearer payment screenshot and submit it again.")
                : <>
                    You've already submitted your payment for{" "}
                    <span style={{ fontFamily: MONO, color: TEXT }}>{fmt(existingAmount, 2)}</span>
                    . We'll notify you once it's active.
                  </>}
            </p>
          </div>

          <ReceiptCard rows={[
            { label: "Reference",  value: mbRef(membershipId), mono: true },
            { label: "Submitted",  value: timeAgo(membershipConfig.submittedAt), mono: true },
            { label: "Status",     value: "● Pending review", warn: true },
          ]} />

          <div style={{ padding: "20px 22px 0" }}>
            <button type="button" onClick={() => setStep("proof")} style={{
              width: "100%", height: 50, background: "transparent",
              border: `1px solid ${BORDER}`, borderRadius: 14, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              fontFamily: SANS, fontSize: 14, fontWeight: 600, color: TEXT,
            }}>
              <Upload size={16} strokeWidth={2} /> Upload new proof
            </button>
            <p style={{ fontFamily: SANS, fontSize: 12, color: MUTED_DIM, textAlign: "center", margin: "8px 0 0", lineHeight: 1.5 }}>
              Only if your earlier payment or screenshot was incorrect
            </p>
          </div>
        </div>
        <Cta label="Back to Home" onClick={() => onNavigate("home")} />
      </div>
    );
  }

  // ── SUBMITTED ────────────────────────────────────────────────────────────────
  if (step === "submitted") {
    return (
      <div ref={rootRef} style={themedScreen}>
        <Header title="Submitted" onBack={() => onNavigate("home")}
          onNotifications={() => onNavigate("notifications")}
          onRefresh={onRefresh}
          refreshing={refreshing} />
        <div style={scroll}>
          <div style={{ padding: "32px 22px 0" }}>
            {/* Check circle */}
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
              <div style={{
                width: 72, height: 72, borderRadius: "50%",
                border: `2px solid ${TEXT}`, background: "rgba(242,240,234,0.06)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Check size={30} strokeWidth={2} color={TEXT} />
              </div>
            </div>

            <h1 style={{ fontFamily: SANS, fontSize: 20, fontWeight: 600, textAlign: "center", margin: "0 0 10px" }}>
              Submitted for review
            </h1>
            <p style={{ fontFamily: SANS, fontSize: 14, color: MUTED, textAlign: "center", lineHeight: 1.65, margin: "0 0 28px" }}>
              We're verifying your payment for{" "}
              <span style={{ fontFamily: MONO, color: TEXT }}>{fmt(selectedAmount, 2)}</span>
              . Your membership activates after admin approval.
            </p>
          </div>

          <ReceiptCard rows={[
            { label: "Reference", value: mbRef(membershipId), mono: true },
            { label: "Amount",    value: fmt(selectedAmount, 2), mono: true },
            { label: "Status",    value: "● Pending review", warn: true },
          ]} />
        </div>
        <Cta label="Back to Home" onClick={() => onNavigate("home")} />
      </div>
    );
  }

  // ── PROOF ────────────────────────────────────────────────────────────────────
  if (step === "proof") {
    return (
      <div ref={rootRef} style={themedScreen}>
        <Header title="Payment Proof" onBack={goBack}
          onNotifications={() => onNavigate("notifications")}
          onRefresh={onRefresh}
          refreshing={refreshing} />
        <div style={scroll}>
          <div style={{ padding: "24px 22px 0" }}>
            <p style={{ fontFamily: SANS, fontSize: 14, color: MUTED, lineHeight: 1.65, margin: "0 0 24px" }}>
              Upload the payment screenshot and enter the UPI reference number so admin can verify your payment.
            </p>

            <div style={eyebrow}>PAYMENT SCREENSHOT</div>
            <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp"
              style={{ display: "none" }}
              onChange={e => {
                const f = e.target.files?.[0];
                if (f) { setSelectedProof(f); setError(""); }
              }} />

            {!selectedProof ? (
              <button type="button" onClick={() => fileInputRef.current?.click()} style={{
                width: "100%", padding: "28px 0", background: "transparent",
                border: `1px dashed ${BORDER}`, borderRadius: 16, cursor: "pointer",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 8, marginBottom: 20,
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: "50%", border: `1px solid ${BORDER}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Upload size={17} strokeWidth={1.9} color={MUTED} />
                </div>
                <span style={{ fontFamily: SANS, fontSize: 14, fontWeight: 600 }}>Tap to upload</span>
                <span style={{ fontFamily: SANS, fontSize: 12, color: MUTED }}>PNG or JPG · up to 5 MB</span>
              </button>
            ) : (
              <div style={{
                display: "flex", alignItems: "center", gap: 12, background: DIM_BG,
                borderRadius: 12, padding: "12px 14px", marginBottom: 20,
              }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: "#3A3A40", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <FileImage size={17} strokeWidth={1.8} color={MUTED} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: SANS, fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {selectedProof.name}
                  </div>
                  <div style={{ fontFamily: SANS, fontSize: 12, color: MUTED }}>{fmtSize(selectedProof)} · ready to upload</div>
                </div>
                <button type="button" onClick={() => setSelectedProof(null)} aria-label="Remove"
                  style={{ background: "transparent", border: "none", cursor: "pointer", color: MUTED, padding: 4 }}>
                  <X size={18} strokeWidth={2} />
                </button>
              </div>
            )}

            <div style={eyebrow}>UPI REFERENCE / UTR</div>
            <input value={paymentReference} onChange={e => setPaymentReference(e.target.value)}
              placeholder="4029 5567 2210" inputMode="text"
              style={{
                width: "100%", height: 50, background: DIM_BG, border: `1px solid ${BORDER}`,
                borderRadius: 12, padding: "0 14px", fontFamily: MONO, fontSize: 15, fontWeight: 500,
                color: TEXT, outline: "none", boxSizing: "border-box",
              }} />
            <div style={{ fontFamily: SANS, fontSize: 12, color: MUTED_DIM, marginTop: 8, marginBottom: 20 }}>
              12-digit reference from your UPI app receipt
            </div>

            {error && (
              <div style={{
                fontFamily: SANS, fontSize: 13, color: "#E55A4E", padding: "10px 14px",
                background: "rgba(229,90,78,0.08)", borderRadius: 8, marginBottom: 12,
              }}>
                {error}
              </div>
            )}
          </div>
        </div>
        <Cta label="Submit for review" onClick={submitProof} disabled={!selectedProof} loading={activatingMembership} />
      </div>
    );
  }

  // ── SCAN & PAY ───────────────────────────────────────────────────────────────
  if (step === "scan") {
    return (
      <div ref={rootRef} style={themedScreen}>
        <Header title="Scan & Pay" onBack={goBack}
          onNotifications={() => onNavigate("notifications")}
          onRefresh={onRefresh}
          refreshing={refreshing} />
        <div style={scroll}>
          <div style={{ padding: "28px 22px 0" }}>
            <div style={eyebrow}>AMOUNT PAYABLE</div>
            <div style={{ fontFamily: MONO, fontSize: 36, fontWeight: 600, letterSpacing: "-0.02em", marginBottom: 28 }}>
              {fmt(selectedAmount, 2)}
            </div>

            {/* QR card */}
            <div style={{
              background: PAPER_BG, borderRadius: 20, padding: "24px 20px 20px",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 10, marginBottom: 14,
            }}>
              <img src={qrUrl} alt="Payment QR" style={{ width: 140, height: 140, objectFit: "contain" }} />
              <span style={{ fontFamily: SANS, fontSize: 13, color: PAPER_MUT }}>Scan with any UPI app</span>
              {upiId && <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 500, color: PAPER_INK }}>{upiId}</span>}
            </div>

            {/* Copy UPI row */}
            {upiId && (
              <button type="button" onClick={copyUpi} style={{
                width: "100%", background: DIM_BG, border: `1px solid ${BORDER}`,
                borderRadius: 12, padding: "12px 16px", cursor: "pointer",
                display: "flex", alignItems: "center", gap: 12, marginBottom: 20,
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, border: `1px solid ${BORDER}`,
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <Copy size={15} strokeWidth={1.9} color={MUTED} />
                </div>
                <div style={{ flex: 1, textAlign: "left" }}>
                  <div style={{ fontFamily: SANS, fontSize: 14, fontWeight: 600, color: TEXT }}>Copy UPI ID</div>
                  <div style={{ fontFamily: MONO, fontSize: 12, color: MUTED }}>{upiId}</div>
                </div>
                <span style={{ fontFamily: SANS, fontSize: 12, fontWeight: 600, color: copied ? GREEN : MUTED }}>
                  {copied ? "Copied!" : "Copy"}
                </span>
              </button>
            )}

            <p style={{ fontFamily: SANS, fontSize: 13, color: MUTED, textAlign: "center", lineHeight: 1.55 }}>
              Pay {fmt(selectedAmount)}, then upload the payment screenshot on the next screen.
            </p>
          </div>
        </div>
        <Cta label="I've paid · Continue" onClick={() => setStep("proof")} />
      </div>
    );
  }

  // ── PLAN SELECTION (default) ──────────────────────────────────────────────────
  return (
    <div ref={rootRef} style={themedScreen}>
      <Header title="Membership" onBack={() => onNavigate("profile")}
        onNotifications={() => onNavigate("notifications")}
        onRefresh={onRefresh}
        refreshing={refreshing} />
      <div style={scroll}>
        <div style={{ padding: "28px 22px 0" }}>
          {/* Crown + eyebrow */}
          <div style={{ textAlign: "center", marginBottom: 8 }}>
            <Crown size={26} strokeWidth={1.8} color={TEXT} />
          </div>
          <div style={{ ...eyebrow, textAlign: "center" }}>CHOOSE YOUR PLAN</div>

          {/* Plan cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
            {plans.map(plan => {
              const sel = selectedPlanType === plan.planType;
              return (
                <button key={plan.planType} type="button" onClick={() => setSelectedPlanType(plan.planType)} style={{
                  width: "100%", background: sel ? SEL_BG : "transparent",
                  border: `1px solid ${sel ? TEXT : BORDER}`, borderRadius: 16,
                  padding: "14px 16px", cursor: "pointer", textAlign: "left", position: "relative",
                }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                    {/* Radio */}
                    <div style={{
                      width: 18, height: 18, borderRadius: "50%", flexShrink: 0, marginTop: 2,
                      border: `2px solid ${sel ? TEXT : BORDER}`, background: sel ? TEXT : "transparent",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {sel && <div style={{ width: 6, height: 6, borderRadius: "50%", background: RADIO_DOT }} />}
                    </div>

                    {/* Labels */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 2 }}>
                        <span style={{ fontFamily: SANS, fontSize: 15, fontWeight: 600, color: TEXT }}>
                          {plan.planName}
                        </span>
                        {plan.preferred && (
                          <span style={{
                            fontFamily: SANS, fontSize: 9, fontWeight: 700, letterSpacing: "0.16em",
                            textTransform: "uppercase", color: MUTED_DIM,
                            padding: "2px 7px", border: `1px solid ${BORDER}`, borderRadius: 8,
                            whiteSpace: "nowrap",
                          }}>
                            Preferred
                          </span>
                        )}
                      </div>
                      <div style={{ fontFamily: SANS, fontSize: 12, color: MUTED, marginBottom: plan.savingsPercent ? 7 : 0 }}>
                        {plan.billingLabel}
                      </div>
                      {plan.savingsPercent && (
                        <span style={{
                          display: "inline-flex", alignItems: "center",
                          fontFamily: SANS, fontSize: 11, fontWeight: 600, color: GREEN,
                          padding: "2px 8px", background: GREEN_BG, borderRadius: 8,
                        }}>
                          ↑ Save ₹{plan.savingsVsMonthly} vs monthly · {plan.savingsPercent}% off
                        </span>
                      )}
                    </div>

                    {/* Price */}
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontFamily: MONO, fontSize: 20, fontWeight: 600, color: TEXT }}>
                        ₹{plan.amount}
                      </div>
                      <div style={{ fontFamily: MONO, fontSize: 11, color: MUTED }}>
                        {plan.perMonthLabel ?? "per month"}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Benefits */}
          <div style={{ ...eyebrow, marginBottom: 14 }}>WHAT'S INCLUDED</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 8 }}>
            {benefits.map(b => (
              <div key={b} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <div style={{
                  width: 20, height: 20, borderRadius: "50%", flexShrink: 0, marginTop: 1,
                  border: `1px solid ${BORDER}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Check size={11} strokeWidth={2.5} color={MUTED} />
                </div>
                <span style={{ fontFamily: SANS, fontSize: 14, color: TEXT, lineHeight: 1.55 }}>{b}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Cta label={`Continue · ${fmt(selectedAmount)}`} onClick={() => setStep("scan")} />
    </div>
  );
}
