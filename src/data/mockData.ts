import type { AppState, BankAccount } from "../types/app";
// emptyState and emptyBankAccount are blank initial values used before the API responds.
// They are NOT fake data — the UI always falls back to "N/A" when these zero values are present.

// Blank state shown for a new user when backend has no data yet.
// All values are zero/null — UI must show N/A when these are absent.
export const emptyState: AppState = {
  profile: {
    id: "",
    name: "",
    email: "",
    phone: "",
    employeeCode: "",
    employer: "",
    accountActive: false,
    salaryLimit: 0,
  },
  dashboard: null,
  documents: [],
  bankAccount: null,
  membershipActive: false,
  membershipConfig: {
    planName: "",
    fee: 0,
    couponDiscount: 0,
    couponCode: "",
    amountPayable: 0,
    validityLabel: "—",
    daysRemaining: 0,
    membershipValidityDays: 0,
    freePlanTitle: "",
    freePlanSubtitle: "",
    membershipTitle: "",
    membershipSubtitle: "",
    freeBenefits: [],
    membershipBenefits: [],
  },
  requests: [],
  notifications: [],
  rawNotifications: [],
};

export const emptyBankAccount: BankAccount = {
  accountHolderName: "",
  bankName: "",
  accountNumber: "",
  ifscCode: "",
  upiId: ""
};

