import { CalendarDays, ChevronDown, ChevronRight, Download, Gift, Shield } from "lucide-react";
import { useState } from "react";
import { formatMoney, formatRequestStatus } from "../utils/format";
import type { AdvanceRequest } from "../types/app";

type ActivityScreenProps = {
  requests: AdvanceRequest[];
};

type Tab = "all" | "advances" | "repayments";

// Format: "15 May 2024 • 09:42 AM"
function formatDatetime(iso?: string) {
  if (!iso || iso === "Pending") return "Pending";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  const date = d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  const time = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }).toUpperCase();
  return `${date} • ${time}`;
}

// Month label: "May 2024"
function monthKey(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
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

  // 1. Advance Request event
  events.push({
    id: `${id}-req`,
    type: "request",
    title: "Advance Request",
    sub: `Advance request of ${formatMoney(amount)}`,
    datetime: formatDatetime(req.requestDate),
    sortTs: new Date(req.requestDate).getTime(),
    amount,
    prefix: "−",
    amountGreen: false,
    iconBg: "#EEE9FF",
    iconColor: "#5B3CE3",
    iconType: "calendar",
    statusLabel: formatRequestStatus(req.status, req.statusLabel),
    done: req.disbursalStatus === "Disbursed" || req.recoveryStatus === "Completed",
  });

  // 2. Disbursal event (if disbursed)
  if (req.disbursalStatus === "Disbursed") {
    const disbursedAt = (req as unknown as Record<string, string>).disbursedAt || req.requestDate;
    events.push({
      id: `${id}-dis`,
      type: "disbursal",
      title: "Advance Disbursed",
      sub: `Advance of ${formatMoney(amount)} credited to your account`,
      datetime: formatDatetime(disbursedAt),
      sortTs: new Date(disbursedAt).getTime() + 1,
      amount,
      prefix: "+",
      amountGreen: true,
      iconBg: "#DCFCE7",
      iconColor: "#16A34A",
      iconType: "wallet",
      statusLabel: "Completed",
      done: true,
    });
  }

  // 3. Repayment event (if recovered)
  if (req.recoveryStatus === "Completed" && req.recoveryDate) {
    events.push({
      id: `${id}-rep`,
      type: "repayment",
      title: "EMI Paid",
      sub: `EMI for advance #${id.slice(-8).toUpperCase()}`,
      datetime: formatDatetime(req.recoveryDate),
      sortTs: new Date(req.recoveryDate).getTime(),
      amount: req.totalRecoveryAmount || amount,
      prefix: "−",
      amountGreen: false,
      iconBg: "#FEF3C7",
      iconColor: "#D97706",
      iconType: "emi",
      statusLabel: "Completed",
      done: true,
    });
  }

  return events;
}

// SVG icons matching mockup
function TxIcon({ type, bg, color }: { type: TxEvent["iconType"]; bg: string; color: string }) {
  return (
    <div style={{ width: 46, height: 46, borderRadius: 14, background: bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, position: "relative" }}>
      {type === "wallet" && (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <rect x="2" y="5" width="20" height="14" rx="2" stroke={color} strokeWidth="1.8" fill="none"/>
          <path d="M2 10h20" stroke={color} strokeWidth="1.8"/>
          <circle cx="17" cy="14" r="1.2" fill={color}/>
          <path d="M7 3l3 2-3 2" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
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
      {/* Green check badge */}
      <div style={{ position: "absolute", bottom: -3, right: -3, width: 16, height: 16, borderRadius: "50%", background: "#16A34A", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid white" }}>
        <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
          <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </div>
  );
}

export function ActivityScreen({ requests }: ActivityScreenProps) {
  const [tab, setTab] = useState<Tab>("all");

  // Expand all requests into individual transaction events
  const allEvents = requests.flatMap(expandRequest).sort((a, b) => b.sortTs - a.sortTs);

  const filtered = allEvents.filter((e) => {
    if (tab === "advances") return e.type === "request" || e.type === "disbursal";
    if (tab === "repayments") return e.type === "repayment";
    return true;
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
    { id: "all", label: "All Transactions" },
    { id: "advances", label: "Advances" },
    { id: "repayments", label: "Repayments" },
  ];

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
        <button type="button" className="hist-filter-btn">
          <CalendarDays size={13} /> All Dates <ChevronDown size={12} />
        </button>
        <button type="button" className="hist-filter-btn">
          All Status <ChevronDown size={12} />
        </button>
        <button type="button" className="hist-export-btn">
          <Download size={13} /> Export
        </button>
      </div>

      {/* ── Body ── */}
      <div className="screen-body hist-body">

        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 16px" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#6B7280", marginBottom: 4 }}>No transactions yet</div>
            <div style={{ fontSize: 12, color: "#9CA3AF" }}>Your advance history will appear here</div>
          </div>
        ) : (
          Array.from(grouped.entries()).map(([month, events]) => (
            <div key={month}>
              <div className="hist-month-label">{month}</div>
              <div className="hist-tx-card">
                {events.map((e, i) => (
                  <div key={e.id}>
                    {i > 0 && <div style={{ height: 1, background: "#F3F1FF", margin: "0 16px" }} />}
                    <div className="hist-tx-row">
                      <TxIcon type={e.iconType} bg={e.iconBg} color={e.iconColor} />
                      <div className="hist-tx-body">
                        <div className="hist-tx-title">{e.title}</div>
                        <div className="hist-tx-sub">{e.sub}</div>
                        <div className="hist-tx-datetime">{e.datetime}</div>
                      </div>
                      <div className="hist-tx-right">
                        <div className={`hist-tx-amount ${e.amountGreen ? "green" : ""}`}>
                          {e.prefix} {formatMoney(e.amount)}
                        </div>
                        <span className={`chip ${e.statusLabel === "Completed" || e.statusLabel === "Disbursed" ? "chip-green" : "chip-amber"}`} style={{ fontSize: 10, marginTop: 4 }}>
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
            <span>All transactions are secure and encrypted</span>
            <br />
            <span>Need help? <a href="#help" style={{ color: "#5B3CE3", fontWeight: 700 }}>Contact our support team.</a></span>
          </div>
          <ChevronRight size={14} color="#9CA3AF" />
        </div>

        {/* Refer & Earn */}
        <div className="hist-refer-card">
          <div className="hist-refer-icon">🎁</div>
          <div className="hist-refer-body">
            <div className="hist-refer-title">Refer &amp; Earn Rewards!</div>
            <div className="hist-refer-sub">Refer your friends and earn exciting rewards on every successful referral.</div>
          </div>
          <button type="button" className="hist-refer-btn">
            <Gift size={13} /> Refer Now <ChevronRight size={13} />
          </button>
        </div>

        <div className="mp-bottom-space" />
      </div>
    </div>
  );
}
