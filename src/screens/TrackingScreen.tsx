import { CalendarDays, IndianRupee, Route } from "lucide-react";
import { Card } from "../components/ui/Card";
import { SectionHeader } from "../components/ui/SectionHeader";
import { StatusPill } from "../components/ui/StatusPill";
import { formatDate, formatMoney } from "../utils/format";
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
      <Card className="request-summary">
        <SectionHeader title={latestRequest.id} eyebrow="Current request" icon={<Route size={19} />} action={<StatusPill status={latestRequest.status} />} />
        <div className="detail-list">
          <div className="detail">
            <IndianRupee size={18} />
            <div>
              <p>Approved amount</p>
              <strong>{formatMoney(latestRequest.approvedAmount)}</strong>
            </div>
          </div>
          <div className="detail">
            <CalendarDays size={18} />
            <div>
              <p>Payment date</p>
              <strong>{formatDate(latestRequest.recoveryDate)}</strong>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <SectionHeader title="Timeline" eyebrow="Request movement" />
        <div className="timeline">
          {latestRequest.timeline.map((item) => (
            <article className={`timeline-item ${item.done ? "done" : ""}`} key={item.status}>
              <span />
              <div>
                <strong>{item.status}</strong>
                <p>{item.description}</p>
                <small>{item.timestamp}</small>
              </div>
            </article>
          ))}
        </div>
      </Card>
    </>
  );
}
