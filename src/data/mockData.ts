import type { AppState, BankAccount } from "../types/app";

export const emptyBankAccount: BankAccount = {
  accountHolderName: "",
  bankName: "",
  accountNumber: "",
  ifscCode: ""
};

export const mockState: AppState = {
  profile: {
    id: "emp_2048",
    name: "Aarav Sharma",
    email: "aarav.sharma@northstar.example",
    phone: "+91 98765 43210",
    employeeCode: "EMP-MP-2048",
    employer: "Northstar Retail Pvt Ltd",
    accountActive: true,
    salaryLimit: 25000
  },
  dashboard: null,
  documents: [
    { id: "pan", label: "PAN", status: "Verified", note: "Identity document verified." },
    { id: "aadhaar", label: "Aadhaar", status: "Under Review", note: "Verification usually completes within one working day." },
    { id: "salary-slip", label: "Salary Slip", status: "Not Uploaded", note: "Latest monthly salary slip required." }
  ],
  bankAccount: null,
  membershipActive: false,
  membershipConfig: {
    planName: "MobPae Membership",
    fee: 449,
    couponDiscount: 0,
    validityLabel: "1 year",
    benefits: ["Access salary advances", "Transparent salary deductions", "Request tracking", "Payment tracking", "Financial flexibility"]
  },
  requests: [
    {
      id: "ADV-1048",
      requestedAmount: 5000,
      approvedAmount: 5000,
      requestDate: "2026-06-20",
      status: "Payment Scheduled",
      remarks: "Approved for payroll-linked payment.",
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
        { status: "Payment Scheduled", timestamp: "28 Jun", description: "Payroll deduction is scheduled.", done: true },
        { status: "Paid", timestamp: "Pending", description: "Payment will complete after payroll deduction.", done: false }
      ]
    }
  ],
  notifications: [
    "Aadhaar verification is under review.",
    "Salary slip upload is pending.",
    "Funds disbursed for ADV-1048.",
    "Salary deduction scheduled for 28 Jun 2026."
  ]
};
