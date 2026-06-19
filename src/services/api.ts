import { emptyBankAccount, emptyState, mockState } from "../data/mockData";
import type {
  AdvanceRequest,
  AppState,
  BankAccount,
  CouponValidation,
  DocumentStatus,
  EmployeeDashboard,
  KycDocument,
  KycDocumentType,
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
  user?: { passwordChanged?: boolean; [key: string]: unknown };
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
  principalAmount?: number | string;
  interestAmount?: number | string;
  totalAmount?: number | string;
  totalRecoveryAmount?: number | string;
  interestDays?: number | string;
  requestedAt?: string;
  createdAt?: string;
  repaymentDate?: string | null;
  dueDate?: string | null;
  recoveryDate?: string | null;
  status?: string;
  statusLabel?: string;   // human-readable label from backend
  statusColor?: string;   // hex or CSS color from backend
  remarks?: string | null;
  repayment?: BackendRepayment | null;
};

type BackendRecoveryPreview = {
  // New contract fields
  requestedAmount?: number;
  youReceive?: number;
  processingFee?: number;
  interestRate?: number;
  interestDays?: number;
  interestAmount?: number;
  totalRecovery?: number;   // primary total field
  recoveryDate?: string;
  principalAmount?: number;
  availableAdvance?: number;
  // Legacy / alternate field names kept for safety
  principal?: number;
  interest?: number;
  total?: number;
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

type BackendMembershipNested = {
  id?: string;
  planName?: string;
  amount?: string | number;
  startDate?: string;
  endDate?: string;
  status?: string;
  couponCode?: string;
  discountAmount?: string | number;
};

type BackendMembership = {
  active?: boolean;
  planName?: string;
  amountPaid?: number;
  membershipFee?: number;
  membershipValidityDays?: number;
  fee?: number;              // legacy compat
  amountPayable?: number;   // legacy compat
  couponCode?: string;
  couponDiscount?: number;
  discountAmount?: string | number;
  validityLabel?: string;
  daysRemaining?: number;
  benefits?: string[];
  memberSince?: string | null;
  validTill?: string | null;
  membership?: BackendMembershipNested;  // nested detail object in /membership/me
};

type BackendMembershipConfig = {
  membershipFee?: number;
  membershipValidityDays?: number;
  freePlanTitle?: string;
  freePlanSubtitle?: string;
  membershipTitle?: string;
  membershipSubtitle?: string;
  freeBenefits?: string[];
  membershipBenefits?: string[];
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
  payrollDate?: number;         // backend field name (maps to payrollDay)
  membershipActive?: boolean;   // flat field from /employees/me
  kycStatus?: string;           // e.g. "NOT_SUBMITTED", "SUBMITTED", "VERIFIED"
  bankAccountStatus?: string;   // e.g. "NOT_ADDED", "PENDING", "VERIFIED"
  selfieStatus?: string;        // "PENDING" | "VERIFIED" | "REJECTED"
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

let refreshPromise: Promise<string | null> | null = null;

const clearStoredSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

const notifySessionExpired = () => {
  clearStoredSession();
  window.dispatchEvent(new CustomEvent("mobpae:session:expired"));
};

const decodeJwtPayload = (token: string): { exp?: number } | null => {
  try {
    const [, payload] = token.split(".");
    if (!payload) return null;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      "="
    );
    return JSON.parse(atob(padded)) as { exp?: number };
  } catch {
    return null;
  }
};

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
  if (!token) return null;
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
    note: document.note ?? "Document status synced from backend.",
  }));


const normalizeRequestStatus = (status?: string): RequestStatus => {
  switch (status) {
    case "SUBMITTED":
      return "Submitted";
    case "EMPLOYER_APPROVED":
      return "Employer Approved";
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
    default:
      return "Submitted";
  }
};

const toAmount = (value: unknown) => Number(value ?? 0);
const todayIso = () => new Date().toISOString();
const getRequestRepayment = (
  request: BackendSalaryRequest,
  repayments: BackendRepayment[],
  requestCount: number
) =>
  request.repayment ??
  repayments.find(
    (item) =>
      item.salaryRequest?.id === request.id ||
      item.salaryRequestId === request.id
  ) ??
  (requestCount === 1 && repayments.length === 1 ? repayments[0] : undefined);

const normalizeRequests = (
  requests: BackendSalaryRequest[],
  repayments: BackendRepayment[]
): AdvanceRequest[] =>
  requests.map((request) => {
    const repayment = getRequestRepayment(request, repayments, requests.length);
    const requestedAmount = toAmount(request.amount);
    const approvedAmount = toAmount(request.approvedAmount ?? request.amount);
    const requestDate = request.requestedAt ?? request.createdAt ?? todayIso();
    const recoveryDate =
      repayment?.dueDate ??
      request.repaymentDate ??
      request.dueDate ??
      request.recoveryDate ??
      "";
    const status = normalizeRequestStatus(request.status);
    const principalAmount = toAmount(
      repayment?.principalAmount ?? request.principalAmount ?? approvedAmount
    );
    const interestAmount = toAmount(
      repayment?.interestAmount ?? request.interestAmount
    );
    const totalRecoveryAmount = toAmount(
      repayment?.totalAmount ??
        request.totalAmount ??
        request.totalRecoveryAmount ??
        principalAmount + interestAmount
    );
    const interestDays = repayment?.interestDays ?? request.interestDays;

    return {
      id: request.id,
      requestedAmount,
      approvedAmount,
      requestDate,
      status,
      statusLabel: request.statusLabel,
      statusColor: request.statusColor,
      remarks: request.remarks ?? "",
      principalAmount,
      interestAmount,
      totalRecoveryAmount,
      interestDays:
        interestDays === undefined ? undefined : Number(interestDays),
      recoveryDate,
      recoveryStatus: repayment?.status === "PAID" ? "Completed" : "Scheduled",
      disbursalStatus:
        request.status === "DISBURSED" ||
        request.status === "REPAYMENT_SCHEDULED" ||
        request.status === "REPAID"
          ? "Disbursed"
          : "Pending",
      timeline: [
        {
          status: "Submitted" as RequestStatus,
          timestamp: requestDate,
          description: "Advance request submitted successfully.",
          done: true,
        },
        {
          status: "Employer Approved" as RequestStatus,
          timestamp: requestDate,
          description: "Approved by your employer.",
          done: [
            "EMPLOYER_APPROVED",
            "READY_FOR_DISBURSAL",
            "DISBURSED",
            "REPAYMENT_SCHEDULED",
            "REPAID",
          ].includes(request.status ?? ""),
        },
        {
          status: "Admin Approved" as RequestStatus,
          timestamp: requestDate,
          description: "Reviewed and approved by MobPae admin.",
          done: [
            "READY_FOR_DISBURSAL",
            "DISBURSED",
            "REPAYMENT_SCHEDULED",
            "REPAID",
          ].includes(request.status ?? ""),
        },
        {
          status: "Disbursed" as RequestStatus,
          timestamp: requestDate,
          description: "Funds disbursed to your bank account.",
          done: ["DISBURSED", "REPAYMENT_SCHEDULED", "REPAID"].includes(
            request.status ?? ""
          ),
        },
        {
          status: "Payment Scheduled" as RequestStatus,
          timestamp: recoveryDate,
          description: "Recovery scheduled from next payroll.",
          done: ["REPAYMENT_SCHEDULED", "REPAID"].includes(
            request.status ?? ""
          ),
        },
        {
          status: (request.status === "EMPLOYER_REJECTED" ? "Rejected" : "Paid") as RequestStatus,
          timestamp: recoveryDate,
          description: request.status === "EMPLOYER_REJECTED"
            ? "Request rejected by employer."
            : "Salary deduction completed.",
          done:
            repayment?.status === "PAID" ||
            request.status === "REPAID" ||
            request.status === "EMPLOYER_REJECTED",
        },
      ],
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
        } for request ${repayment.salaryRequest?.id ?? repayment.id}.`
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
  value:
    | T
    | { data?: T; membership?: T; bankAccount?: T; account?: T }
    | null
    | undefined,
  keys: Array<"membership" | "bankAccount" | "account">
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
    payrollDay: rawDashboard.payrollDay ?? employeeMe.payrollDate ?? (employee as BackendEmployeeMe).payrollDate,
  };

  return {
    employee,
    dashboard,
    employeeId,
    // Flat membership/kyc/bank flags from /employees/me — use as supplementary signals
    membershipActiveFromEmployee: employeeMe.membershipActive,
    kycStatus: employeeMe.kycStatus,
    bankAccountStatus: employeeMe.bankAccountStatus,
    appActivated: employeeMe.appActivated,
    selfieStatus: (employeeMe.selfieStatus ?? (employee as BackendEmployeeMe).selfieStatus) as "PENDING" | "VERIFIED" | "REJECTED" | undefined,
    selfieUrl: employeeMe.selfieUrl ?? (employee as BackendEmployeeMe).selfieUrl,
    profilePhotoUrl: employeeMe.profilePhotoUrl ?? (employee as BackendEmployeeMe).profilePhotoUrl,
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

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  let response: Response;
  try {
    response = await fetchWithAuth(path, {
      ...options,
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
    if (response.status === 401 && !path.includes("/auth/login")) {
      notifySessionExpired();
    }

    throw new ApiError(message, response.status);
  }

  return response.json() as Promise<T>;
}

// The backend already owns the real data model. The app falls back to local demo data
// so product review never lands on a blank screen when a local API is unavailable.
export const employeeApi = {
  hasSession() {
    return Boolean(
      localStorage.getItem(TOKEN_KEY) || localStorage.getItem(REFRESH_TOKEN_KEY)
    );
  },

  async login(email: string, password: string) {
    const data = await request<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    const token = data.accessToken ?? data.token;
    if (!token) {
      throw new ApiError("Login succeeded but no access token was returned.");
    }
    if (!data.refreshToken) {
      throw new ApiError("Login succeeded but no refresh token was returned.");
    }
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
    return data.user?.passwordChanged ?? data.passwordChanged;
  },

  logout() {
    clearStoredSession();
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await request<{ success: boolean; message: string }>("/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },

  async forgotPassword(email: string): Promise<void> {
    await request<{ message: string }>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
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
        membershipActiveFromEmployee,
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
        membership,
        membershipConfig,
      ] = await Promise.allSettled([
        request<
          | BackendKycDocument[]
          | {
              documents?: BackendKycDocument[];
              data?: BackendKycDocument[];
              items?: BackendKycDocument[];
            }
        >("/kyc-documents/my"),
        request<
          | BankAccount
          | {
              bankAccount?: BankAccount;
              account?: BankAccount;
              data?: BankAccount;
            }
          | null
        >("/bank-accounts/my"),
        request<
          | BackendSalaryRequest[]
          | {
              requests?: BackendSalaryRequest[];
              data?: BackendSalaryRequest[];
              items?: BackendSalaryRequest[];
            }
        >("/salary-requests/my"),
        request<
          | BackendRepayment[]
          | {
              repayments?: BackendRepayment[];
              data?: BackendRepayment[];
              items?: BackendRepayment[];
            }
        >("/repayments/my"),
        request<
          | BackendNotification[]
          | {
              notifications?: BackendNotification[];
              data?: BackendNotification[];
              items?: BackendNotification[];
            }
        >("/notifications/me"),
        request<
          | BackendMembership
          | { membership?: BackendMembership; data?: BackendMembership }
        >("/membership/me"),
        request<BackendMembershipConfig | { data?: BackendMembershipConfig }>("/membership/config"),
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
          ? unwrapArray(salaryRequests.value, "requests")
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
      // /membership/me returns top-level fields (active, memberSince, validTill, …)
      // plus a nested `membership` sub-object for detail fields.
      // unwrapObject must NOT follow the "membership" key or it will discard the
      // top-level fields and return only the nested sub-object.
      const membershipData: BackendMembership | null =
        membership.status === "fulfilled"
          ? (() => {
              const v = membership.value as Record<string, unknown> | null | undefined;
              if (!v) return null;
              // Unwrap only if response is wrapped in { data: … }
              if (!("active" in v) && "data" in v && v.data) return v.data as BackendMembership;
              return v as BackendMembership;
            })()
          : null;
      const membershipConfigData: BackendMembershipConfig | null =
        membershipConfig.status === "fulfilled"
          ? (() => {
              const v = membershipConfig.value;
              // Could be the object directly or wrapped in { data: ... }
              if (v && typeof v === "object" && "membershipFee" in v) return v as BackendMembershipConfig;
              const wrapped = v as { data?: BackendMembershipConfig };
              return wrapped?.data ?? (v as BackendMembershipConfig);
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
          // appActivated is the definitive "account is live" flag from the new API shape
          accountActive: appActivated ?? employee.accountActive ?? false,
          salaryLimit,
          selfieStatus,
          selfieUrl,
          profilePhotoUrl,
        },
        dashboard: dashboardData,
        // Prefer the flag from /employees/me; fall back to /membership/me response
        membershipActive: membershipActiveFromEmployee ?? membershipData?.active ?? false,
        membershipConfig: (() => {
          const nested = membershipData?.membership;

          // Plan fee (list price) — from /membership/config, then /membership/me top-level
          const planFee = Number(
            membershipConfigData?.membershipFee ??
            membershipData?.membershipFee ??
            membershipData?.fee ??
            0
          );
          // Amount actually paid (may differ if coupon was used)
          const amountPaid = Number(
            membershipData?.amountPaid ??
            nested?.amount ??
            planFee
          );
          const validityDays = Number(
            membershipConfigData?.membershipValidityDays ??
            membershipData?.membershipValidityDays ??
            365
          );
          const daysRemaining = membershipData?.daysRemaining ?? 0;
          // Coupon fields live in the nested membership object
          const couponCode =
            nested?.couponCode ??
            membershipData?.couponCode ??
            "";
          const couponDiscount = Number(
            nested?.discountAmount ??
            membershipData?.discountAmount ??
            membershipData?.couponDiscount ??
            0
          );
          // memberSince/validTill: top-level or nested startDate/endDate
          const memberSince =
            membershipData?.memberSince ??
            nested?.startDate ??
            undefined;
          const validTill =
            membershipData?.validTill ??
            nested?.endDate ??
            undefined;
          const validityLabel = membershipData?.validityLabel
            ?? (daysRemaining > 0
                ? `${daysRemaining} days remaining`
                : validTill
                  ? `Valid till ${new Date(validTill).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`
                  : "—");
          return {
            planName: membershipData?.planName ?? nested?.planName ?? membershipConfigData?.membershipTitle ?? "",
            fee: planFee,
            couponCode,
            couponDiscount,
            amountPayable: amountPaid,
            validityLabel,
            daysRemaining,
            membershipValidityDays: validityDays,
            memberSince,
            validTill,
            // Plan comparison content — from /membership/config only, no hardcoded fallbacks
            freePlanTitle:      membershipConfigData?.freePlanTitle      ?? "",
            freePlanSubtitle:   membershipConfigData?.freePlanSubtitle   ?? "",
            membershipTitle:    membershipConfigData?.membershipTitle     ?? "",
            membershipSubtitle: membershipConfigData?.membershipSubtitle  ?? "",
            freeBenefits:       membershipConfigData?.freeBenefits        ?? [],
            membershipBenefits: membershipConfigData?.membershipBenefits  ?? [],
          };
        })(),
        documents: kycData.length ? normalizeKycDocuments(kycData) : [],
        // bankAccountStatus from /employees/me tells us definitively if there's an account
        bankAccount: bankAccountStatus === "NOT_ADDED" ? null : (bankAccountData ?? null),
        requests: normalizedRequests,
        notifications: buildActivity(
          notificationData,
          normalizedRequests,
          repaymentData
        ),
      };
    } catch {
      return emptyState;
    }
  },

  async saveBankAccount(_employeeId: string, bankAccount: BankAccount) {
    // POST /bank-accounts (create) — NOT /bank-accounts/my
    await request<BankAccount>("/bank-accounts", {
      method: "POST",
      body: JSON.stringify({
        accountHolderName: bankAccount.accountHolderName,
        accountNumber:     bankAccount.accountNumber,
        bankName:          bankAccount.bankName,
        ifscCode:          bankAccount.ifscCode.toUpperCase(),
        upiId:             bankAccount.upiId ?? "",
      }),
    });
    // Refetch the saved record so we get the server-side state (verified flag, id, etc.)
    return await request<BankAccount>("/bank-accounts/my");
  },

  async updateUpiId(employeeId: string, upiId: string) {
    try {
      return await request<BankAccount>("/bank-account/upi", {
        method: "POST",
        body: JSON.stringify({ upiId }),
      });
    } catch {
      return { ...(mockState.bankAccount ?? emptyBankAccount), upiId };
    }
  },

  async fetchKycDocuments(): Promise<KycDocument[]> {
    const result = await request<
      | BackendKycDocument[]
      | { documents?: BackendKycDocument[]; data?: BackendKycDocument[]; items?: BackendKycDocument[] }
    >("/kyc-documents/my");
    const docs = unwrapArray(result, "documents");
    return docs.length ? normalizeKycDocuments(docs) : [];
  },

  async uploadKycDocument(documentType: KycDocumentType, file: File) {
    // Step 1 — upload the file as multipart/form-data to /files/upload.
    // Do NOT set Content-Type manually; the browser sets the correct boundary.
    const formData = new FormData();
    formData.append("file", file);

    let uploadRes: Response;
    try {
      uploadRes = await fetchWithAuth("/files/upload", {
        method: "POST",
        body: formData,
      });
    } catch {
      throw new ApiError("Could not reach the server. Please check your connection and try again.");
    }

    if (!uploadRes.ok) {
      let msg = `File upload failed (${uploadRes.status}).`;
      try {
        const body = (await uploadRes.json()) as { message?: string | string[] };
        if (Array.isArray(body.message)) msg = body.message.join(" ");
        else if (body.message) msg = body.message;
      } catch { /* ignore */ }
      if (uploadRes.status === 413) msg = "File is too large. Please upload a file under 5 MB.";
      if (uploadRes.status === 415) msg = "Unsupported file type. Please upload a PDF, JPG, or PNG.";
      if (uploadRes.status === 401) {
        notifySessionExpired();
        msg = "Your session has expired. Please log in again.";
      }
      throw new ApiError(msg, uploadRes.status);
    }

    const uploaded = (await uploadRes.json()) as { filePath?: string; path?: string; url?: string };
    const filePath = uploaded.filePath ?? uploaded.path ?? uploaded.url;
    if (!filePath) throw new ApiError("Upload succeeded but server did not return a file path.");

    // Step 2 — register the KYC document with only the filePath (no base64).
    const savedDocument = await request<BackendKycDocument>("/kyc-documents", {
      method: "POST",
      body: JSON.stringify({ documentType, filePath }),
    });

    return normalizeKycDocuments([savedDocument])[0];
  },

  async validateMembershipCoupon(couponCode: string): Promise<CouponValidation> {
    return request<CouponValidation>("/membership/coupons/validate", {
      method: "POST",
      body: JSON.stringify({ couponCode }),
    });
  },

  async activateMembership(couponCode?: string) {
    return request<BackendMembership>("/membership/request", {
      method: "POST",
      body: JSON.stringify(couponCode ? { couponCode } : {}),
    });
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
      throw new ApiError("Could not reach the server. Please check your connection.");
    }

    if (!res.ok) {
      let msg = `Photo upload failed (${res.status}).`;
      try {
        const body = (await res.json()) as { message?: string | string[] };
        if (Array.isArray(body.message)) msg = body.message.join(" ");
        else if (body.message) msg = body.message;
      } catch { /* ignore */ }
      if (res.status === 413) msg = "Photo is too large. Please choose a smaller image.";
      if (res.status === 415) msg = "Unsupported file type. Please upload a JPG or PNG.";
      if (res.status === 401) {
        notifySessionExpired();
        msg = "Your session has expired. Please log in again.";
      }
      throw new ApiError(msg, res.status);
    }

    const employee = (await res.json()) as { profilePhotoUrl?: string };
    const filePath = employee.profilePhotoUrl;
    if (!filePath) throw new ApiError("Upload succeeded but server did not return a photo URL.");

    return filePath;
  },

  async uploadSelfie(file: File): Promise<{ selfieUrl?: string; selfieStatus?: "PENDING" | "VERIFIED" | "REJECTED" }> {
    const formData = new FormData();
    formData.append("file", file);

    let res: Response;
    try {
      res = await fetchWithAuth("/employees/selfie", {
        method: "POST",
        body: formData,
      });
    } catch {
      throw new ApiError("Could not reach the server. Please check your connection.");
    }

    if (!res.ok) {
      let msg = `Selfie upload failed (${res.status}).`;
      try {
        const body = (await res.json()) as { message?: string | string[] };
        if (Array.isArray(body.message)) msg = body.message.join(" ");
        else if (body.message) msg = body.message;
      } catch { /* ignore */ }
      if (res.status === 413) msg = "Selfie is too large. Please capture again or choose a smaller image.";
      if (res.status === 415) msg = "Unsupported file type. Please upload a JPG, PNG or WebP image.";
      if (res.status === 401) {
        notifySessionExpired();
        msg = "Your session has expired. Please log in again.";
      }
      throw new ApiError(msg, res.status);
    }

    return res.json() as Promise<{ selfieUrl?: string; selfieStatus?: "PENDING" | "VERIFIED" | "REJECTED" }>;
  },

  async submitSalaryAdvance(employeeId: string, amount: number) {
    const requestData = await request<BackendSalaryRequest>(
      "/salary-requests",
      {
        method: "POST",
        body: JSON.stringify({ amount }),
      }
    );
    return normalizeRequests([requestData], [])[0];
  },

  async previewSalaryAdvance(amount: number): Promise<RecoveryPreview> {
    const preview = await request<BackendRecoveryPreview>(
      "/salary-requests/preview",
      {
        method: "POST",
        body: JSON.stringify({ amount }),
      }
    );
    return {
      principal:     preview.principalAmount  ?? preview.principal     ?? amount,
      interest:      preview.interestAmount   ?? preview.interest      ?? 0,
      processingFee: preview.processingFee    ?? 0,
      youReceive:    preview.youReceive       ?? amount,
      total:         preview.totalRecovery    ?? preview.total         ?? preview.totalAmount ?? amount,
      interestDays:  preview.interestDays     ?? 0,
      interestRate:  preview.interestRate,
      recoveryDate:  preview.recoveryDate     ?? preview.dueDate       ?? "",
    };
  },
};
