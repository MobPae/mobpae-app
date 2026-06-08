import { BadgeCheck, CreditCard, Landmark, UserRound } from "lucide-react";
import { Card } from "../components/ui/Card";
import { Field } from "../components/ui/Field";
import { PrimaryButton } from "../components/ui/PrimaryButton";
import { SectionHeader } from "../components/ui/SectionHeader";
import { StatusPill } from "../components/ui/StatusPill";
import { formatMoney, maskAccountNumber } from "../utils/format";
import type { AppState, BankAccount } from "../types/app";

type ProfileScreenProps = {
  appState: AppState;
  bankForm: BankAccount;
  membershipFee: number;
  savingBank: boolean;
  onActivateMembership: () => void;
  onBankFormChange: (bankAccount: BankAccount) => void;
  onSaveBank: () => void;
};

export function ProfileScreen({ appState, bankForm, membershipFee, savingBank, onActivateMembership, onBankFormChange, onSaveBank }: ProfileScreenProps) {
  const bankReady = bankForm.accountHolderName && bankForm.accountNumber && bankForm.ifscCode;

  return (
    <>
      <Card>
        <SectionHeader title="Employee profile" eyebrow="Account" icon={<UserRound size={19} />} />
        <div className="detail-list">
          <div className="detail">
            <p>Name</p>
            <strong>{appState.profile.name}</strong>
          </div>
          <div className="detail">
            <p>Employee code</p>
            <strong>{appState.profile.employeeCode}</strong>
          </div>
          <div className="detail">
            <p>Phone</p>
            <strong>{appState.profile.phone}</strong>
          </div>
        </div>
      </Card>

      <Card>
        <SectionHeader title="Bank account" eyebrow="Disbursal" icon={<Landmark size={19} />} />
        {appState.bankAccount ? (
          <div className="saved-bank">
            <CreditCard size={20} />
            <div>
              <strong>{appState.bankAccount.bankName || "Saved bank"}</strong>
              <p>{maskAccountNumber(appState.bankAccount.accountNumber)} • {appState.bankAccount.ifscCode}</p>
              <StatusPill status={appState.bankAccount.verified ? "Verified" : "Under Review"} />
            </div>
          </div>
        ) : null}
        <Field label="Account holder name" value={bankForm.accountHolderName} onChange={(event) => onBankFormChange({ ...bankForm, accountHolderName: event.target.value })} />
        <Field label="Bank name" value={bankForm.bankName} onChange={(event) => onBankFormChange({ ...bankForm, bankName: event.target.value })} />
        <Field label="Account number" value={bankForm.accountNumber} onChange={(event) => onBankFormChange({ ...bankForm, accountNumber: event.target.value })} />
        <Field label="IFSC code" value={bankForm.ifscCode} onChange={(event) => onBankFormChange({ ...bankForm, ifscCode: event.target.value.toUpperCase() })} />
        <PrimaryButton icon={<Landmark size={17} />} disabled={!bankReady || savingBank} onClick={onSaveBank}>
          {savingBank ? "Saving bank" : "Save bank account"}
        </PrimaryButton>
      </Card>

      <Card>
        <SectionHeader title={appState.membershipConfig.planName} eyebrow="Membership" icon={<BadgeCheck size={19} />} />
        <div className="membership-panel">
          <div>
            <p>Fee</p>
            <strong>{formatMoney(membershipFee)}</strong>
            <span>{appState.membershipConfig.validityLabel}</span>
          </div>
          <PrimaryButton variant={appState.membershipActive ? "secondary" : "primary"} onClick={onActivateMembership} disabled={appState.membershipActive}>
            {appState.membershipActive ? "Active" : "Activate"}
          </PrimaryButton>
        </div>
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
