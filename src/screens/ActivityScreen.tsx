import { CalendarDays, ChevronDown, Download, Shield } from "lucide-react";
import { useState } from "react";
import { formatMoney, formatRequestStatus } from "../utils/format";
import type { AdvanceRequest, View } from "../types/app";

type ActivityScreenProps = {
  requests: AdvanceRequest[];
  onNavigate: (view: View) => void;
};

type Tab = "all" | "advances" | "repayments";

function formatDatetime(iso?: string) {
  if (!iso || iso === "Pending") return "Pending";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  const date = d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  const time = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }).toUpperCase();
  return `${date} • ${time}`;
}

type TxEvent = {
  id: string;
  type: "request" | "disbursal" | "repayment";
  title: string;
  sub: string;
  datetime: string;
  sortTs: number;
  amount: number;
  prefix: "+" | "−" | "";
  amountGreen: boolean;
  amountRed: boolean;
  iconBg: string;
  iconColor: string;
  iconType: "wallet" | "calendar" | "emi";
  statusLabel: string;
  done: boolean;
};

function expandRequest(req: AdvanceRequest): TxEvent[] {
  const events: TxEvent[] = [];
  const amount = req.approvedAmount || req.requestedAmount;
  const id = req.id;
  const isDone = req.disbursalStatus === "Disbursed" || req.recoveryStatus === "Completed";

  events.push({
    id: `${id}-req`,
    type: "request",
    title: "Advance Requested",
    sub: `Salary advance of ${formatMoney(amount)}`,
    datetime: formatDatetime(req.requestDate),
    sortTs: new Date(req.requestDate).getTime(),
    amount,
    prefix: "",
    amountGreen: false,
    amountRed: false,
    iconBg: "#EEE9FF",
    iconColor: "#5B3CE3",
    iconType: "calendar",
    statusLabel: formatRequestStatus(req.status, req.statusLabel),
    done: isDone,
  });

  if (req.disbursalStatus === "Disbursed") {
    const disbursedAt = (req as unknown as Record<string, string>).disbursedAt || req.requestDate;
    events.push({
      id: `${id}-dis`,
      type: "disbursal",
      title: "Advance Credited",
      sub: `${formatMoney(amount)} credited to your bank account`,
      datetime: formatDatetime(disbursedAt),
      sortTs: new Date(disbursedAt).getTime() + 1,
      amount,
      prefix: "+",
      amountGreen: true,
      amountRed: false,
      iconBg: "#DCFCE7",
      iconColor: "#16A34A",
      iconType: "wallet",
      statusLabel: "Credited",
      done: true,
    });
  }

  if (req.recoveryStatus === "Completed" && req.recoveryDate) {
    events.push({
      id: `${id}-rep`,
      type: "repayment",
      title: "Advance Repaid",
      sub: "Recovered from salary settlement",
      datetime: formatDatetime(req.recoveryDate),
      sortTs: new Date(req.recoveryDate).getTime(),
      amount: req.totalRecoveryAmount || amount,
      prefix: "−",
      amountGreen: false,
      amountRed: true,
      iconBg: "#FEF3C7",
      iconColor: "#D97706",
      iconType: "emi",
      statusLabel: "Repaid",
      done: true,
    });
  }

  return events;
}

function TxIcon({ type, bg, color, done }: { type: TxEvent["iconType"]; bg: string; color: string; done: boolean }) {
  return (
    <div style={{ width: 46, height: 46, borderRadius: 14, background: bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, position: "relative" }}>
      {type === "wallet" && (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <rect x="2" y="5" width="20" height="14" rx="2" stroke={color} strokeWidth="1.8" fill="none"/>
          <path d="M2 10h20" stroke={color} strokeWidth="1.8"/>
          <circle cx="17" cy="14" r="1.2" fill={color}/>
        </svg>
      )}
      {type === "calendar" && (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="4" width="18" height="17" rx="2" stroke={color} strokeWidth="1.8" fill="none"/>
          <path d="M16 2v4M8 2v4M3 10h18" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
          <circle cx="12" cy="15" r="1.5" fill={color}/>
        </svg>
      )}
      {type === "emi" && (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="4" width="18" height="17" rx="2" stroke={color} strokeWidth="1.8" fill="none"/>
          <path d="M16 2v4M8 2v4M3 10h18" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
          <path d="M8 14h4M8 17h6" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
      )}
      {done && (
        <div style={{ position: "absolute", bottom: -3, right: -3, width: 16, height: 16, borderRadius: "50%", background: "#16A34A", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid white" }}>
          <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
            <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      )}
    </div>
  );
}

function exportCSV(events: TxEvent[]) {
  const header = ["Date/Time", "Type", "Description", "Amount", "Status"];
  const rows = events.map(e => [
    e.datetime,
    e.title,
    e.sub,
    `${e.prefix}${e.amount}`,
    e.statusLabel,
  ]);
  const csv = [header, ...rows]
    .map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `mobpae-transactions-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

const STATUS_CYCLE = ["All Status", "Pending", "Credited", "Repaid"] as const;
type StatusFilter = typeof STATUS_CYCLE[number];

export function ActivityScreen({ requests, onNavigate }: ActivityScreenProps) {
  const [tab, setTab] = useState<Tab>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All Status");
  const [monthFilter, setMonthFilter] = useState<string>("All Dates");

  const allEvents = requests.flatMap(expandRequest).sort((a, b) => b.sortTs - a.sortTs);

  // Derive available months from data
  const availableMonths = Array.from(new Set(
    allEvents.map(e => {
      const ts = new Date(e.sortTs);
      return isNaN(ts.getTime()) ? null : ts.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
    }).filter(Boolean)
  )) as string[];

  const cycleMonth = () => {
    const opts = ["All Dates", ...availableMonths];
    const idx = opts.indexOf(monthFilter);
    setMonthFilter(opts[(idx + 1) % opts.length]);
  };

  const cycleStatus = () => {
    const idx = STATUS_CYCLE.indexOf(statusFilter);
    setStatusFilter(STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length]);
  };

  const filtered = allEvents
    .filter(e => {
      if (tab === "advances") return e.type === "request" || e.type === "disbursal";
      if (tab === "repayments") return e.type === "repayment";
      return true;
    })
    .filter(e => statusFilter === "All Status" || e.statusLabel === statusFilter)
    .filter(e => {
      if (monthFilter === "All Dates") return true;
      const ts = new Date(e.sortTs);
      return ts.toLocaleDateString("en-IN", { month: "short", year: "numeric" }) === monthFilter;
    });

  // Group by month
  const grouped = new Map<string, TxEvent[]>();
  for (const e of filtered) {
    const ts = new Date(e.sortTs);
    const key = isNaN(ts.getTime()) ? "Unknown" : ts.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(e);
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: "all", label: "All" },
    { id: "advances", label: "Advances" },
    { id: "repayments", label: "Repayments" },
  ];

  const isMonthActive = monthFilter !== "All Dates";
  const isStatusActive = statusFilter !== "All Status";

  return (
    <div className="hist-screen">

      {/* ── Tabs ── */}
      <div className="hist-tabs-wrap">
        {TABS.map(({ id, label }) => (
          <button key={id} type="button" className={`hist-tab ${tab === id ? "active" : ""}`} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </div>

      {/* ── Filter bar ── */}
      <div className="hist-filter-bar">
        <button
          type="button"
          className="hist-filter-btn"
          onClick={cycleMonth}
          style={isMonthActive ? { background: "#ECEAFF", color: "#5B3CE3", borderColor: "#C4B5FD" } : undefined}
        >
          <CalendarDays size={13} /> {monthFilter} <ChevronDown size={12} />
        </button>
        <button
          type="button"
          className="hist-filter-btn"
          onClick={cycleStatus}
          style={isStatusActive ? { background: "#ECEAFF", color: "#5B3CE3", borderColor: "#C4B5FD" } : undefined}
        >
          {statusFilter} <ChevronDown size={12} />
        </button>
        <button
          type="button"
          className="hist-export-btn"
          onClick={() => exportCSV(filtered)}
          disabled={filtered.length === 0}
        >
          <Download size={13} /> Export
        </button>
      </div>

      {/* ── Body ── */}
      <div className="screen-body hist-body">

        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 16px" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#6B7280", marginBottom: 4 }}>No transactions found</div>
            <div style={{ fontSize: 12, color: "#9CA3AF" }}>
              {isMonthActive || isStatusActive
                ? "Try changing the filters above"
                : "Your advance history will appear here"}
            </div>
            {(isMonthActive || isStatusActive) && (
              <button
                type="button"
                className="mp-link-btn"
                style={{ marginTop: 12, fontSize: 13 }}
                onClick={() => { setMonthFilter("All Dates"); setStatusFilter("All Status"); }}
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          Array.from(grouped.entries()).map(([month, events]) => (
            <div key={month}>
              <div className="hist-month-label">{month}</div>
              <div className="hist-tx-card">
                {events.map((e, i) => (
                  <div key={e.id} className={i > 0 ? "hist-tx-item-spaced" : undefined}>
                    <div className="hist-tx-row">
                      <TxIcon type={e.iconType} bg={e.iconBg} color={e.iconColor} done={e.done} />
                      <div className="hist-tx-body">
                        <div className="hist-tx-title">{e.title}</div>
                        <div className="hist-tx-sub">{e.sub}</div>
                        <div className="hist-tx-datetime">{e.datetime}</div>
                      </div>
                      <div className="hist-tx-right">
                        <div className={`hist-tx-amount ${e.amountGreen ? "green" : e.amountRed ? "red" : ""}`}>
                          {e.prefix}{formatMoney(e.amount)}
                        </div>
                        <span
                          className={`hist-tx-status ${
                            e.statusLabel === "Credited" || e.statusLabel === "Repaid"
                              ? "chip-green"
                              : e.statusLabel === "Pending"
                              ? "chip-amber"
                              : "chip-purple"
                          }`}
                          title={e.statusLabel}
                          style={{ marginTop: 4 }}
                        >
                          {e.statusLabel}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}

        {/* Security note */}
        <div className="hist-security-note">
          <Shield size={14} color="#9CA3AF" />
          <div className="hist-security-text">
            <span>
              All transactions are secure & encrypted.{" "}
              <button
                type="button"
                style={{ color: "#5B3CE3", fontWeight: 600, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: "inherit", padding: 0 }}
                onClick={() => onNavigate("help")}
              >
                Contact support
              </button>
            </span>
          </div>
        </div>

        <div className="mp-bottom-space" />
      </div>
    </div>
  );
}
