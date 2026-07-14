import { ArrowDownToLine, ArrowUpFromLine, Clock, Clock3, XCircle } from "lucide-react";
import { useMemo, useState } from "react";
import type { AdvanceRequest, BankAccount } from "../types/app";
import { formatMoney, formatRequestStatus } from "../utils/format";

type ActivityScreenProps = {
  requests: AdvanceRequest[];
  bankAccount?: BankAccount | null;
};

type Tab = "all" | "advances" | "repayments";

type ActivityEvent = {
  id: string;
  type: "request" | "credit" | "repayment";
  title: string;
  subtitle: string;
  amount: number;
  prefix: "+" | "-" | "";
  date: string;
  monthKey: string;
  sortTs: number;
  tone: "green" | "warm" | "error" | "warning" | "pending" | "default";
  status?: string;
};

function activityPalette() {
  return {
    bg: "#FFFFFF",
    panel: "#FFFFFF",
    panelSoft: "#F5F3FB",
    border: "#E9E6F1",
    rule: "#F1EEF7",
    text: "#17151F",
    muted: "#6B6878",
    dim: "#9A97A8",
    activeBg: "#315eff",
    activeText: "#FFFFFF",
    green: "#1F9E67",
    warm: "#B4591F",
    shadow: "0 30px 80px -30px rgba(30,22,54,0.14)",
  };
}

function formatDay(dateStr?: string) {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

function formatMonth(dateStr?: string) {
  if (!dateStr) return "Unknown";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

function bankLabel(bankAccount?: BankAccount | null) {
  if (!bankAccount?.accountNumber) return "To linked bank";
  return `To ${bankAccount.bankName || "Bank"} ••${bankAccount.accountNumber.slice(-4)}`;
}

function requestAmount(request: AdvanceRequest) {
  return request.approvedAmount || request.requestedAmount || request.principalAmount || 0;
}

function hasVisibleRepayment(request: AdvanceRequest) {
  return (
    request.disbursalStatus === "Disbursed" ||
    request.status === "Payment Scheduled" ||
    request.status === "Paid" ||
    request.status === "Recovered"
  );
}

function requestTone(status: string, disbursalStatus?: string | null): ActivityEvent["tone"] {
  if (disbursalStatus === "Disbursed") return "green";
  const s = status.toLowerCase();
  if (s.includes("reject") || s.includes("cancelled") || s.includes("expired")) return "error";
  if (s.includes("paid") || s.includes("recovered") || s.includes("repaid")) return "green";
  if (s.includes("approved")) return "warning";
  return "pending";
}

function expandRequest(request: AdvanceRequest, bankAccount?: BankAccount | null): ActivityEvent[] {
  const amount = requestAmount(request);
  const events: ActivityEvent[] = [];
  const requestTs = new Date(request.requestDate).getTime();
  const tone = requestTone(request.status, request.disbursalStatus);

  events.push({
    id: `${request.id}-requested`,
    type: "request",
    title: "Advance requested",
    subtitle: formatRequestStatus(request.status, request.statusLabel),
    amount,
    prefix: "",
    date: formatDay(request.requestDate),
    monthKey: formatMonth(request.requestDate),
    sortTs: Number.isNaN(requestTs) ? 0 : requestTs,
    tone,
    status: request.status,
  });

  if (request.disbursalStatus === "Disbursed") {
    const disbursedAt = request.disbursalDate || request.requestDate;
    const disbursalTs = new Date(disbursedAt).getTime();
    events.push({
      id: `${request.id}-credited`,
      type: "credit",
      title: "Advance credited",
      subtitle: bankLabel(bankAccount),
      amount,
      prefix: "+",
      date: formatDay(disbursedAt),
      monthKey: formatMonth(disbursedAt),
      sortTs: (Number.isNaN(disbursalTs) ? 0 : disbursalTs) + 2,
      tone: "green",
    });
  }

  if (
    hasVisibleRepayment(request) &&
    request.recoveryDate &&
    (request.recoveryStatus === "Completed" || request.recoveryStatus === "Scheduled")
  ) {
    const recoveryTs = new Date(request.recoveryDate).getTime();
    events.push({
      id: `${request.id}-repayment`,
      type: "repayment",
      title: request.recoveryStatus === "Completed" ? "Repayment" : "Repayment scheduled",
      subtitle: request.recoveryStatus === "Completed" ? "Auto-deducted from salary" : "Auto-deduct from salary",
      amount: request.totalRecoveryAmount || amount,
      prefix: "-",
      date: formatDay(request.recoveryDate),
      monthKey: formatMonth(request.recoveryDate),
      sortTs: (Number.isNaN(recoveryTs) ? 0 : recoveryTs) + 1,
      tone: "warm",
    });
  }

  return events;
}

function EmptyActivity({ colors }: { colors: ReturnType<typeof activityPalette> }) {
  return (
    <div
      style={{
        flex: 1,
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
          <Clock3 size={28} strokeWidth={1.7} />
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
          No activity yet
        </h1>
        <p
          style={{
            margin: "18px auto 0",
            maxWidth: 285,
            color: colors.muted,
            fontSize: 14,
            fontWeight: 400,
            lineHeight: 1.55,
          }}
        >
          Your advances and repayments will show up here the moment you make your first request.
        </p>
      </div>
    </div>
  );
}

const TONE_STYLE: Record<ActivityEvent["tone"], { bg: string; fg: string; pillBg: string; pillBorder: string }> = {
  green:   { bg: "rgba(16,185,129,0.12)",  fg: "#10b981", pillBg: "rgba(16,185,129,0.12)", pillBorder: "rgba(16,185,129,0.3)" },
  error:   { bg: "rgba(239,68,68,0.10)",   fg: "#ef4444", pillBg: "rgba(239,68,68,0.12)",  pillBorder: "rgba(239,68,68,0.3)"  },
  warning: { bg: "rgba(245,158,11,0.10)",  fg: "#f59e0b", pillBg: "rgba(245,158,11,0.12)", pillBorder: "rgba(245,158,11,0.3)" },
  pending: { bg: "rgba(49,94,255,0.10)",   fg: "#315eff", pillBg: "rgba(49,94,255,0.10)",  pillBorder: "rgba(49,94,255,0.25)" },
  warm:    { bg: "rgba(180,89,31,0.13)",   fg: "#B4591F", pillBg: "rgba(180,89,31,0.10)",  pillBorder: "rgba(180,89,31,0.3)"  },
  default: { bg: "rgba(107,104,120,0.10)", fg: "#6B6878", pillBg: "rgba(107,104,120,0.10)",pillBorder: "rgba(107,104,120,0.2)"},
};

function ActivityIcon({
  tone,
  type,
}: {
  tone: ActivityEvent["tone"];
  type: ActivityEvent["type"];
  colors: ReturnType<typeof activityPalette>;
}) {
  const { bg, fg } = TONE_STYLE[tone];
  const Icon =
    type === "credit" ? ArrowDownToLine
    : type === "repayment" ? ArrowUpFromLine
    : tone === "error" ? XCircle
    : Clock;

  return (
    <span style={{
      width: 40, height: 40, borderRadius: 13,
      background: bg, color: fg,
      display: "grid", placeItems: "center", flexShrink: 0,
    }}>
      <Icon size={18} strokeWidth={1.8} />
    </span>
  );
}

export function ActivityScreen({ requests, bankAccount }: ActivityScreenProps) {
  const [tab, setTab] = useState<Tab>("all");
  const colors = activityPalette();

  const allEvents = useMemo(
    () =>
      requests
        .flatMap((request) => expandRequest(request, bankAccount))
        .sort((a, b) => b.sortTs - a.sortTs),
    [bankAccount, requests],
  );

  const filtered = allEvents.filter((event) => {
    if (tab === "advances") return event.type === "request" || event.type === "credit";
    if (tab === "repayments") return event.type === "repayment";
    return true;
  });

  const totalAdvanced = allEvents
    .filter((event) => event.type === "credit")
    .reduce((sum, event) => sum + event.amount, 0);
  const totalRepaid = allEvents
    .filter((event) => event.type === "repayment" && event.title === "Repayment")
    .reduce((sum, event) => sum + event.amount, 0);

  const grouped = filtered.reduce<Map<string, ActivityEvent[]>>((map, event) => {
    if (!map.has(event.monthKey)) map.set(event.monthKey, []);
    map.get(event.monthKey)!.push(event);
    return map;
  }, new Map());

  if (allEvents.length === 0) {
    return <EmptyActivity colors={colors} />;
  }

  const tabs: Array<{ id: Tab; label: string }> = [
    { id: "all", label: "All" },
    { id: "advances", label: "Advances" },
    { id: "repayments", label: "Repayments" },
  ];

  return (
    <div
      style={{
        minHeight: "100%",
        background: colors.bg,
        color: colors.text,
        
        padding: "18px 22px 34px",
      }}
    >
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div
          style={{
            border: `1px solid ${colors.border}`,
            borderRadius: 18,
            background: colors.panel,
            padding: "17px 16px",
            boxShadow: colors.shadow,
          }}
        >
          <div style={{ color: colors.muted, fontSize: 12, fontWeight: 450, marginBottom: 14 }}>
            Total advanced
          </div>
          <div
            style={{
              color: colors.text,

              fontSize: 18,
              fontWeight: 450,
              letterSpacing: "-0.06em",
            }}
          >
            {formatMoney(totalAdvanced)}
          </div>
          {totalAdvanced === 0 && (
            <div style={{ color: colors.dim, fontSize: 11, fontWeight: 400, marginTop: 6 }}>
              No advances yet
            </div>
          )}
        </div>
        <div
          style={{
            border: `1px solid ${colors.border}`,
            borderRadius: 18,
            background: colors.panel,
            padding: "17px 16px",
            boxShadow: colors.shadow,
          }}
        >
          <div style={{ color: colors.muted, fontSize: 12, fontWeight: 450, marginBottom: 14 }}>
            Total repaid
          </div>
          <div
            style={{
              color: colors.green,

              fontSize: 18,
              fontWeight: 450,
              letterSpacing: "-0.06em",
            }}
          >
            {formatMoney(totalRepaid)}
          </div>
          {totalRepaid === 0 && (
            <div style={{ color: colors.dim, fontSize: 11, fontWeight: 400, marginTop: 6 }}>
              Nothing repaid yet
            </div>
          )}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 18, marginBottom: 28 }}>
        {tabs.map((item) => {
          const active = item.id === tab;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              style={{
                height: 38,
                borderRadius: 16,
                border: `1px solid ${active ? colors.activeBg : colors.border}`,
                background: active ? colors.activeBg : "transparent",
                color: active ? colors.activeText : colors.muted,
                padding: "0 15px",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div
          style={{
            border: `1px dashed ${colors.border}`,
            borderRadius: 18,
            minHeight: 130,
            display: "grid",
            placeItems: "center",
            color: colors.muted,
            fontSize: 13,
            fontWeight: 450,
            textAlign: "center",
            padding: 24,
          }}
        >
          No {tab === "advances" ? "advance" : "repayment"} activity for this filter.
        </div>
      ) : (
        Array.from(grouped.entries()).map(([month, events]) => (
          <section key={month} style={{ marginTop: 24 }}>
            <div
              style={{
                color: colors.muted,
                fontSize: 12,
                fontWeight: 500,
                letterSpacing: "0.28em",
                textTransform: "uppercase",
                marginBottom: 18,
              }}
            >
              {month}
            </div>
            <div>
              {events.map((event, index) => {
                const ts = TONE_STYLE[event.tone];
                const amountColor =
                  event.tone === "green" ? ts.fg
                  : event.tone === "error" ? ts.fg
                  : event.tone === "warm" ? colors.text
                  : colors.text;
                const isRequest = event.type === "request";

                return (
                  <div key={event.id}>
                    {index > 0 && <div style={{ height: 1, background: colors.rule, margin: "16px 0" }} />}
                    <div style={{ display: "grid", gridTemplateColumns: "48px 1fr auto", gap: 12, alignItems: "center" }}>
                      <ActivityIcon tone={event.tone} type={event.type} colors={colors} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ color: colors.text, fontSize: 15, fontWeight: 450, lineHeight: 1.08 }}>
                          {event.title}
                        </div>
                        {isRequest ? (
                          /* Coloured status pill for request events */
                          <span style={{
                            display: "inline-flex", alignItems: "center",
                            marginTop: 6, padding: "2px 8px", borderRadius: 99,
                            background: ts.pillBg, border: `1px solid ${ts.pillBorder}`,
                            fontSize: 11, fontWeight: 500, color: ts.fg,
                            whiteSpace: "nowrap",
                          }}>
                            {event.subtitle}
                          </span>
                        ) : (
                          <div style={{
                            color: colors.muted, fontSize: 12, fontWeight: 400,
                            marginTop: 6, overflow: "hidden",
                            textOverflow: "ellipsis", whiteSpace: "nowrap",
                          }}>
                            {event.subtitle}
                          </div>
                        )}
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{
                          color: amountColor, fontSize: 15, fontWeight: 450,
                          letterSpacing: "-0.05em", whiteSpace: "nowrap",
                        }}>
                          {event.prefix ? `${event.prefix} ` : ""}
                          {formatMoney(event.amount)}
                        </div>
                        <div style={{ color: colors.dim, fontSize: 11, fontWeight: 400, marginTop: 8 }}>
                          {event.date}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))
      )}

      {filtered.length > 0 && (() => {
        const oldest = filtered[filtered.length - 1];
        const oldestYear = oldest?.sortTs ? new Date(oldest.sortTs).getFullYear() : new Date().getFullYear();
        const currentYear = new Date().getFullYear();
        const label = oldestYear < currentYear
          ? `That’s everything since ${oldestYear}`
          : "That’s everything from this year";
        return (
          <div style={{ color: colors.dim, textAlign: "center", fontSize: 12, fontWeight: 450, marginTop: 28 }}>
            {label}
          </div>
        );
      })()}
    </div>
  );
}
