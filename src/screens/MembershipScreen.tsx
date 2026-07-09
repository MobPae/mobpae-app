/**
 * MembershipScreen — Razorpay-powered membership flow
 *
 * Steps:
 *  plan      → plan selection + coupon input
 *  paying    → loading: creating Razorpay order + opening modal
 *  verifying → loading: verifying payment signature with backend
 *  success   → membership activated successfully
 *  failed    → payment failed, retry option
 *  active    → already has active membership
 */

import { useEffect, useRef, useState, useMemo, type CSSProperties } from "react";
import {
  ArrowRight,
  Bell,
  Check,
  ChevronLeft,
  Clock3,
  Crown,
  RefreshCw,
  Shield,
  X,
} from "lucide-react";
import type { AppState, CouponValidation, MembershipPlan, View } from "../types/app";
import { employeeApi } from "../services/api";
import type { Theme } from "../hooks/useTheme";

// ── Razorpay global type declaration ─────────────────────────────────────────
declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}
interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color?: string };
  handler: (response: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => void;
  modal?: { ondismiss?: () => void };
}
interface RazorpayInstance {
  open(): void;
  on(event: "payment.failed", cb: (res: { error?: { description?: string } }) => void): void;
}

// ── Props ─────────────────────────────────────────────────────────────────────
type Props = {
  appState: AppState;
  couponValidation: CouponValidation | null;
  couponError: string;
  validatingCoupon: boolean;
  onPaymentVerified: (membership: {
    id?: string;
    planType?: string;
    planName?: string;
    status?: string;
    amount?: string | number;
    amountPaid?: string | number;
  }) => void;
  onValidateCoupon: (code: string) => Promise<void>;
  onClearCoupon: () => void;
  onNavigate: (view: View) => void;
  onRefresh?: () => void;
  refreshing?: boolean;
  showHeader?: boolean;
  theme?: Theme;
};

type MembershipStep = "plan" | "paying" | "verifying" | "success" | "failed" | "active";

// ── Design tokens ─────────────────────────────────────────────────────────────
const BG        = "var(--mem-bg, #0C0C0E)";
const TEXT      = "var(--mem-text, #F2F0EA)";
const MUTED     = "var(--mem-muted, #7C7C85)";
const MUTED_DIM = "var(--mem-dim, #5C5C64)";
const BORDER    = "var(--mem-border, #26262B)";
const DIM_BG    = "var(--mem-panel, #2A2A30)";
const PAPER_BG  = "var(--mem-paper, #F4F1E8)";
const PAPER_INK = "var(--mem-paper-ink, #17150F)";
const PAPER_MUT = "var(--mem-paper-muted, #8A8676)";
const PAPER_DAS = "var(--mem-paper-dash, #D8D3C2)";
const GREEN     = "var(--mem-green, #5AB370)";
const GREEN_BG  = "var(--mem-green-bg, rgba(90,179,112,0.10))";
const CTA_BG    = "var(--mem-cta-bg, #F4F1E8)";
const CTA_LABEL = "var(--mem-cta-label, #17150F)";
const CTA_ICON_BG = "var(--mem-cta-icon-bg, #17150F)";
const CTA_ARROW = "var(--mem-cta-arrow, #F4F1E8)";
const CTA_SHADOW= "var(--mem-cta-shadow, 0 4px 20px rgba(242,240,234,0.12))";
const DIS_ICON  = "var(--mem-dis-icon, #3A3A40)";
const SEL_BG    = "var(--mem-sel-bg, rgba(242,240,234,0.04))";
const BLUE      = "#315eff";

// ── Helpers ───────────────────────────────────────────────────────────────────
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
    planType: "ANNUAL",
    planName: "Annual",
    amount: 799,
    validityDays: 365,
    billingLabel: "Billed once a year",
    perMonthLabel: "= ₹67 / month",
    preferred: false,
    savingsVsMonthly: 1301,
    savingsPercent: 62,
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
      "--mem-paper": "#F1EDFC",
      "--mem-paper-ink": "#1E1636",
      "--mem-paper-muted": "#6E6786",
      "--mem-paper-dash": "#DCD5F2",
      "--mem-green": "#1F9E67",
      "--mem-green-bg": "rgba(31,158,103,0.10)",
      "--mem-cta-bg":     "#315eff",
      "--mem-cta-label":  "#FFFFFF",
      "--mem-cta-icon-bg":"#FFFFFF",
      "--mem-cta-arrow":  "#315eff",
      "--mem-cta-shadow": "0 18px 42px rgba(49,94,255,0.24)",
      "--mem-dis-icon":   "#C4BBE8",
      "--mem-sel-bg":     "rgba(49,94,255,0.06)",
    } as CSSProperties;
  }

  return {
    "--mem-bg": "#0C0C0E",
    "--mem-text": "#F2F0EA",
    "--mem-muted": "#7C7C85",
    "--mem-dim": "#5C5C64",
    "--mem-border": "#26262B",
    "--mem-panel": "#2A2A30",
    "--mem-paper": "#F4F1E8",
    "--mem-paper-ink": "#17150F",
    "--mem-paper-muted": "#8A8676",
    "--mem-paper-dash": "#D8D3C2",
    "--mem-green": "#5AB370",
    "--mem-green-bg": "rgba(90,179,112,0.10)",
    "--mem-cta-bg":     "#F4F1E8",
    "--mem-cta-label":  "#17150F",
    "--mem-cta-icon-bg":"#17150F",
    "--mem-cta-arrow":  "#F4F1E8",
    "--mem-cta-shadow": "0 4px 20px rgba(242,240,234,0.12)",
    "--mem-dis-icon":   "#3A3A40",
    "--mem-sel-bg":     "rgba(242,240,234,0.04)",
  } as CSSProperties;
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function Header({
  title, onBack, onNotifications, onRefresh, refreshing,
}: {
  title: string; onBack: () => void; onNotifications: () => void;
  onRefresh?: () => void; refreshing?: boolean;
}) {
  const btn: CSSProperties = {
    width: 40, height: 40, borderRadius: "50%", border: `1px solid ${BORDER}`,
    background: "transparent", display: "flex", alignItems: "center",
    justifyContent: "center", flexShrink: 0, cursor: "pointer",
  };
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "max(16px, env(safe-area-inset-top, 0px)) 22px 0" }}>
      <button type="button" onClick={onBack} aria-label="Back" style={{ ...btn, color: TEXT }}>
        <ChevronLeft size={20} strokeWidth={2} />
      </button>
      <span style={{ fontFamily: "inherit", fontSize: 12, fontWeight: 400, letterSpacing: "0.32em", color: MUTED, textTransform: "uppercase" }}>
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
        width: "100%", height: 60, background: on ? CTA_BG : DIM_BG, border: "none", borderRadius: 16,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 8px 0 22px", cursor: on ? "pointer" : "not-allowed",
        boxShadow: on ? CTA_SHADOW : "none",
      }}>
        <span style={{ fontFamily: "inherit", fontSize: 15, fontWeight: 400, color: on ? CTA_LABEL : MUTED }}>
          {loading ? "Please wait…" : label}
        </span>
        <span style={{
          width: 44, height: 44, borderRadius: 8, background: on ? CTA_ICON_BG : DIS_ICON,
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

function Orb({ children, warn, success: isSuccess }: { children: React.ReactNode; warn?: boolean; success?: boolean }) {
  const bg = isSuccess ? "rgba(90,179,112,0.10)" : warn ? "rgba(180,89,31,0.10)" : "rgba(242,240,234,0.06)";
  const border = isSuccess ? `1px solid rgba(90,179,112,0.3)` : warn ? `1px solid rgba(180,89,31,0.3)` : `1px solid ${BORDER}`;
  return (
    <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
      <div style={{
        width: 64, height: 64, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
        background: bg, border,
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
            <span style={{ fontFamily: "inherit", fontSize: 13, color: PAPER_MUT }}>{row.label}</span>
            <span style={{ fontFamily: "inherit", fontSize: 13, fontWeight: 400, color: row.warn ? "#B4591F" : row.green ? "#5AB370" : PAPER_INK }}>
              {row.value}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function BenefitsList({ benefits }: { benefits: string[] }) {
  return (
    <div style={{ margin: "0 22px 24px" }}>
      {benefits.map((b) => (
        <div key={b} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 12 }}>
          <span style={{
            width: 20, height: 20, borderRadius: "50%", background: GREEN_BG,
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1,
          }}>
            <Check size={11} strokeWidth={2.5} color={GREEN} />
          </span>
          <span style={{ fontFamily: "inherit", fontSize: 13, color: TEXT, lineHeight: 1.45 }}>{b}</span>
        </div>
      ))}
    </div>
  );
}

function PlanCard({
  plan, selected, onSelect,
}: { plan: MembershipPlan; selected: boolean; onSelect: () => void }) {
  const border = selected ? `1px solid ${BLUE}` : `1px solid ${BORDER}`;
  const bg = selected ? SEL_BG : "transparent";
  return (
    <div onClick={onSelect} role="button" style={{
      position: "relative", border, borderRadius: 14, padding: "14px 16px",
      background: bg, cursor: "pointer", transition: "border-color 0.15s ease",
    }}>
      {plan.preferred && (
        <div style={{
          position: "absolute", top: -9, left: 14,
          background: BLUE, borderRadius: 20, padding: "2px 10px",
          fontSize: 9, fontWeight: 500, color: "#fff", letterSpacing: "0.12em", textTransform: "uppercase",
        }}>
          Best value
        </div>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {/* Radio */}
        <div style={{
          width: 18, height: 18, borderRadius: "50%",
          border: `1.5px solid ${selected ? BLUE : MUTED_DIM}`,
          background: selected ? BLUE : "transparent",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          transition: "all 0.15s ease",
        }}>
          {selected && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#0C0C0E" }} />}
        </div>

        {/* Plan info */}
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
            <span style={{ fontFamily: "inherit", fontSize: 14, fontWeight: 400, color: TEXT }}>
              {plan.planName}
            </span>
            <span style={{ fontFamily: "inherit", fontSize: 16, fontWeight: 400, color: TEXT }}>
              {fmt(plan.amount)}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 3 }}>
            <span style={{ fontFamily: "inherit", fontSize: 11, color: MUTED }}>
              {plan.billingLabel}
            </span>
            {plan.savingsPercent != null && (
              <span style={{
                fontFamily: "inherit", fontSize: 10, fontWeight: 400, color: GREEN,
                background: GREEN_BG, padding: "2px 7px", borderRadius: 20,
              }}>
                Save {plan.savingsPercent}%
              </span>
            )}
          </div>
          {plan.perMonthLabel && (
            <div style={{ marginTop: 2, fontFamily: "inherit", fontSize: 11, color: MUTED_DIM }}>
              {plan.perMonthLabel}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CouponInput({
  couponInput, setCouponInput, couponValidation, couponError, validatingCoupon,
  onValidate, onClear,
}: {
  couponInput: string;
  setCouponInput: (v: string) => void;
  couponValidation: CouponValidation | null;
  couponError: string;
  validatingCoupon: boolean;
  onValidate: (code: string) => Promise<void>;
  onClear: () => void;
}) {
  const applied = Boolean(couponValidation);
  return (
    <div style={{ margin: "0 22px 20px" }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        border: `1px solid ${applied ? GREEN : couponError ? "#B4591F" : BORDER}`,
        borderRadius: 10, padding: "0 12px",
        background: applied ? GREEN_BG : DIM_BG,
        transition: "border-color 0.15s ease",
      }}>
        <input
          type="text"
          placeholder="Coupon code (optional)"
          value={couponInput}
          onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
          disabled={applied || validatingCoupon}
          style={{
            flex: 1, height: 44, background: "transparent", border: "none", outline: "none",
            fontFamily: "inherit", fontSize: 13, fontWeight: 400,
            color: applied ? GREEN : TEXT,
            letterSpacing: applied ? "0.06em" : "normal",
          }}
        />
        {applied ? (
          <button type="button" onClick={onClear} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: MUTED }}>
            <X size={16} strokeWidth={2} />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => couponInput.trim() && onValidate(couponInput.trim())}
            disabled={!couponInput.trim() || validatingCoupon}
            style={{
              background: "none", border: "none", cursor: couponInput.trim() ? "pointer" : "default",
              padding: 0, fontFamily: "inherit", fontSize: 12, fontWeight: 400,
              color: couponInput.trim() ? BLUE : MUTED_DIM,
            }}
          >
            {validatingCoupon ? "…" : "Apply"}
          </button>
        )}
      </div>
      {couponError && (
        <div style={{ marginTop: 6, fontFamily: "inherit", fontSize: 11, color: "#B4591F" }}>
          {couponError}
        </div>
      )}
      {applied && couponValidation && (
        <div style={{ marginTop: 6, fontFamily: "inherit", fontSize: 11, color: GREEN }}>
          Coupon applied — {fmt(couponValidation.discountAmount)} off
        </div>
      )}
    </div>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export function MembershipScreen({
  appState, couponValidation, couponError, validatingCoupon,
  onPaymentVerified, onValidateCoupon, onClearCoupon,
  onNavigate, onRefresh, refreshing, theme = "dark",
}: Props) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const { membershipActive, membershipConfig } = appState;

  const plans: MembershipPlan[] = useMemo(() => {
    const cfg = membershipConfig.plans;
    if (cfg && cfg.length >= 1) return [...cfg].sort((a, b) => (b.preferred ? 1 : 0) - (a.preferred ? 1 : 0));
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

  const [selectedPlanType, setSelectedPlanType] = useState<string>(() => {
    // Prefer the plan the backend says is preferred
    const preferred = plans.find(p => p.preferred);
    return membershipConfig.planType || preferred?.planType || plans[0]?.planType || "BIANNUAL";
  });

  const selectedPlan = plans.find(p => p.planType === selectedPlanType) ?? plans[0];
  const discountAmount = couponValidation?.discountAmount ?? 0;
  const payableAmount = Math.max(0, (selectedPlan?.amount ?? 0) - discountAmount);

  const [step, setStep] = useState<MembershipStep>(() => membershipActive ? "active" : "plan");
  const [error, setError] = useState("");
  const [couponInput, setCouponInput] = useState("");

  useEffect(() => {
    if (membershipActive && step !== "paying" && step !== "verifying" && step !== "success") {
      setStep("active");
    }
  }, [membershipActive, step]);

  useEffect(() => {
    rootRef.current?.closest<HTMLElement>(".screen-body")?.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [step]);

  // ── Payment flow ───────────────────────────────────────────────────────────

  const openRazorpay = async () => {
    if (typeof window.Razorpay === "undefined") {
      setError("Payment system is loading. Please wait a moment and try again.");
      return;
    }

    setStep("paying");
    setError("");

    let order: Awaited<ReturnType<typeof employeeApi.initiatePayment>>;
    try {
      order = await employeeApi.initiatePayment({
        planKey: selectedPlanType,
        couponCode: couponValidation?.couponCode,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to initiate payment. Please try again.");
      setStep("plan");
      return;
    }

    const rzp = new window.Razorpay({
      key: order.keyId,
      amount: order.amount,
      currency: order.currency,
      name: "MobPae",
      description: order.description,
      order_id: order.orderId,
      prefill: {
        name: order.employeeName,
        email: order.employeeEmail,
        contact: order.employeePhone,
      },
      theme: { color: BLUE },
      handler: async (response) => {
        setStep("verifying");
        try {
          const result = await employeeApi.verifyPayment({
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          });
          if (result.success) {
            if (result.membership) onPaymentVerified(result.membership);
            setStep("success");
            setCouponInput("");
            onClearCoupon();
          } else {
            setError("Payment verification failed. Please contact support if your account was charged.");
            setStep("plan");
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : "Payment verification failed. Please contact support.");
          setStep("plan");
        }
      },
      modal: {
        ondismiss: () => {
          setStep("plan");
        },
      },
    });

    rzp.on("payment.failed", (response) => {
      setStep("failed");
      setError(response.error?.description ?? "Payment failed. Please try again.");
    });

    rzp.open();
  };

  // ── Styles ─────────────────────────────────────────────────────────────────
  const screen: CSSProperties = {
    minHeight: "100%", flex: 1, background: BG,
    fontFamily: "inherit", color: TEXT,
    display: "flex", flexDirection: "column",
    ...membershipVars(theme),
  };
  const scroll: CSSProperties = { flex: 1, overflowY: "visible", padding: "0 0 8px" };
  const eyebrow: CSSProperties = {
    fontSize: 11, fontWeight: 400, letterSpacing: "0.32em", color: MUTED_DIM,
    textTransform: "uppercase", marginBottom: 12,
  };

  // ── LOADING (paying / verifying) ───────────────────────────────────────────
  if (step === "paying" || step === "verifying") {
    const msg = step === "paying" ? "Opening payment…" : "Confirming payment…";
    const sub = step === "paying"
      ? "Setting up your secure payment session"
      : "Verifying your payment and activating membership";
    return (
      <div ref={rootRef} style={screen}>
        <Header title="Membership" onBack={() => {}}
          onNotifications={() => onNavigate("notifications")} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 22px", gap: 24 }}>
          <div style={{
            width: 72, height: 72, borderRadius: "50%", border: `1px solid ${BORDER}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(49,94,255,0.06)",
          }}>
            <span className="spin" style={{ width: 28, height: 28, border: `2px solid ${BLUE}`, borderTopColor: "transparent", borderRadius: "50%", display: "block" }} />
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 17, fontWeight: 400, color: TEXT, marginBottom: 8 }}>{msg}</div>
            <div style={{ fontSize: 13, color: MUTED }}>{sub}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: MUTED_DIM }}>
            <Shield size={12} strokeWidth={1.8} />
            <span>Secured by Razorpay</span>
          </div>
        </div>
      </div>
    );
  }

  // ── SUCCESS ────────────────────────────────────────────────────────────────
  if (step === "success") {
    return (
      <div ref={rootRef} style={screen}>
        <Header title="Membership" onBack={() => setStep("active")}
          onNotifications={() => onNavigate("notifications")} />
        <div style={scroll}>
          <div style={{ padding: "48px 22px 0" }}>
            <Orb success>
              <Check size={28} strokeWidth={2.2} color={GREEN} />
            </Orb>
            <div style={{ textAlign: "center", marginBottom: 36 }}>
              <div style={{ ...eyebrow, marginBottom: 8 }}>Membership activated</div>
              <div style={{ fontSize: 22, fontWeight: 400, color: TEXT, marginBottom: 10 }}>
                You're all set!
              </div>
              <div style={{ fontSize: 14, color: MUTED, lineHeight: 1.55, maxWidth: 280, margin: "0 auto" }}>
                Your membership is now active. Enjoy instant salary advances at zero fees.
              </div>
            </div>
          </div>
          <BenefitsList benefits={benefits} />
        </div>
        <Cta label="Go to Home" onClick={() => onNavigate("home")} />
      </div>
    );
  }

  // ── FAILED ─────────────────────────────────────────────────────────────────
  if (step === "failed") {
    return (
      <div ref={rootRef} style={screen}>
        <Header title="Membership" onBack={() => setStep("plan")}
          onNotifications={() => onNavigate("notifications")} />
        <div style={scroll}>
          <div style={{ padding: "48px 22px 0" }}>
            <Orb warn>
              <X size={26} strokeWidth={2} color="#B4591F" />
            </Orb>
            <div style={{ textAlign: "center", marginBottom: 36 }}>
              <div style={{ ...eyebrow, marginBottom: 8 }}>Payment failed</div>
              <div style={{ fontSize: 22, fontWeight: 400, color: TEXT, marginBottom: 10 }}>
                Couldn't complete payment
              </div>
              {error && (
                <div style={{ fontSize: 13, color: "#B4591F", lineHeight: 1.55, maxWidth: 280, margin: "0 auto" }}>
                  {error}
                </div>
              )}
            </div>
          </div>
          <div style={{ margin: "0 22px 24px", padding: 16, borderRadius: 12, border: `1px solid ${BORDER}`, background: DIM_BG }}>
            <div style={{ fontSize: 13, color: MUTED, lineHeight: 1.6 }}>
              No amount has been deducted. You can try again with a different payment method.
              If the issue persists, please contact support.
            </div>
          </div>
        </div>
        <Cta label="Try again" onClick={() => { setError(""); setStep("plan"); }} />
      </div>
    );
  }

  // ── ACTIVE ─────────────────────────────────────────────────────────────────
  if (step === "active") {
    const total = Math.max(1, membershipConfig.membershipValidityDays || 180);
    const days = typeof membershipConfig.daysRemaining === "number"
      ? Math.max(0, membershipConfig.daysRemaining)
      : membershipConfig.validTill
        ? Math.max(0, Math.ceil((new Date(membershipConfig.validTill).getTime() - Date.now()) / 86_400_000))
        : total;
    const usedPct = Math.min(100, Math.max(3, ((total - days) / total) * 100));

    return (
      <div ref={rootRef} style={screen}>
        <Header title="Membership" onBack={() => onNavigate("profile")}
          onNotifications={() => onNavigate("notifications")}
          onRefresh={onRefresh} refreshing={refreshing} />
        <div style={scroll}>
          <div style={{ padding: "32px 22px 0" }}>
            <Orb success>
              <Crown size={26} strokeWidth={1.8} color={TEXT} />
            </Orb>

            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 16, fontWeight: 400 }}>
                  {membershipConfig.planName || "Advance Membership"}
                </span>
                <span style={{
                  fontSize: 9, fontWeight: 500, letterSpacing: "0.12em",
                  padding: "2px 8px", borderRadius: 20, background: "rgba(90,179,112,0.12)",
                  color: GREEN, textTransform: "uppercase",
                }}>
                  Active
                </span>
              </div>
              <div style={{ fontSize: 30, fontWeight: 400, color: TEXT, marginBottom: 2 }}>
                {days}
              </div>
              <div style={{ fontSize: 13, color: MUTED }}>days remaining</div>
            </div>

            {/* Progress bar */}
            <div style={{ height: 4, background: BORDER, borderRadius: 99, margin: "0 0 28px", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${usedPct}%`, background: BLUE, borderRadius: 99, transition: "width 0.6s ease" }} />
            </div>
          </div>

          {/* Stats */}
          <ReceiptCard rows={[
            { label: "Member since", value: fmtDate(membershipConfig.memberSince), mono: true },
            { label: "Valid till",   value: fmtDate(membershipConfig.validTill),   mono: true },
            {
              label: "Paid",
              value: fmt(membershipConfig.amountPayable || membershipConfig.fee || 0),
              green: true,
            },
          ]} />

          <div style={{ height: 28 }} />
          <div style={{ margin: "0 22px 12px", ...eyebrow }}>Benefits</div>
          <BenefitsList benefits={benefits} />

          {/* Timer */}
          {days <= 30 && days > 0 && (
            <div style={{
              margin: "0 22px 24px", padding: "14px 16px", borderRadius: 12,
              border: `1px solid rgba(180,89,31,0.25)`, background: "rgba(180,89,31,0.06)",
              display: "flex", alignItems: "center", gap: 10,
            }}>
              <Clock3 size={16} strokeWidth={1.8} color="#B4591F" />
              <span style={{ fontSize: 13, color: "#B4591F" }}>
                Membership expires in {days} day{days !== 1 ? "s" : ""}.
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── PLAN SELECTION ─────────────────────────────────────────────────────────
  return (
    <div ref={rootRef} style={screen}>
      <Header title="Membership" onBack={() => onNavigate("profile")}
        onNotifications={() => onNavigate("notifications")} />

      <div style={scroll}>
        <div style={{ padding: "28px 22px 0" }}>
          <div style={eyebrow}>Choose a plan</div>
          <div style={{ fontSize: 22, fontWeight: 400, color: TEXT, marginBottom: 6 }}>
            Unlock salary advances
          </div>
          <div style={{ fontSize: 13, color: MUTED, marginBottom: 28, lineHeight: 1.6 }}>
            One membership. Instant access to salary advances, zero processing fees.
          </div>
        </div>

        {/* Plan cards */}
        <div style={{ margin: "0 22px", display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
          {plans.map((plan) => (
            <PlanCard
              key={plan.planType}
              plan={plan}
              selected={selectedPlanType === plan.planType}
              onSelect={() => setSelectedPlanType(plan.planType)}
            />
          ))}
        </div>

        {/* Error */}
        {error && (
          <div style={{ margin: "0 22px 16px", padding: "12px 14px", borderRadius: 10, background: "rgba(180,89,31,0.08)", border: "1px solid rgba(180,89,31,0.2)" }}>
            <span style={{ fontSize: 13, color: "#B4591F" }}>{error}</span>
          </div>
        )}

        {/* Trust signal */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, margin: "0 22px 24px", fontSize: 12, color: MUTED }}>
          <Shield size={13} strokeWidth={1.8} />
          <span>Secured by Razorpay · 256-bit SSL</span>
        </div>
      </div>

      {/* CTA */}
      <Cta
        label={`Pay ${fmt(payableAmount)} with Razorpay`}
        onClick={openRazorpay}
        disabled={!selectedPlan}
      />
    </div>
  );
}
