import { StrictMode, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  BadgeCheck,
  Banknote,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  CreditCard,
  FileCheck2,
  Landmark,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  WalletCards
} from "lucide-react";
import "./styles.css";

type BankAccount = {
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
};

type AdvanceRequest = {
  id: string;
  amount: number;
  totalRecovery: number;
  recoveryDate: string;
  status: "Employer review" | "Disbursed" | "Recovered";
};

const membership = {
  label: "MobPae Membership",
  feeLabel: "Configured by backend",
  validityLabel: "1 year plan",
  status: "Inactive"
};

const initialBankAccount: BankAccount = {
  accountHolderName: "",
  bankName: "",
  accountNumber: "",
  ifscCode: ""
};

const requests: AdvanceRequest[] = [
  {
    id: "ADV-1048",
    amount: 5000,
    totalRecovery: 5039.45,
    recoveryDate: "2026-06-28",
    status: "Disbursed"
  }
];

const formatMoney = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2
  }).format(amount);

const formatDate = (date: string) =>
  new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(date));

const maskAccountNumber = (accountNumber: string) => {
  if (!accountNumber) return "";
  return `**** ${accountNumber.slice(-4)}`;
};

function App() {
  const [kycDone, setKycDone] = useState(false);
  const [membershipActive, setMembershipActive] = useState(false);
  const [bankAccount, setBankAccount] = useState<BankAccount>(initialBankAccount);
  const [savedBankAccount, setSavedBankAccount] = useState<BankAccount | null>(null);

  const bankDone = Boolean(savedBankAccount);
  const eligible = kycDone && membershipActive && bankDone;
  const onboardingSteps = useMemo(
    () => [
      { label: "Profile", done: true },
      { label: "KYC", done: kycDone },
      { label: "Bank account", done: bankDone },
      { label: "Membership", done: membershipActive },
      { label: "Salary advances", done: eligible }
    ],
    [bankDone, eligible, kycDone, membershipActive]
  );

  const handleBankSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSavedBankAccount({
      ...bankAccount,
      ifscCode: bankAccount.ifscCode.toUpperCase()
    });
  };

  return (
    <main className="app-shell">
      <section className="phone-frame">
        <header className="topbar">
          <div>
            <p className="eyebrow">MobPae Employee</p>
            <h1>Hi, Aarav</h1>
          </div>
          <button className="icon-button" aria-label="Security">
            <ShieldCheck size={20} />
          </button>
        </header>

        <section className="balance-panel">
          <div>
            <p>Available advance limit</p>
            <strong>{eligible ? formatMoney(25000) : formatMoney(0)}</strong>
            <span>{eligible ? "Ready for request" : "Complete onboarding to unlock"}</span>
          </div>
          <WalletCards size={38} />
        </section>

        <section className="status-strip">
          {onboardingSteps.map((step) => (
            <div className={step.done ? "step done" : "step"} key={step.label}>
              <span>{step.done ? <CheckCircle2 size={14} /> : step.label.slice(0, 1)}</span>
              <p>{step.label}</p>
            </div>
          ))}
        </section>

        <section className="quick-grid">
          <MetricCard icon={<FileCheck2 size={18} />} label="KYC" value={kycDone ? "Verified" : "Pending"} tone={kycDone ? "good" : "warn"} />
          <MetricCard icon={<Sparkles size={18} />} label="Membership" value={membershipActive ? "Active" : "Inactive"} tone={membershipActive ? "good" : "warn"} />
          <MetricCard icon={<Landmark size={18} />} label="Bank account" value={bankDone ? "Added" : "Required"} tone={bankDone ? "good" : "warn"} />
          <MetricCard icon={<CalendarDays size={18} />} label="Recovery" value={formatDate(requests[0].recoveryDate)} />
        </section>

        <section className="card">
          <div className="section-title">
            <div>
              <p className="eyebrow">MVP Required</p>
              <h2>Add bank account</h2>
            </div>
            <Landmark size={22} />
          </div>

          {savedBankAccount ? (
            <div className="saved-bank">
              <div>
                <strong>{savedBankAccount.bankName}</strong>
                <p>{savedBankAccount.accountHolderName}</p>
                <span>{maskAccountNumber(savedBankAccount.accountNumber)} · {savedBankAccount.ifscCode}</span>
              </div>
              <BadgeCheck size={22} />
            </div>
          ) : null}

          <form className="bank-form" onSubmit={handleBankSubmit}>
            <Field
              label="Account holder name"
              value={bankAccount.accountHolderName}
              onChange={(value) => setBankAccount((current) => ({ ...current, accountHolderName: value }))}
              placeholder="Aarav Sharma"
              required
            />
            <Field
              label="Bank name"
              value={bankAccount.bankName}
              onChange={(value) => setBankAccount((current) => ({ ...current, bankName: value }))}
              placeholder="HDFC Bank"
              required
            />
            <Field
              label="Account number"
              value={bankAccount.accountNumber}
              onChange={(value) => setBankAccount((current) => ({ ...current, accountNumber: value.replace(/\D/g, "") }))}
              placeholder="501002348901"
              inputMode="numeric"
              required
            />
            <Field
              label="IFSC code"
              value={bankAccount.ifscCode}
              onChange={(value) => setBankAccount((current) => ({ ...current, ifscCode: value.toUpperCase() }))}
              placeholder="HDFC0001234"
              required
            />
            <button className="primary-button" type="submit">
              {savedBankAccount ? "Update bank account" : "Save bank account"}
              <ChevronRight size={18} />
            </button>
          </form>
        </section>

        <section className="card">
          <div className="section-title">
            <div>
              <p className="eyebrow">Eligibility</p>
              <h2>Complete access setup</h2>
            </div>
            <ClipboardCheck size={22} />
          </div>
          <ActionRow icon={<FileCheck2 size={18} />} title="Complete KYC" subtitle="PAN, Aadhaar and salary slip verification" active={!kycDone} onClick={() => setKycDone(true)} />
          <ActionRow icon={<CreditCard size={18} />} title={membership.label} subtitle={`${membership.feeLabel} · ${membership.validityLabel}`} active={!membershipActive} onClick={() => setMembershipActive(true)} />
        </section>

        <section className="card">
          <div className="section-title">
            <div>
              <p className="eyebrow">Salary advance</p>
              <h2>Request preview</h2>
            </div>
            <Banknote size={22} />
          </div>
          <div className="advance-preview">
            <div>
              <p>Advance amount</p>
              <strong>{formatMoney(5000)}</strong>
            </div>
            <div>
              <p>Total salary deduction</p>
              <strong>{formatMoney(5039.45)}</strong>
            </div>
          </div>
          <p className="deduction-note">
            {formatMoney(5039.45)} will be deducted from your salary on {formatDate("2026-06-28")}. No manual repayment is required.
          </p>
          <button className="primary-button" type="button" disabled={!eligible}>
            Request advance
            <LockKeyhole size={18} />
          </button>
        </section>

        <section className="card">
          <div className="section-title">
            <div>
              <p className="eyebrow">Activity</p>
              <h2>Recent request</h2>
            </div>
          </div>
          {requests.map((request) => (
            <article className="request-row" key={request.id}>
              <div>
                <strong>{request.id}</strong>
                <p>{request.status}</p>
              </div>
              <div>
                <strong>{formatMoney(request.amount)}</strong>
                <p>{formatDate(request.recoveryDate)}</p>
              </div>
            </article>
          ))}
        </section>
      </section>
    </main>
  );
}

function MetricCard({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone?: "good" | "warn" }) {
  return (
    <article className={`metric ${tone ?? ""}`}>
      <span>{icon}</span>
      <p>{label}</p>
      <strong>{value}</strong>
    </article>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  inputMode,
  required
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  required?: boolean;
}) {
  return (
    <label className="field">
      {label}
      <input value={value} placeholder={placeholder} inputMode={inputMode} required={required} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function ActionRow({
  icon,
  title,
  subtitle,
  active,
  onClick
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button className="action-row" type="button" disabled={!active} onClick={onClick}>
      <span>{active ? icon : <CheckCircle2 size={18} />}</span>
      <div>
        <strong>{title}</strong>
        <p>{active ? subtitle : "Completed"}</p>
      </div>
      <ChevronRight size={18} />
    </button>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

