import { ArrowLeft, Banknote, Bell, Check, CheckCheck, CreditCard, Info, Landmark, ShieldCheck } from "lucide-react";
import type { AppNotification } from "../services/api";
import type { Theme } from "../hooks/useTheme";

type Props = {
  notifications: AppNotification[];
  onBack: () => void;
  onMarkRead: (id: string) => Promise<void>;
  onMarkAllRead: () => Promise<void>;
  theme?: Theme;
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
  if (t.includes("bank")) return <Landmark size={18} />;
  if (t.includes("approved") || t.includes("success")) return <Check size={18} />;
  return <Info size={18} />;
}

function getNotifIconClass(title: string) {
  const t = title.toLowerCase();
  if (t.includes("approved") || t.includes("disburse") || t.includes("success")) return "notif-icon-green";
  if (t.includes("repayment") || t.includes("payment") || t.includes("recovery")) return "notif-icon-purple";
  if (t.includes("bank")) return "notif-icon-neutral";
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

export function NotificationsScreen({ notifications, onBack, onMarkRead, onMarkAllRead, theme = "dark" }: Props) {
  const sorted = [...notifications].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const unread = sorted.filter((n) => !n.isRead);
  const grouped = groupByDate(sorted);

  return (
    <div className={`notif-screen notif-screen--${theme}`}>
      <header className="notif-topbar">
        <button type="button" className="notif-back" onClick={onBack} aria-label="Back">
          <ArrowLeft size={20} strokeWidth={2.25} />
        </button>
        <div className="notif-heading">
          <span>Notifications</span>
        </div>
        {unread.length > 0 && (
          <button
            type="button"
            className="notif-all-read"
            onClick={onMarkAllRead}
          >
            <CheckCheck size={16} strokeWidth={2.2} />
            <span>All read</span>
          </button>
        )}
      </header>

      <div className="notif-body">
        {sorted.length === 0 ? (
          <div className="notif-empty">
            <div className="notif-empty-orb">
              <Bell size={34} strokeWidth={1.8} />
            </div>
            <h2>You’re all caught up</h2>
            <p>New alerts about your advances and account will appear here.</p>
          </div>
        ) : (
          Array.from(grouped.entries()).map(([dateLabel, items]) => (
            <section className="notif-group" key={dateLabel}>
              <div className="notif-date-label">{dateLabel}</div>
              <div className="notif-list">
                {items.map((n) => (
                  <button
                    type="button"
                    key={n.id}
                    className={`notif-row${!n.isRead ? " unread" : ""}`}
                    onClick={() => { if (!n.isRead) void onMarkRead(n.id); }}
                    disabled={n.isRead}
                  >
                    {!n.isRead && <span className="notif-unread-bar" aria-hidden="true" />}
                    <span className={`notif-icon ${getNotifIconClass(n.title)}`}>
                      {getNotifIcon(n.title)}
                    </span>
                    <span className="notif-body-col">
                      <span className="notif-title">
                        {n.title}
                        {!n.isRead && <i aria-hidden="true" />}
                      </span>
                      <span className="notif-sub">{n.message}</span>
                      <span className="notif-time">{timeAgo(n.createdAt)}</span>
                    </span>
                  </button>
                ))}
              </div>
            </section>
          ))
        )}

        {sorted.length > 0 && (
          <div className="notif-security-note">
            <ShieldCheck size={13} strokeWidth={1.9} />
            <span>Notifications are encrypted and private</span>
          </div>
        )}

        <div className="mp-bottom-space" />
      </div>
    </div>
  );
}
