// ── DashboardScreen.tsx ───────────────────────────────────────────────────────
// Home screen. Shows salary on file, advance limit/used, paydate,
// and a recent-activity summary. All financial figures come directly from
// the backend (dashboard object); no re-computation on the frontend.

import {
  Archive,
  ArrowDownToLine,
  CalendarDays,
  XCircle,
  Clock,
} from "lucide-react";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import type { AdvanceRequest, AppState, View } from "../types/app";
import { formatMoney, formatRequestStatus, formatShortDate } from "../utils/format";
import { useCountUp } from "../hooks/useCountUp";

// ── Payday countdown ring — display-only date math on a backend-provided
// payroll day; no financial figures are derived here. ─────────────────────
function getPaydayInfo(payrollDay: number) {
  const now = new Date();
  const today = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  let daysLeft = payrollDay - today;
  if (daysLeft < 0) daysLeft += daysInMonth;
  const cycleLength = 30;
  const progress = Math.min(Math.max((cycleLength - daysLeft) / cycleLength, 0), 1);
  return { daysLeft, progress };
}

function PaydayRing({ payrollDay }: { payrollDay: number }) {
  const { progress } = useMemo(() => getPaydayInfo(payrollDay), [payrollDay]);
  const [animatedProgress, setAnimatedProgress] = useState(0);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setAnimatedProgress(progress));
    return () => cancelAnimationFrame(frame);
  }, [progress]);

  const size = 28;
  const stroke = 3;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - animatedProgress);

  return (
    <span className="dash-payday-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth={stroke} />
        <circle
          className="dash-payday-ring-progress"
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke="#FFFFFF" strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
    </span>
  );
}

// ── Types ──────────────────────────────────────────────────────────────────────

type DashboardScreenProps = {
  appState: AppState;
  notice: string;
  onNavigate: (view: View) => void;
  setupBlocker?: string;
  onSetupAction?: () => void;
};

// ── Hero card constants (blue gradient) ────────────────────────────────────────

const HERO_BG         = "linear-gradient(160deg, #3A65FF 0%, #315eff 55%, #2549DA 100%)";
const HERO_TEXT       = "#FFFFFF";
const HERO_MUTED      = "rgba(255,255,255,0.65)";
const HERO_BORDER     = "rgba(255,255,255,0.16)";
const HERO_TILE_BG    = "rgba(255,255,255,0.13)";
const HERO_METRIC_USED = "#FFD4A0";   // amber — draws attention to amount drawn

// ── Palette ────────────────────────────────────────────────────────────────────

function dashboardPalette() {
  return {
    bg:          "#FFFFFF",
    panel2:      "#FFFFFF",
    border:      "#E9E6F1",
    text:        "#17151F",
    muted:       "#6B6878",
    dim:         "#9A97A8",
    warm:        "#B4591F",
    green:       "#1F9E67",
    divider:     "#F1EEF7",
    emptyBorder: "#E2DEEE",
    emptyBg:     "#FFFFFF",
    iconTile:    "#F5F3FB",
    shadow:      "0 8px 32px -8px rgba(30,22,54,0.12), 0 1px 0 rgba(30,22,54,0.04)",
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

// ── Status semantic colour ─────────────────────────────────────────────────────

type StatusTone = "success" | "error" | "warning" | "pending" | "neutral";

function statusTone(status: string, disbursalStatus?: string): StatusTone {
  if (disbursalStatus === "Disbursed") return "success";
  const s = status.toLowerCase();
  if (s.includes("reject") || s.includes("cancelled") || s.includes("expired")) return "error";
  if (s.includes("paid") || s.includes("recovered") || s.includes("repaid")) return "success";
  if (s.includes("approved")) return "warning"; // employer/admin approved but not yet disbursed
  return "pending";
}

const TONE_TOKEN = {
  success: { bg: "rgba(16,185,129,0.10)", fg: "#10b981", pill: "rgba(16,185,129,0.12)", pillBorder: "rgba(16,185,129,0.3)" },
  error:   { bg: "rgba(239,68,68,0.10)",  fg: "#ef4444", pill: "rgba(239,68,68,0.12)",  pillBorder: "rgba(239,68,68,0.3)"  },
  warning: { bg: "rgba(245,158,11,0.10)", fg: "#f59e0b", pill: "rgba(245,158,11,0.12)", pillBorder: "rgba(245,158,11,0.3)" },
  pending: { bg: "rgba(49,94,255,0.10)",  fg: "#315eff", pill: "rgba(49,94,255,0.10)",  pillBorder: "rgba(49,94,255,0.25)" },
  neutral: { bg: "rgba(107,104,120,0.10)",fg: "#6B6878", pill: "rgba(107,104,120,0.10)",pillBorder: "rgba(107,104,120,0.2)"},
} as const;

// Most-relevant advance to surface in Recent Activity.
function activeAdvance(requests: AdvanceRequest[]) {
  return (
    requests.find((r) => r.disbursalStatus === "Disbursed" && r.recoveryStatus === "Scheduled") ??
    requests.find((r) => r.disbursalStatus === "Pending") ??
    [...requests].sort((a, b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime())[0]
  );
}

function maskBank(bankName?: string, accountNumber?: string) {
  if (!accountNumber) return bankName || "Linked bank";
  return `${bankName || "Bank"} ••${accountNumber.slice(-4)}`;
}

// Only show repayment row when a recovery amount exists and advance is live.
function hasVisibleRepayment(request?: AdvanceRequest) {
  if (!request) return false;
  return (
    request.disbursalStatus === "Disbursed" ||
    request.status === "Payment Scheduled" ||
    request.status === "Paid" ||
    request.status === "Recovered"
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionLabel({
  children,
  action,
  colors,
}: {
  children: string;
  action?: () => void;
  colors: ReturnType<typeof dashboardPalette>;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
      <span style={{ color: colors.muted, fontSize: 12, fontWeight: 500, letterSpacing: "0.28em", textTransform: "uppercase" }}>
        {children}
      </span>
      {action && (
        <button
          type="button"
          onClick={action}
          style={{ display: "inline-flex", alignItems: "center", gap: 6, color: colors.text, fontSize: 13, fontWeight: 450, background: "transparent", border: 0, cursor: "pointer" }}
        >
          View all
        </button>
      )}
    </div>
  );
}

// ── DashboardScreen ───────────────────────────────────────────────────────────

export function DashboardScreen({ appState, notice, onNavigate, setupBlocker, onSetupAction }: DashboardScreenProps) {
  const { profile, dashboard, requests, bankAccount, peerActivity } = appState;
  const colors = dashboardPalette();

  // ── Data — straight from backend; no derived arithmetic ───────────────────
  const salary       = dashboard?.salaryInHand ?? 0;
  const limit        = dashboard?.approvedLimit ?? 0;
  const advanceTaken = dashboard?.activeRequestAmount ?? 0;
  const payrollDay   = dashboard?.payrollDay;          // day-of-month, e.g. 28
  const recent       = activeAdvance(requests);
  const hasHistory   = requests.length > 0 || advanceTaken > 0;
  const bankMeta     = maskBank(bankAccount?.bankName, bankAccount?.accountNumber);
  const recentDisbursed  = recent?.disbursalStatus === "Disbursed";
  const repaymentAmount  = recent?.totalRecoveryAmount ?? advanceTaken;
  const repaymentDate    = recent?.recoveryDate ? formatShortDate(recent.recoveryDate) : "Payday";
  const showRepaymentRow = hasVisibleRepayment(recent) && repaymentAmount > 0;
  const firstName        = (profile.name || "").split(" ")[0] || "there";
  const animatedSalary   = useCountUp(salary);

  // ── Peer activity ─────────────────────────────────────────────────────────
  const peerInitials = peerActivity?.initials ?? [];
  const peerCount    = peerActivity?.activeUsers ?? 0;

  const PEER_PALETTES = [
    { bg: "rgba(49,94,255,0.18)",  fg: "#2549DA" },
    { bg: "rgba(31,158,103,0.18)", fg: "#1A7A52" },
    { bg: "rgba(245,166,35,0.18)", fg: "#A06800" },
    { bg: "rgba(207,78,255,0.15)", fg: "#8B20B5" },
    { bg: "rgba(255,94,78,0.15)",  fg: "#C02A18" },
  ];

  const shellStyle: CSSProperties = {
    minHeight: "100%",
    background: colors.bg,
    color: colors.text,
    padding: "20px 22px 28px",
  };

  return (
    <div style={shellStyle}>

      {/* ── Notice banner (admin-set messages) ───────────────────────────── */}
      {notice && (
        <div
          className="banner-pop-in"
          style={{
            marginBottom: 14,
            padding: "12px 14px",
            border: `1px solid ${colors.border}`,
            borderRadius: 16,
            background: colors.panel2,
            color: colors.muted,
            fontSize: 12,
          }}
        >
          {notice}
        </div>
      )}

      {/* ── Setup banner (shown until KYC + bank complete) ───────────────── */}
      {setupBlocker && (
        <div
          style={{
            marginBottom: 14,
            padding: "12px 14px",
            borderRadius: 16,
            background: "rgba(49,94,255,0.08)",
            border: "1px solid rgba(49,94,255,0.18)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>🔔</span>
            <span style={{ fontSize: 12, color: "#2549DA", lineHeight: 1.4 }}>{setupBlocker}</span>
          </div>
          {onSetupAction && (
            <button
              onClick={onSetupAction}
              style={{
                flexShrink: 0,
                padding: "6px 12px",
                borderRadius: 10,
                background: "#315EFF",
                color: "#fff",
                fontSize: 11,
                fontWeight: 500,
                border: "none",
                cursor: "pointer",
              }}
            >
              Set up →
            </button>
          )}
        </div>
      )}

      {/* ── Greeting ─────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ color: colors.text, fontSize: 22, fontWeight: 400, letterSpacing: "-0.03em", lineHeight: 1.1 }}>
          Hey, {firstName}
        </div>
        <div style={{ color: colors.muted, fontSize: 13, fontWeight: 400, marginTop: 4 }}>
          Here's your advance overview
        </div>
      </div>

      {/* ── Hero card — blue gradient ─────────────────────────────────────── */}
      <section
        style={{
          position: "relative",
          borderRadius: 22,
          background: HERO_BG,
          padding: "22px 20px 20px",
          overflow: "hidden",
        }}
      >
        {/* Subtle dot pattern overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.10) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
            pointerEvents: "none",
          }}
        />

        {/* ── Salary + paydate row ─────────────────────────────────────── */}
        <div style={{ position: "relative" }}>
          <div style={{ color: HERO_MUTED, fontSize: 11, fontWeight: 500, letterSpacing: "0.26em", textTransform: "uppercase", marginBottom: 8 }}>
            Salary on file
          </div>
          <div style={{ color: HERO_TEXT, fontSize: 28, fontWeight: 450, letterSpacing: "-0.07em", lineHeight: 1 }}>
            {salary ? formatMoney(animatedSalary) : "—"}
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginTop: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, color: HERO_MUTED, fontSize: 13 }}>
              <span className={dashboard ? "dash-sync-dot" : undefined} style={{ width: 7, height: 7, borderRadius: 99, background: "#5BEBA0", flexShrink: 0, position: "relative" }} />
              {dashboard ? "Synced" : "Syncing salary data"}
            </div>
            {payrollDay != null && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: HERO_MUTED, fontSize: 12 }}>
                <PaydayRing payrollDay={payrollDay} />
                <span>{getPaydayInfo(payrollDay).daysLeft}d to payday</span>
              </div>
            )}
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: HERO_BORDER, margin: "20px 0 16px", position: "relative" }} />

        {/* ── Advance: limit + used (2 tiles, straight from backend) ───── */}
        <div style={{ color: HERO_MUTED, fontSize: 11, fontWeight: 500, letterSpacing: "0.22em", textTransform: "uppercase", marginBottom: 10, position: "relative" }}>
          Your advance
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, position: "relative" }}>
          {/* Tile 1 — approved limit */}
          <div style={{ padding: "12px 14px", borderRadius: 16, border: `1px solid ${HERO_BORDER}`, background: HERO_TILE_BG }}>
            <div style={{ color: HERO_MUTED, fontSize: 11, fontWeight: 500, letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 8 }}>
              Total limit
            </div>
            <div style={{ color: HERO_TEXT, fontSize: 16, fontWeight: 500, letterSpacing: "-0.03em" }}>
              {formatMoney(limit)}
            </div>
          </div>
          {/* Tile 2 — amount drawn (highlighted when non-zero) */}
          <div style={{ padding: "12px 14px", borderRadius: 16, border: `1px solid ${HERO_BORDER}`, background: HERO_TILE_BG }}>
            <div style={{ color: HERO_MUTED, fontSize: 11, fontWeight: 500, letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 8 }}>
              Used
            </div>
            <div style={{ color: advanceTaken > 0 ? HERO_METRIC_USED : HERO_TEXT, fontSize: 16, fontWeight: 500, letterSpacing: "-0.03em" }}>
              {formatMoney(advanceTaken)}
            </div>
          </div>
        </div>

        {/* ── CTA — clean full-width blue button, no slide/arrow box ────── */}
        <div style={{ marginTop: 14, position: "relative" }}>
          <button
            type="button"
            onClick={() => onNavigate("advance")}
            style={{
              width: "100%",
              height: 48,
              borderRadius: 12,
              background: "#FFFFFF",
              color: "#315eff",
              border: 0,
              fontSize: 15,
              fontWeight: 500,
              cursor: "pointer",
              boxShadow: "0 4px 20px rgba(0,0,0,0.14)",
            }}
          >
            {hasHistory ? "Manage advance" : "Access advance"}
          </button>
        </div>
      </section>

      {/* ── Recent Activity ───────────────────────────────────────────────── */}
      <section style={{ marginTop: 30 }}>
        <SectionLabel action={() => onNavigate("activity")} colors={colors}>
          Recent Activity
        </SectionLabel>

        {hasHistory && recent ? (
          <div
            style={{
              border: `1px solid ${colors.border}`,
              borderRadius: 22,
              background: colors.panel2,
              overflow: "hidden",
            }}
          >
            {/* Latest advance row */}
            {(() => {
              const tone = statusTone(recent.status, recent.disbursalStatus ?? undefined);
              const t = TONE_TOKEN[tone];
              const statusLabel = formatRequestStatus(recent.status, recent.statusLabel);
              const Icon = tone === "success" ? ArrowDownToLine
                : tone === "error" ? XCircle
                : tone === "warning" ? CalendarDays
                : Clock;
              return (
                <button
                  type="button"
                  onClick={() => onNavigate("activity")}
                  style={{
                    width: "100%",
                    display: "grid",
                    gridTemplateColumns: "42px 1fr auto",
                    alignItems: "center",
                    gap: 14,
                    padding: "18px",
                    background: "transparent",
                    border: 0,
                    color: colors.text,
                    textAlign: "left",
                    cursor: "pointer",
                    borderBottom: showRepaymentRow ? `1px solid ${colors.border}` : undefined,
                  }}
                >
                  {/* Icon tile */}
                  <span style={{
                    width: 36, height: 36, borderRadius: 12,
                    background: t.bg, color: t.fg,
                    display: "grid", placeItems: "center", flexShrink: 0,
                  }}>
                    <Icon size={17} strokeWidth={1.8} />
                  </span>

                  {/* Title + status pill */}
                  <span style={{ minWidth: 0 }}>
                    <span style={{ display: "block", fontSize: 15, fontWeight: 450 }}>
                      {recentDisbursed ? "Advance credited" : "Advance requested"}
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 5, flexWrap: "wrap" }}>
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: 4,
                        padding: "2px 8px", borderRadius: 99,
                        background: t.pill, border: `1px solid ${t.pillBorder}`,
                        fontSize: 11, fontWeight: 500, color: t.fg,
                        whiteSpace: "nowrap",
                      }}>
                        {statusLabel}
                      </span>
                      <span style={{ fontSize: 11, color: colors.muted }}>
                        {formatShortDate(recent.disbursalDate || recent.requestDate)}
                      </span>
                    </span>
                  </span>

                  {/* Amount */}
                  <span style={{
                    color: tone === "success" ? t.fg : tone === "error" ? t.fg : colors.text,
                    fontSize: 15, fontWeight: 450, letterSpacing: "-0.03em", flexShrink: 0,
                  }}>
                    {recentDisbursed ? "+ " : ""}{formatMoney(recent.approvedAmount || recent.requestedAmount)}
                  </span>
                </button>
              );
            })()}

            {/* Repayment row — only when an active recovery is scheduled */}
            {showRepaymentRow && (
              <button
                type="button"
                onClick={() => onNavigate("repayments")}
                style={{
                  width: "100%",
                  display: "grid",
                  gridTemplateColumns: "42px 1fr auto",
                  alignItems: "center",
                  gap: 14,
                  padding: "18px",
                  background: "transparent",
                  border: 0,
                  color: colors.text,
                  textAlign: "left",
                  cursor: "pointer",
                }}
              >
                <span
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 12,
                    background: "rgba(180,89,31,0.14)",
                    color: colors.warm,
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <CalendarDays size={18} />
                </span>
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: 15, fontWeight: 450 }}>Repayment scheduled</span>
                  <small style={{ display: "block", color: colors.muted, fontSize: 12, fontWeight: 400, marginTop: 5 }}>
                    Auto-deduct · {repaymentDate}
                  </small>
                </span>
                <span style={{ color: colors.text, fontSize: 15, fontWeight: 450, letterSpacing: "-0.05em" }}>
                  {formatMoney(repaymentAmount)}
                </span>
              </button>
            )}
          </div>
        ) : (
          /* Empty state */
          <div
            style={{
              height: 116,
              border: `1px dashed ${colors.emptyBorder}`,
              borderRadius: 20,
              display: "grid",
              placeItems: "center",
              textAlign: "center",
              color: colors.dim,
              background: colors.emptyBg,
            }}
          >
            <div>
              <span
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 999,
                  border: `1px solid ${colors.border}`,
                  display: "inline-grid",
                  placeItems: "center",
                  marginBottom: 14,
                }}
              >
                <Archive size={17} />
              </span>
              <div style={{ fontSize: 13, fontWeight: 450 }}>Your first advance will show up here.</div>
            </div>
          </div>
        )}
      </section>

      {/* ── Divider ───────────────────────────────────────────────────────── */}
      <div style={{ height: 1, background: colors.divider, margin: "28px 0 26px" }} />

      {/* ── Peer activity (show only when backend returns data) ───────────── */}
      {(peerInitials.length > 0 || peerCount > 0) && (
        <section>
          <span style={{ display: "block", marginBottom: 16, color: colors.muted, fontSize: 12, fontWeight: 500, letterSpacing: "0.28em", textTransform: "uppercase" }}>
            Your colleagues
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {peerInitials.length > 0 && (
              <div style={{ display: "flex" }}>
                {peerInitials.map((initials, i) => {
                  const p = PEER_PALETTES[i % PEER_PALETTES.length];
                  return (
                    <span
                      key={`${initials}-${i}`}
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 999,
                        marginLeft: i ? -10 : 0,
                        background: p.bg,
                        border: "2px solid #FFFFFF",
                        color: p.fg,
                        display: "grid",
                        placeItems: "center",
                        fontSize: 12,
                        fontWeight: 500,
                        letterSpacing: "0.02em",
                        zIndex: peerInitials.length - i,
                        position: "relative",
                      }}
                    >
                      {initials}
                    </span>
                  );
                })}
              </div>
            )}
            <div>
              <div style={{ color: colors.text, fontSize: 15, fontWeight: 500 }}>
                {peerCount} colleague{peerCount !== 1 ? "s" : ""}
              </div>
              <div style={{ color: colors.muted, fontSize: 12, fontWeight: 400, marginTop: 2 }}>
                using MobPae advances
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
