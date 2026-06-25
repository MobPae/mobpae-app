import { Banknote, Bell, BellOff, Check, CheckCheck, CreditCard, Info, ShieldCheck } from "lucide-react";
import type { AppNotification } from "../services/api";
import { SubPageHeader } from "../components/layout/SubPageHeader";

type Props = {
  notifications: AppNotification[];
  onBack: () => void;
  onMarkRead: (id: string) => Promise<void>;
  onMarkAllRead: () => Promise<void>;
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function getNotifIcon(title: string) {
  const t = title.toLowerCase();
  if (t.includes("advance") || t.includes("salary") || t.includes("disburse")) return <Banknote size={18} />;
  if (t.includes("repayment") || t.includes("payment") || t.includes("recovery")) return <CreditCard size={18} />;
  if (t.includes("approved") || t.includes("success")) return <Check size={18} />;
  return <Info size={18} />;
}

function getNotifIconClass(title: string) {
  const t = title.toLowerCase();
  if (t.includes("approved") || t.includes("disburse") || t.includes("success")) return "notif-icon-green";
  if (t.includes("repayment") || t.includes("payment") || t.includes("recovery")) return "notif-icon-purple";
  return "notif-icon-amber";
}

function groupByDate(notifications: AppNotification[]) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
  const map = new Map<string, AppNotification[]>();
  for (const n of notifications) {
    const d = new Date(n.createdAt); d.setHours(0, 0, 0, 0);
    let key: string;
    if (d.getTime() === today.getTime()) key = "Today";
    else if (d.getTime() === yesterday.getTime()) key = "Yesterday";
    else key = d.toLocaleDateString("en-IN", { day: "numeric", month: "long" });
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(n);
  }
  return map;
}

export function NotificationsScreen({ notifications, onBack, onMarkRead, onMarkAllRead }: Props) {
  const sorted = [...notifications].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const unread = sorted.filter((n) => !n.isRead);
  const grouped = groupByDate(sorted);

  return (
    <div className="notif-screen">

      {/* Header */}
      <div style={{ position: "relative" }}>
        <SubPageHeader
          title={`Notifications${unread.length > 0 ? ` (${unread.length})` : ""}`}
          onBack={onBack}
        />
        {unread.length > 0 && (
          <button
            type="button"
            className="mp-link-btn"
            style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 12 }}
            onClick={onMarkAllRead}
          >
            <CheckCheck size={14} /> All read
          </button>
        )}
      </div>

      <div className="screen-body notif-body">

        {sorted.length === 0 ? (
          <div style={{ textAlign: "center", padding: "56px 24px" }}>
            <BellOff size={40} color="#D1D5DB" style={{ margin: "0 auto 16px", display: "block" }} />
            <div style={{ fontSize: 16, fontWeight: 700, color: "#6B7280", marginBottom: 6 }}>No notifications yet</div>
            <div style={{ fontSize: 13, color: "#9CA3AF" }}>You'll see advance updates and alerts here.</div>
          </div>
        ) : (
          Array.from(grouped.entries()).map(([dateLabel, items]) => (
            <div key={dateLabel}>
              <div className="notif-date-label">{dateLabel}</div>
              <div className="notif-card">
                {items.map((n) => (
                  <div
                    key={n.id}
                    className={`notif-row${!n.isRead ? " unread" : ""}`}
                    onClick={() => { if (!n.isRead) void onMarkRead(n.id); }}
                    style={{ cursor: !n.isRead ? "pointer" : "default" }}
                  >
                    <div className={`notif-icon ${getNotifIconClass(n.title)}`}>
                      {getNotifIcon(n.title)}
                    </div>
                    <div className="notif-body-col">
                      <div className="notif-title">{n.title}</div>
                      <div className="notif-sub">{n.message}</div>
                      <div className="notif-time">{timeAgo(n.createdAt)}</div>
                    </div>
                    {!n.isRead && <div className="notif-unread-dot" />}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}

        {/* Security note */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "12px 0 4px", fontSize: 11, color: "#9CA3AF" }}>
          <ShieldCheck size={12} color="#16A34A" />
          Notifications are encrypted and private
        </div>

        <div className="mp-bottom-space" />
      </div>
    </div>
  );
}
