import { useState } from "react";
import { ArrowRight, BadgeCheck, Check, CheckCircle, Crown, Gift, ShieldCheck, Sparkles, Tag, X } from "lucide-react";
import type { AppState, CouponValidation, View } from "../types/app";
import { SubPageHeader } from "../components/layout/SubPageHeader";

type Props = {
  appState: AppState;
  activatingMembership: boolean;
  couponValidation: CouponValidation | null;
  couponError: string;
  validatingCoupon: boolean;
  onActivateMembership: () => Promise<void>;
  onValidateCoupon: (code: string) => Promise<void>;
  onClearCoupon: () => void;
  onNavigate: (view: View) => void;
};

const fmtDate = (iso: string | undefined | null) => {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }); }
  catch { return "—"; }
};

export function MembershipScreen({
  appState,
  activatingMembership,
  couponValidation,
  couponError,
  validatingCoupon,
  onActivateMembership,
  onValidateCoupon,
  onClearCoupon,
  onNavigate,
}: Props) {
  const { membershipActive, membershipConfig } = appState;
  const {
    planName, fee, amountPayable, daysRemaining, memberSince, validTill,
    membershipTitle, membershipSubtitle, membershipBenefits,
  } = membershipConfig;

  const [couponInput, setCouponInput] = useState("");
  const [activationError, setActivationError] = useState("");

  const payable = couponValidation?.payableAmount ?? amountPayable ?? fee;
  const discount = couponValidation?.discountAmount ?? 0;
  const listPrice = fee || payable;

  const BENEFITS = membershipBenefits?.length
    ? membershipBenefits
    : [
        "Up to 50% of monthly salary in advance",
        "Same-day disbursal after approval",
        "Zero hidden charges",
        "Flexible advance amounts",
        "Auto salary repayment",
        "Priority customer support",
      ];

  // ── Active state ──────────────────────────────────────────
  if (membershipActive) {
    return (
      <div className="mem-screen">
        <SubPageHeader title="My Membership" onBack={() => onNavigate("profile")} />

        <div className="screen-body mem-body">
          {/* Active card */}
          <div className="mem-active-card">
            <div className="mem-active-top">
              <div className="mem-active-icon"><Crown size={22} /></div>
              <div>
                <div className="mem-active-card-title">{planName || "MobPae Member"}</div>
                <div className="mem-active-badge">Active membership</div>
              </div>
            </div>
            <div className="mem-active-details">
              <div>
                <div className="mem-active-stat-label">Member Since</div>
                <div className="mem-active-stat-val">{fmtDate(memberSince)}</div>
              </div>
              <div>
                <div className="mem-active-stat-label">Valid Till</div>
                <div className="mem-active-stat-val">{fmtDate(validTill)}</div>
              </div>
              <div>
                <div className="mem-active-stat-label">Days Remaining</div>
                <div className="mem-active-stat-val">{daysRemaining ?? "—"}</div>
              </div>
              <div>
                <div className="mem-active-stat-label">Status</div>
                <div className="mem-active-stat-val">Active</div>
              </div>
            </div>
          </div>

          {/* Benefits */}
          <div className="mem-benefits-card">
            <div className="mem-benefits-title">Your benefits</div>
            {BENEFITS.map((b) => (
              <div key={b} className="mem-benefit-item">
                <div className="mem-benefit-icon"><Check size={16} /></div>
                <div className="mem-benefit-body">
                  <div className="mem-benefit-title">{b}</div>
                </div>
                <BadgeCheck size={16} className="mem-benefit-check-right" color="#16A34A" />
              </div>
            ))}
          </div>

          {/* Security */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#F0FDF4", borderRadius: 12, border: "1px solid #BBF7D0", padding: "13px 16px", margin: "0 0 12px" }}>
            <ShieldCheck size={18} color="#16A34A" />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#14532D" }}>Your membership is secure</div>
              <div style={{ fontSize: 12, color: "#166534" }}>One-time activation · No recurring charge</div>
            </div>
          </div>

          <div className="mp-bottom-space" />
        </div>
      </div>
    );
  }

  // ── Upgrade / Activate state ──────────────────────────────
  return (
    <div className="mem-screen">
      <SubPageHeader title="Activate Membership" onBack={() => onNavigate("profile")} />

      {/* Hero */}
      <div className="mem-hero">
        <div className="mem-crown-ring"><Sparkles size={30} /></div>
        <div className="mem-hero-title">{membershipTitle || "Unlock MobPae"}</div>
        <div className="mem-hero-sub">{membershipSubtitle || "Activate your plan to access salary advances and exclusive benefits."}</div>
      </div>

      <div className="screen-body mem-body">

        {/* Plan card */}
        <div className="mem-plan-card">
          <div className="mem-plan-badge">One-time activation</div>
          <div style={{ marginTop: 8 }}>
            <div className="mem-plan-name">{planName || "MobPae Plus"}</div>
            <div className="mem-plan-price">
              ₹{payable.toLocaleString("en-IN")} <span>one-time</span>
            </div>
            {discount > 0 && (
              <div className="mem-plan-save">You save ₹{discount.toLocaleString("en-IN")}</div>
            )}
          </div>
          <div style={{ margin: "12px 0" }}>
            {BENEFITS.slice(0, 5).map((b) => (
              <div key={b} className="mem-benefit-row">
                <CheckCircle size={14} className="mem-benefit-check" color="#16A34A" />
                {b}
              </div>
            ))}
          </div>

          {/* Coupon */}
          {!couponValidation ? (
            <div className="mem-coupon-row">
              <input
                type="text"
                className="mem-coupon-input"
                placeholder="Have a coupon code?"
                value={couponInput}
                onChange={e => setCouponInput(e.target.value.toUpperCase())}
              />
              <button
                type="button"
                className="mem-coupon-btn"
                disabled={!couponInput || validatingCoupon}
                onClick={() => onValidateCoupon(couponInput)}
              >
                <Tag size={13} /> {validatingCoupon ? "..." : "Apply"}
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#F0FDF4", borderRadius: 10, padding: "10px 12px", marginBottom: 12 }}>
              <Check size={16} color="#16A34A" />
              <div style={{ flex: 1, fontSize: 13, color: "#14532D", fontWeight: 600 }}>
                Coupon <strong>{couponValidation.couponCode}</strong> applied — saving ₹{couponValidation.discountAmount.toLocaleString("en-IN")}
              </div>
              <button type="button" onClick={onClearCoupon} style={{ color: "#6B7280", background: "none", border: "none", cursor: "pointer" }}>
                <X size={14} />
              </button>
            </div>
          )}
          {couponError && <div style={{ fontSize: 12, color: "#DC2626", marginBottom: 8 }}>⚠ {couponError}</div>}
        </div>

        <div className="mem-price-card">
          <div className="mem-price-row">
            <span>Membership fee</span>
            <strong>₹{listPrice.toLocaleString("en-IN")}</strong>
          </div>
          <div className="mem-price-row">
            <span>Coupon discount</span>
            <strong className={discount > 0 ? "green" : ""}>{discount > 0 ? `− ₹${discount.toLocaleString("en-IN")}` : "Optional"}</strong>
          </div>
          <div className="mem-price-total">
            <span>Final payable</span>
            <strong>₹{payable.toLocaleString("en-IN")}</strong>
          </div>
        </div>

        {activationError && (
          <div style={{ background: "#FEE2E2", color: "#B91C1C", borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 12 }}>
            ⚠ {activationError}
          </div>
        )}

        {/* Benefits list */}
        <div style={{ background: "white", borderRadius: 16, border: "1px solid #F0EEFF", padding: "16px", marginBottom: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#0F0A3C", marginBottom: 10 }}>All benefits included</div>
          {BENEFITS.map((b) => (
            <div key={b} className="mem-benefit-item">
              <Check size={15} color="#5B3CE3" />
              <div style={{ flex: 1, fontSize: 13, color: "#374151" }}>{b}</div>
            </div>
          ))}
        </div>

        <div style={{ fontSize: 12, color: "#9CA3AF", textAlign: "center", marginBottom: 12 }}>
          One-time activation fee · Valid for {membershipConfig.membershipValidityDays || 365} days
        </div>

        <div className="mp-bottom-space" />
      </div>

      {/* Sticky CTA */}
      <div style={{ padding: "12px 16px 20px", background: "var(--bg)" }}>
        <button
          type="button"
          className="mp-btn-primary"
          disabled={activatingMembership}
          onClick={async () => {
            setActivationError("");
            try { await onActivateMembership(); }
            catch (e: unknown) {
              setActivationError(e instanceof Error ? e.message : "Activation failed. Please try again.");
            }
          }}
        >
          {activatingMembership ? <span className="mp-spinner" /> : <>Activate for ₹{payable.toLocaleString("en-IN")} <ArrowRight size={16} /></>}
        </button>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, fontSize: 11, color: "#9CA3AF", marginTop: 8 }}>
          <Gift size={12} /> Coupon optional · Secure activation
        </div>
      </div>
    </div>
  );
}
