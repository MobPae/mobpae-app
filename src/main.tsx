import { StrictMode, useMemo, useState, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import {
  AlertCircle,
  BadgeCheck,
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  CreditCard,
  FileCheck2,
  Home,
  Landmark,
  ListChecks,
  Loader2,
  LockKeyhole,
  LogOut,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  UserRound,
  WalletCards
} from "lucide-react";
import "./styles.css";

type View = "dashboard" | "kyc" | "advance" | "tracking" | "profile";
type DocumentStatus = "Not Uploaded" | "Under Review" | "Verified" | "Rejected";
type RequestStatus = "Submitted" | "Under Review" | "Approved" | "Disbursed" | "Recovery Scheduled" | "Recovered";

type KycDocument = {
  id: string;
  label: string;
  status: DocumentStatus;
  note: string;
};

type BankAccount = {
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
};

type AdvanceRequest = {
  id: string;
  requestedAmount: number;
  approvedAmount: number;
  requestDate: string;
  status: RequestStatus;
  remarks: string;
  principalAmount: number;
  interestAmount: number;
  totalRecoveryAmount: number;
  recoveryDate: string;
  recoveryStatus: "Scheduled" | "Completed";
  disbursalDate?: string;
  disbursalStatus: "Pending" | "Disbursed";
  timeline: Array<{
    status: RequestStatus;
    timestamp: string;
    description: string;
    done: boolean;
  }>;
};

const membershipConfig = {
  planName: "MobPae Membership",
  fee: 449,
  couponDiscount: 0,
  validityLabel: "1 year",
  benefits: ["Access salary advances", "Transparent salary deductions", "Request tracking", "Recovery tracking", "Financial flexibility"]
};

const employee = {
  name: "Aarav Sharma",
  email: "aarav.sharma@northstar.example",
  phone: "+91 98765 43210",
  employeeCode: "EMP-MP-2048",
  employer: "Northstar Retail Pvt Ltd",
  accountActive: true,
  salaryLimit: 25000
};

const initialDocuments: KycDocument[] = [
  { id: "pan", label: "PAN", status: "Verified", note: "Identity document verified." },
  { id: "aadhaar", label: "Aadhaar", status: "Under Review", note: "Verification usually completes within one working day." },
  { id: "salary-slip", label: "Salary Slip", status: "Not Uploaded", note: "Latest monthly salary slip required." }
];

const initialBankAccount: BankAccount = {
  accountHolderName: "",
  bankName: "",
  accountNumber: "",
  ifscCode: ""
};

const demoRequest: AdvanceRequest = {
  id: "ADV-1048",
  requestedAmount: 5000,
  approvedAmount: 5000,
  requestDate: "2026-06-20",
  status: "Recovery Scheduled",
  remarks: "Approved for payroll-linked recovery.",
  principalAmount: 5000,
  interestAmount: 39.45,
  totalRecoveryAmount: 5039.45,
  recoveryDate: "2026-06-28",
  recoveryStatus: "Scheduled",
  disbursalDate: "2026-06-20",
  disbursalStatus: "Disbursed",
  timeline: [
    { status: "Submitted", timestamp: "20 Jun, 10:15 AM", description: "Your salary advance request was submitted.", done: true },
    { status: "Under Review", timestamp: "20 Jun, 10:18 AM", description: "Employer review started.", done: true },
    { status: "Approved", timestamp: "20 Jun, 12:40 PM", description: "Employer approved your request.", done: true },
    { status: "Disbursed", timestamp: "20 Jun, 01:10 PM", description: "MobPae disbursed funds to your bank account.", done: true },
    { status: "Recovery Scheduled", timestamp: "28 Jun", description: "Payroll deduction is scheduled.", done: true },
    { status: "Recovered", timestamp: "Pending", description: "Recovery will complete after payroll deduction.", done: false }
  ]
};

const notifications = [
  "Aadhaar verification is under review.",
  "Salary slip upload is pending.",
  "Funds disbursed for ADV-1048.",
  "Salary deduction scheduled for 28 Jun 2026."
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

const maskAccountNumber = (accountNumber: string) => (accountNumber ? `**** ${accountNumber.slice(-4)}` : "");

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [view, setView] = useState<View>("dashboard");
  const [documents, setDocuments] = useState(initialDocuments);
  const [membershipActive, setMembershipActive] = useState(false);
  const [bankForm, setBankForm] = useState(initialBankAccount);
  const [bankAccount, setBankAccount] = useState<BankAccount | null>(null);
  const [advanceAmount, setAdvanceAmount] = useState(5000);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const kycVerifiedCount = documents.filter((document) => document.status === "Verified").length;
  const kycComplete = kycVerifiedCount === documents.length;
  const bankComplete = Boolean(bankAccount);
  const hasActiveRestriction = demoRequest.recoveryStatus === "Scheduled";
  const eligible = employee.accountActive && kycComplete && membershipActive && bankComplete && !hasActiveRestriction && employee.salaryLimit > 0;
  const finalMembershipFee = membershipConfig.fee - membershipConfig.couponDiscount;
  const interestAmount = Number((advanceAmount * 0.00789).toFixed(2));
  const recoveryPreview = {
    principal: advanceAmount,
    interest: interestAmount,
    total: advanceAmount + interestAmount,
    interestDays: 8,
    recoveryDate: "2026-06-28"
  };

  const onboardingSteps = useMemo(
    () => [
      { label: "Login", done: loggedIn },
      { label: "Profile", done: true },
      { label: "KYC", done: kycComplete },
      { label: "Bank", done: bankComplete },
      { label: "Membership", done: membershipActive },
      { label: "Advances", done: eligible }
    ],
    [bankComplete, eligible, kycComplete, loggedIn, membershipActive]
  );

  const completeAllKyc = () => {
    setDocuments((current) => current.map((document) => ({ ...document, status: "Verified", note: "Document verified." })));
  };

  const saveBankAccount = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBankAccount({ ...bankForm, ifscCode: bankForm.ifscCode.toUpperCase() });
  };

  const simulateRequest = () => {
    setLoading(true);
    setError("");
    window.setTimeout(() => {
      setLoading(false);
      setError("An active recovery is already scheduled. New advances unlock after payroll recovery is complete.");
    }, 600);
  };

  if (!loggedIn) {
    return <LoginScreen onLogin={() => setLoggedIn(true)} />;
  }

  return (
    <main className="app-shell">
      <section className="device">
        <header className="topbar">
          <div>
            <p className="eyebrow">MobPae Employee</p>
            <h1>{employee.name.split(" ")[0]}'s salary access</h1>
          </div>
          <button className="icon-button" aria-label="Notifications" onClick={() => setView("dashboard")}>
            <Bell size={20} />
          </button>
        </header>

        <section className="hero-card">
          <div>
            <p>Available advance limit</p>
            <strong>{eligible ? formatMoney(employee.salaryLimit) : formatMoney(0)}</strong>
            <span>{eligible ? "You can request an advance" : nextBlocker({ kycComplete, membershipActive, bankComplete, hasActiveRestriction })}</span>
          </div>
          <WalletCards size={42} />
        </section>

        <section className="step-strip">
          {onboardingSteps.map((step) => (
            <div className={step.done ? "step done" : "step"} key={step.label}>
              <span>{step.done ? <CheckCircle2 size={14} /> : step.label.slice(0, 1)}</span>
              <p>{step.label}</p>
            </div>
          ))}
        </section>

        <nav className="tabs" aria-label="Employee app sections">
          <TabButton active={view === "dashboard"} icon={<Home size={17} />} label="Home" onClick={() => setView("dashboard")} />
          <TabButton active={view === "kyc"} icon={<FileCheck2 size={17} />} label="KYC" onClick={() => setView("kyc")} />
          <TabButton active={view === "advance"} icon={<CreditCard size={17} />} label="Advance" onClick={() => setView("advance")} />
          <TabButton active={view === "tracking"} icon={<ListChecks size={17} />} label="Track" onClick={() => setView("tracking")} />
          <TabButton active={view === "profile"} icon={<UserRound size={17} />} label="Profile" onClick={() => setView("profile")} />
        </nav>

        {view === "dashboard" ? (
          <Dashboard
            kycComplete={kycComplete}
            membershipActive={membershipActive}
            bankComplete={bankComplete}
            finalMembershipFee={finalMembershipFee}
            onGoKyc={() => setView("kyc")}
            onGoAdvance={() => setView("advance")}
            onActivateMembership={() => setMembershipActive(true)}
          />
        ) : null}

        {view === "kyc" ? (
          <KycView documents={documents} verifiedCount={kycVerifiedCount} onComplete={completeAllKyc} />
        ) : null}

        {view === "advance" ? (
          <AdvanceView
            advanceAmount={advanceAmount}
            bankAccount={bankAccount}
            bankForm={bankForm}
            eligible={eligible}
            error={error}
            loading={loading}
            membershipActive={membershipActive}
            finalMembershipFee={finalMembershipFee}
            kycComplete={kycComplete}
            preview={recoveryPreview}
            onAmountChange={setAdvanceAmount}
            onActivateMembership={() => setMembershipActive(true)}
            onBankFormChange={setBankForm}
            onGoKyc={() => setView("kyc")}
            onRequest={simulateRequest}
            onSaveBank={saveBankAccount}
          />
        ) : null}

        {view === "tracking" ? <TrackingView request={demoRequest} /> : null}

        {view === "profile" ? (
          <ProfileView
            kycComplete={kycComplete}
            membershipActive={membershipActive}
            bankAccount={bankAccount}
            onLogout={() => setLoggedIn(false)}
          />
        ) : null}
      </section>
    </main>
  );
}

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  return (
    <main className="login-shell">
      <section className="login-card">
        <div className="brand-mark">
          <WalletCards size={28} />
        </div>
        <p className="eyebrow">Earned Wage Access</p>
        <h1>MobPae Employee App</h1>
        <p className="login-copy">
          Sign in with the credentials issued by your employer after app access is activated.
        </p>
        <label className="field">
          Employee email
          <input value={employee.email} readOnly />
        </label>
        <label className="field">
          Password
          <input value="MobPae@123" readOnly type="password" />
        </label>
        <button className="primary-button" type="button" onClick={onLogin}>
          Sign in
          <ChevronRight size={18} />
        </button>
      </section>
    </main>
  );
}

function Dashboard({
  kycComplete,
  membershipActive,
  bankComplete,
  finalMembershipFee,
  onGoKyc,
  onGoAdvance,
  onActivateMembership
}: {
  kycComplete: boolean;
  membershipActive: boolean;
  bankComplete: boolean;
  finalMembershipFee: number;
  onGoKyc: () => void;
  onGoAdvance: () => void;
  onActivateMembership: () => void;
}) {
  return (
    <>
      <section className="quick-grid">
        <Metric icon={<FileCheck2 size={18} />} label="KYC" value={kycComplete ? "Complete" : "Pending"} tone={kycComplete ? "good" : "warn"} />
        <Metric icon={<Landmark size={18} />} label="Bank" value={bankComplete ? "Added" : "Required"} tone={bankComplete ? "good" : "warn"} />
        <Metric icon={<Sparkles size={18} />} label="Membership" value={membershipActive ? "Active" : "Inactive"} tone={membershipActive ? "good" : "warn"} />
        <Metric icon={<CalendarDays size={18} />} label="Next deduction" value={formatDate(demoRequest.recoveryDate)} />
      </section>

      <Card eyebrow="Action needed" title="Unlock salary advances" icon={<ClipboardCheck size={22} />}>
        {!kycComplete ? <ActionRow icon={<FileCheck2 size={18} />} title="Complete KYC" subtitle="PAN, Aadhaar and salary slip are required." onClick={onGoKyc} /> : null}
        {!membershipActive ? (
          <ActionRow
            icon={<Sparkles size={18} />}
            title="Activate membership"
            subtitle={`Current payable amount: ${formatMoney(finalMembershipFee)}. Values come from settings.`}
            onClick={onActivateMembership}
          />
        ) : null}
        <ActionRow icon={<CreditCard size={18} />} title="Check advance preview" subtitle="Review salary deduction before request." onClick={onGoAdvance} />
      </Card>

      <Card eyebrow="Recovery schedule" title="Upcoming salary deduction" icon={<CalendarDays size={22} />}>
        <div className="deduction-banner">
          <strong>{formatMoney(demoRequest.totalRecoveryAmount)}</strong>
          <p>will be deducted from your salary on {formatDate(demoRequest.recoveryDate)}. No manual repayment is required.</p>
        </div>
      </Card>

      <Card eyebrow="Notifications" title="Recent updates" icon={<Bell size={22} />}>
        <div className="notification-list">
          {notifications.map((notification) => (
            <div className="notification" key={notification}>
              <span />
              <p>{notification}</p>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}

function KycView({ documents, verifiedCount, onComplete }: { documents: KycDocument[]; verifiedCount: number; onComplete: () => void }) {
  const progress = Math.round((verifiedCount / documents.length) * 100);
  return (
    <Card eyebrow="KYC first" title={`${progress}% complete`} icon={<ShieldCheck size={22} />}>
      <div className="progress-track">
        <span style={{ width: `${progress}%` }} />
      </div>
      <div className="document-list">
        {documents.map((document) => (
          <article className="document-row" key={document.id}>
            <div>
              <strong>{document.label}</strong>
              <p>{document.note}</p>
            </div>
            <StatusPill label={document.status} />
          </article>
        ))}
      </div>
      <button className="secondary-button" type="button" onClick={onComplete}>
        Simulate KYC approval
        <RefreshCcw size={17} />
      </button>
    </Card>
  );
}

function AdvanceView({
  advanceAmount,
  bankAccount,
  bankForm,
  eligible,
  error,
  loading,
  membershipActive,
  finalMembershipFee,
  kycComplete,
  preview,
  onAmountChange,
  onActivateMembership,
  onBankFormChange,
  onGoKyc,
  onRequest,
  onSaveBank
}: {
  advanceAmount: number;
  bankAccount: BankAccount | null;
  bankForm: BankAccount;
  eligible: boolean;
  error: string;
  loading: boolean;
  membershipActive: boolean;
  finalMembershipFee: number;
  kycComplete: boolean;
  preview: { principal: number; interest: number; total: number; interestDays: number; recoveryDate: string };
  onAmountChange: (amount: number) => void;
  onActivateMembership: () => void;
  onBankFormChange: (account: BankAccount) => void;
  onGoKyc: () => void;
  onRequest: () => void;
  onSaveBank: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <>
      <Card eyebrow="Bank setup" title="Add bank account for transfer" icon={<Landmark size={22} />}>
        {bankAccount ? (
          <div className="saved-bank">
            <div>
              <strong>{bankAccount.bankName}</strong>
              <p>{bankAccount.accountHolderName}</p>
              <span>{maskAccountNumber(bankAccount.accountNumber)} · {bankAccount.ifscCode}</span>
            </div>
            <BadgeCheck size={22} />
          </div>
        ) : null}
        <form className="bank-form" onSubmit={onSaveBank}>
          <Field label="Account holder name" value={bankForm.accountHolderName} placeholder="Aarav Sharma" required onChange={(value) => onBankFormChange({ ...bankForm, accountHolderName: value })} />
          <Field label="Bank name" value={bankForm.bankName} placeholder="HDFC Bank" required onChange={(value) => onBankFormChange({ ...bankForm, bankName: value })} />
          <Field label="Account number" value={bankForm.accountNumber} placeholder="501002348901" inputMode="numeric" required onChange={(value) => onBankFormChange({ ...bankForm, accountNumber: value.replace(/\D/g, "") })} />
          <Field label="IFSC code" value={bankForm.ifscCode} placeholder="HDFC0001234" required onChange={(value) => onBankFormChange({ ...bankForm, ifscCode: value.toUpperCase() })} />
          <button className="primary-button" type="submit">
            {bankAccount ? "Update bank account" : "Save bank account"}
            <ChevronRight size={18} />
          </button>
        </form>
      </Card>

      <Card eyebrow="Membership" title="Activate access" icon={<Sparkles size={22} />}>
        <div className="membership-panel">
          <div>
            <strong>{membershipConfig.planName}</strong>
            <p>{membershipConfig.validityLabel} validity. Coupon and employer-sponsored membership ready.</p>
          </div>
          <strong>{formatMoney(finalMembershipFee)}</strong>
        </div>
        <div className="benefit-list">
          {membershipConfig.benefits.map((benefit) => (
            <span key={benefit}><CheckCircle2 size={14} /> {benefit}</span>
          ))}
        </div>
        <button className="secondary-button" type="button" disabled={membershipActive} onClick={onActivateMembership}>
          {membershipActive ? "Membership active" : "Activate membership"}
          <ChevronRight size={17} />
        </button>
      </Card>

      <Card eyebrow="Salary advance" title="Deduction preview" icon={<CreditCard size={22} />}>
        <label className="field">
          Advance amount
          <input min={1000} max={25000} type="number" value={advanceAmount} onChange={(event) => onAmountChange(Number(event.target.value))} />
        </label>
        <div className="preview-grid">
          <PreviewItem label="Advance amount" value={formatMoney(preview.principal)} />
          <PreviewItem label="Interest / charges" value={formatMoney(preview.interest)} />
          <PreviewItem label="Interest days" value={`${preview.interestDays} days`} />
          <PreviewItem label="Recovery date" value={formatDate(preview.recoveryDate)} />
        </div>
        <div className="deduction-banner">
          <strong>{formatMoney(preview.total)}</strong>
          <p>will be automatically deducted from salary on {formatDate(preview.recoveryDate)}. No manual payment is required.</p>
        </div>
        {!kycComplete ? <InlineAlert text="KYC must be fully verified before requesting an advance." action="Complete KYC" onClick={onGoKyc} /> : null}
        {error ? <InlineAlert text={error} /> : null}
        <button className="primary-button" type="button" disabled={!eligible || loading} onClick={onRequest}>
          {loading ? <Loader2 className="spin" size={18} /> : <LockKeyhole size={18} />}
          Request advance
        </button>
      </Card>
    </>
  );
}

function TrackingView({ request }: { request: AdvanceRequest }) {
  return (
    <>
      <Card eyebrow="Request tracking" title={request.id} icon={<ListChecks size={22} />}>
        <div className="timeline">
          {request.timeline.map((item) => (
            <article className={item.done ? "timeline-item done" : "timeline-item"} key={item.status}>
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

      <Card eyebrow="Request details" title="Advance and recovery" icon={<ClipboardCheck size={22} />}>
        <div className="detail-list">
          <Detail label="Requested amount" value={formatMoney(request.requestedAmount)} />
          <Detail label="Approved amount" value={formatMoney(request.approvedAmount)} />
          <Detail label="Status" value={request.status} />
          <Detail label="Request date" value={formatDate(request.requestDate)} />
          <Detail label="Remarks" value={request.remarks} />
          <Detail label="Principal amount" value={formatMoney(request.principalAmount)} />
          <Detail label="Interest amount" value={formatMoney(request.interestAmount)} />
          <Detail label="Total salary deduction" value={formatMoney(request.totalRecoveryAmount)} />
          <Detail label="Recovery status" value={request.recoveryStatus} />
          <Detail label="Disbursal status" value={request.disbursalStatus} />
        </div>
      </Card>

      <Card eyebrow="Salary deductions" title="Recovery schedule" icon={<CalendarDays size={22} />}>
        <article className="request-row">
          <div>
            <strong>{formatMoney(request.totalRecoveryAmount)}</strong>
            <p>{formatMoney(request.principalAmount)} advance + {formatMoney(request.interestAmount)} charges</p>
          </div>
          <div>
            <strong>{formatDate(request.recoveryDate)}</strong>
            <p>{request.recoveryStatus}</p>
          </div>
        </article>
      </Card>
    </>
  );
}

function ProfileView({
  kycComplete,
  membershipActive,
  bankAccount,
  onLogout
}: {
  kycComplete: boolean;
  membershipActive: boolean;
  bankAccount: BankAccount | null;
  onLogout: () => void;
}) {
  return (
    <Card eyebrow="Profile" title="Account information" icon={<UserRound size={22} />}>
      <div className="detail-list">
        <Detail label="Name" value={employee.name} />
        <Detail label="Email" value={employee.email} />
        <Detail label="Phone" value={employee.phone} />
        <Detail label="Employee code" value={employee.employeeCode} />
        <Detail label="Employer" value={employee.employer} />
        <Detail label="KYC status" value={kycComplete ? "Verified" : "Incomplete"} />
        <Detail label="Membership status" value={membershipActive ? "Active" : "Inactive"} />
        <Detail label="Bank account" value={bankAccount ? `${bankAccount.bankName} ${maskAccountNumber(bankAccount.accountNumber)}` : "Not added"} />
      </div>
      <button className="secondary-button" type="button">
        Change password
        <ChevronRight size={17} />
      </button>
      <button className="danger-button" type="button" onClick={onLogout}>
        Logout
        <LogOut size={17} />
      </button>
    </Card>
  );
}

function Card({ eyebrow, title, icon, children }: { eyebrow: string; title: string; icon?: ReactNode; children: ReactNode }) {
  return (
    <section className="card">
      <div className="section-title">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h2>{title}</h2>
        </div>
        {icon}
      </div>
      {children}
    </section>
  );
}

function TabButton({ active, icon, label, onClick }: { active: boolean; icon: ReactNode; label: string; onClick: () => void }) {
  return (
    <button className={active ? "tab active" : "tab"} type="button" onClick={onClick}>
      {icon}
      <span>{label}</span>
    </button>
  );
}

function Metric({ icon, label, value, tone }: { icon: ReactNode; label: string; value: string; tone?: "good" | "warn" }) {
  return (
    <article className={`metric ${tone ?? ""}`}>
      <span>{icon}</span>
      <p>{label}</p>
      <strong>{value}</strong>
    </article>
  );
}

function ActionRow({ icon, title, subtitle, onClick }: { icon: ReactNode; title: string; subtitle: string; onClick: () => void }) {
  return (
    <button className="action-row" type="button" onClick={onClick}>
      <span>{icon}</span>
      <div>
        <strong>{title}</strong>
        <p>{subtitle}</p>
      </div>
      <ChevronRight size={18} />
    </button>
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

function PreviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p>{label}</p>
      <strong>{value}</strong>
    </div>
  );
}

function StatusPill({ label }: { label: DocumentStatus }) {
  return <span className={`status ${label.toLowerCase().replaceAll(" ", "-")}`}>{label}</span>;
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="detail">
      <p>{label}</p>
      <strong>{value}</strong>
    </div>
  );
}

function InlineAlert({ text, action, onClick }: { text: string; action?: string; onClick?: () => void }) {
  return (
    <div className="inline-alert">
      <AlertCircle size={18} />
      <p>{text}</p>
      {action ? <button type="button" onClick={onClick}>{action}</button> : null}
    </div>
  );
}

function nextBlocker({
  kycComplete,
  membershipActive,
  bankComplete,
  hasActiveRestriction
}: {
  kycComplete: boolean;
  membershipActive: boolean;
  bankComplete: boolean;
  hasActiveRestriction: boolean;
}) {
  if (!kycComplete) return "KYC verification is required";
  if (!bankComplete) return "Add bank account for transfer";
  if (!membershipActive) return "Activate membership to unlock";
  if (hasActiveRestriction) return "One active advance until recovery is complete";
  return "Eligibility checks pending";
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
