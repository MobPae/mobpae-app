import { useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Landmark,
  Zap,
} from "lucide-react";
import { formatMoney } from "../utils/format";
import type { AdvanceRequest, BankAccount, View } from "../types/app";

type RepaymentScheduleScreenProps = {
  requests: AdvanceRequest[];
  bankAccount?: BankAccount | null;
  onNavigate: (view: View) => void;
};

function fmtShortDate(dateStr: string) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function daysUntil(dateStr: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  const days = Math.max(0, Math.ceil((d.getTime() - Date.now()) / 86_400_000));
  return `in ${days} ${days === 1 ? "day" : "days"}`;
}

function maskAccount(num?: string) {
  if (!num) return "Account linked";
  return `•••• ${num.slice(-4)}`;
}

export function RepaymentScheduleScreen({
  requests,
  bankAccount,
  onNavigate,
}: RepaymentScheduleScreenProps) {
  const activeRequest = requests.find(
    (r) => !["Paid", "Recovered", "Rejected"].includes(r.status)
  );

  const amount = activeRequest ? (activeRequest.approvedAmount || activeRequest.requestedAmount) : 0;
  const totalRepay = activeRequest?.totalRecoveryAmount || amount;
  const recoveryDate = activeRequest?.recoveryDate || "";
  const disbursalDate = activeRequest?.disbursalDate || activeRequest?.requestDate || "";
  const isActive = !!activeRequest && !["Paid", "Recovered"].includes(activeRequest.status);
  const bankName = bankAccount?.bankName || "Linked bank account";
  const bankMeta = bankAccount
    ? `${maskAccount(bankAccount.accountNumber)} · ${bankAccount.ifscCode}`
    : "Bank account verified";

  const completedRequests = requests.filter((r) => r.recoveryStatus === "Completed");
  const [showAllPaid, setShowAllPaid] = useState(false);
  const visibleCompleted = showAllPaid ? completedRequests : completedRequests.slice(0, 2);

  return (
    <div className="rep-screen">
      <div className="rep-body">

        {/* ── No active advance ── */}
        {!isActive && (
          <div className="rep-empty-state">
            <div className="rep-empty-icon"><CalendarDays size={28} /></div>
            <div className="rep-empty-title">No active repayment</div>
            <div className="rep-empty-sub">Once you take a salary advance, your schedule appears here.</div>
            <button type="button" className="mp-btn-primary" onClick={() => onNavigate("advance")}>
              Request Advance <ArrowRight size={16} />
            </button>
          </div>
        )}

        {isActive && (
          <>
            {/* ── Inline repayment overview (no card) ── */}
            <section className="rep-inline-hero">
              <div className="rep-inline-eyebrow">Total repayment due</div>
              <div className="rep-inline-amount-row">
                <div className="rep-inline-amount">{formatMoney(totalRepay)}</div>
                <div className="rep-inline-badge"><Clock size={11} />{daysUntil(recoveryDate)}</div>
              </div>
              <div className="rep-inline-meta">
                Credited <strong>{formatMoney(amount)}</strong>
                <span>·</span>
                Due <strong>{fmtShortDate(recoveryDate).replace(/ 202\d/, "")}</strong>
              </div>

              {/* Progress bar */}
              <div className="rep-inline-track">
                <div className="rep-inline-fill" style={{ width: "100%" }} />
              </div>

              {/* Bank auto-debit row */}
              <div className="rep-inline-bank">
                <Landmark size={13} />
                <span>{bankName} · {bankMeta}</span>
                <div className="rep-inline-auto"><Zap size={9} />Auto</div>
              </div>
            </section>

            {/* ── Journey steps ── */}
            <section className="rep-journey-card">
              <div className="rep-journey-label">Repayment journey</div>
              <div className="rep-journey-step rep-journey-step--done">
                <div className="rep-journey-dot rep-journey-dot--green"><BadgeCheck size={13} /></div>
                <div className="rep-journey-line" />
                <div className="rep-journey-body">
                  <span>Advance credited</span>
                  <strong>{fmtShortDate(disbursalDate)}</strong>
                </div>
                <div className="rep-journey-amount green">+{formatMoney(amount)}</div>
              </div>
              <div className="rep-journey-step rep-journey-step--active">
                <div className="rep-journey-dot rep-journey-dot--orange">
                  <div className="rep-journey-pulse" />
                </div>
                <div className="rep-journey-line rep-journey-line--muted" />
                <div className="rep-journey-body">
                  <span>Auto-deduction</span>
                  <strong>{fmtShortDate(recoveryDate)}</strong>
                </div>
                <div className="rep-journey-amount red">−{formatMoney(totalRepay)}</div>
              </div>
              <div className="rep-journey-step rep-journey-step--upcoming">
                <div className="rep-journey-dot rep-journey-dot--muted" />
                <div />
                <div className="rep-journey-body">
                  <span>Cycle closes</span>
                  <strong>₹0 balance</strong>
                </div>
                <div className="rep-journey-amount muted">Clear</div>
              </div>
            </section>
          </>
        )}

        {/* ── Past repayments ── */}
        {completedRequests.length > 0 && (
          <section className="rep-history-v2">
            <div className="rep-history-head-v2">
              <h2>Past repayments</h2>
              {completedRequests.length > 2 && (
                <button type="button" onClick={() => setShowAllPaid((p) => !p)}>
                  {showAllPaid ? <><ChevronUp size={14} /> Less</> : <><ChevronDown size={14} /> All</>}
                </button>
              )}
            </div>
            {visibleCompleted.map((r) => (
              <div key={r.id} className="rep-paid-row-v2">
                <span className="rep-paid-icon-v2"><Check size={16} /></span>
                <div>
                  <strong>{new Date(r.recoveryDate).toLocaleDateString("en-IN", { month: "short", year: "numeric" })} advance</strong>
                  <small>{fmtShortDate(r.recoveryDate)}</small>
                </div>
                <b>{formatMoney(r.totalRecoveryAmount)}<small>Settled</small></b>
              </div>
            ))}
          </section>
        )}

        <div className="mp-bottom-space" />
      </div>
    </div>
  );
}
