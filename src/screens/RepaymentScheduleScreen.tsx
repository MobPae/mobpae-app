import { CheckCircle2, CreditCard, ShieldCheck, Landmark } from "lucide-react";
import type { AdvanceRequest, BankAccount, View } from "../types/app";
import { formatMoney } from "../utils/format";

type RepaymentScheduleScreenProps = {
  requests: AdvanceRequest[];
  bankAccount?: BankAccount | null;
  onNavigate?: (view: View) => void;
};

function repaymentPalette() {
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
    progressFill: "#315eff",
    paperBg: "#F1EDFC",
    paperInk: "#1E1636",
    paperMuted: "#6E6786",
    paperRule: "#DCD5F2",
    shadow: "0 30px 80px -30px rgba(30,22,54,0.14)",
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
            fontWeight: 500,
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
            fontWeight: 400,
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
            fontWeight: 500,
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
}: RepaymentScheduleScreenProps) {
  const colors = repaymentPalette();
  const DARK = colors.bg;
  const PANEL = colors.panel;
  const BORDER = colors.border;
  const TEXT = colors.text;
  const MUTED = colors.muted;
  const DIM = colors.dim;
  const WARM = colors.warm;
  const GREEN = colors.green;
  const request = activeRepayment(requests);
  const activeRepaymentCount = requests.filter(
    (r) =>
      (r.disbursalStatus === "Disbursed" || r.status === "Payment Scheduled") &&
      r.recoveryStatus === "Scheduled" &&
      !["Paid", "Recovered", "Rejected", "Cancelled", "Expired"].includes(r.status),
  ).length || 1;

  if (!request) {
    return <EmptyRepayment colors={colors} />;
  }

  const principal = request.approvedAmount || request.requestedAmount || request.principalAmount || 0;
  const interest = request.interestAmount || Math.max(0, (request.totalRecoveryAmount || 0) - principal);
  const total = request.totalRecoveryAmount || principal + interest;
  const dueDate = request.recoveryDate;
  const left = daysLeft(dueDate);
  const totalDays = request.interestDays || Math.max(left, 1);
  const progress = Math.min(100, Math.max(0, 100 - Math.round((left / totalDays) * 100)));

  const blue = "#315eff";
  const blueSoft = "rgba(49,94,255,0.08)";
  const blueBorder = "rgba(49,94,255,0.18)";
  const daysColor = left <= 3 ? "#ef4444" : left <= 7 ? WARM : blue;

  return (
    <div style={{ minHeight: "100%", background: DARK, color: TEXT, padding: "16px 18px 32px" }}>

      {/* ── Card 1: Summary + auto-deduct ── */}
      <section style={{ borderRadius: 18, border: `1px solid ${blueBorder}`, background: PANEL, overflow: "hidden", marginBottom: 12 }}>

        {/* Colored hero area */}
        <div style={{ background: blueSoft, padding: "16px 16px 14px", borderBottom: `1px solid ${blueBorder}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: blue, fontWeight: 450 }}>
              Outstanding
            </span>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "4px 10px", borderRadius: 99,
              border: "1px solid rgba(180,89,31,0.35)", background: "rgba(180,89,31,0.1)",
              color: WARM, fontSize: 11, fontWeight: 450,
            }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: WARM }} />
              Active
            </span>
          </div>

          <div style={{ fontSize: 34, fontWeight: 300, letterSpacing: "-0.06em", color: blue, lineHeight: 1, marginBottom: 5 }}>
            {formatMoney(total)}
          </div>
          <div style={{ fontSize: 12, color: "rgba(49,94,255,0.6)" }}>
            {activeRepaymentCount === 1
              ? "1 active advance · recovers this cycle"
              : `${activeRepaymentCount} active advances · recovers this cycle`}
          </div>
        </div>

        {/* Details area */}
        <div style={{ padding: "14px 16px 14px" }}>

          {/* Due date + Days left */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 11, color: MUTED, marginBottom: 4 }}>Auto-deducts on</div>
              <div style={{ fontSize: 15, fontWeight: 450, color: TEXT }}>{formatDate(dueDate)}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: MUTED, marginBottom: 4 }}>Days left</div>
              <div style={{ fontSize: 15, fontWeight: 450, color: daysColor }}>{left}</div>
            </div>
          </div>

          {/* Progress */}
          <div style={{ height: 4, borderRadius: 999, background: colors.progressTrack, overflow: "hidden", marginBottom: 6 }}>
            <div style={{ width: `${Math.max(progress, 2)}%`, height: "100%", borderRadius: 999, background: `linear-gradient(90deg, ${blue} 0%, rgba(49,94,255,0.6) 100%)` }} />
          </div>
          <div style={{ fontSize: 11, color: DIM, marginBottom: 14 }}>
            {progress}% elapsed · {left} days remaining
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: colors.rule, marginBottom: 12 }} />

          {/* Auto-deduct row */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{
              width: 34, height: 34, borderRadius: 10, flexShrink: 0,
              display: "grid", placeItems: "center",
              background: blueSoft, color: blue,
            }}>
              <Landmark size={16} strokeWidth={1.9} />
            </span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: "block", fontSize: 13, color: TEXT }}>Auto-deduct from salary</span>
              <span style={{ display: "block", fontSize: 11, color: MUTED, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {maskBank(bankAccount)}
              </span>
            </span>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              padding: "3px 9px", borderRadius: 99,
              background: "rgba(32,164,106,0.1)", border: "1px solid rgba(32,164,106,0.25)",
              color: GREEN, fontSize: 11, fontWeight: 450,
            }}>
              <span style={{ width: 4, height: 4, borderRadius: "50%", background: GREEN }} />
              On
            </span>
          </div>
        </div>

      </section>

      {/* ── Card 2: Breakdown ── */}
      <section style={{ borderRadius: 18, border: `1px solid ${BORDER}`, background: PANEL, padding: "16px 16px 14px" }}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <span style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: MUTED, fontWeight: 450 }}>
            Breakdown
          </span>
          <span style={{ fontSize: 11, color: MUTED }}>
            {request.interestDays || left} days{request.interestRate ? ` @ ${request.interestRate}%` : ""}
          </span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <span style={{ fontSize: 13, color: MUTED }}>Principal</span>
          <span style={{ fontSize: 14, fontWeight: 450, color: TEXT, letterSpacing: "-0.03em" }}>{formatMoney(principal)}</span>
        </div>

        <div style={{ borderTop: `1px dashed ${BORDER}`, margin: "0 0 12px" }} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <span style={{ fontSize: 13, color: MUTED }}>Interest accrued</span>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            padding: "3px 9px", borderRadius: 99,
            background: "rgba(180,89,31,0.08)", border: "1px solid rgba(180,89,31,0.22)",
            fontSize: 13, fontWeight: 450, color: WARM, letterSpacing: "-0.02em",
          }}>
            + {formatMoney(interest)}
          </span>
        </div>

        <div style={{ borderTop: `1px dashed ${BORDER}`, margin: "0 0 14px" }} />

        {/* Total — blue tinted row */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          background: blueSoft, border: `1px solid ${blueBorder}`,
          borderRadius: 12, padding: "12px 14px",
        }}>
          <div>
            <div style={{ fontSize: 11, color: "rgba(49,94,255,0.55)", marginBottom: 3 }}>Due {formatDate(dueDate)}</div>
            <div style={{ fontSize: 13, color: blue }}>Total repayment</div>
          </div>
          <span style={{ fontSize: 22, fontWeight: 300, letterSpacing: "-0.06em", color: blue }}>
            {formatMoney(total)}
          </span>
        </div>

      </section>

      <div style={{ display: "flex", alignItems: "flex-start", gap: 8, color: MUTED, fontSize: 12, lineHeight: 1.4, marginTop: 16 }}>
        <ShieldCheck size={13} strokeWidth={1.8} color={DIM} style={{ flexShrink: 0, marginTop: 1 }} />
        Auto-recovered from salary on payday · no action needed
      </div>

    </div>
  );
}
