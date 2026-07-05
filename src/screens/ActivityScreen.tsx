import { ArrowDownToLine, CheckCircle2, Clock3 } from "lucide-react";
import { useMemo, useState } from "react";
import type { AdvanceRequest, BankAccount } from "../types/app";
import { formatMoney, formatRequestStatus } from "../utils/format";
import type { Theme } from "../hooks/useTheme";

type ActivityScreenProps = {
  requests: AdvanceRequest[];
  bankAccount?: BankAccount | null;
  theme?: Theme;
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
  tone: "green" | "warm" | "default";
};

const DARK = "#0C0C0E";
const PANEL_SOFT = "#141418";
const BORDER = "#29292F";
const TEXT = "#F2F0EA";
const MUTED = "#8A8892";
const DIM = "#5C5C64";
const GREEN = "#20A46A";
const WARM = "#B4591F";

function activityPalette(theme: Theme) {
  if (theme === "light") {
    return {
      bg: "#FFFFFF",
      panel: "#FFFFFF",
      panelSoft: "#F5F3FB",
      border: "#E9E6F1",
      rule: "#F1EEF7",
      text: "#17151F",
      muted: "#6B6878",
      dim: "#9A97A8",
      activeBg: "#5B3CE3",
      activeText: "#FFFFFF",
      green: "#1F9E67",
      warm: "#B4591F",
      shadow: "0 30px 80px -30px rgba(30,22,54,0.14)",
    };
  }

  return {
    bg: DARK,
    panel: "rgba(20,20,24,0.72)",
    panelSoft: PANEL_SOFT,
    border: BORDER,
    rule: "#1D1D21",
    text: TEXT,
    muted: MUTED,
    dim: DIM,
    activeBg: "#F4F1E8",
    activeText: "#11100D",
    green: GREEN,
    warm: WARM,
    shadow: "none",
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

function expandRequest(request: AdvanceRequest, bankAccount?: BankAccount | null): ActivityEvent[] {
  const amount = requestAmount(request);
  const events: ActivityEvent[] = [];
  const requestTs = new Date(request.requestDate).getTime();

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
    tone: "default",
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
        minHeight: "calc(100dvh - 170px)",
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
            fontWeight: 750,
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
            fontWeight: 600,
            lineHeight: 1.55,
          }}
        >
          Your advances and repayments will show up here the moment you make your first request.
        </p>
      </div>
    </div>
  );
}

function ActivityIcon({
  tone,
  type,
  colors,
}: {
  tone: ActivityEvent["tone"];
  type: ActivityEvent["type"];
  colors: ReturnType<typeof activityPalette>;
}) {
  const color = tone === "green" ? colors.green : tone === "warm" ? colors.warm : colors.dim;
  const background =
    tone === "green"
      ? "rgba(32,164,106,0.13)"
      : tone === "warm"
        ? "rgba(180,89,31,0.13)"
        : colors.panelSoft;

  return (
    <span
      style={{
        width: 40,
        height: 40,
        borderRadius: 13,
        background,
        color,
        display: "grid",
        placeItems: "center",
        flexShrink: 0,
      }}
    >
      {type === "credit" ? (
        <ArrowDownToLine size={18} strokeWidth={2} />
      ) : type === "repayment" ? (
        <span style={{ fontSize: 20, lineHeight: 1 }}>↑</span>
      ) : (
        <CheckCircle2 size={17} strokeWidth={1.9} />
      )}
    </span>
  );
}

export function ActivityScreen({ requests, bankAccount, theme = "dark" }: ActivityScreenProps) {
  const [tab, setTab] = useState<Tab>("all");
  const colors = activityPalette(theme);

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
        fontFamily: "'Space Grotesk', sans-serif",
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
          <div style={{ color: colors.muted, fontSize: 12, fontWeight: 650, marginBottom: 14 }}>
            Total advanced
          </div>
          <div
            style={{
              color: colors.text,
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 18,
              fontWeight: 650,
              letterSpacing: "-0.06em",
            }}
          >
            {formatMoney(totalAdvanced)}
          </div>
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
          <div style={{ color: colors.muted, fontSize: 12, fontWeight: 650, marginBottom: 14 }}>
            Total repaid
          </div>
          <div
            style={{
              color: colors.green,
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 18,
              fontWeight: 650,
              letterSpacing: "-0.06em",
            }}
          >
            {formatMoney(totalRepaid)}
          </div>
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
                borderRadius: 13,
                border: `1px solid ${active ? colors.activeBg : colors.border}`,
                background: active ? colors.activeBg : "transparent",
                color: active ? colors.activeText : colors.muted,
                padding: "0 15px",
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 13,
                fontWeight: 750,
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
            fontWeight: 650,
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
                fontWeight: 700,
                letterSpacing: "0.28em",
                textTransform: "uppercase",
                marginBottom: 18,
              }}
            >
              {month}
            </div>
            <div>
              {events.map((event, index) => {
                const amountColor = event.tone === "green" ? colors.green : event.tone === "warm" ? colors.text : colors.muted;

                return (
                  <div key={event.id}>
                    {index > 0 && <div style={{ height: 1, background: colors.rule, margin: "16px 0" }} />}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "48px 1fr auto",
                        gap: 12,
                        alignItems: "center",
                      }}
                    >
                      <ActivityIcon tone={event.tone} type={event.type} colors={colors} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ color: colors.text, fontSize: 15, fontWeight: 750, lineHeight: 1.08 }}>
                          {event.title}
                        </div>
                        <div
                          style={{
                            color: colors.muted,
                            fontSize: 12,
                            fontWeight: 600,
                            marginTop: 7,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {event.subtitle}
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div
                          style={{
                            color: amountColor,
                            fontFamily: "'IBM Plex Mono', monospace",
                            fontSize: 15,
                            fontWeight: 650,
                            letterSpacing: "-0.05em",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {event.prefix ? `${event.prefix} ` : ""}
                          {formatMoney(event.amount)}
                        </div>
                        <div style={{ color: colors.dim, fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, fontWeight: 600, marginTop: 8 }}>
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

      {filtered.length > 0 && (
        <div style={{ color: colors.dim, textAlign: "center", fontSize: 12, fontWeight: 650, marginTop: 28 }}>
          That’s everything from this year
        </div>
      )}
    </div>
  );
}
