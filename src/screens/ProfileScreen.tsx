import { BadgeCheck, Building2, CreditCard, Landmark, TicketPercent, UserRound } from "lucide-react";
import { Card } from "../components/ui/Card";
import { Field } from "../components/ui/Field";
import { InlineAlert } from "../components/ui/InlineAlert";
import { PrimaryButton } from "../components/ui/PrimaryButton";
import { SectionHeader } from "../components/ui/SectionHeader";
import { StatusPill } from "../components/ui/StatusPill";
import { formatMoney, maskAccountNumber } from "../utils/format";
import type { AppState, BankAccount } from "../types/app";

type ProfileScreenProps = {
  appState: AppState;
  bankForm: BankAccount;
  membershipFee: number;
  notice: string;
  savingBank: boolean;
  couponCode: string;
  applyingCoupon: boolean;
  activatingMembership: boolean;
  onApplyCoupon: () => void;
  onActivateMembership: () => void;
  onBankFormChange: (bankAccount: BankAccount) => void;
  onCouponCodeChange: (couponCode: string) => void;
  onSaveBank: () => void;
};

export function ProfileScreen({
  appState,
  bankForm,
  membershipFee,
  notice,
  savingBank,
  couponCode,
  applyingCoupon,
  activatingMembership,
  onApplyCoupon,
  onActivateMembership,
  onBankFormChange,
  onCouponCodeChange,
  onSaveBank
}: ProfileScreenProps) {
  const bankReady = bankForm.accountHolderName && bankForm.accountNumber && bankForm.ifscCode;
  const membershipDiscount = appState.membershipConfig.couponDiscount;

  return (
    <>
      <Card className="profile-card">
        <SectionHeader title="Profile" eyebrow="Employee" icon={<UserRound size={19} />} />
        <div className="profile-identity">
          <span>
            <UserRound size={19} />
          </span>
          <div>
            <strong>{appState.profile.name}</strong>
            <p>{appState.profile.employeeCode} • {appState.profile.phone}</p>
          </div>
        </div>
        <div className="profile-summary-grid">
          <div>
            <Building2 size={17} />
            <p>Employer</p>
            <strong>{appState.profile.employer}</strong>
          </div>
          <div>
            <BadgeCheck size={17} />
            <p>Membership</p>
            <strong>{appState.membershipActive ? "Active" : "Pending"}</strong>
          </div>
        </div>
      </Card>

      <Card className="setup-card">
        <SectionHeader title="Payout setup" eyebrow="Bank" icon={<Landmark size={19} />} />
        <div className="setup-grid">
          <div className="setup-status-panel">
            <div className="setup-status-icon">
              <CreditCard size={20} />
            </div>
            <strong>{appState.bankAccount?.bankName || "Bank account"}</strong>
            <p>
              {appState.bankAccount
                ? `${maskAccountNumber(appState.bankAccount.accountNumber)} • ${appState.bankAccount.ifscCode}`
                : "Add account details for salary disbursal."}
            </p>
            {appState.bankAccount ? <StatusPill status={appState.bankAccount.verified ? "Verified" : "Under Review"} /> : null}
          </div>
          <div className="setup-form">
            <Field label="Account holder name" value={bankForm.accountHolderName} onChange={(event) => onBankFormChange({ ...bankForm, accountHolderName: event.target.value })} />
            <Field label="Bank name" value={bankForm.bankName} onChange={(event) => onBankFormChange({ ...bankForm, bankName: event.target.value })} />
            <Field label="Account number" value={bankForm.accountNumber} onChange={(event) => onBankFormChange({ ...bankForm, accountNumber: event.target.value })} />
            <Field label="IFSC code" value={bankForm.ifscCode} onChange={(event) => onBankFormChange({ ...bankForm, ifscCode: event.target.value.toUpperCase() })} />
          </div>
        </div>
        <PrimaryButton icon={<Landmark size={17} />} disabled={!bankReady || savingBank} onClick={onSaveBank}>
          {savingBank ? "Saving bank" : "Save bank account"}
        </PrimaryButton>
      </Card>

      <Card className="membership-card">
        <SectionHeader title={appState.membershipConfig.planName} eyebrow="Membership" icon={<BadgeCheck size={19} />} />
        <div className="membership-panel">
          <div>
            <p>Payable now</p>
            <strong>{formatMoney(membershipFee)}</strong>
            <span>{appState.membershipConfig.validityLabel}</span>
          </div>
          <PrimaryButton variant={appState.membershipActive ? "secondary" : "primary"} onClick={onActivateMembership} disabled={appState.membershipActive || activatingMembership}>
            {appState.membershipActive ? "Active" : activatingMembership ? "Activating" : "Activate"}
          </PrimaryButton>
        </div>
        <InlineAlert message={notice} tone={appState.membershipActive ? "success" : "warning"} />
        <div className="membership-breakdown">
          <div>
            <span>Membership fee</span>
            <strong>{formatMoney(appState.membershipConfig.fee)}</strong>
          </div>
          <div>
            <span>Coupon deduction</span>
            <strong className={membershipDiscount ? "success-text" : ""}>-{formatMoney(membershipDiscount)}</strong>
          </div>
        </div>
        {!appState.membershipActive ? (
          <div className="coupon-row">
            <Field label="Coupon code" value={couponCode} onChange={(event) => onCouponCodeChange(event.target.value.toUpperCase())} placeholder="WELCOME100" />
            <PrimaryButton icon={<TicketPercent size={17} />} variant="secondary" disabled={!couponCode.trim() || applyingCoupon} onClick={onApplyCoupon}>
              {applyingCoupon ? "Applying" : "Apply"}
            </PrimaryButton>
          </div>
        ) : null}
        <div className="benefit-list">
          {appState.membershipConfig.benefits.map((benefit) => (
            <p key={benefit}>
              <BadgeCheck size={15} />
              {benefit}
            </p>
          ))}
        </div>
      </Card>
    </>
  );
}
