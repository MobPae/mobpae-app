import { useEffect, useState } from "react";
import { AlertTriangle, BellOff, Check, ChevronLeft, Info, ShieldCheck, Wallet } from "lucide-react";
import type { AppNotification } from "../services/api";

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

function NotifIcon({ type }: { type: string | null }) {
  if (type === "ALERT")   return <AlertTriangle size={14} />;
  if (type === "SUCCESS") return <ShieldCheck size={14} />;
  if (type === "WARNING") return <Wallet size={14} />;
  return <Info size={14} />;
}

function typeTag(type: string | null): string {
  if (type === "ALERT")   return "Alert";
  if (type === "SUCCESS") return "Success";
  if (type === "WARNING") return "Warning";
  return "Update";
}

export function NotificationsScreen({ notifications, onBack, onMarkRead, onMarkAllRead }: Props) {
  const [items, setItems] = useState<AppNotification[]>(notifications);
  const unread = items.filter((n) => !n.isRead).length;

  useEffect(() => { setItems(notifications); }, [notifications]);

  const handleMarkRead = async (id: string) => {
    setItems((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
    try { await onMarkRead(id); } catch { /* non-critical */ }
  };

  const handleMarkAllRead = async () => {
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    try { await onMarkAllRead(); } catch { /* non-critical */ }
  };

  return (
    <div className="notif-screen">
      {/* Header */}
      <div className="notif-header">
        <button type="button" className="notif-back-btn" onClick={onBack}>
          <ChevronLeft size={20} />
        </button>
        <div>
          <p className="notif-header-eyebrow">Updates</p>
          <h1 className="notif-header-title">Notifications</h1>
        </div>
        {unread > 0 && (
          <span className="notif-count-pill">{unread}</span>
        )}
      </div>

      {/* Mark all read */}
      {unread > 0 && (
        <div style={{ display: "flex", justifyContent: "flex-end", padding: "8px 16px 0" }}>
          <button
            type="button"
            onClick={handleMarkAllRead}
            style={{
              display: "flex", alignItems: "center", gap: 4,
              fontSize: 11, fontWeight: 600, color: "var(--brand)",
              background: "none", border: "none", cursor: "pointer", padding: "4px 0",
            }}
          >
            <Check size={12} /> Mark all as read
          </button>
        </div>
      )}

      {/* List */}
      {items.length === 0 ? (
        <div className="notif-empty">
          <div className="notif-empty-icon">
            <BellOff size={26} />
          </div>
          <p className="notif-empty-title">All caught up</p>
          <p className="notif-empty-sub">
            New updates about your advances and account will appear here.
          </p>
        </div>
      ) : (
        <div className="notif-list">
          {items.map((n) => (
            <div
              key={n.id}
              className="notif-item"
              style={{ opacity: n.isRead ? 0.72 : 1, cursor: n.isRead ? "default" : "pointer" }}
              onClick={() => { if (!n.isRead) void handleMarkRead(n.id); }}
            >
              <div className="notif-item-icon">
                <NotifIcon type={n.type} />
              </div>
              <div className="notif-item-body">
                {n.title && n.title !== "Notification" && (
                  <p style={{
                    fontSize: 12, fontWeight: n.isRead ? 500 : 700,
                    color: "var(--t1)", marginBottom: 2, lineHeight: 1.3,
                  }}>
                    {n.title}
                  </p>
                )}
                <p className="notif-item-text" style={{ fontWeight: n.isRead ? 400 : 500 }}>
                  {n.message || n.title}
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                  <span className="notif-item-tag">{typeTag(n.type)}</span>
                  <span style={{ fontSize: 10, color: "var(--t3)" }}>{timeAgo(n.createdAt)}</span>
                  {!n.isRead && (
                    <span style={{
                      width: 6, height: 6, borderRadius: "50%",
                      background: "var(--brand)", display: "inline-block", marginLeft: "auto",
                      flexShrink: 0,
                    }} />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ height: 40 }} />
    </div>
  );
}
