import { CalendarClock, CheckCircle2, Circle, XCircle } from "lucide-react";
import { formatMoney, formatShortDate } from "../utils/format";
import type { AdvanceRequest, RequestStatus } from "../types/app";

type ActivityScreenProps = {
  requests: AdvanceRequest[];
};

// Ordered steps for the forward path
const TIMELINE_STEPS: RequestStatus[] = [
  "Submitted",
  "Employer Approved",
  "Admin Approved",
  "Disbursed",
  "Payment Scheduled",
  "Paid",
];

function stepIndexOf(status: RequestStatus): number {
  if (status === "Rejected") return 1;
  const idx = TIMELINE_STEPS.indexOf(status);
  return idx >= 0 ? idx : 0;
}

// Fallback colors when backend doesn't send statusColor
const FALLBACK_COLOR: Partial<Record<RequestStatus, string>> = {
  Rejected:           "#ef4444",
  Paid:               "#16a34a",
  Disbursed:          "#c4522a",
  "Payment Scheduled":"#c4522a",
  "Admin Approved":   "#7c3aed",
  "Employer Approved":"#0369a1",
  Submitted:          "#64748b",
};
const FALLBACK_BG: Partial<Record<RequestStatus, string>> = {
  Rejected:           "#fef2f2",
  Paid:               "#f0fdf4",
  Disbursed:          "#fdf3ee",
  "Payment Scheduled":"#fdf3ee",
  "Admin Approved":   "#ede9fe",
  "Employer Approved":"#e0f2fe",
  Submitted:          "#f8fafc",
};

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  if (h.length !== 6) return `rgba(0,0,0,${alpha})`;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function StatusBadge({ request }: { request: AdvanceRequest }) {
  // Backend statusLabel/statusColor take full priority
  const label = request.statusLabel ?? request.status;
  const color = request.statusColor ?? FALLBACK_COLOR[request.status] ?? "#64748b";
  const bg    = hexToRgba(color.startsWith("#") ? color : "#64748b", 0.1);

  return (
    <span
      style={{
        background: bg,
        color,
        fontSize: 11,
        fontWeight: 700,
        borderRadius: 20,
        padding: "3px 10px",
        letterSpacing: "0.02em",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}

type TimelineStepProps = {
  step: RequestStatus;
  stepLabel: string;      // backend statusLabel if available, else step string
  stepColor: string;      // backend statusColor if available, else fallback
  done: boolean;
  active: boolean;
  isLast: boolean;
  description: string;
  timestamp: string;
};

function TimelineStep({
  step,
  stepLabel,
  stepColor,
  done,
  active,
  isLast,
  description,
  timestamp,
}: TimelineStepProps) {
  const isRejected = step === "Rejected";

  const dotColor = done
    ? stepColor
    : active
    ? stepColor
    : "var(--b1)";

  const labelColor = done ? "var(--t1)" : active ? "var(--t1)" : "var(--t3)";
  const descColor  = done || active ? "var(--t2)" : "var(--t3)";

  return (
    <div style={{ display: "flex", gap: 12, position: "relative" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 20, flexShrink: 0 }}>
        <div
          style={{
            width: 20, height: 20, borderRadius: "50%",
            background: dotColor,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0, transition: "background 0.2s",
          }}
        >
          {done && !isRejected && <CheckCircle2 size={13} color="white" />}
          {done && isRejected  && <XCircle size={13} color="white" />}
          {!done && active     && <Circle size={8} color="white" fill="white" />}
        </div>
        {!isLast && (
          <div style={{ width: 2, flex: 1, minHeight: 24, background: done ? hexToRgba(stepColor, 0.18) : "var(--b2)", margin: "3px 0" }} />
        )}
      </div>

      <div style={{ paddingBottom: isLast ? 0 : 20, flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 13, fontWeight: done || active ? 700 : 500, color: labelColor }}>
            {stepLabel}
          </span>
          {done && timestamp && (
            <span style={{ fontSize: 11, color: "var(--t3)", fontWeight: 500 }}>
              {formatShortDate(timestamp)}
            </span>
          )}
        </div>
        {(done || active) && description && (
          <p style={{ fontSize: 12, color: descColor, marginTop: 2, lineHeight: 1.5 }}>
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

function RequestCard({ request }: { request: AdvanceRequest }) {
  const currentIdx = stepIndexOf(request.status);
  const isRejected = request.status === "Rejected";

  const displaySteps: RequestStatus[] = isRejected
    ? ["Submitted", "Rejected"]
    : TIMELINE_STEPS;

  return (
    <div
      style={{
        background: "var(--surface)",
        borderRadius: 20,
        padding: "18px 16px",
        marginBottom: 12,
        border: "1px solid var(--border)",
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
      }}
    >
      {/* Card header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 11, color: "var(--t3)", fontWeight: 600, marginBottom: 2 }}>
            {formatShortDate(request.requestDate)}
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "var(--t1)", letterSpacing: "-0.02em" }}>
            {formatMoney(request.approvedAmount || request.requestedAmount)}
          </div>
          {request.recoveryDate && !isRejected && (
            <div style={{ fontSize: 12, color: "var(--t3)", marginTop: 2 }}>
              Recovery {formatShortDate(request.recoveryDate)}
            </div>
          )}
        </div>
        <StatusBadge request={request} />
      </div>

      {/* Timeline */}
      <div style={{ paddingLeft: 4 }}>
        {displaySteps.map((step, i) => {
          const isLast = i === displaySteps.length - 1;
          const timelineItem = request.timeline.find((t) => t.status === step);
          const done   = isRejected ? (step === "Submitted" || step === "Rejected") : i <= currentIdx;
          const active = !isRejected && i === currentIdx;

          // Use backend color for this step if it's the current status, else fallback
          const stepColor =
            step === request.status && request.statusColor
              ? request.statusColor
              : FALLBACK_COLOR[step] ?? "#64748b";

          // Use backend label only for the current status step, else the step name
          const stepLabel =
            step === request.status && request.statusLabel
              ? request.statusLabel
              : step;

          return (
            <TimelineStep
              key={step}
              step={step}
              stepLabel={stepLabel}
              stepColor={stepColor}
              done={done}
              active={active}
              isLast={isLast}
              description={timelineItem?.description ?? ""}
              timestamp={timelineItem?.timestamp ?? ""}
            />
          );
        })}
      </div>
    </div>
  );
}

export function ActivityScreen({ requests }: ActivityScreenProps) {
  return (
    <div className="activity-screen">
      <div className="screen-header">
        <div className="screen-header-text">
          <h2>Advance History</h2>
          <p>Track your salary advance requests</p>
        </div>
      </div>

      {requests.length === 0 ? (
        <div className="act-empty">
          <div className="act-empty-icon">
            <CalendarClock size={24} />
          </div>
          <h3>No advances yet</h3>
          <p>
            Your salary advance requests and their status will appear here once
            you make your first request.
          </p>
        </div>
      ) : (
        <div style={{ padding: "0 16px 24px" }}>
          {requests.map((req) => (
            <RequestCard key={req.id} request={req} />
          ))}
        </div>
      )}
    </div>
  );
}
