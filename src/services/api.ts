import { emptyBankAccount, mockState } from "../data/mockData";
import type { AdvanceRequest, AppState, AuthProfile, BankAccount, DocumentStatus, EmployeeDashboard, KycDocument, KycDocumentType, RecoveryPreview, RequestStatus } from "../types/app";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";
const CONFIGURED_EMPLOYEE_ID = import.meta.env.VITE_EMPLOYEE_ID;
const TOKEN_KEY = "mobpae_employee_token";

type LoginResponse = {
  accessToken?: string;
  token?: string;
};

type BackendKycDocument = {
  id?: string;
  label?: string;
  documentType?: string;
  status?: string;
  note?: string;
};

type BackendSalaryRequest = {
  id: string;
  amount?: number | string;
  approvedAmount?: number | string | null;
  requestedAt?: string;
  repaymentDate?: string | null;
  status?: string;
  remarks?: string | null;
  repayment?: BackendRepayment | null;
};

type BackendRecoveryPreview = Partial<RecoveryPreview> & {
  principalAmount?: number;
  interestAmount?: number;
  totalAmount?: number;
  dueDate?: string;
};

type BackendRepayment = {
  id: string;
  salaryRequestId?: string;
  principalAmount?: number | string;
  interestAmount?: number | string;
  totalAmount?: number | string;
  interestDays?: number | string;
  dueDate?: string;
  status?: string;
  salaryRequest?: BackendSalaryRequest;
};

type BackendNotification = {
  id: string;
  title?: string;
  message?: string;
  createdAt?: string;
};

type BackendMembership = {
  active?: boolean;
  planName?: string;
  fee?: number;
  validityLabel?: string;
  couponCode?: string;
  couponDiscount?: number;
  amountPayable?: number;
};

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status?: number
  ) {
    super(message);
  }
}

const authHeaders = (): Record<string, string> => {
  const token = localStorage.getItem(TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const unique = (values: Array<string | undefined>) => values.filter((value, index, array): value is string => Boolean(value) && array.indexOf(value) === index);

const normalizeDocumentStatus = (status?: string): DocumentStatus => {
  if (status === "VERIFIED" || status === "Verified") return "Verified";
  if (status === "REJECTED" || status === "Rejected") return "Rejected";
  if (status === "PENDING" || status === "Under Review") return "Under Review";
  return "Not Uploaded";
};

const normalizeKycDocuments = (documents: BackendKycDocument[]): KycDocument[] =>
  documents.map((document, index) => ({
    id: document.id ?? `document-${index}`,
    label: document.label ?? document.documentType?.replaceAll("_", " ") ?? "Document",
    documentType: document.documentType as KycDocumentType | undefined,
    status: normalizeDocumentStatus(document.status),
    note: document.note ?? "Document status synced from backend."
  }));

const createUploadPath = (employeeId: string, documentType: KycDocumentType, file: File) =>
  `employee-uploads/${employeeId}/${documentType}/${Date.now()}-${file.name}`;

const normalizeRequestStatus = (status?: string): RequestStatus => {
  switch (status) {
    case "SUBMITTED":
      return "Submitted";
    case "EMPLOYER_APPROVED":
      return "Approved";
    case "READY_FOR_DISBURSAL":
      return "Under Review";
    case "DISBURSED":
      return "Disbursed";
    case "REPAYMENT_SCHEDULED":
      return "Payment Scheduled";
    case "REPAID":
      return "Paid";
    case "EMPLOYER_REJECTED":
      return "Rejected";
    default:
      return "Submitted";
  }
};

const toAmount = (value: unknown) => Number(value ?? 0);
const todayIso = () => new Date().toISOString();
const getRequestRepayment = (request: BackendSalaryRequest, repayments: BackendRepayment[], requestCount: number) =>
  request.repayment ??
  repayments.find((item) => item.salaryRequest?.id === request.id || item.salaryRequestId === request.id) ??
  (requestCount === 1 && repayments.length === 1 ? repayments[0] : undefined);

const normalizeRequests = (requests: BackendSalaryRequest[], repayments: BackendRepayment[]): AdvanceRequest[] =>
  requests.map((request) => {
    const repayment = getRequestRepayment(request, repayments, requests.length);
    const requestedAmount = toAmount(request.amount);
    const approvedAmount = toAmount(request.approvedAmount ?? request.amount);
    const requestDate = request.requestedAt ?? todayIso();
    const recoveryDate = repayment?.dueDate ?? request.repaymentDate ?? "";
    const status = normalizeRequestStatus(request.status);

    return {
      id: request.id,
      requestedAmount,
      approvedAmount,
      requestDate,
      status,
      remarks: request.remarks ?? "",
      principalAmount: toAmount(repayment?.principalAmount ?? approvedAmount),
      interestAmount: toAmount(repayment?.interestAmount),
      totalRecoveryAmount: toAmount(repayment?.totalAmount ?? approvedAmount),
      interestDays: repayment?.interestDays === undefined ? undefined : Number(repayment.interestDays),
      recoveryDate,
      recoveryStatus: repayment?.status === "PAID" ? "Completed" : "Scheduled",
      disbursalStatus: request.status === "DISBURSED" || request.status === "REPAYMENT_SCHEDULED" || request.status === "REPAID" ? "Disbursed" : "Pending",
      timeline: [
        { status: "Submitted", timestamp: requestDate, description: "Salary advance request submitted.", done: true },
        { status: "Approved", timestamp: requestDate, description: "Employer approval status synced from backend.", done: ["EMPLOYER_APPROVED", "READY_FOR_DISBURSAL", "DISBURSED", "REPAYMENT_SCHEDULED", "REPAID"].includes(request.status ?? "") },
        { status: "Disbursed", timestamp: requestDate, description: "Disbursal status synced from backend.", done: ["DISBURSED", "REPAYMENT_SCHEDULED", "REPAID"].includes(request.status ?? "") },
        { status: "Payment Scheduled", timestamp: recoveryDate, description: "Payroll payment is scheduled.", done: ["REPAYMENT_SCHEDULED", "REPAID"].includes(request.status ?? "") },
        { status: "Paid", timestamp: recoveryDate, description: "Payment completed.", done: repayment?.status === "PAID" || request.status === "REPAID" }
      ]
    };
  });

const buildActivity = (notifications: BackendNotification[], requests: AdvanceRequest[], repayments: BackendRepayment[]) => {
  const notificationItems = notifications.map((notification) => notification.message ?? notification.title).filter(Boolean) as string[];
  const requestItems = requests.slice(0, 2).map((request) => `Request ${request.id} is ${request.status}.`);
  const repaymentItems = repayments.slice(0, 2).map((repayment) => `Payment ${repayment.status?.toLowerCase() ?? "scheduled"} for request ${repayment.salaryRequest?.id ?? repayment.id}.`);
  return [...notificationItems, ...requestItems, ...repaymentItems].slice(0, 5);
};

async function getFirstDashboard(employeeIds: string[]) {
  for (const employeeId of employeeIds) {
    try {
      return {
        employeeId,
        dashboard: await request<EmployeeDashboard>(`/dashboard/employees/${employeeId}`)
      };
    } catch {
      // The backend currently needs employeeId, while auth/me returns userId.
      // Try the next known candidate until the backend exposes an employee self endpoint.
    }
  }
  return null;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  Object.entries(authHeaders()).forEach(([key, value]) => headers.set(key, value));

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers
    });
  } catch {
    throw new ApiError("Backend is not reachable. Please confirm the API is running on port 3000.");
  }

  if (!response.ok) {
    let message = `Request failed: ${response.status}`;
    try {
      const errorBody = (await response.json()) as { message?: string | string[] };
      if (Array.isArray(errorBody.message)) {
        message = errorBody.message.join(" ");
      } else if (errorBody.message) {
        message = errorBody.message;
      }
    } catch {
      message = response.status === 0 ? "Backend is not reachable." : message;
    }
    throw new ApiError(message, response.status);
  }

  return response.json() as Promise<T>;
}

// The backend already owns the real data model. The app falls back to local demo data
// so product review never lands on a blank screen when a local API is unavailable.
export const employeeApi = {
  hasSession() {
    return Boolean(localStorage.getItem(TOKEN_KEY));
  },

  async login(email: string, password: string) {
    const data = await request<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });
    const token = data.accessToken ?? data.token;
    if (!token) {
      throw new ApiError("Login succeeded but no access token was returned.");
    }
    localStorage.setItem(TOKEN_KEY, token);
  },

  logout() {
    localStorage.removeItem(TOKEN_KEY);
  },

  async loadAppState(): Promise<AppState> {
    try {
      const authData = await request<AuthProfile>("/auth/me");
      const dashboardResult = await getFirstDashboard(unique([CONFIGURED_EMPLOYEE_ID, authData.employeeId, authData.userId, mockState.profile.id]));
      const employeeId = dashboardResult?.employeeId ?? CONFIGURED_EMPLOYEE_ID ?? mockState.profile.id;
      const dashboardData = dashboardResult?.dashboard ?? null;

      const [kycDocuments, bankAccount, salaryRequests, repayments, notifications, membership] = await Promise.allSettled([
        request<BackendKycDocument[]>(`/kyc-documents/employee/${employeeId}`),
        request<BankAccount | null>(`/bank-accounts/employee/${employeeId}`),
        request<BackendSalaryRequest[]>(`/salary-requests/employee/${employeeId}`),
        request<BackendRepayment[]>(`/repayments/employee/${employeeId}`),
        request<BackendNotification[]>("/notifications/me"),
        request<BackendMembership>(`/membership/employee/${employeeId}`)
      ]);

      const salaryLimit = Number(dashboardData?.availableAdvance ?? dashboardData?.approvedLimit ?? mockState.profile.salaryLimit);
      const kycComplete = Boolean(dashboardData?.kycCompleted);
      const requestData = salaryRequests.status === "fulfilled" ? salaryRequests.value : [];
      const repaymentData = repayments.status === "fulfilled" ? repayments.value : [];
      const normalizedRequests = salaryRequests.status === "fulfilled" ? normalizeRequests(requestData, repaymentData) : mockState.requests;
      const notificationData = notifications.status === "fulfilled" ? notifications.value : [];
      const membershipData = membership.status === "fulfilled" ? membership.value : null;

      return {
        ...mockState,
        profile: {
          ...mockState.profile,
          id: employeeId,
          name: dashboardData?.employeeName ?? mockState.profile.name,
          email: authData?.email ?? mockState.profile.email,
          salaryLimit
        },
        dashboard: dashboardData,
        membershipActive: membershipData?.active ?? mockState.membershipActive,
        membershipConfig: {
          ...mockState.membershipConfig,
          planName: membershipData?.planName ?? mockState.membershipConfig.planName,
          fee: Number(membershipData?.fee ?? mockState.membershipConfig.fee),
          couponCode: membershipData?.couponCode ?? "",
          couponDiscount: Number(membershipData?.couponDiscount ?? 0),
          amountPayable: Number(membershipData?.amountPayable ?? membershipData?.fee ?? mockState.membershipConfig.fee),
          validityLabel: membershipData?.validityLabel ?? mockState.membershipConfig.validityLabel
        },
        documents:
          kycDocuments.status === "fulfilled" && kycDocuments.value.length
            ? normalizeKycDocuments(kycDocuments.value)
            : kycComplete
              ? mockState.documents.map((document) => ({ ...document, status: "Verified" }))
              : mockState.documents,
        bankAccount: bankAccount.status === "fulfilled" ? bankAccount.value : mockState.bankAccount,
        requests: normalizedRequests,
        notifications: buildActivity(notificationData, normalizedRequests, repaymentData)
      };
    } catch {
      return mockState;
    }
  },

  async saveBankAccount(employeeId: string, bankAccount: BankAccount) {
    try {
      return await request<BankAccount>("/bank-accounts", {
        method: "POST",
        body: JSON.stringify({ employeeId, ...bankAccount, ifscCode: bankAccount.ifscCode.toUpperCase() })
      });
    } catch {
      return { ...bankAccount, ifscCode: bankAccount.ifscCode.toUpperCase() };
    }
  },

  async updateUpiId(employeeId: string, upiId: string) {
    try {
      return await request<BankAccount>(`/bank-accounts/employee/${employeeId}/upi`, {
        method: "POST",
        body: JSON.stringify({ upiId })
      });
    } catch {
      return { ...(mockState.bankAccount ?? emptyBankAccount), upiId };
    }
  },

  async uploadKycDocument(employeeId: string, documentType: KycDocumentType, file: File) {
    // MVP upload contract: backend stores the submitted file path and does not inspect the PDF.
    const filePath = createUploadPath(employeeId, documentType, file);
    const savedDocument = await request<BackendKycDocument>("/kyc-documents", {
      method: "POST",
      body: JSON.stringify({ employeeId, documentType, filePath })
    });
    return normalizeKycDocuments([savedDocument])[0];
  },

  async applyMembershipCoupon(employeeId: string, couponCode: string) {
    return request<BackendMembership>("/membership/apply-coupon", {
      method: "POST",
      body: JSON.stringify({ employeeId, couponCode })
    });
  },

  async activateMembership(employeeId: string, couponCode?: string) {
    return request<BackendMembership>("/membership/activate", {
      method: "POST",
      body: JSON.stringify({ employeeId, couponCode })
    });
  },

  async submitSalaryAdvance(employeeId: string, amount: number) {
    const requestData = await request<BackendSalaryRequest>("/salary-requests", {
      method: "POST",
      body: JSON.stringify({ employeeId, amount })
    });
    return normalizeRequests([requestData], [])[0];
  },

  async previewSalaryAdvance(amount: number): Promise<RecoveryPreview> {
    try {
      const preview = await request<BackendRecoveryPreview>("/salary-requests/preview", {
        method: "POST",
        body: JSON.stringify({ amount })
      });
      return {
        principal: preview.principal ?? preview.principalAmount ?? amount,
        interest: preview.interest ?? preview.interestAmount ?? Number((amount * 0.00789).toFixed(2)),
        total: preview.total ?? preview.totalAmount ?? amount + Number((amount * 0.00789).toFixed(2)),
        interestDays: preview.interestDays ?? 8,
        recoveryDate: preview.recoveryDate ?? preview.dueDate ?? "2026-06-28"
      };
    } catch {
      const interest = Number((amount * 0.00789).toFixed(2));
      return { principal: amount, interest, total: amount + interest, interestDays: 8, recoveryDate: "2026-06-28" };
    }
  }
};
