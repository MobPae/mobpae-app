import type { ReactNode } from "react";
import type { AppNotification } from "../services/api";

export type View =
  | "home"
  | "advance"
  | "repayments"
  | "activity"
  | "profile"
  | "profile-kyc"
  | "profile-bank"
  | "change-password"
  | "onboarding-kyc"
  | "onboarding-bank"
  | "onboarding-done"
  | "forgot-password"
  | "reset-password"
  | "notifications"
  | "help"
  | "legal";
export type DocumentStatus =
  | "Not Uploaded"
  | "Under Review"
  | "Verified"
  | "Rejected";
export type KycDocumentType = "PAN" | "AADHAR" | "SALARY_SLIP";
export type RequestStatus =
  | "Submitted"
  | "Employer Approved"
  | "Awaiting Platform Fee"
  | "Admin Approved"
  | "Under Review"
  | "Approved"
  | "Rejected"
  | "Disbursed"
  | "Payment Scheduled"
  | "Paid"
  | "Recovery Scheduled"
  | "Recovered"
  | "Cancelled"
  | "Expired";

export type EmployeeProfile = {
  id: string;
  name: string;
  email: string;
  phone: string;
  employeeCode: string;
  employer: string;
  employerEmail?: string;
  accountActive: boolean;
  salaryLimit: number;
  profilePhotoUrl?: string;
};

export type AuthProfile = {
  userId: string;
  email: string;
  role: string;
  employeeId?: string;
};

export type EmployeeDashboard = {
  employeeName?: string;
  kycCompleted?: boolean;
  approvedLimit?: number;
  salaryInHand?: number;
  monthlyCTC?: number;
  activeRequestAmount?: number;
  availableAdvance?: number;
  activeRequestStatus?: string | null;
  activeRepaymentStatus?: string | null;
  earnedSoFar?: number;
  payrollDay?: number;
  payrollCutoffDate?: number;
};

export type KycDocument = {
  id: string;
  label: string;
  documentType?: KycDocumentType;
  status: DocumentStatus;
  note: string;
  originalFileName?: string;
};

export type BankAccount = {
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  upiId?: string;
  verified?: boolean;
};

export type SetupItem = {
  key: "KYC" | "BANK_ACCOUNT" | "PLATFORM_FEE" | string;
  label: string;
  status: string;
  completed: boolean;
};

export type PlatformFeeStatus =
  | "PENDING_PAYMENT"
  | "PAID"
  | "FAILED"
  | "EXPIRED"
  | "REFUNDED"
  | "WAIVED"
  | string;

export type PlatformFeeConfig = {
  amount: number;
  amountPaise?: number;
  currency: string;
  keyId?: string;
  label?: string;
  description?: string;
};

export type PlatformFee = {
  id?: string;
  loanApplicationId?: string;
  employeeId?: string;
  employerId?: string;
  feeType?: string;
  amount: number;
  currency: string;
  status: PlatformFeeStatus;
  providerOrderId?: string | null;
  providerPaymentId?: string | null;
  paidAt?: string | null;
  waivedAt?: string | null;
  remarks?: string | null;
  paymentOrders?: Array<{
    id?: string;
    providerOrderId?: string;
    status?: string;
    amount?: number;
    currency?: string;
    createdAt?: string;
    expiresAt?: string;
  }>;
};

export type AdvanceRequest = {
  id: string;
  applicationNumber?: string;
  requestedAmount: number;
  approvedAmount: number;
  requestDate: string;
  status: RequestStatus;
  rawStatus?: string; // backend raw status string (e.g. "SUBMITTED")
  statusLabel?: string; // backend-provided human-readable label
  statusColor?: string; // backend-provided hex/CSS color
  remarks: string;
  principalAmount: number;
  interestAmount: number;
  totalRecoveryAmount: number;
  interestDays?: number;
  interestRate?: number;
  recoveryDate: string;
  recoveryStatus: "Scheduled" | "Completed";
  disbursalDate?: string;
  disbursalStatus: "Pending" | "Disbursed";
  platformFee?: PlatformFee | null;
  // Backend-driven lifecycle fields (from presentSalaryRequest)
  progress?: number;
  nextAction?: string;
  nextActionLabel?: string;
  allowedActions?: { cancel: boolean };
  timeline: Array<{
    status: RequestStatus;
    timestamp: string;
    description: string;
    done: boolean;
  }>;
};

export type EligibilityResult = {
  eligible: boolean;
  reasons: Array<{ code: string; message: string }>;
  nextAction: string;
  nextActionLabel: string;
  setup: SetupItem[];
  limits: {
    salaryInHand: number;
    approvedLimit: number;
    usedLimit: number;
    availableAdvance: number;
    interestFreeThreshold: number;
  };
  payroll: { payrollDate: number | null; payrollCutoffDate: number | null };
  platformFeeRequiredAfterEmployerApproval: boolean;
  platformFee: PlatformFeeConfig | null;
  outstandingRepayment: {
    id: string;
    status: string;
    dueDate: string;
    totalAmount: number;
  } | null;
  activeRequest: AdvanceRequest | null;
};

export type RecoveryPreview = {
  principal: number;
  interest: number;
  processingFee: number;
  total: number;
  youReceive: number;
  interestDays: number;
  interestRate?: number; // annual % from backend
  recoveryDate: string;
  payrollDate?: number;
  payrollCutoffDate?: number;
  isNextCycleRecovery?: boolean;
  cycleMessage?: string;
  nextEligibleAfter?: string;
  platformFee?: PlatformFeeConfig | null;
};

export type PeerActivity = {
  totalEmployees: number;
  activeUsers: number;
  percentageActive: number;
  /** Up to 5 two-letter initials, e.g. ["JJ","PK","AJ"] — no names for privacy */
  initials: string[];
};

export type AppState = {
  profile: EmployeeProfile;
  dashboard: EmployeeDashboard | null;
  documents: KycDocument[];
  bankAccount: BankAccount | null;
  platformFeeConfig: PlatformFeeConfig | null;
  requests: AdvanceRequest[];
  rawNotifications: AppNotification[];
  peerActivity: PeerActivity | null;
};

export type NavItem = {
  id: View;
  label: string;
  icon: ReactNode;
};
