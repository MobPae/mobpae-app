import { useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Banknote,
  CalendarDays,
  CheckCircle,
  ChevronDown,
  HelpCircle,
  RefreshCw,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { formatMoney } from "../utils/format";
import type { AdvanceRequest, BankAccount, View } from "../types/app";
import { SUPPORT_EMAIL } from "../config";

type RepaymentScheduleScreenProps = {
  requests: AdvanceRequest[];
  bankAccount?: BankAccount | null;
  onNavigate: (view: View) => void;
};

function maskAccount(num: string) { return `•••• ${num.slice(-4)}`; }

function fmtDate(dateStr: string) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

function getDay(dateStr: string) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? "—" : String(d.getDate());
}

function getMonth(dateStr: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-IN", { month: "short" }).toUpperCase();
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
  const interest = activeRequest?.interestAmount || 0;
  const principal = activeRequest?.principalAmount || amount;
  const recoveryDate = activeRequest?.recoveryDate || "";
  const isActive = !!activeRequest && !["Paid", "Recovered"].includes(activeRequest.status);
  const bankLabel = bankAccount
    ? `${bankAccount.bankName} ${maskAccount(bankAccount.accountNumber)}`
    : "Linked bank account";

  const completedRequests = requests.filter((r) => r.recoveryStatus === "Completed");
  const totalPaid = completedRequests.reduce((s, r) => s + r.totalRecoveryAmount, 0);
  const [showAllPaid, setShowAllPaid] = useState(false);
  const visibleCompleted = showAllPaid ? completedRequests : completedRequests.slice(0, 5);

  return (
    <div className="rep-screen">

      <div className="screen-body rep-body">

        {/* ── No active advance ── */}
        {!isActive && (
          <div style={{ textAlign: "center", padding: "48px 20px 24px" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#ECEAFF", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", color: "#5B3CE3" }}>
              <CalendarDays size={28} />
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#0F0A3C", marginBottom: 6 }}>No active repayment</div>
            <div style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.6, marginBottom: 20 }}>
              Once you take a salary advance, your repayment schedule will appear here.
            </div>
            <button type="button" className="mp-btn-primary" onClick={() => onNavigate("advance")}>
              Request Advance <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* ── Next Repayment card ── */}
        {isActive && (
          <div className="rep-next-card">
            <div className="rep-next-icon">
              <CalendarDays size={24} />
            </div>
            <div className="rep-next-body">
              <div className="rep-next-lbl">Next repayment date</div>
              <div className="rep-next-date">{fmtDate(recoveryDate)}</div>
              <span className="chip chip-green"><span className="chip-dot" /> On Payday</span>
            </div>
            <div className="rep-next-right">
              <div className="rep-next-amount-lbl">Auto deduction</div>
              <div className="rep-next-amount">{formatMoney(totalRepay)}</div>
            </div>
          </div>
        )}

        {/* ── Summary stats ── */}
        <div className="rep-summary-grid">
          {[
            { icon: <Banknote size={18} />, label: "Borrowed", val: formatMoney(amount), color: "" },
            { icon: <RefreshCw size={18} />, label: "Interest", val: formatMoney(interest), color: "" },
            { icon: <Wallet size={18} />, label: "Total Due", val: formatMoney(totalRepay), color: "purple" },
            { icon: <CheckCircle size={18} />, label: "Total Repaid", val: formatMoney(totalPaid), color: "green" },
          ].map((s) => (
            <div key={s.label} className="rep-summary-item">
              <div className="rep-summary-icon">{s.icon}</div>
              <div className="rep-summary-label">{s.label}</div>
              <div className={`rep-summary-val ${s.color}`}>{s.val}</div>
            </div>
          ))}
        </div>

        {/* ── Schedule ── */}
        {isActive && (
          <div className="rep-sch-card">
            <div className="rep-sch-hdr">
              <CalendarDays size={16} color="#5B3CE3" />
              <span className="rep-sch-title">Repayment Schedule</span>
              <span className="chip chip-amber">{isActive ? "1 upcoming" : "None"}</span>
            </div>
            <div className="rep-sch-row">
              <div className="rep-sch-date">
                <div className="rep-sch-day">{getDay(recoveryDate)}</div>
                <div className="rep-sch-month">{getMonth(recoveryDate)}</div>
              </div>
              <div className="rep-sch-body">
                <div className="rep-sch-amount">{formatMoney(totalRepay)}</div>
                <div className="rep-sch-bank">Via {bankLabel}</div>
              </div>
              <span className="chip chip-amber">Pending</span>
            </div>
          </div>
        )}

        {/* ── Completed repayments ── */}
        {completedRequests.length > 0 && (
          <div className="rep-sch-card">
            <div className="rep-sch-hdr">
              <BadgeCheck size={16} color="#16A34A" />
              <span className="rep-sch-title">Repayment History</span>
              <span className="chip chip-green">{completedRequests.length} paid</span>
            </div>
            {visibleCompleted.map((r) => (
              <div key={r.id} className="rep-sch-row">
                <div className="rep-sch-date">
                  <div className="rep-sch-day" style={{ fontSize: 18 }}>{getDay(r.recoveryDate)}</div>
                  <div className="rep-sch-month">{getMonth(r.recoveryDate)}</div>
                </div>
                <div className="rep-sch-body">
                  <div className="rep-sch-amount">{formatMoney(r.totalRecoveryAmount)}</div>
                  <div className="rep-sch-bank">Salary Advance repaid</div>
                </div>
                <span className="chip chip-green"><CheckCircle size={10} /> Paid</span>
              </div>
            ))}
            {completedRequests.length > 5 && (
              <button
                type="button"
                className="mp-link-btn"
                style={{ display: "flex", justifyContent: "center", width: "100%", padding: "10px 0", fontSize: 13, gap: 4 }}
                onClick={() => setShowAllPaid(p => !p)}
              >
                <ChevronDown size={14} style={{ transform: showAllPaid ? "rotate(180deg)" : undefined, transition: "transform 0.2s" }} />
                {showAllPaid ? "Show less" : `Show all ${completedRequests.length} repayments`}
              </button>
            )}
          </div>
        )}

        {/* ── Auto repayment note ── */}
        <div className="rep-auto-card">
          <div className="rep-auto-icon"><ShieldCheck size={20} /></div>
          <div>
            <div className="rep-auto-title">Automatic Repayment</div>
            <div className="rep-auto-sub">
              Your repayment is automatically deducted from your bank account on payday.
              Ensure your account has sufficient funds to avoid any issues.
            </div>
          </div>
        </div>

        {/* ── Help ── */}
        <div className="rep-help-card">
          <div>
            <div className="rep-help-title">Need help with repayments?</div>
            <div className="rep-help-sub">Our support team is available to assist you.</div>
          </div>
          <button
            type="button"
            className="mp-btn-secondary"
            style={{ width: "auto", padding: "10px 14px" }}
            onClick={() => { window.location.href = `mailto:${SUPPORT_EMAIL}`; }}
          >
            <HelpCircle size={14} /> Support
          </button>
        </div>

        <div className="mp-bottom-space" />
      </div>
    </div>
  );
}
