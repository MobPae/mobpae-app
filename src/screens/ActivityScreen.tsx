import { useState } from "react";
import {
  CheckCircle2,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Clock3,
  FileText,
  IndianRupee,
  Landmark,
  ReceiptText,
  ShieldCheck,
  WalletCards,
  XCircle,
} from "lucide-react";
import { formatMoney, formatRequestStatus, formatShortDate } from "../utils/format";
import type { AdvanceRequest, RequestStatus } from "../types/app";

type ActivityScreenProps = {
  requests: AdvanceRequest[];
};

const TIMELINE_STEPS: RequestStatus[] = [
  "Submitted",
  "Employer Approved",
  "Admin Approved",
  "Disbursed",
  "Payment Scheduled",
  "Paid",
];

const FALLBACK_COLOR: Partial<Record<RequestStatus, string>> = {
  Submitted:          "#185FA5",
  "Employer Approved":"#185FA5",
  "Admin Approved":   "#185FA5",
  Disbursed:          "#3B6D11",
  "Payment Scheduled":"#9A4910",
  Paid:               "#3B6D11",
  Rejected:           "#A32D2D",
};

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  if (h.length !== 6) return `rgba(0,0,0,${alpha})`;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function getStatusColor(request: AdvanceRequest) {
  const color = request.statusColor ?? FALLBACK_COLOR[request.status] ?? "#8D90A3";
  return color.startsWith("#") ? color : "#8D90A3";
}

function getStatusLabel(request: AdvanceRequest) {
  return formatRequestStatus(request.status, request.statusLabel);
}

function shortRequestId(id: string) {
  return id ? `#${id.slice(0, 8).toUpperCase()}` : "—";
}

function isClosed(request: AdvanceRequest) {
  return ["Paid", "Recovered", "Rejected"].includes(request.status);
}

function stepIndexOf(status: RequestStatus): number {
  if (status === "Rejected") return 1;
  const idx = TIMELINE_STEPS.indexOf(status);
  return idx >= 0 ? idx : 0;
}

function compactStatusLabel(label: string) {
  const normalized = label.toLowerCase();
  if (normalized.includes("pending approval")) return "Pending approval";
  if (normalized.includes("employer approved")) return "Employer OK";
  if (normalized.includes("admin approved")) return "Admin OK";
  if (normalized.includes("payment scheduled")) return "Scheduled";
  return label;
}

function StatusPill({ request, compact = false }: { request: AdvanceRequest; compact?: boolean }) {
  const color = getStatusColor(request);
  const label = getStatusLabel(request);
  return (
    <span className={`tx-status-pill${compact ? " compact" : ""}`} style={{ color, background: hexToRgba(color, 0.1) }}>
      {compact ? compactStatusLabel(label) : label}
    </span>
  );
}

function Timeline({ request }: { request: AdvanceRequest }) {
  const currentIdx = stepIndexOf(request.status);
  const isRejected = request.status === "Rejected";
  const displaySteps = isRejected ? (["Submitted", "Rejected"] as RequestStatus[]) : TIMELINE_STEPS;

  return (
    <div className="tx-timeline">
      {displaySteps.map((step, index) => {
        const isLast = index === displaySteps.length - 1;
        const timelineItem = request.timeline.find((item) => item.status === step);
        const done = isRejected ? step === "Submitted" || step === "Rejected" : index <= currentIdx;
        const active = !isRejected && index === currentIdx;
        const color = step === request.status ? getStatusColor(request) : FALLBACK_COLOR[step] ?? "#98A2B3";

        return (
          <div className={`tx-timeline-row ${done ? "done" : ""} ${active ? "active" : ""}`} key={step}>
            <div className="tx-timeline-marker">
              <span style={{ background: done || active ? color : undefined }}>
                {done && step !== "Rejected" && <CheckCircle2 size={12} />}
                {done && step === "Rejected" && <XCircle size={12} />}
              </span>
              {!isLast && <i />}
            </div>
            <div className="tx-timeline-copy">
              <div>
                <strong>{step === request.status ? getStatusLabel(request) : step}</strong>
                {timelineItem?.timestamp && <small>{formatShortDate(timelineItem.timestamp)}</small>}
              </div>
              {timelineItem?.description && <p>{timelineItem.description}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RequestReceipt({ request }: { request: AdvanceRequest }) {
  const amount = request.approvedAmount || request.requestedAmount;
  return (
    <div className="tx-receipt">
      <div className="tx-receipt-head">
        <div>
          <span>Request receipt</span>
          <strong>{shortRequestId(request.id)}</strong>
        </div>
        <StatusPill request={request} compact />
      </div>
      <div className="tx-receipt-grid">
        <div>
          <span>Amount</span>
          <strong>{formatMoney(request.principalAmount || amount)}</strong>
        </div>
        <div>
          <span>Tenure</span>
          <strong>{request.interestDays ? `${request.interestDays} days` : "—"}</strong>
        </div>
        <div>
          <span>Interest</span>
          <strong>{formatMoney(request.interestAmount || 0)}</strong>
        </div>
        <div>
          <span>Total payment</span>
          <strong>{formatMoney(request.totalRecoveryAmount || amount)}</strong>
        </div>
      </div>
      <div className="tx-receipt-date">
        <CalendarDays size={14} />
        <span>Payment date</span>
        <strong>{request.recoveryDate ? formatShortDate(request.recoveryDate) : "—"}</strong>
      </div>
      <div className="tx-receipt-grid compact">
        <div>
          <span>Requested</span>
          <strong>{formatShortDate(request.requestDate)}</strong>
        </div>
        <div>
          <span>Recovery</span>
          <strong>{request.recoveryDate ? formatShortDate(request.recoveryDate) : "—"}</strong>
        </div>
      </div>
      <Timeline request={request} />
    </div>
  );
}

function CurrentRequestCard({ request, expanded, onToggle }: {
  request: AdvanceRequest;
  expanded: boolean;
  onToggle: () => void;
}) {
  const amount = request.approvedAmount || request.requestedAmount;
  return (
    <section className="tx-current-card">
      <div className="tx-current-top">
        <div>
          <span>Live request · {shortRequestId(request.id)}</span>
          <h2>{formatMoney(amount)}</h2>
        </div>
        <StatusPill request={request} compact />
      </div>
      <div className="tx-current-meta">
        <div>
          <Clock3 size={15} />
          <span>Started {formatShortDate(request.requestDate)}</span>
        </div>
        <div>
          <Landmark size={15} />
          <span>{request.recoveryDate ? `Pays on ${formatShortDate(request.recoveryDate)}` : "Payment date pending"}</span>
        </div>
      </div>
      <button type="button" className="tx-expand-btn" onClick={onToggle}>
        {expanded ? "Hide details" : "View receipt"}
        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      {expanded && <RequestReceipt request={request} />}
    </section>
  );
}

function TransactionRow({ request, expanded, onToggle }: {
  request: AdvanceRequest;
  expanded: boolean;
  onToggle: () => void;
}) {
  const amount = request.approvedAmount || request.requestedAmount;
  const color = getStatusColor(request);
  const positive = ["Paid", "Recovered"].includes(request.status);

  return (
    <div className="tx-row-wrap">
      <button type="button" className="tx-row" onClick={onToggle}>
        <span className="tx-row-icon" style={{ color, background: hexToRgba(color, 0.1) }}>
          <IndianRupee size={18} />
        </span>
        <span className="tx-row-body">
          <strong>{shortRequestId(request.id)}</strong>
          <small>{formatShortDate(request.requestDate)} · {getStatusLabel(request)}</small>
        </span>
        <span className="tx-row-side">
          <strong>{positive ? "+" : ""}{formatMoney(amount)}</strong>
          {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </span>
      </button>
      {expanded && <RequestReceipt request={request} />}
    </div>
  );
}

export function ActivityScreen({ requests }: ActivityScreenProps) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const currentRequest = requests.find((request) => !isClosed(request));
  const history = requests.filter((request) => request.id !== currentRequest?.id);
  const totalDisbursed = requests
    .filter((request) => ["Disbursed", "Payment Scheduled", "Paid", "Recovered"].includes(request.status))
    .reduce((sum, request) => sum + Number(request.approvedAmount || request.requestedAmount || 0), 0);

  return (
    <div className="activity-screen-v2 tx-screen">
      <div className="tx-header">
        <div>
          <span>Money movement</span>
          <h1>Transactions</h1>
        </div>
        <div className="tx-header-icon">
          <ReceiptText size={20} />
        </div>
      </div>

      <div className="tx-summary-strip">
        <div>
          <WalletCards size={17} />
          <span>Total accessed</span>
          <strong>{formatMoney(totalDisbursed)}</strong>
        </div>
        <div>
          <FileText size={17} />
          <span>Requests</span>
          <strong>{requests.length}</strong>
        </div>
      </div>

      {currentRequest && (
        <CurrentRequestCard
          request={currentRequest}
          expanded={expanded === currentRequest.id}
          onToggle={() => setExpanded(expanded === currentRequest.id ? null : currentRequest.id)}
        />
      )}

      <div className="tx-section-head">
        <div>
          <span>History</span>
          <h2>{currentRequest ? "Past advances" : "Advance history"}</h2>
        </div>
        <small>{history.length} total</small>
      </div>

      {requests.length === 0 ? (
        <div className="tx-empty">
          <div><ShieldCheck size={28} /></div>
          <h3>No transactions yet</h3>
          <p>Your salary advance requests and repayments will appear here once you make your first request.</p>
        </div>
      ) : history.length === 0 ? (
        <div className="tx-empty slim">
          <p>No past advances yet. Your completed requests will appear here.</p>
        </div>
      ) : (
        <div className="tx-list">
          {history.map((request) => (
            <TransactionRow
              key={request.id}
              request={request}
              expanded={expanded === request.id}
              onToggle={() => setExpanded(expanded === request.id ? null : request.id)}
            />
          ))}
        </div>
      )}

      <div style={{ height: 42 }} />
    </div>
  );
}
