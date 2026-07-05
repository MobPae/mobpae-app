import { CheckCircle2, CreditCard, ShieldCheck } from "lucide-react";
import type { AdvanceRequest, BankAccount, View } from "../types/app";
import { formatMoney } from "../utils/format";
import type { Theme } from "../hooks/useTheme";

type RepaymentScheduleScreenProps = {
  requests: AdvanceRequest[];
  bankAccount?: BankAccount | null;
  onNavigate: (view: View) => void;
  theme?: Theme;
};

const DARK = "#0C0C0E";
const PANEL = "#17171B";
const PANEL_SOFT = "#141418";
const BORDER = "#29292F";
const TEXT = "#F2F0EA";
const MUTED = "#8A8892";
const DIM = "#5C5C64";
const WARM = "#B4591F";
const GREEN = "#20A46A";

function repaymentPalette(theme: Theme) {
  if (theme === "light") {
    return {
      bg: "#FFFFFF",
      panel: "#FFFFFF",
      panelSoft: "#F5F3FB",
      border: "#E9E6F1",
      text: "#17151F",
      muted: "#6B6878",
      dim: "#9A97A8",
      warm: "#B4591F",
      green: "#1F9E67",
      rule: "#F1EEF7",
      progressTrack: "#EEEBF6",
      progressFill: "#5B3CE3",
      paperBg: "#F1EDFC",
      paperInk: "#1E1636",
      paperMuted: "#6E6786",
      paperRule: "#DCD5F2",
      shadow: "0 30px 80px -30px rgba(30,22,54,0.14)",
    };
  }

  return {
    bg: DARK,
    panel: PANEL,
    panelSoft: PANEL_SOFT,
    border: BORDER,
    text: TEXT,
    muted: MUTED,
    dim: DIM,
    warm: WARM,
    green: GREEN,
    rule: BORDER,
    progressTrack: "#29292F",
    progressFill: TEXT,
    paperBg: "#F4F1E8",
    paperInk: "#11100D",
    paperMuted: "#928D82",
    paperRule: "#D9D2C0",
    shadow: "0 22px 52px rgba(0,0,0,0.28)",
  };
}

function formatDate(dateStr?: string) {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
}

function daysLeft(dateStr?: string) {
  if (!dateStr) return 0;
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return 0;
  return Math.max(0, Math.ceil((date.getTime() - Date.now()) / 86_400_000));
}

function maskBank(bankAccount?: BankAccount | null) {
  if (!bankAccount?.accountNumber) return "Linked salary account";
  return `${bankAccount.bankName || "Bank"} · ••••${bankAccount.accountNumber.slice(-4)}`;
}

function activeRepayment(requests: AdvanceRequest[]) {
  return requests.find(
    (request) =>
      (request.disbursalStatus === "Disbursed" ||
        request.status === "Payment Scheduled" ||
        request.status === "Paid" ||
        request.status === "Recovered") &&
      request.recoveryStatus === "Scheduled" &&
      !["Paid", "Recovered", "Rejected", "Cancelled", "Expired"].includes(request.status),
  );
}

function EmptyRepayment({ colors }: { colors: ReturnType<typeof repaymentPalette> }) {
  return (
    <div
      style={{
        minHeight: "calc(100dvh - 180px)",
        display: "grid",
        placeItems: "center",
        textAlign: "center",
        padding: "0 24px 56px",
      }}
    >
      <div>
        <div
          style={{
            width: 74,
            height: 74,
            borderRadius: 999,
            border: `1px solid ${colors.border}`,
            background: colors.panelSoft,
            color: colors.dim,
            display: "grid",
            placeItems: "center",
            margin: "0 auto 28px",
          }}
        >
          <CheckCircle2 size={28} strokeWidth={1.7} />
        </div>
        <h1
          style={{
            margin: 0,
            color: colors.text,
            fontSize: 22,
            fontWeight: 750,
            letterSpacing: "-0.04em",
          }}
        >
          Nothing to repay yet
        </h1>
        <p
          style={{
            margin: "18px auto 0",
            maxWidth: 270,
            color: colors.muted,
            fontSize: 14,
            fontWeight: 600,
            lineHeight: 1.55,
          }}
        >
          Once you take an advance, your due date and full repayment breakdown will appear here.
        </p>
        <div
          style={{
            height: 40,
            borderRadius: 14,
            border: `1px solid ${colors.border}`,
            color: colors.muted,
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            padding: "0 18px",
            marginTop: 30,
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          <CreditCard size={16} strokeWidth={1.9} />
          Auto-deduct from salary is ready
        </div>
      </div>
    </div>
  );
}

export function RepaymentScheduleScreen({
  requests,
  bankAccount,
  theme = "dark",
}: RepaymentScheduleScreenProps) {
  const colors = repaymentPalette(theme);
  const DARK = colors.bg;
  const PANEL = colors.panel;
  const BORDER = colors.border;
  const TEXT = colors.text;
  const MUTED = colors.muted;
  const DIM = colors.dim;
  const WARM = colors.warm;
  const GREEN = colors.green;
  const request = activeRepayment(requests);

  if (!request) {
    return <EmptyRepayment colors={colors} />;
  }

  const principal = request.approvedAmount || request.requestedAmount || request.principalAmount || 0;
  const interest = request.interestAmount || Math.max(0, (request.totalRecoveryAmount || 0) - principal);
  const total = request.totalRecoveryAmount || principal + interest;
  const dueDate = request.recoveryDate;
  const left = daysLeft(dueDate);
  const progress = Math.max(5, Math.min(100, 100 - Math.round((left / Math.max(request.interestDays || left || 1, 1)) * 100)));

  return (
    <div
      style={{
        minHeight: "100%",
        background: DARK,
        color: TEXT,
        fontFamily: "'Space Grotesk', sans-serif",
        padding: "18px 22px 30px",
      }}
    >
      <section
        style={{
          border: `1px solid ${BORDER}`,
          borderRadius: 22,
          background: PANEL,
          padding: "26px 22px 24px",
          boxShadow: colors.shadow,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "start" }}>
          <div>
            <div
              style={{
                color: MUTED,
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.28em",
                textTransform: "uppercase",
                marginBottom: 22,
              }}
            >
              Outstanding
            </div>
            <div
              style={{
                color: TEXT,
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 33,
                fontWeight: 650,
                letterSpacing: "-0.08em",
                lineHeight: 1,
              }}
            >
              {formatMoney(total)}
            </div>
            <div style={{ color: MUTED, fontSize: 13, fontWeight: 600, marginTop: 14 }}>
              1 active advance · recovers this cycle
            </div>
          </div>
          <span
            style={{
              height: 34,
              borderRadius: 999,
              border: "1px solid rgba(180,89,31,0.52)",
              background: "rgba(180,89,31,0.14)",
              color: WARM,
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "0 14px",
              fontSize: 12,
              fontWeight: 750,
            }}
          >
            <span style={{ width: 7, height: 7, borderRadius: 99, background: WARM }} />
            Active
          </span>
        </div>

        <div style={{ height: 1, background: colors.rule, margin: "24px 0 22px" }} />

        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 20 }}>
          <div>
            <div style={{ color: MUTED, fontSize: 12, fontWeight: 650, marginBottom: 10 }}>
              Auto-deducts on
            </div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 16, fontWeight: 650 }}>
              {formatDate(dueDate)}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: MUTED, fontSize: 12, fontWeight: 650, marginBottom: 10 }}>
              Days left
            </div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 16, fontWeight: 650 }}>
              {left}
            </div>
          </div>
        </div>

        <div style={{ height: 6, borderRadius: 999, background: colors.progressTrack, marginTop: 22, overflow: "hidden" }}>
          <div style={{ width: `${progress}%`, height: "100%", borderRadius: 999, background: colors.progressFill }} />
        </div>
        <div style={{ color: DIM, fontSize: 12, fontWeight: 600, marginTop: 12 }}>
          Salary cycle · resets on payday
        </div>
      </section>

      <section
        style={{
          border: `1px solid ${BORDER}`,
          borderRadius: 18,
          background: PANEL,
          minHeight: 62,
          display: "grid",
          gridTemplateColumns: "42px 1fr auto",
          alignItems: "center",
          gap: 14,
          padding: "15px 18px",
          marginTop: 18,
        }}
      >
        <span
          style={{
            width: 40,
            height: 40,
            borderRadius: 14,
            border: `1px solid ${BORDER}`,
            display: "grid",
            placeItems: "center",
            color: theme === "light" ? "#5B3CE3" : "#C9C7D0",
            background: theme === "light" ? "#F5F3FB" : "transparent",
          }}
        >
          <CreditCard size={18} strokeWidth={1.9} />
        </span>
        <span style={{ minWidth: 0 }}>
          <strong style={{ display: "block", color: TEXT, fontSize: 15, fontWeight: 750 }}>
            Auto-deduct from salary
          </strong>
          <small
            style={{
              display: "block",
              color: MUTED,
              fontSize: 12,
              fontWeight: 600,
              marginTop: 6,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {maskBank(bankAccount)}
          </small>
        </span>
        <span style={{ color: GREEN, fontSize: 12, fontWeight: 750 }}>On</span>
      </section>

      <section
        style={{
          position: "relative",
          borderRadius: 22,
          background: colors.paperBg,
          color: colors.paperInk,
          padding: "22px 22px 24px",
          marginTop: 18,
          overflow: "visible",
          fontFamily: "'Space Grotesk', sans-serif",
        }}
      >
        <span
          style={{
            position: "absolute",
            left: -10,
            top: "52%",
            width: 20,
            height: 28,
            borderRadius: "0 999px 999px 0",
            background: DARK,
          }}
        />
        <span
          style={{
            position: "absolute",
            right: -10,
            top: "52%",
            width: 20,
            height: 28,
            borderRadius: "999px 0 0 999px",
            background: DARK,
          }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
          <div
            style={{
              color: colors.paperMuted,
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: "0.28em",
              textTransform: "uppercase",
            }}
          >
            Breakdown
          </div>
          <div style={{ color: colors.paperMuted, fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, fontWeight: 600 }}>
            {request.interestDays || left} days @ {request.interestRate || 36}%
          </div>
        </div>

        {[
          { label: "Principal", value: formatMoney(principal), color: colors.paperInk },
          { label: "Interest accrued", value: `+ ${formatMoney(interest)}`, color: WARM },
        ].map((row, index) => (
          <div key={row.label}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
              <span style={{ color: colors.paperMuted, fontSize: 14, fontWeight: 650 }}>{row.label}</span>
              <strong
                style={{
                  color: row.color,
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 16,
                  fontWeight: 650,
                  letterSpacing: "-0.05em",
                }}
              >
                {row.value}
              </strong>
            </div>
            {index === 0 && <div style={{ borderTop: `1px dashed ${colors.paperRule}`, margin: "20px 0" }} />}
          </div>
        ))}

        <div style={{ borderTop: `1px dashed ${colors.paperRule}`, margin: "20px 0 18px" }} />
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "end" }}>
          <span>
            <small style={{ display: "block", color: colors.paperMuted, fontSize: 12, fontWeight: 650, marginBottom: 7 }}>
              Due {formatDate(dueDate)}
            </small>
            <strong style={{ color: colors.paperMuted, fontSize: 15, fontWeight: 750 }}>Total repayment</strong>
          </span>
          <strong
            style={{
              color: colors.paperInk,
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 23,
              fontWeight: 650,
              letterSpacing: "-0.08em",
            }}
          >
            {formatMoney(total)}
          </strong>
        </div>
      </section>

      <div style={{ display: "flex", alignItems: "start", gap: 10, color: MUTED, fontSize: 12, fontWeight: 600, lineHeight: 1.35, marginTop: 20 }}>
        <ShieldCheck size={14} strokeWidth={1.8} color={DIM} />
        Auto-recovered from salary on payday · no action needed
      </div>
    </div>
  );
}
