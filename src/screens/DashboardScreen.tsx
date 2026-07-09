import {
  Archive,
  ArrowDownToLine,
  ArrowRight,
  CalendarDays,
} from "lucide-react";
import type { CSSProperties } from "react";
import type { AdvanceRequest, AppState, View } from "../types/app";
import { formatMoney, formatRequestStatus, formatShortDate } from "../utils/format";
import type { Theme } from "../hooks/useTheme";

type DashboardScreenProps = {
  appState: AppState;
  notice: string;
  onNavigate: (view: View) => void;
  theme?: Theme;
};

const DARK = "#0C0C0E";
const PANEL = "#17171B";
const PANEL_2 = "#141418";
const BORDER = "#29292F";
const TEXT = "#F2F0EA";
const MUTED = "#8A8892";
const DIM = "#5C5C64";
const WARM = "#B4591F";
const GREEN = "#20A46A";

function latestRequest(requests: AdvanceRequest[]) {
  return [...requests].sort(
    (a, b) =>
      new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime()
  )[0];
}

function activeAdvance(requests: AdvanceRequest[]) {
  return (
    requests.find(
      (r) =>
        r.disbursalStatus === "Disbursed" && r.recoveryStatus === "Scheduled"
    ) ??
    requests.find((r) => r.disbursalStatus === "Pending") ??
    latestRequest(requests)
  );
}

function firstNameOnly(displayName: string) {
  return displayName.trim().split(/\s+/)[0] || "Colleague";
}

function maskBank(bankName?: string, accountNumber?: string) {
  if (!accountNumber) return bankName || "Linked bank";
  return `${bankName || "Bank"} ••${accountNumber.slice(-4)}`;
}

function peerTime(daysAgo: number) {
  if (daysAgo <= 0) return "Today";
  if (daysAgo === 1) return "Yesterday";
  return `${daysAgo}d ago`;
}

function dashboardPalette(theme: Theme) {
  if (theme === "light") {
    return {
      bg: "#FFFFFF",
      panel: "#FFFFFF",
      panel2: "#FFFFFF",
      border: "#E9E6F1",
      text: "#17151F",
      muted: "#6B6878",
      dim: "#9A97A8",
      warm: "#B4591F",
      green: "#1F9E67",
      ring: "#315eff",
      ringTrack: "#EEEBF6",
      divider: "#F1EEF7",
      emptyBorder: "#E2DEEE",
      emptyBg: "#FFFFFF",
      ctaBg: "#315eff",
      ctaText: "#FFFFFF",
      ctaIconBg: "#FFFFFF",
      ctaIconText: "#315eff",
      iconTile: "#F5F3FB",
      shadow: "0 8px 32px -8px rgba(30,22,54,0.12), 0 1px 0 rgba(30,22,54,0.04)",
    };
  }

  return {
    bg: DARK,
    panel: PANEL,
    panel2: PANEL_2,
    border: BORDER,
    text: TEXT,
    muted: MUTED,
    dim: DIM,
    warm: WARM,
    green: GREEN,
    ring: TEXT,
    ringTrack: "#2A2A30",
    divider: "#1C1C20",
    emptyBorder: "#303036",
    emptyBg: "rgba(20,20,24,0.32)",
    ctaBg: "#F4F1E8",
    ctaText: "#11100D",
    ctaIconBg: "#0F0E0C",
    ctaIconText: "#F4F1E8",
    iconTile: PANEL_2,
    shadow: "0 4px 24px rgba(0,0,0,0.28), 0 1px 0 rgba(255,255,255,0.03)",
  };
}

function hasVisibleRepayment(request?: AdvanceRequest) {
  if (!request) return false;
  return (
    request.disbursalStatus === "Disbursed" ||
    request.status === "Payment Scheduled" ||
    request.status === "Paid" ||
    request.status === "Recovered"
  );
}

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
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 14,
      }}
    >
      <span
        style={{
          color: colors.muted,
          fontSize: 12,
          fontWeight: 500,
          letterSpacing: "0.28em",
          textTransform: "uppercase",
        }}
      >
        {children}
      </span>
      {action && (
        <button
          type="button"
          onClick={action}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            color: colors.text,
            fontSize: 13,
            fontWeight: 450,
            background: "transparent",
            border: 0,
          }}
        >
          View all <ArrowRight size={15} strokeWidth={2.1} />
        </button>
      )}
    </div>
  );
}

export function DashboardScreen({
  appState,
  notice,
  onNavigate,
  theme = "dark",
}: DashboardScreenProps) {
  const { profile, dashboard, requests, bankAccount, peerActivity } = appState;
  const colors = dashboardPalette(theme);
  const DARK = colors.bg;
  const PANEL = colors.panel;
  const PANEL_2 = colors.panel2;
  const BORDER = colors.border;
  const TEXT = colors.text;
  const MUTED = colors.muted;
  const DIM = colors.dim;
  const WARM = colors.warm;
  const GREEN = colors.green;

  const monthlySalary = dashboard?.salaryInHand ?? profile.salaryLimit ?? 0;
  const limit = dashboard?.approvedLimit ?? monthlySalary;
  const current = activeAdvance(requests);
  const advanceTaken = current
    ? current.approvedAmount || current.requestedAmount
    : dashboard?.activeRequestAmount ?? 0;
  const availableNow =
    dashboard?.availableAdvance ?? Math.max(0, limit - advanceTaken);
  const heroMetrics = [
    { label: "Total limit", value: formatMoney(limit), tone: TEXT },
    { label: "Used", value: formatMoney(advanceTaken), tone: advanceTaken > 0 ? WARM : TEXT },
    { label: "Available", value: formatMoney(availableNow), tone: GREEN },
  ];
  const usedPercent =
    limit > 0 ? Math.min(100, Math.round((advanceTaken / limit) * 100)) : 0;
  const hasAdvanceHistory = requests.length > 0 || advanceTaken > 0;
  const primaryActionCopy = hasAdvanceHistory ? "Manage advance" : "Access advance";
  const bankMeta = maskBank(bankAccount?.bankName, bankAccount?.accountNumber);
  const recent = current ?? latestRequest(requests);
  const repaymentAmount = recent?.totalRecoveryAmount || advanceTaken;
  const repaymentDate = recent?.recoveryDate ? formatShortDate(recent.recoveryDate) : "Payday";
  const recentIsDisbursed = recent?.disbursalStatus === "Disbursed";
  const showRepaymentRow = hasVisibleRepayment(recent) && repaymentAmount > 0;
  const peer = peerActivity;
  const peerRows = peer?.recentActivity?.slice(0, 3) ?? [];
  const peerCount = peer?.activeUsers ?? 0;

  const shellStyle: CSSProperties = {
    minHeight: "100%",
    background: DARK,
    color: TEXT,
    
    padding: "20px 22px 28px",
  };

  return (
    <div style={shellStyle}>
      {notice && (
        <div
          style={{
            marginBottom: 14,
            padding: "12px 14px",
            border: `1px solid ${BORDER}`,
            borderRadius: 16,
            background: PANEL_2,
            color: MUTED,
            fontSize: 12,
            fontWeight: 400,
          }}
        >
          {notice}
        </div>
      )}

      <section
        style={{
          border: `1px solid ${BORDER}`,
          borderRadius: 22,
          background: PANEL,
          padding: "24px 22px 22px",
          boxShadow: colors.shadow,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "92px 1fr",
            gap: 22,
            alignItems: "center",
          }}
        >
          <div
            aria-label={`${usedPercent}% salary advance used`}
            style={{
              width: 78,
              height: 78,
              borderRadius: 999,
              background: `conic-gradient(${colors.ring} ${usedPercent > 0 ? Math.max(14, usedPercent * 3.6) : 0}deg, ${colors.ringTrack} 0deg)`,
              padding: 6,
              display: "grid",
              placeItems: "center",
            }}
          >
            <div
              style={{
                width: "100%",
                height: "100%",
                borderRadius: 999,
                background: PANEL,
                border: `1px solid ${BORDER}`,
                display: "grid",
                placeItems: "center",
                textAlign: "center",
              }}
            >
              <span
                style={{
                  color: TEXT,
                  fontSize: 15,
                  fontWeight: 500,
                  lineHeight: 1,
                }}
              >
                {usedPercent}%
              </span>
              <span
                style={{
                  color: MUTED,
                  fontSize: 9,
                  fontWeight: 500,
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  marginTop: -12,
                }}
              >
                Used
              </span>
            </div>
          </div>

          <div>
            <div
              style={{
                color: MUTED,
                fontSize: 12,
                fontWeight: 500,
                letterSpacing: "0.26em",
                textTransform: "uppercase",
                marginBottom: 8,
              }}
            >
              Salary on File
            </div>
            <div
              style={{
                color: TEXT,
                
                fontSize: 28,
                fontWeight: 450,
                letterSpacing: "-0.07em",
                lineHeight: 1,
              }}
            >
              {monthlySalary ? formatMoney(monthlySalary) : "—"}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                color: MUTED,
                fontSize: 13,
                fontWeight: 400,
                marginTop: 14,
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: 99,
                  background: GREEN,
                }}
              />
              {dashboard ? "Updated today" : "Syncing salary data"}
            </div>
          </div>
        </div>

        <div
          style={{
            height: 1,
            background: BORDER,
            margin: "24px 0 16px",
          }}
        />

        <div
          style={{
            color: MUTED,
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            marginBottom: 10,
          }}
        >
          Advance limit
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: 8,
            alignItems: "stretch",
          }}
        >
          {heroMetrics.map((metric) => (
            <div
              key={metric.label}
              style={{
                minWidth: 0,
                padding: "12px 10px",
                borderRadius: 16,
                border: `1px solid ${theme === "light" ? colors.divider : "rgba(242,240,234,0.045)"}`,
                background: theme === "light" ? "#F3F1FB" : "rgba(255,255,255,0.03)",
              }}
            >
              <div
                style={{
                  color: MUTED,
                  fontSize: 11,
                  lineHeight: 1.2,
                  fontWeight: 500,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  marginBottom: 9,
                }}
              >
                {metric.label}
              </div>
              <div
                style={{
                  
                  color: metric.tone,
                  fontSize: 14,
                  fontWeight: 500,
                  letterSpacing: "-0.02em",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {metric.value}
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 14 }}>
          <button
            type="button"
            onClick={() => onNavigate("advance")}
            style={{
              width: "100%",
              height: 50,
              borderRadius: 14,
              background: colors.ctaBg,
              color: colors.ctaText,
              padding: "0 8px 0 18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 14,
              fontSize: 15,
              fontWeight: 500,
              whiteSpace: "nowrap",
              boxShadow: theme === "light" ? "0 12px 32px -8px rgba(30,22,54,0.14)" : "0 14px 32px rgba(0,0,0,0.26)",
            }}
          >
            {primaryActionCopy}
            <span
              style={{
                width: 34,
                height: 34,
                borderRadius: 11,
                background: colors.ctaIconBg,
                color: colors.ctaIconText,
                display: "grid",
                placeItems: "center",
              }}
            >
              <ArrowRight size={18} />
            </span>
          </button>
        </div>
      </section>

      <section style={{ marginTop: 30 }}>
        <SectionLabel action={() => onNavigate("activity")} colors={colors}>Recent Activity</SectionLabel>

        {hasAdvanceHistory && recent ? (
          <div
            style={{
              border: `1px solid ${BORDER}`,
              borderRadius: 22,
              background: PANEL_2,
              overflow: "hidden",
            }}
          >
            <button
              type="button"
              onClick={() => onNavigate("activity")}
              style={{
                width: "100%",
                display: "grid",
                gridTemplateColumns: "42px 1fr auto",
                alignItems: "center",
                gap: 14,
                padding: "18px 18px",
                background: "transparent",
                color: TEXT,
                textAlign: "left",
                borderBottom: `1px solid ${BORDER}`,
              }}
            >
              <span
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 12,
                    background: recentIsDisbursed ? "rgba(31,158,103,0.10)" : colors.iconTile,
                    color: recentIsDisbursed ? GREEN : "#C9C7D0",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                {recentIsDisbursed ? <ArrowDownToLine size={18} /> : <CalendarDays size={18} />}
              </span>
              <span style={{ minWidth: 0 }}>
                <span style={{ display: "block", fontSize: 15, fontWeight: 500 }}>
                  {recentIsDisbursed ? "Advance credited" : "Advance requested"}
                </span>
                <small
                  style={{
                    display: "block",
                    color: MUTED,
                    fontSize: 12,
                    fontWeight: 400,
                    marginTop: 5,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {recentIsDisbursed ? `To ${bankMeta}` : formatRequestStatus(recent.status, recent.statusLabel)} ·{" "}
                  {formatShortDate(recent.disbursalDate || recent.requestDate)}
                </small>
              </span>
              <span
                style={{
                  color: recentIsDisbursed ? GREEN : TEXT,
                  
                  fontSize: 15,
                  fontWeight: 450,
                  letterSpacing: "-0.05em",
                }}
              >
                {recentIsDisbursed ? "+ " : ""}
                {formatMoney(recent.approvedAmount || recent.requestedAmount)}
              </span>
            </button>

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
                  padding: "18px 18px",
                  background: "transparent",
                  color: TEXT,
                  textAlign: "left",
                }}
              >
                <span
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 12,
                    background: "rgba(180,89,31,0.14)",
                    color: WARM,
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <CalendarDays size={18} />
                </span>
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: 15, fontWeight: 500 }}>
                    Repayment scheduled
                  </span>
                  <small
                    style={{
                      display: "block",
                      color: MUTED,
                      fontSize: 12,
                      fontWeight: 400,
                      marginTop: 5,
                    }}
                  >
                    Auto-deduct · {repaymentDate}
                  </small>
                </span>
                <span
                  style={{
                    color: TEXT,
                    
                    fontSize: 15,
                    fontWeight: 450,
                    letterSpacing: "-0.05em",
                  }}
                >
                  {formatMoney(repaymentAmount)}
                </span>
              </button>
            )}
          </div>
        ) : (
          <div
            style={{
              height: 116,
              border: `1px dashed ${colors.emptyBorder}`,
              borderRadius: 20,
              display: "grid",
              placeItems: "center",
              textAlign: "center",
              color: DIM,
              background: colors.emptyBg,
            }}
          >
            <div>
              <span
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 999,
                  border: `1px solid ${BORDER}`,
                  display: "inline-grid",
                  placeItems: "center",
                  marginBottom: 14,
                }}
              >
                <Archive size={17} />
              </span>
              <div style={{ fontSize: 13, fontWeight: 450 }}>
                Your first advance will show up here.
              </div>
            </div>
          </div>
        )}
      </section>

      <div style={{ height: 1, background: colors.divider, margin: "28px 0 26px" }} />

      <section>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 18,
          }}
        >
          <span
            style={{
              color: MUTED,
              fontSize: 12,
              fontWeight: 500,
              letterSpacing: "0.28em",
              textTransform: "uppercase",
            }}
          >
            Your colleagues
          </span>
          {peerCount > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ display: "flex" }}>
                {peerRows.slice(0, 3).map((item, i) => {
                  const initial = firstNameOnly(item.displayName)[0]?.toUpperCase() ?? "M";
                  return (
                    <span
                      key={`${item.displayName}-${i}`}
                      style={{
                        width: 21,
                        height: 21,
                        borderRadius: 999,
                        marginLeft: i ? -6 : 0,
                        background: theme === "light" ? "#F5F3FB" : "#25252B",
                        border: `1px solid ${DARK}`,
                        color: TEXT,
                        display: "grid",
                        placeItems: "center",
                        fontSize: 10,
                        fontWeight: 500,
                      }}
                    >
                      {initial}
                    </span>
                  );
                })}
              </div>
              <span style={{ color: TEXT, fontSize: 13, fontWeight: 500 }}>
                {peerCount} on Advance
              </span>
            </div>
          )}
        </div>

        {peerRows.length > 0 ? (
          <div style={{ display: "grid", gap: 18 }}>
            {peerRows.map((item, i) => {
              const name = firstNameOnly(item.displayName);
              return (
                <div
                  key={`${item.displayName}-${item.action}-${i}`}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "42px 1fr auto",
                    gap: 14,
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 999,
                      border: `1px solid ${BORDER}`,
                      background: PANEL_2,
                      color: TEXT,
                      display: "grid",
                      placeItems: "center",
                      fontSize: 15,
                      fontWeight: 500,
                    }}
                  >
                    {name[0]?.toUpperCase() ?? "M"}
                  </span>
                  <span style={{ minWidth: 0, color: MUTED, fontSize: 13.5, fontWeight: 400 }}>
                    <span style={{ color: TEXT, fontWeight: 500 }}>{name}</span>{" "}
                    {item.action}
                  </span>
                  <span
                    style={{
                      color: DIM,
                      
                      fontSize: 11.5,
                      fontWeight: 400,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {peerTime(item.daysAgo)}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div
            style={{
              padding: "20px 0 4px",
              color: DIM,
              fontSize: 13,
              fontWeight: 400,
              textAlign: "center",
            }}
          >
            Colleague activity will appear here once others join.
          </div>
        )}
      </section>
    </div>
  );
}
