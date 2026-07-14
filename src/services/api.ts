import { emptyBankAccount, emptyState } from "../data/emptyState";
import type {
  AdvanceRequest,
  AppState,
  BankAccount,
  DocumentStatus,
  EligibilityResult,
  EmployeeDashboard,
  KycDocument,
  KycDocumentType,
  PeerActivity,
  PlatformFee,
  PlatformFeeConfig,
  RecoveryPreview,
  RequestStatus,
} from "../types/app";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";
const TOKEN_KEY = "mobpae_employee_token";
const REFRESH_TOKEN_KEY = "mobpae_employee_refresh_token";

/** Converts a relative upload path (e.g. "uploads/user-id/file.png") to an absolute URL. */
export function getFileUrl(path: string | null | undefined): string {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const base = ((import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "")
    .replace(/\/api\/v1\/?$/, "")
    .replace(/\/api\/?$/, "");
  return `${base.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}

type LoginResponse = {
  accessToken?: string;
  token?: string;
  refreshToken?: string;
  passwordChanged?: boolean;
  user?: { passwordChanged?: boolean; role?: string; [key: string]: unknown };
};

const EMPLOYEE_ROLE = "EMPLOYEE";
const EMPLOYEE_ACCESS_MESSAGE =
  "This account does not have access to the Employee app.";

type BackendKycDocument = {
  id?: string;
  label?: string;
  documentType?: string;
  status?: string;
  note?: string;
  rejectionNote?: string;
  originalFileName?: string;
};

type BackendPlatformFee = {
  id?: string;
  loanApplicationId?: string;
  employeeId?: string;
  employerId?: string;
  feeType?: string;
  amount?: number | string;
  currency?: string;
  status?: string;
  providerOrderId?: string | null;
  providerPaymentId?: string | null;
  paidAt?: string | null;
  waivedAt?: string | null;
  remarks?: string | null;
  paymentOrders?: Array<{
    id?: string;
    providerOrderId?: string;
    status?: string;
    amount?: number | string;
    currency?: string;
    createdAt?: string;
    expiresAt?: string;
  }>;
};

type BackendLoanApplication = {
  id: string;
  // v3.1 field names
  applicationNumber?: string;
  requestedAmount?: number | string;
  adminApprovedAmount?: number | string | null;
  employerApprovedAmount?: number | string | null;
  submittedAt?: string;
  // repayment breakdown (from nested repayment object)
  principalAmount?: number | string;
  interestAmount?: number | string;
  totalAmount?: number | string;
  totalRecoveryAmount?: number | string;
  interestDays?: number | string;
  interestRate?: number | string;
  // dates
  approvedAt?: string | null;
  createdAt?: string;
  repaymentDate?: string | null;
  dueDate?: string | null;
  recoveryDate?: string | null;
  disbursedAt?: string | null;
  // status
  status?: string;
  statusLabel?: string;
  statusColor?: string;
  remarks?: string | null;
  // nested objects
  repayment?:
    | (BackendRepayment & {
        principalAmount?: number | string;
        interestAmount?: number | string;
        totalAmount?: number | string;
        interestRate?: number | string;
        interestDays?: number | string;
        dueDate?: string;
        status?: string;
      })
    | null;
  disbursal?: {
    id?: string | null;
    status?: string | null;
    disbursedAt?: string | null;
    disbursedAmount?: number | string | null;
  } | null;
  // lifecycle fields
  progress?: number;
  nextAction?: string;
  nextActionLabel?: string;
  allowedActions?: { cancel: boolean };
  timeline?: Array<{
    status: string;
    label: string;
    completed: boolean;
    completedAt: string | null;
  }>;
  platformFee?: BackendPlatformFee | null;
};

/** @deprecated alias kept for type-compat during migration */
type BackendSalaryRequest = BackendLoanApplication;

type BackendRecoveryPreview = {
  // New contract fields
  requestedAmount?: number;
  youReceive?: number;
  processingFee?: number;
  interestRate?: number;
  interestDays?: number;
  interestAmount?: number;
  totalRecovery?: number; // primary total field
  recoveryDate?: string;
  payrollDate?: number;
  payrollCutoffDate?: number;
  isNextCycleRecovery?: boolean;
  cycleMessage?: string;
  nextEligibleAfter?: string;
  principalAmount?: number;
  availableAdvance?: number;
  // Legacy / alternate field names kept for safety
  principal?: number;
  interest?: number;
  total?: number;
  totalAmount?: number;
  dueDate?: string;
  platformFee?: PlatformFeeConfig | null;
};

type BackendRepayment = {
  id: string;
  loanApplicationId?: string;
  principalAmount?: number | string;
  interestAmount?: number | string;
  totalAmount?: number | string;
  interestDays?: number | string;
  interestRate?: number | string;
  dueDate?: string;
  status?: string;
  loanApplication?: BackendLoanApplication;
};

type BackendNotification = {
  id: string;
  title?: string;
  message?: string;
  createdAt?: string;
  isRead?: boolean;
  type?: string | null;
};

export type AppInfoItem = {
  id: string;
  type: string;
  title: string;
  content: string;
  version?: number;
  updatedAt?: string;
};

export type AppNotification = {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  type: string | null;
};

type BackendEmployeeMe = EmployeeDashboard & {
  id?: string;
  employeeId?: string;
  name?: string;
  email?: string;
  phone?: string;
  employeeCode?: string;
  employer?:
    | string
    | {
        companyName?: string;
        companyCode?: string;
        contactPerson?: string;
        email?: string;
      };
  employerName?: string;
  companyName?: string;
  accountActive?: boolean;
  appActivated?: boolean;
  employmentStatus?: string;
  salaryLimit?: number;
  payrollDate?: number; // backend field name (maps to payrollDay)
  kycStatus?: string; // e.g. "NOT_SUBMITTED", "SUBMITTED", "VERIFIED"
  bankAccountStatus?: string; // e.g. "NOT_ADDED", "PENDING", "VERIFIED"
  selfieStatus?: string; // "PENDING" | "VERIFIED" | "REJECTED"
  selfieUrl?: string;
  profilePhotoUrl?: string;
  dashboard?: EmployeeDashboard;
  employee?: Partial<BackendEmployeeMe>;
};

export class ApiError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
  }
}

type ApiRequestOptions = RequestInit & {
  suppressSessionExpiry?: boolean;
};

let refreshPromise: Promise<string | null> | null = null;

const clearStoredSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

const notifySessionExpired = () => {
  clearStoredSession();
  window.dispatchEvent(new CustomEvent("mobpae:session:expired"));
};

const decodeJwtPayload = (
  token: string
): { exp?: number; role?: string } | null => {
  try {
    const [, payload] = token.split(".");
    if (!payload) return null;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      "="
    );
    return JSON.parse(atob(padded)) as { exp?: number; role?: string };
  } catch {
    return null;
  }
};

const hasEmployeeRole = (token: string, responseRole?: string) =>
  (responseRole ?? decodeJwtPayload(token)?.role) === EMPLOYEE_ROLE;

const shouldRefreshAccessToken = (token: string) => {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return false;
  return payload.exp * 1000 <= Date.now() + 30_000;
};

const refreshSession = async (): Promise<string | null> => {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      if (!refreshToken) return null;

      let response: Response;
      try {
        response = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        });
      } catch {
        return null;
      }

      if (!response.ok) return null;

      const data = (await response.json()) as LoginResponse;
      const nextAccessToken = data.accessToken ?? data.token;
      if (!nextAccessToken || !data.refreshToken) return null;

      if (!hasEmployeeRole(nextAccessToken, data.user?.role)) {
        clearStoredSession();
        window.dispatchEvent(new CustomEvent("mobpae:session:expired"));
        return null;
      }

      localStorage.setItem(TOKEN_KEY, nextAccessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
      return nextAccessToken;
    })().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
};

const getAccessTokenForRequest = async () => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return refreshSession();
  if (!shouldRefreshAccessToken(token)) return token;
  return (await refreshSession()) ?? token;
};

const fetchWithAuth = async (
  path: string,
  options: RequestInit = {},
  retryAfterRefresh = true
) => {
  const headers = new Headers(options.headers);
  const token = await getAccessTokenForRequest();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const isAuthEndpoint =
    path.startsWith("/auth/login") ||
    path.startsWith("/auth/refresh") ||
    path.startsWith("/auth/forgot-password") ||
    path.startsWith("/auth/reset-password");

  if (response.status !== 401 || !retryAfterRefresh || isAuthEndpoint) {
    return response;
  }

  const refreshedToken = await refreshSession();
  if (!refreshedToken) return response;

  const retryHeaders = new Headers(options.headers);
  retryHeaders.set("Authorization", `Bearer ${refreshedToken}`);

  return fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: retryHeaders,
  });
};

const normalizeDocumentStatus = (status?: string): DocumentStatus => {
  if (status === "VERIFIED" || status === "Verified") return "Verified";
  if (status === "REJECTED" || status === "Rejected") return "Rejected";
  if (status === "PENDING" || status === "Under Review") return "Under Review";
  return "Not Uploaded";
};

const normalizeKycDocuments = (
  documents: BackendKycDocument[]
): KycDocument[] =>
  documents.map((document, index) => ({
    id: document.id ?? `document-${index}`,
    label:
      document.label ??
      document.documentType?.replaceAll("_", " ") ??
      "Document",
    documentType: document.documentType as KycDocumentType | undefined,
    status: normalizeDocumentStatus(document.status),
    note: document.rejectionNote || document.note || "",
    originalFileName: document.originalFileName,
  }));

const normalizeRequestStatus = (status?: string): RequestStatus => {
  switch (status) {
    case "SUBMITTED":
      return "Submitted";
    case "EMPLOYER_APPROVED":
      return "Employer Approved";
    case "AWAITING_PLATFORM_FEE_PAYMENT":
      return "Awaiting Platform Fee";
    case "READY_FOR_DISBURSAL":
      return "Admin Approved";
    case "DISBURSED":
      return "Disbursed";
    case "REPAYMENT_SCHEDULED":
      return "Payment Scheduled";
    case "REPAID":
      return "Paid";
    case "EMPLOYER_REJECTED":
      return "Rejected";
    case "CANCELLED":
      return "Cancelled";
    case "EXPIRED":
      return "Expired";
    default:
      return "Submitted";
  }
};

const toAmount = (value: unknown) => Number(value ?? 0);

const normalizePlatformFee = (
  fee?: BackendPlatformFee | null
): PlatformFee | null => {
  if (!fee) return null;
  return {
    id: fee.id,
    loanApplicationId: fee.loanApplicationId,
    employeeId: fee.employeeId,
    employerId: fee.employerId,
    feeType: fee.feeType,
    amount: toAmount(fee.amount),
    currency: fee.currency ?? "INR",
    status: fee.status ?? "PENDING_PAYMENT",
    providerOrderId: fee.providerOrderId ?? null,
    providerPaymentId: fee.providerPaymentId ?? null,
    paidAt: fee.paidAt ?? null,
    waivedAt: fee.waivedAt ?? null,
    remarks: fee.remarks ?? null,
    paymentOrders: fee.paymentOrders?.map((order) => ({
      ...order,
      amount: order.amount === undefined ? undefined : Number(order.amount),
    })),
  };
};

const todayIso = () => new Date().toISOString();
const getRequestRepayment = (
  request: BackendLoanApplication,
  repayments: BackendRepayment[],
  requestCount: number
) =>
  request.repayment ??
  repayments.find(
    (item) =>
      item.loanApplication?.id === request.id ||
      item.loanApplicationId === request.id
  ) ??
  (requestCount === 1 && repayments.length === 1 ? repayments[0] : undefined);

const normalizeRequests = (
  requests: BackendLoanApplication[],
  repayments: BackendRepayment[]
): AdvanceRequest[] =>
  requests.map((request) => {
    // v3.1: backend returns nested repayment/disbursal objects with renamed fields.
    const nestedRepayment = request.repayment ?? null;
    const legacyRepayment = getRequestRepayment(
      request,
      repayments,
      requests.length
    );
    const repayment = nestedRepayment ?? legacyRepayment;

    const requestedAmount = toAmount(request.requestedAmount);
    const approvedAmount = toAmount(
      request.adminApprovedAmount ??
        request.employerApprovedAmount ??
        request.requestedAmount
    );
    const requestDate = request.submittedAt ?? request.createdAt ?? todayIso();

    // disbursedAt: prefer disbursal object (v3.1: disbursal.disbursedAt), then flat field
    const disbursedAt =
      request.disbursal?.disbursedAt ?? request.disbursedAt ?? null;

    // Recovery date: nested repayment.dueDate > repaymentDate > dueDate
    const recoveryDate =
      nestedRepayment?.dueDate ??
      repayment?.dueDate ??
      request.repaymentDate ??
      request.dueDate ??
      request.recoveryDate ??
      "";

    const status = normalizeRequestStatus(request.status);

    // Principal/interest/total: prefer nested repayment, then flat fields
    const principalAmount = toAmount(
      nestedRepayment?.principalAmount ??
        repayment?.principalAmount ??
        request.principalAmount ??
        approvedAmount
    );
    const interestAmount = toAmount(
      nestedRepayment?.interestAmount ??
        repayment?.interestAmount ??
        request.interestAmount
    );
    const totalRecoveryAmount = toAmount(
      nestedRepayment?.totalAmount ??
        repayment?.totalAmount ??
        request.totalAmount ??
        request.totalRecoveryAmount
    );
    const rawInterestDays =
      nestedRepayment?.interestDays ??
      repayment?.interestDays ??
      request.interestDays;
    const rawInterestRate =
      nestedRepayment?.interestRate ??
      repayment?.interestRate ??
      request.interestRate;
    const repaymentStatus = nestedRepayment?.status ?? repayment?.status;

    const isDisbursed = ["DISBURSED", "REPAYMENT_SCHEDULED", "REPAID"].includes(
      request.status ?? ""
    );

    // Prefer backend-provided timeline (from history) if available
    const backendTimeline = request.timeline;
    const builtTimeline: AdvanceRequest["timeline"] = backendTimeline
      ? backendTimeline.map((step) => ({
          status: normalizeRequestStatus(step.status),
          timestamp: step.completedAt ?? "",
          description: step.label,
          done: step.completed,
        }))
      : [
          {
            status: "Submitted" as RequestStatus,
            timestamp: requestDate,
            description: "Advance request submitted successfully.",
            done: true,
          },
          {
            status: "Employer Approved" as RequestStatus,
            timestamp: request.approvedAt ?? "",
            description: "Approved by your employer.",
            done: [
              "EMPLOYER_APPROVED",
              "AWAITING_PLATFORM_FEE_PAYMENT",
              "READY_FOR_DISBURSAL",
              "DISBURSED",
              "REPAYMENT_SCHEDULED",
              "REPAID",
            ].includes(request.status ?? ""),
          },
          {
            status: "Admin Approved" as RequestStatus,
            timestamp: "",
            description:
              request.status === "AWAITING_PLATFORM_FEE_PAYMENT"
                ? "Pay the platform fee to move this request to MobPae review."
                : "Reviewed and approved by MobPae admin.",
            done: [
              "READY_FOR_DISBURSAL",
              "DISBURSED",
              "REPAYMENT_SCHEDULED",
              "REPAID",
            ].includes(request.status ?? ""),
          },
          {
            status: "Disbursed" as RequestStatus,
            timestamp: disbursedAt ?? "",
            description: "Funds disbursed to your bank account.",
            done: isDisbursed,
          },
          {
            status: "Payment Scheduled" as RequestStatus,
            timestamp: recoveryDate,
            description: "Repayment scheduled from your salary.",
            done: ["REPAYMENT_SCHEDULED", "REPAID"].includes(
              request.status ?? ""
            ),
          },
          {
            status: (request.status === "EMPLOYER_REJECTED" ||
            request.status === "CANCELLED" ||
            request.status === "EXPIRED"
              ? "Rejected"
              : "Paid") as RequestStatus,
            timestamp: recoveryDate,
            description:
              request.status === "EMPLOYER_REJECTED"
                ? "Request rejected by employer."
                : request.status === "CANCELLED"
                ? "Request cancelled."
                : request.status === "EXPIRED"
                ? "Request expired after 3 days."
                : "Salary deduction completed.",
            done:
              repaymentStatus === "PAID" ||
              request.status === "REPAID" ||
              request.status === "EMPLOYER_REJECTED" ||
              request.status === "CANCELLED" ||
              request.status === "EXPIRED",
          },
        ];

    return {
      id: request.id,
      applicationNumber: request.applicationNumber,
      requestedAmount,
      approvedAmount,
      requestDate,
      status,
      rawStatus: request.status,
      statusLabel: request.statusLabel,
      statusColor: request.statusColor,
      remarks: request.remarks ?? "",
      platformFee: normalizePlatformFee(request.platformFee),
      principalAmount,
      interestAmount,
      totalRecoveryAmount,
      interestDays:
        rawInterestDays === undefined ? undefined : Number(rawInterestDays),
      interestRate:
        rawInterestRate === undefined ? undefined : Number(rawInterestRate),
      recoveryDate,
      recoveryStatus: repaymentStatus === "PAID" ? "Completed" : "Scheduled",
      disbursalStatus: isDisbursed ? "Disbursed" : "Pending",
      disbursalDate: disbursedAt ?? undefined,
      progress: request.progress,
      nextAction: request.nextAction,
      nextActionLabel: request.nextActionLabel,
      allowedActions: request.allowedActions,
      timeline: builtTimeline,
    };
  });

const buildActivity = (
  notifications: BackendNotification[],
  requests: AdvanceRequest[],
  repayments: BackendRepayment[]
) => {
  const notificationItems = notifications
    .map((notification) => notification.message ?? notification.title)
    .filter(Boolean) as string[];
  const requestItems = requests
    .slice(0, 2)
    .map((request) => `Request ${request.id} is ${request.status}.`);
  const repaymentItems = repayments
    .slice(0, 2)
    .map(
      (repayment) =>
        `Payment ${
          repayment.status?.toLowerCase() ?? "scheduled"
        } for application ${repayment.loanApplication?.id ?? repayment.id}.`
    );
  return [...notificationItems, ...requestItems, ...repaymentItems].slice(0, 5);
};

const unwrapArray = <T>(
  value:
    | T[]
    | {
        data?: T[];
        items?: T[];
        documents?: T[];
        requests?: T[];
        repayments?: T[];
        notifications?: T[];
      }
    | null
    | undefined,
  key: "documents" | "requests" | "repayments" | "notifications"
): T[] => {
  if (Array.isArray(value)) return value;
  return value?.[key] ?? value?.data ?? value?.items ?? [];
};

const unwrapObject = <T>(
  value: T | { data?: T; bankAccount?: T; account?: T } | null | undefined,
  keys: Array<"bankAccount" | "account">
): T | null => {
  if (!value) return null;
  if (typeof value !== "object") return value as T;
  const record = value as Record<string, T | undefined>;
  for (const key of keys) {
    if (record[key]) return record[key] as T;
  }
  if (record.data) return record.data as T;
  return value as T;
};

const normalizeEmployeeMe = (employeeMe: BackendEmployeeMe) => {
  const employee = employeeMe.employee ?? employeeMe;
  const rawDashboard = employeeMe.dashboard ?? employeeMe;
  const employeeId =
    employee.id ??
    employee.employeeId ??
    employeeMe.id ??
    employeeMe.employeeId ??
    "";

  // Normalise field-name differences between backend and our EmployeeDashboard type.
  // Backend sends `payrollDate`, we use `payrollDay` internally.
  const dashboard: EmployeeDashboard = {
    ...rawDashboard,
    payrollDay:
      rawDashboard.payrollDay ??
      employeeMe.payrollDate ??
      (employee as BackendEmployeeMe).payrollDate,
  };

  return {
    employee,
    dashboard,
    employeeId,
    // Flat kyc/bank flags from /employees/me — use as supplementary signals
    kycStatus: employeeMe.kycStatus,
    bankAccountStatus: employeeMe.bankAccountStatus,
    appActivated: employeeMe.appActivated,
    selfieStatus: (employeeMe.selfieStatus ??
      (employee as BackendEmployeeMe).selfieStatus) as
      | "PENDING"
      | "VERIFIED"
      | "REJECTED"
      | undefined,
    selfieUrl:
      employeeMe.selfieUrl ?? (employee as BackendEmployeeMe).selfieUrl,
    profilePhotoUrl:
      employeeMe.profilePhotoUrl ??
      (employee as BackendEmployeeMe).profilePhotoUrl,
  };
};

const getEmployerName = (employee: Partial<BackendEmployeeMe>) => {
  if (typeof employee.employer === "string") return employee.employer;
  return (
    employee.employer?.companyName ??
    employee.employerName ??
    employee.companyName ??
    ""
  );
};

const getEmployerEmail = (employee: Partial<BackendEmployeeMe>) => {
  if (typeof employee.employer === "object")
    return employee.employer?.email ?? "";
  return "";
};

async function request<T>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const { suppressSessionExpiry = false, ...requestOptions } = options;
  const headers = new Headers(requestOptions.headers);
  headers.set("Content-Type", "application/json");

  let response: Response;
  try {
    response = await fetchWithAuth(path, {
      ...requestOptions,
      headers,
    });
  } catch {
    throw new ApiError(
      "Backend is not reachable. Please confirm the API is running on port 3000."
    );
  }

  if (!response.ok) {
    let message = `Request failed: ${response.status}`;
    try {
      const errorBody = (await response.json()) as {
        message?: string | string[];
      };
      if (Array.isArray(errorBody.message)) {
        message = errorBody.message.join(" ");
      } else if (errorBody.message) {
        message = errorBody.message;
      }
    } catch {
      message = response.status === 0 ? "Backend is not reachable." : message;
    }

    // Session expired after refresh retry — clear both tokens and show login.
    if (
      response.status === 401 &&
      !suppressSessionExpiry &&
      !path.includes("/auth/login")
    ) {
      notifySessionExpired();
    }

    throw new ApiError(message, response.status);
  }

  return response.json() as Promise<T>;
}

// The backend owns the real data model. The local state below is only blank
// initialization before API responses arrive.
export const employeeApi = {
  hasSession() {
    const token = localStorage.getItem(TOKEN_KEY);
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

    if (token && !hasEmployeeRole(token)) {
      clearStoredSession();
      return false;
    }

    return Boolean(token || refreshToken);
  },

  async login(email: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const data = await request<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: normalizedEmail, password }),
    });
    const token = data.accessToken ?? data.token;
    if (!token) {
      throw new ApiError("Login succeeded but no access token was returned.");
    }
    if (!data.refreshToken) {
      throw new ApiError("Login succeeded but no refresh token was returned.");
    }
    if (!hasEmployeeRole(token, data.user?.role)) {
      clearStoredSession();
      throw new ApiError(EMPLOYEE_ACCESS_MESSAGE, 403);
    }
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
    return data.user?.passwordChanged ?? data.passwordChanged;
  },

  logout() {
    clearStoredSession();
  },

  // Returns new tokens when the backend detects a forced first-time change,
  // so the app can establish a fresh session without re-login.
  async changePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<{ accessToken: string; refreshToken: string } | void> {
    const data = await request<{
      success: boolean;
      accessToken?: string;
      refreshToken?: string;
      message?: string;
    }>("/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    if (data.accessToken && data.refreshToken) {
      // First-time forced change — store the fresh session tokens.
      localStorage.setItem(TOKEN_KEY, data.accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
      return { accessToken: data.accessToken, refreshToken: data.refreshToken };
    }
    // Voluntary change — caller handles logout.
  },

  async forgotPassword(email: string): Promise<void> {
    const normalizedEmail = email.trim().toLowerCase();
    await request<{ message: string }>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email: normalizedEmail }),
    });
  },

  async resetPassword(token: string, newPassword: string): Promise<void> {
    await request<{ message: string }>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, newPassword }),
    });
  },

  async loadAppState(): Promise<AppState> {
    try {
      const employeeMe = await request<BackendEmployeeMe>("/employees/me");
      const {
        employee,
        dashboard,
        employeeId,
        kycStatus,
        bankAccountStatus,
        appActivated,
        selfieStatus,
        selfieUrl,
        profilePhotoUrl,
      } = normalizeEmployeeMe(employeeMe);

      const [
        kycDocuments,
        bankAccount,
        salaryRequests,
        repayments,
        notifications,
        platformFeeConfig,
        peerActivityResult,
      ] = await Promise.allSettled([
        request<
          | BackendKycDocument[]
          | {
              documents?: BackendKycDocument[];
              data?: BackendKycDocument[];
              items?: BackendKycDocument[];
            }
        >("/kyc-documents/my", { suppressSessionExpiry: true }),
        request<
          | BankAccount
          | {
              bankAccount?: BankAccount;
              account?: BankAccount;
              data?: BankAccount;
            }
          | null
        >("/bank-accounts/my", { suppressSessionExpiry: true }),
        request<
          | BackendLoanApplication[]
          | {
              requests?: BackendLoanApplication[];
              data?: BackendLoanApplication[];
              items?: BackendLoanApplication[];
            }
        >("/loan-applications/my", { suppressSessionExpiry: true }),
        request<
          | BackendRepayment[]
          | {
              repayments?: BackendRepayment[];
              data?: BackendRepayment[];
              items?: BackendRepayment[];
            }
        >("/repayments/my", { suppressSessionExpiry: true }),
        request<
          | BackendNotification[]
          | {
              notifications?: BackendNotification[];
              data?: BackendNotification[];
              items?: BackendNotification[];
            }
        >("/notifications/me", { suppressSessionExpiry: true }),
        request<PlatformFeeConfig | { data?: PlatformFeeConfig }>(
          "/platform-fees/config",
          { suppressSessionExpiry: true }
        ),
        request<PeerActivity>("/employees/me/peer-activity", {
          suppressSessionExpiry: true,
        }),
      ]);

      const dashboardData = dashboard;
      const salaryLimit = Number(
        dashboardData?.availableAdvance ??
          dashboardData?.approvedLimit ??
          employee.salaryLimit ??
          0
      );
      const requestData =
        salaryRequests.status === "fulfilled"
          ? unwrapArray(
              salaryRequests.value as
                | BackendLoanApplication[]
                | {
                    requests?: BackendLoanApplication[];
                    data?: BackendLoanApplication[];
                    items?: BackendLoanApplication[];
                  },
              "requests"
            )
          : [];
      const repaymentData =
        repayments.status === "fulfilled"
          ? unwrapArray(repayments.value, "repayments")
          : [];
      const normalizedRequests =
        salaryRequests.status === "fulfilled"
          ? normalizeRequests(requestData, repaymentData)
          : [];
      const notificationData =
        notifications.status === "fulfilled"
          ? unwrapArray(notifications.value, "notifications")
          : [];
      const platformFeeConfigData: PlatformFeeConfig | null =
        platformFeeConfig.status === "fulfilled"
          ? (() => {
              const v = platformFeeConfig.value;
              if (
                v &&
                typeof v === "object" &&
                ("amount" in v || "currency" in v)
              ) {
                return v as PlatformFeeConfig;
              }
              return (v as { data?: PlatformFeeConfig })?.data ?? null;
            })()
          : null;
      const bankAccountData =
        bankAccount.status === "fulfilled"
          ? unwrapObject<BankAccount>(bankAccount.value, [
              "bankAccount",
              "account",
            ])
          : null;
      const kycData =
        kycDocuments.status === "fulfilled"
          ? unwrapArray(kycDocuments.value, "documents")
          : [];

      return {
        profile: {
          id: employeeId,
          name: employee.name ?? dashboardData?.employeeName ?? "",
          email: employee.email ?? "",
          phone: employee.phone ?? "",
          employeeCode: employee.employeeCode ?? "",
          employer: getEmployerName(employee),
          employerEmail: getEmployerEmail(employee),
          // appActivated is the definitive "account is live" flag from the new API shape
          accountActive: appActivated ?? employee.accountActive ?? false,
          salaryLimit,
          selfieStatus,
          selfieUrl,
          profilePhotoUrl,
        },
        dashboard: dashboardData,
        platformFeeConfig: platformFeeConfigData,
        documents: kycData.length ? normalizeKycDocuments(kycData) : [],
        // bankAccountStatus from /employees/me tells us definitively if there's an account
        bankAccount:
          bankAccountStatus === "NOT_ADDED" ? null : bankAccountData ?? null,
        requests: normalizedRequests,
        notifications: buildActivity(
          notificationData,
          normalizedRequests,
          repaymentData
        ),
        rawNotifications: notificationData.map((n) => ({
          id: n.id,
          title: n.title ?? "Notification",
          message: n.message ?? "",
          createdAt: n.createdAt ?? new Date().toISOString(),
          isRead: n.isRead ?? false,
          type: n.type ?? null,
        })),
        peerActivity:
          peerActivityResult.status === "fulfilled"
            ? (peerActivityResult.value as PeerActivity)
            : null,
      };
    } catch (err) {
      // Re-throw so callers (useEmployeeApp) can surface the error to the user
      throw err;
    }
  },

  async saveBankAccount(_employeeId: string, bankAccount: BankAccount) {
    // POST /bank-accounts (create) — NOT /bank-accounts/my
    await request<BankAccount>("/bank-accounts", {
      method: "POST",
      body: JSON.stringify({
        accountHolderName: bankAccount.accountHolderName,
        accountNumber: bankAccount.accountNumber,
        bankName: bankAccount.bankName,
        ifscCode: bankAccount.ifscCode.toUpperCase(),
        upiId: bankAccount.upiId ?? "",
      }),
    });
    // Refetch the saved record so we get the server-side state (verified flag, id, etc.)
    return await request<BankAccount>("/bank-accounts/my");
  },

  async updateUpiId(employeeId: string, upiId: string) {
    return await request<BankAccount>(
      `/bank-accounts/employee/${employeeId}/upi`,
      {
        method: "POST",
        body: JSON.stringify({ upiId }),
      }
    );
  },

  async fetchKycDocuments(): Promise<KycDocument[]> {
    const result = await request<
      | BackendKycDocument[]
      | {
          documents?: BackendKycDocument[];
          data?: BackendKycDocument[];
          items?: BackendKycDocument[];
        }
    >("/kyc-documents/my");
    const docs = unwrapArray(result, "documents");
    return docs.length ? normalizeKycDocuments(docs) : [];
  },

  async uploadKycDocument(documentType: KycDocumentType, file: File) {
    // Map KycDocumentType → UploadType query param expected by /files/upload
    const uploadTypeMap: Record<KycDocumentType, string> = {
      PAN: "kyc_pan",
      AADHAR: "kyc_aadhar",
      SALARY_SLIP: "kyc_salary_slip",
    };
    const uploadType = uploadTypeMap[documentType] ?? "kyc_other";

    // Step 1 — upload the file as multipart/form-data to /files/upload?type=...
    // Do NOT set Content-Type manually; the browser sets the correct boundary.
    const formData = new FormData();
    formData.append("file", file);

    let uploadRes: Response;
    try {
      uploadRes = await fetchWithAuth(`/files/upload?type=${uploadType}`, {
        method: "POST",
        body: formData,
      });
    } catch {
      throw new ApiError(
        "Could not reach the server. Please check your connection and try again."
      );
    }

    if (!uploadRes.ok) {
      let msg = `File upload failed (${uploadRes.status}).`;
      try {
        const body = (await uploadRes.json()) as {
          message?: string | string[];
        };
        if (Array.isArray(body.message)) msg = body.message.join(" ");
        else if (body.message) msg = body.message;
      } catch {
        /* ignore */
      }
      if (uploadRes.status === 413)
        msg = "File is too large. Please upload a file under 5 MB.";
      if (uploadRes.status === 415)
        msg = "Unsupported file type. Please upload a PDF, JPG, or PNG.";
      if (uploadRes.status === 401) {
        notifySessionExpired();
        msg = "Your session has expired. Please log in again.";
      }
      throw new ApiError(msg, uploadRes.status);
    }

    // Backend returns { key, mimeType, size } — store the key as filePath
    const uploaded = (await uploadRes.json()) as { key?: string };
    const filePath = uploaded.key;
    if (!filePath)
      throw new ApiError(
        "Upload succeeded but server did not return a file key."
      );

    // Step 2 — register the KYC document with the R2 object key as filePath.
    const savedDocument = await request<BackendKycDocument>("/kyc-documents", {
      method: "POST",
      body: JSON.stringify({
        documentType,
        filePath,
        originalFileName: file.name,
      }),
    });

    return normalizeKycDocuments([savedDocument])[0];
  },

  async uploadProfilePhoto(file: File): Promise<string> {
    // Backend: POST /employees/profile-photo (multipart) — uploads and updates profilePhotoUrl in one call.
    // Do NOT use POST /files/upload + PATCH /employees/me; the latter route is EMPLOYER-only.
    const formData = new FormData();
    formData.append("file", file);

    let res: Response;
    try {
      res = await fetchWithAuth("/employees/profile-photo", {
        method: "POST",
        body: formData,
      });
    } catch {
      throw new ApiError(
        "Could not reach the server. Please check your connection."
      );
    }

    if (!res.ok) {
      let msg = `Photo upload failed (${res.status}).`;
      try {
        const body = (await res.json()) as { message?: string | string[] };
        if (Array.isArray(body.message)) msg = body.message.join(" ");
        else if (body.message) msg = body.message;
      } catch {
        /* ignore */
      }
      if (res.status === 413)
        msg = "Photo is too large. Please choose a smaller image.";
      if (res.status === 415)
        msg = "Unsupported file type. Please upload a JPG or PNG.";
      if (res.status === 401) {
        notifySessionExpired();
        msg = "Your session has expired. Please log in again.";
      }
      throw new ApiError(msg, res.status);
    }

    const employee = (await res.json()) as { profilePhotoUrl?: string };
    const filePath = employee.profilePhotoUrl;
    if (!filePath)
      throw new ApiError(
        "Upload succeeded but server did not return a photo URL."
      );

    return filePath;
  },

  async uploadSelfie(file: File): Promise<{
    selfieUrl?: string;
    selfieStatus?: "PENDING" | "VERIFIED" | "REJECTED";
  }> {
    const formData = new FormData();
    formData.append("file", file);

    let res: Response;
    try {
      res = await fetchWithAuth("/employees/selfie", {
        method: "POST",
        body: formData,
      });
    } catch {
      throw new ApiError(
        "Could not reach the server. Please check your connection."
      );
    }

    if (!res.ok) {
      let msg = `Selfie upload failed (${res.status}).`;
      try {
        const body = (await res.json()) as { message?: string | string[] };
        if (Array.isArray(body.message)) msg = body.message.join(" ");
        else if (body.message) msg = body.message;
      } catch {
        /* ignore */
      }
      if (res.status === 413)
        msg =
          "Selfie is too large. Please capture again or choose a smaller image.";
      if (res.status === 415)
        msg = "Unsupported file type. Please upload a JPG, PNG or WebP image.";
      if (res.status === 401) {
        notifySessionExpired();
        msg = "Your session has expired. Please log in again.";
      }
      throw new ApiError(msg, res.status);
    }

    return res.json() as Promise<{
      selfieUrl?: string;
      selfieStatus?: "PENDING" | "VERIFIED" | "REJECTED";
    }>;
  },

  async submitSalaryAdvance(
    employeeId: string,
    amount: number,
    purposeCategory?: string,
    purposeNote?: string
  ) {
    const body: Record<string, unknown> = {
      amount,
      purposeCategory: purposeCategory ?? "OTHER", // always present — backend requires enum
    };
    if (purposeNote) body.purposeNote = purposeNote;
    const requestData = await request<BackendLoanApplication>(
      "/loan-applications",
      {
        method: "POST",
        body: JSON.stringify(body),
      }
    );
    return normalizeRequests([requestData], [])[0];
  },

  async getNotifications(): Promise<AppNotification[]> {
    const raw = await request<
      | BackendNotification[]
      | {
          notifications?: BackendNotification[];
          data?: BackendNotification[];
          items?: BackendNotification[];
        }
    >("/notifications/me");
    const list: BackendNotification[] = Array.isArray(raw)
      ? raw
      : raw.notifications ?? raw.data ?? raw.items ?? [];
    return list.map((n) => ({
      id: n.id,
      title: n.title ?? "Notification",
      message: n.message ?? "",
      createdAt: n.createdAt ?? new Date().toISOString(),
      isRead: n.isRead ?? false,
      type: n.type ?? null,
    }));
  },

  async markNotificationRead(id: string): Promise<void> {
    await request(`/notifications/${id}/read`, { method: "POST" });
  },

  async getAppInformation(): Promise<AppInfoItem[]> {
    try {
      const data = await request<
        AppInfoItem[] | { data?: AppInfoItem[]; items?: AppInfoItem[] }
      >("/app-information");
      if (Array.isArray(data)) return data;
      return (
        (data as { data?: AppInfoItem[]; items?: AppInfoItem[] }).data ??
        (data as { data?: AppInfoItem[]; items?: AppInfoItem[] }).items ??
        []
      );
    } catch {
      return [];
    }
  },

  async previewSalaryAdvance(amount: number): Promise<RecoveryPreview> {
    const preview = await request<BackendRecoveryPreview>(
      `/loan-applications/preview?amount=${encodeURIComponent(amount)}`
    );
    return {
      principal: preview.principalAmount ?? preview.principal ?? amount,
      interest: preview.interestAmount ?? preview.interest ?? 0,
      processingFee: preview.processingFee ?? 0,
      youReceive: preview.youReceive ?? amount,
      total:
        preview.totalRecovery ?? preview.total ?? preview.totalAmount ?? amount,
      interestDays: preview.interestDays ?? 0,
      interestRate: preview.interestRate,
      recoveryDate: preview.recoveryDate ?? preview.dueDate ?? "",
      payrollDate: preview.payrollDate,
      payrollCutoffDate: preview.payrollCutoffDate,
      isNextCycleRecovery: preview.isNextCycleRecovery,
      cycleMessage: preview.cycleMessage,
      nextEligibleAfter: preview.nextEligibleAfter,
      platformFee: preview.platformFee ?? null,
    };
  },

  async getEligibility(): Promise<EligibilityResult> {
    const raw = await request<{
      eligible?: boolean;
      reasons?: Array<{ code: string; message: string }>;
      nextAction?: string;
      nextActionLabel?: string;
      setup?: Array<{
        key: string;
        label: string;
        status: string;
        completed: boolean;
      }>;
      limits?: {
        salaryInHand: number;
        approvedLimit: number;
        usedLimit: number;
        availableAdvance: number;
        interestFreeThreshold?: number;
      };
      payroll?: {
        payrollDate: number | null;
        payrollCutoffDate: number | null;
      };
      platformFeeRequiredAfterEmployerApproval?: boolean;
      platformFee?: PlatformFeeConfig | null;
      outstandingRepayment?: {
        id: string;
        status: string;
        dueDate: string;
        totalAmount: number;
      } | null;
      activeRequest?: BackendLoanApplication | null;
    }>("/loan-applications/eligibility");
    return {
      eligible: raw.eligible ?? false,
      reasons: raw.reasons ?? [],
      nextAction: raw.nextAction ?? "REQUEST_ADVANCE",
      nextActionLabel: raw.nextActionLabel ?? "",
      setup: (raw.setup ?? []) as EligibilityResult["setup"],
      limits: {
        salaryInHand: raw.limits?.salaryInHand ?? 0,
        approvedLimit: raw.limits?.approvedLimit ?? 0,
        usedLimit: raw.limits?.usedLimit ?? 0,
        availableAdvance: raw.limits?.availableAdvance ?? 0,
        interestFreeThreshold: raw.limits?.interestFreeThreshold ?? 0,
      },
      payroll: raw.payroll ?? { payrollDate: null, payrollCutoffDate: null },
      platformFeeRequiredAfterEmployerApproval:
        raw.platformFeeRequiredAfterEmployerApproval ?? false,
      platformFee: raw.platformFee ?? null,
      outstandingRepayment: raw.outstandingRepayment ?? null,
      activeRequest: raw.activeRequest
        ? normalizeRequests([raw.activeRequest], [])[0]
        : null,
    };
  },

  async initiatePlatformFeePayment(loanApplicationId: string) {
    return request<{
      alreadyPaid?: boolean;
      paymentOrderId?: string;
      orderId?: string;
      amount?: number;
      amountRupees?: number;
      currency?: string;
      keyId?: string;
      description?: string;
      fee?: PlatformFee;
      customer?: { name?: string; email?: string; contact?: string };
    }>(
      `/platform-fees/loan-applications/${loanApplicationId}/initiate-payment`,
      {
        method: "POST",
        body: JSON.stringify({}),
      }
    );
  },

  async verifyPlatformFeePayment(payload: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }) {
    return request<{
      success: boolean;
      fee?: PlatformFee;
      loanApplication?: BackendLoanApplication;
    }>("/platform-fees/verify-payment", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async cancelLoanApplication(id: string): Promise<void> {
    await request(`/loan-applications/my/${id}/cancel`, {
      method: "POST",
      body: JSON.stringify({}),
    });
  },
};
