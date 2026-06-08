import type { ReactNode } from "react";

export type View = "dashboard" | "kyc" | "advance" | "tracking" | "profile";
export type DocumentStatus = "Not Uploaded" | "Under Review" | "Verified" | "Rejected";
export type RequestStatus = "Submitted" | "Under Review" | "Approved" | "Disbursed" | "Payment Scheduled" | "Paid" | "Recovery Scheduled" | "Recovered";

export type EmployeeProfile = {
  id: string;
  name: string;
  email: string;
  phone: string;
  employeeCode: string;
  employer: string;
  accountActive: boolean;
  salaryLimit: number;
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
  activeRequestStatus?: string | null;
  activeRepaymentStatus?: string | null;
};

export type KycDocument = {
  id: string;
  label: string;
  status: DocumentStatus;
  note: string;
};

export type BankAccount = {
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
};

export type AdvanceRequest = {
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

export type MembershipConfig = {
  planName: string;
  fee: number;
  couponDiscount: number;
  validityLabel: string;
  benefits: string[];
};

export type RecoveryPreview = {
  principal: number;
  interest: number;
  total: number;
  interestDays: number;
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
};

export type NavItem = {
  id: View;
  label: string;
  icon: ReactNode;
};
