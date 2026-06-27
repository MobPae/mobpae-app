import { useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  CalendarDays,
  Check,
  Circle,
  Landmark,
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
            <div className="rep-empty-icon">
              <CalendarDays size={28} />
            </div>
            <div className="rep-empty-title">No active repayment</div>
            <div className="rep-empty-sub">
              Once you take a salary advance, your repayment schedule will appear here.
            </div>
            <button type="button" className="mp-btn-primary" onClick={() => onNavigate("advance")}>
              Request Advance <ArrowRight size={16} />
            </button>
          </div>
        )}

        {isActive && (
          <>
            <section className="rep-hero-card-v2">
              <div className="rep-hero-v2">
                <div className="rep-eyebrow-v2">Next deduction · Full repayment</div>
                <div className="rep-amount-v2">{formatMoney(totalRepay)}</div>
                <div className="rep-auto-line-v2">
                  <span className="rep-auto-chip-v2">
                    <ArrowDown size={14} /> Auto-deducts {fmtShortDate(recoveryDate).replace(/ 202\d/, "")}
                  </span>
                  <span>{daysUntil(recoveryDate)}</span>
                </div>
              </div>
              <div className="rep-hero-mini-v2">
                <div>
                  <span>Advance</span>
                  <strong>{formatMoney(amount)}</strong>
                </div>
                <div>
                  <span>Due by</span>
                  <strong>{fmtShortDate(recoveryDate).replace(/ 202\d/, "")}</strong>
                </div>
              </div>
            </section>

            <section className="rep-schedule-card-v2">
              <div className="rep-schedule-v2">
              <h2>Repayment schedule</h2>

              <div className="rep-timeline-row-v2">
                <div className="rep-timeline-mark-v2 rep-timeline-mark-v2--green">
                  <span />
                  <i />
                </div>
                <div className="rep-timeline-body-v2">
                  <strong>Advance disbursed</strong>
                  <div>
                    <span>{fmtShortDate(disbursalDate)}</span>
                    <em className="rep-status-v2 rep-status-v2--green">
                      <span /> Completed
                    </em>
                  </div>
                </div>
                <b className="rep-money-v2 rep-money-v2--green">+{formatMoney(amount)}</b>
              </div>

              <div className="rep-timeline-row-v2">
                <div className="rep-timeline-mark-v2 rep-timeline-mark-v2--purple">
                  <span />
                  <i />
                </div>
                <div className="rep-timeline-body-v2">
                  <strong>Repayment due</strong>
                  <div>
                    <span>{fmtShortDate(recoveryDate)}</span>
                    <em className="rep-status-v2 rep-status-v2--orange">
                      <span /> Scheduled
                    </em>
                  </div>
                </div>
                <b className="rep-money-v2 rep-money-v2--red">-{formatMoney(totalRepay)}</b>
              </div>

              <div className="rep-timeline-row-v2 rep-timeline-row-v2--muted">
                <div className="rep-timeline-mark-v2 rep-timeline-mark-v2--muted">
                  <Circle size={16} />
                </div>
                <div className="rep-timeline-body-v2">
                  <strong>Cycle closes</strong>
                  <div>
                    <span>{fmtShortDate(recoveryDate)}</span>
                    <em className="rep-status-v2 rep-status-v2--muted">
                      <span /> Upcoming
                    </em>
                  </div>
                </div>
                <b className="rep-money-v2 rep-money-v2--muted">₹0 due</b>
              </div>
              </div>
            </section>

            <section className="rep-auto-card-v2">
              <div className="rep-auto-icon-v2">
                <Landmark size={23} />
              </div>
              <div>
                <strong>Auto-debit from salary</strong>
                <span>{bankName}</span>
                <small>{bankMeta}</small>
              </div>
              <em><span /> Active</em>
            </section>
          </>
        )}

        <section className="rep-history-v2">
          <div className="rep-history-head-v2">
            <h2>Past repayments</h2>
            {completedRequests.length > 2 && (
              <button type="button" onClick={() => setShowAllPaid((p) => !p)}>
                {showAllPaid ? "Show less" : "View all"} <ArrowRight size={15} />
              </button>
            )}
          </div>

          {completedRequests.length > 0 ? (
            visibleCompleted.map((r) => (
              <div key={r.id} className="rep-paid-row-v2">
                <span className="rep-paid-icon-v2">
                  <Check size={19} />
                </span>
                <div>
                  <strong>{new Date(r.recoveryDate).toLocaleDateString("en-IN", { month: "short" })} advance repaid</strong>
                  <small>{fmtShortDate(r.recoveryDate)}</small>
                </div>
                <b>
                  {formatMoney(r.totalRecoveryAmount)}
                  <small>Settled</small>
                </b>
              </div>
            ))
          ) : (
            <div className="rep-history-empty-v2">No past repayments yet.</div>
          )}
        </section>

        <div className="mp-bottom-space" />
      </div>
    </div>
  );
}
