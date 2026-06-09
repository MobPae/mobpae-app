import { BadgeCheck, CalendarDays, IndianRupee, Route } from "lucide-react";
import { Card } from "../components/ui/Card";
import { SectionHeader } from "../components/ui/SectionHeader";
import { formatDate, formatMoney, formatShortDate } from "../utils/format";
import type { AdvanceRequest } from "../types/app";

type TrackingScreenProps = {
  requests: AdvanceRequest[];
};

export function TrackingScreen({ requests }: TrackingScreenProps) {
  const latestRequest = requests[0];

  if (!latestRequest) {
    return (
      <Card>
        <SectionHeader title="No requests yet" eyebrow="Tracking" icon={<Route size={19} />} />
        <p className="muted">Your salary advance timeline will appear after the first request.</p>
      </Card>
    );
  }

  return (
    <>
      <Card className="request-summary tracking-summary-card">
        <SectionHeader title={latestRequest.id} eyebrow="Current request" icon={<Route size={19} />} />
        <div className="track-status-hero">
          <span>
            <BadgeCheck size={22} />
          </span>
          <div>
            <p>Status</p>
            <strong>{latestRequest.status}</strong>
          </div>
        </div>
        <div className="track-detail-grid">
          <div>
            <IndianRupee size={18} />
            <div>
              <p>Approved amount</p>
              <strong>{formatMoney(latestRequest.approvedAmount)}</strong>
            </div>
          </div>
          <div>
            <CalendarDays size={18} />
            <div>
              <p>Payment date</p>
              <strong>{formatDate(latestRequest.recoveryDate)}</strong>
            </div>
          </div>
        </div>
      </Card>

      <Card className="tracking-timeline-card">
        <SectionHeader title="Activity" eyebrow="Request movement" />
        <div className="timeline">
          {latestRequest.timeline.map((item) => (
            <article className={`timeline-item ${item.done ? "done" : ""}`} key={item.status}>
              <span />
              <div>
                <strong>{item.status}</strong>
                <p>{item.description}</p>
                <small>{formatShortDate(item.timestamp)}</small>
              </div>
            </article>
          ))}
        </div>
      </Card>
    </>
  );
}
