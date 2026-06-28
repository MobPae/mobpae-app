import type { AppState, BankAccount } from "../types/app";

// Blank initial values used only before API data arrives.
// All business data rendered by the app should come from backend responses.
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
    validityLabel: "-",
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
  upiId: "",
};
