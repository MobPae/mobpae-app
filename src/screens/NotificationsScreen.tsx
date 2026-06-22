import { Bell, BellOff, ChevronLeft, Info } from "lucide-react";

type Props = {
  notifications: string[];
  onBack: () => void;
};

export function NotificationsScreen({ notifications, onBack }: Props) {
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
        {notifications.length > 0 && (
          <span className="notif-count-pill">{notifications.length}</span>
        )}
      </div>

      {/* List */}
      {notifications.length === 0 ? (
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
          {notifications.map((msg, i) => (
            <div key={i} className="notif-item">
              <div className="notif-item-icon">
                <Info size={14} />
              </div>
              <div className="notif-item-body">
                <p className="notif-item-text">{msg}</p>
                <span className="notif-item-tag">Account update</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ height: 40 }} />
    </div>
  );
}
