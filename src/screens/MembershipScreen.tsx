import { useState } from "react";
import { Check, CheckCircle2, Crown, Gem, ShieldCheck, Sparkles, Tag, X } from "lucide-react";
import type { AppState, CouponValidation, View } from "../types/app";

type Props = {
  appState: AppState;
  activatingMembership: boolean;
  couponValidation: CouponValidation | null;
  couponError: string;
  validatingCoupon: boolean;
  onActivateMembership: () => void;
  onValidateCoupon: (code: string) => Promise<void>;
  onClearCoupon: () => void;
  onNavigate: (view: View) => void;
};

const fmtDate = (iso: string | undefined | null) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "numeric", month: "short", year: "numeric",
    });
  } catch { return "—"; }
};

const fmtMoney = (n: number) =>
  n.toLocaleString("en-IN", { maximumFractionDigits: 0 });

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
  const { membershipActive, membershipConfig, profile } = appState;
  const {
    planName,
    fee,
    amountPayable,
    couponCode,
    couponDiscount,
    daysRemaining,
    memberSince,
    validTill,
    membershipValidityDays,
    membershipTitle,
    membershipSubtitle,
    membershipBenefits,
  } = membershipConfig;

  const [showCouponStep, setShowCouponStep] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [justActivated, setJustActivated] = useState(false);
  const [paidAmount, setPaidAmount] = useState(0);

  const memberSinceFmt = fmtDate(memberSince);
  const validTillFmt   = fmtDate(validTill);
  const pct = membershipValidityDays > 0 && daysRemaining != null
    ? Math.min(100, Math.round((daysRemaining / membershipValidityDays) * 100))
    : 0;

  // Effective payable: validated coupon > base fee (no frontend calc)
  const effectiveFee = couponValidation?.payableAmount ?? fee;
  const hasDiscount  = couponValidation?.valid && couponValidation.discountAmount > 0;

  const handleApplyCoupon = () => {
    if (couponInput.trim()) void onValidateCoupon(couponInput);
  };

  const handleClearCoupon = () => {
    setCouponInput("");
    onClearCoupon();
  };

  const handleActivate = async () => {
    setPaidAmount(effectiveFee > 0 ? effectiveFee : fee);
    await onActivateMembership();
    setJustActivated(true);
  };

  /* ── Activation success screen ──────────────────────────────────────── */
  if (justActivated) {
    return (
      <div className="mem-success-screen">
        <div className="mem-success-glow" />

        <div className="mem-success-icon">
          <CheckCircle2 size={56} strokeWidth={1.8} color="white" />
        </div>

        <div className="mem-success-title">Account Activated!</div>
        <div className="mem-success-sub">
          Your MobPae Plus membership is now live.
        </div>

        <div className="mem-success-card">
          <div className="mem-success-card-row">
            <span className="mem-success-card-label">Status</span>
            <span className="mem-success-card-value mem-success-card-value--green">
              <CheckCircle2 size={13} /> Paid &amp; Active
            </span>
          </div>
          <div className="mem-success-card-divider" />
          <div className="mem-success-card-row">
            <span className="mem-success-card-label">Plan</span>
            <span className="mem-success-card-value">
              <Crown size={13} color="#f59e0b" /> {membershipTitle || "MobPae Plus"}
            </span>
          </div>
          <div className="mem-success-card-divider" />
          <div className="mem-success-card-row">
            <span className="mem-success-card-label">Amount paid</span>
            <span className="mem-success-card-value">
              {paidAmount > 0 ? `₹${fmtMoney(paidAmount)}` : "—"}
            </span>
          </div>
          {membershipValidityDays > 0 && (
            <>
              <div className="mem-success-card-divider" />
              <div className="mem-success-card-row">
                <span className="mem-success-card-label">Valid for</span>
                <span className="mem-success-card-value">{membershipValidityDays} days</span>
              </div>
            </>
          )}
        </div>

        <button
          type="button"
          className="mem-success-home-btn"
          onClick={() => onNavigate("home")}
        >
          Go to Home
        </button>

        <p className="mem-success-note">No auto-renewal · Cancel anytime</p>
      </div>
    );
  }

  return (
    <div className="mem-screen">

      {/* ── Screen header ────────────────────────────────────────────── */}
      <div className="mem-page-header">
        <div>
          <span>MobPae access</span>
          <h2>Membership</h2>
          <p>{membershipActive ? "Your active plan" : "Upgrade for more benefits"}</p>
        </div>
      </div>

      {/* ── Status card ─────────────────────────────────────────────── */}
      <div className="mem-status-card">
        <div className="mem-status-card-bg" />

        <div className="mem-status-top">
          <div className="mem-status-plan-pill">
            <Crown size={11} />
            {membershipActive ? planName : (membershipTitle || "MobPae Plus")}
          </div>
          <span className={`mem-status-badge ${membershipActive ? "mem-status-badge--active" : "mem-status-badge--inactive"}`}>
            {membershipActive ? "Active" : "Not Active"}
          </span>
        </div>

        <div className="mem-status-name">{profile.name || "—"}</div>

        {membershipActive ? (
          <>
            <div className="mem-status-dates">
              <div className="mem-status-date-block">
                <div className="mem-status-date-label">Member since</div>
                <div className="mem-status-date-value">{memberSinceFmt}</div>
              </div>
              <div className="mem-status-date-sep" />
              <div className="mem-status-date-block">
                <div className="mem-status-date-label">Valid till</div>
                <div className="mem-status-date-value">{validTillFmt}</div>
              </div>
              <div className="mem-status-date-sep" />
              <div className="mem-status-date-block">
                <div className="mem-status-date-label">Days left</div>
                <div className="mem-status-date-value">{daysRemaining ?? "—"}</div>
              </div>
            </div>
            <div className="mem-status-progress-track">
              <div className="mem-status-progress-fill" style={{ width: `${pct}%` }} />
            </div>
            <div className="mem-status-progress-label">{pct}% of membership remaining</div>
          </>
        ) : (
          <div className="mem-status-free-sub">
            {membershipSubtitle}
          </div>
        )}
      </div>

      {/* ── Active membership detail ─────────────────────────────────── */}
      {membershipActive && (
        <>
          {/* Payment summary card */}
          <div className="mem-payment-card">
            <div className="mem-payment-row">
              <span className="mem-payment-label">Amount paid</span>
              <span className="mem-payment-value">
                {amountPayable && amountPayable > 0 ? `₹${fmtMoney(amountPayable)}` : "—"}
                {couponDiscount > 0 && fee > 0 && (
                  <span className="mem-payment-original">₹{fmtMoney(fee)}</span>
                )}
              </span>
            </div>
            {couponCode && couponDiscount > 0 && (
              <div className="mem-payment-row">
                <span className="mem-payment-label">Coupon applied</span>
                <span className="mem-payment-coupon-badge">
                  <Tag size={11} />
                  {couponCode} · Saved ₹{fmtMoney(couponDiscount)}
                </span>
              </div>
            )}
            <div className="mem-payment-row">
              <span className="mem-payment-label">Plan</span>
              <span className="mem-payment-value">{planName || "—"}</span>
            </div>
          </div>

          {/* Premium benefits */}
          {membershipBenefits.length > 0 && (
            <>
              <div className="mem-section-label">Your premium benefits</div>
              <div className="mem-benefits-list">
                {membershipBenefits.map((b, i) => (
                  <div key={i} className="mem-benefit-row">
                    <div className="mem-benefit-check">
                      <Check size={13} strokeWidth={3} />
                    </div>
                    <span className="mem-benefit-text">{b}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="mem-active-note">
            Membership valid till <strong>{validTillFmt}</strong>. No auto-renewal.
          </div>
        </>
      )}

      {/* ── Premium upgrade card (inactive view) ────────────────────── */}
      {!membershipActive && (
        <div className="mem-upgrade-box">

          {/* Dark premium header */}
          <div className="mem-upgrade-premium-hero">
            <div className="mem-upgrade-premium-crown">
              <Gem size={28} color="#fbbf24" />
            </div>
            <div>
              <div className="mem-upgrade-box-title">
                {membershipTitle || "MobPae Plus"}
              </div>
              <div className="mem-upgrade-box-sub">
                {fee > 0 ? `₹${fmtMoney(fee)}` : "—"}
                {membershipValidityDays > 0 ? ` · ${membershipValidityDays} days` : ""}
                {" · One-time payment"}
              </div>
            </div>
          </div>

          <div className="mem-price-card">
            <div>
              <span>One-time membership</span>
              <strong>{fee > 0 ? `₹${fmtMoney(fee)}` : "—"}</strong>
            </div>
            <div>
              <span>Valid for</span>
              <strong>{membershipValidityDays > 0 ? `${membershipValidityDays} days` : "—"}</strong>
            </div>
          </div>

          {/* Benefits list */}
          {membershipBenefits.length > 0 && (
            <>
            <div className="mem-section-label">Benefits you get</div>
            <div className="mem-upgrade-benefits">
              {membershipBenefits.map((b, i) => (
                <div key={i} className="mem-upgrade-benefit-row">
                  <div className="mem-upgrade-benefit-check">
                    <Check size={11} strokeWidth={3} />
                  </div>
                  <span className="mem-upgrade-benefit-text">{b}</span>
                </div>
              ))}
            </div>
            </>
          )}

          {/* Divider */}
          <div className="mem-upgrade-divider" />

          {/* Step 1: Initial activate CTA */}
          {!showCouponStep && (
            <button
              type="button"
              className="mem-upgrade-btn"
              disabled={fee === 0}
              onClick={() => setShowCouponStep(true)}
            >
              <Crown size={15} />
              Activate{fee > 0 ? ` for ₹${fmtMoney(fee)}` : ""}
            </button>
          )}

          {/* Step 2: Coupon + confirm */}
          {showCouponStep && (
            <div className="mem-coupon-step">

              {/* Coupon input (hidden once valid coupon applied) */}
              {!couponValidation && (
                <div className="mem-coupon-row">
                  <div className="mem-coupon-input-wrap">
                    <Tag size={14} className="mem-coupon-icon" />
                    <input
                      className="mem-coupon-input"
                      type="text"
                      placeholder="Coupon code (optional)"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
                      disabled={validatingCoupon}
                      autoFocus
                    />
                  </div>
                  <button
                    type="button"
                    className="mem-coupon-apply-btn"
                    disabled={!couponInput.trim() || validatingCoupon}
                    onClick={handleApplyCoupon}
                  >
                    {validatingCoupon ? <span className="cta-spinner" /> : "Apply"}
                  </button>
                </div>
              )}

              {/* Error */}
              {couponError && (
                <div className="mem-coupon-error">{couponError}</div>
              )}

              {/* Success state — all numbers from backend */}
              {couponValidation?.valid && (
                <div className="mem-coupon-success">
                  <div className="mem-coupon-success-top">
                    <div className="mem-coupon-success-code">
                      <Tag size={13} />
                      {couponValidation.couponCode}
                    </div>
                    <button
                      type="button"
                      className="mem-coupon-clear-btn"
                      onClick={handleClearCoupon}
                      title="Remove coupon"
                    >
                      <X size={13} />
                    </button>
                  </div>
                  <div className="mem-coupon-price-row">
                    <span className="mem-coupon-price-label">Original price</span>
                    <span className="mem-coupon-price-original">₹{fmtMoney(couponValidation.membershipAmount)}</span>
                  </div>
                  <div className="mem-coupon-price-row">
                    <span className="mem-coupon-price-label">Discount</span>
                    <span className="mem-coupon-price-discount">−₹{fmtMoney(couponValidation.discountAmount)}</span>
                  </div>
                  <div className="mem-coupon-price-row mem-coupon-price-row--total">
                    <span className="mem-coupon-price-label">You pay</span>
                    <span className="mem-coupon-price-payable">₹{fmtMoney(couponValidation.payableAmount)}</span>
                  </div>
                  {couponValidation.savings > 0 && (
                    <div className="mem-coupon-savings-pill">
                      <Sparkles size={13} /> You save ₹{fmtMoney(couponValidation.savings)}
                    </div>
                  )}
                </div>
              )}

              {/* Confirm activation */}
              <button
                type="button"
                className="mem-upgrade-btn"
                disabled={activatingMembership}
                onClick={() => void handleActivate()}
              >
                {activatingMembership ? (
                  <span className="cta-spinner" />
                ) : hasDiscount ? (
                  <>Activate for ₹{fmtMoney(effectiveFee)}</>
                ) : (
                  <>Activate{fee > 0 ? ` for ₹${fmtMoney(fee)}` : ""}</>
                )}
              </button>

              {/* Cancel link */}
              {!activatingMembership && (
                <button
                  type="button"
                  className="mem-coupon-skip-btn"
                  onClick={() => {
                    setShowCouponStep(false);
                    handleClearCoupon();
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          )}

          <p className="mem-upgrade-disclaimer">
            <ShieldCheck size={13} /> No auto-renewal · Instant activation · Cancel anytime
          </p>
        </div>
      )}

    </div>
  );
}
