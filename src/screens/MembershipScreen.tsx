import { useState } from "react";
import { Check, CheckCircle2, Crown, Tag, X } from "lucide-react";
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
    freePlanTitle,
    membershipTitle,
    membershipSubtitle,
    freeBenefits,
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

  const configLoaded = freeBenefits.length > 0 || membershipBenefits.length > 0;

  const compareRows: [string, boolean, boolean][] = [
    ...freeBenefits.map((b): [string, boolean, boolean] => [b, true, true]),
    ...membershipBenefits.map((b): [string, boolean, boolean] => [b, false, true]),
  ];

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
      <div className="screen-header">
        <div className="screen-header-text">
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
            {membershipActive ? planName : freePlanTitle}
          </div>
          <span className={`mem-status-badge ${membershipActive ? "mem-status-badge--active" : "mem-status-badge--free"}`}>
            {membershipActive ? "Active" : "Free plan"}
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

      {/* ── Plan comparison + upgrade (inactive view) ────────────────── */}
      {!membershipActive && (
        <>
          {/* ── Upgrade box (shown first so CTA is visible) ─────────── */}
          {(fee > 0 || configLoaded) && (
            <div className="mem-upgrade-box">
              <div className="mem-upgrade-box-top">
                <div className="mem-upgrade-crown-wrap">
                  <Crown size={22} color="#fbbf24" />
                </div>
                <div>
                  <div className="mem-upgrade-box-title">
                    Upgrade to {membershipTitle || "Premium"}
                  </div>
                  <div className="mem-upgrade-box-sub">
                    {fee > 0 ? `₹${fmtMoney(fee)}` : "—"}
                    {membershipValidityDays > 0 ? ` · ${membershipValidityDays} days` : ""}
                    {" · One-time"}
                  </div>
                </div>
              </div>

              {/* Step 1: Initial activate CTA */}
              {!showCouponStep && (
                <button
                  type="button"
                  className="mem-upgrade-btn"
                  disabled={fee === 0}
                  onClick={() => setShowCouponStep(true)}
                >
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

                  {/* Success state — all numbers from backend, zero frontend calc */}
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
                          🎉 You save ₹{fmtMoney(couponValidation.savings)}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Confirm activation */}
                  <button
                    type="button"
                    className="mem-upgrade-btn"
                    disabled={activatingMembership}
                    onClick={() => {
                      setPaidAmount(effectiveFee > 0 ? effectiveFee : fee);
                      onActivateMembership();
                      setJustActivated(true);
                    }}
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
                No auto-renewal · Instant activation · Cancel anytime
              </p>
            </div>
          )}

          {/* ── Plan comparison (reference, shown below CTA) ─────────── */}
          <div className="mem-section-label">What's included</div>

          {!configLoaded ? (
            <div className="mem-config-loading">Loading plan details…</div>
          ) : (
            <div className="mem-compare-table">
              <div className="mem-compare-header">
                <div className="mem-compare-header-feature" />
                <div className="mem-compare-header-col mem-compare-header-col--free">
                  {freePlanTitle || "Free"}
                </div>
                <div className="mem-compare-header-col mem-compare-header-col--premium">
                  <Crown size={11} color="#fbbf24" />
                  {membershipTitle || "Premium"}
                </div>
              </div>
              {compareRows.map(([label, freeHas, premiumHas], i) => (
                <div key={i} className={`mem-compare-row ${i % 2 === 1 ? "mem-compare-row--alt" : ""}`}>
                  <div className="mem-compare-row-label">{label}</div>
                  <div className="mem-compare-row-cell">
                    {freeHas
                      ? <span className="mem-cell-check"><Check size={13} strokeWidth={3} /></span>
                      : <span className="mem-cell-cross"><X size={13} strokeWidth={3} /></span>
                    }
                  </div>
                  <div className="mem-compare-row-cell">
                    {premiumHas
                      ? <span className="mem-cell-check mem-cell-check--premium"><Check size={13} strokeWidth={3} /></span>
                      : <span className="mem-cell-cross"><X size={13} strokeWidth={3} /></span>
                    }
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

    </div>
  );
}
