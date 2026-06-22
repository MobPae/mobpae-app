import type { ReactNode } from "react";
import type { AppNotification } from "../services/api";

export type View =
  | "home"
  | "advance"
  | "activity"
  | "profile"
  | "profile-kyc"
  | "profile-bank"
  | "profile-membership"
  | "change-password"
  | "onboarding-kyc"
  | "onboarding-bank"
  | "onboarding-done"
  | "forgot-password"
  | "reset-password"
  | "notifications";
export type DocumentStatus = "Not Uploaded" | "Under Review" | "Verified" | "Rejected";
export type KycDocumentType = "PAN" | "AADHAR" | "SALARY_SLIP";
export type RequestStatus = "Submitted" | "Employer Approved" | "Admin Approved" | "Under Review" | "Approved" | "Rejected" | "Disbursed" | "Payment Scheduled" | "Paid" | "Recovery Scheduled" | "Recovered";

export type SelfieStatus = "PENDING" | "VERIFIED" | "REJECTED";

export type EmployeeProfile = {
  id: string;
  name: string;
  email: string;
  phone: string;
  employeeCode: string;
  employer: string;
  accountActive: boolean;
  salaryLimit: number;
  selfieStatus?: SelfieStatus;
  selfieUrl?: string;
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
};

export type KycDocument = {
  id: string;
  label: string;
  documentType?: KycDocumentType;
  status: DocumentStatus;
  note: string;
};

export type BankAccount = {
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  upiId?: string;
  verified?: boolean;
};

export type AdvanceRequest = {
  id: string;
  requestedAmount: number;
  approvedAmount: number;
  requestDate: string;
  status: RequestStatus;
  statusLabel?: string;   // backend-provided human-readable label
  statusColor?: string;   // backend-provided hex/CSS color
  remarks: string;
  principalAmount: number;
  interestAmount: number;
  totalRecoveryAmount: number;
  interestDays?: number;
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

export type MembershipPlan = {
  id: "free" | "plus";
  name: string;
  price: number;
  priceLabel: string;
  features: string[];
  advanceLimit: number;
  fee: number;
  feeLabel: string;
  isCurrentPlan?: boolean;
};

export type MembershipConfig = {
  // Active member fields
  planName: string;
  fee: number;                  // membershipFee from config or amountPaid from /me
  couponDiscount: number;
  couponCode?: string;
  amountPayable?: number;
  validityLabel: string;
  daysRemaining?: number;
  memberSince?: string;
  validTill?: string;
  savedThisYear?: number;
  // Plan comparison content from /membership/config
  freePlanTitle: string;
  freePlanSubtitle: string;
  membershipTitle: string;
  membershipSubtitle: string;
  freeBenefits: string[];
  membershipBenefits: string[];
  membershipValidityDays: number;
};

export type CouponValidation = {
  valid: boolean;
  couponCode: string;
  membershipAmount: number;
  discountAmount: number;
  payableAmount: number;
  savings: number;
};

export type RecoveryPreview = {
  principal: number;
  interest: number;
  processingFee: number;
  total: number;
  youReceive: number;
  interestDays: number;
  interestRate?: number;   // annual % from backend
  recoveryDate: string;
};

export type AppState = {
  profile: EmployeeProfile;
  dashboard: EmployeeDashboard | null;
  documents: KycDocument[];
  bankAccount: BankAccount | null;
  membershipActive: boolean;
  membershipConfig: MembershipConfig;
  requests: AdvanceRequest[];
  notifications: string[];
  rawNotifications: AppNotification[];
};

export type NavItem = {
  id: View;
  label: string;
  icon: ReactNode;
};
