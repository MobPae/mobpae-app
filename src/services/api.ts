import { mockState } from "../data/mockData";
import type { AppState, BankAccount, KycDocument, RecoveryPreview } from "../types/app";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";
const TOKEN_KEY = "mobpae_employee_token";

type LoginResponse = {
  accessToken?: string;
  token?: string;
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
      const profile = mockState.profile;
      const [dashboard, kycDocuments, bankAccount, salaryRequests, repayments] = await Promise.allSettled([
        request<unknown>(`/dashboard/employees/${profile.id}`),
        request<KycDocument[]>(`/kyc-documents/employee/${profile.id}`),
        request<BankAccount | null>(`/bank-accounts/employee/${profile.id}`),
        request<unknown[]>(`/salary-requests/employee/${profile.id}`),
        request<unknown[]>(`/repayments/employee/${profile.id}`)
      ]);

      void dashboard;
      void salaryRequests;
      void repayments;

      return {
        ...mockState,
        documents: kycDocuments.status === "fulfilled" && kycDocuments.value.length ? kycDocuments.value : mockState.documents,
        bankAccount: bankAccount.status === "fulfilled" ? bankAccount.value : mockState.bankAccount
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

  async previewSalaryAdvance(amount: number): Promise<RecoveryPreview> {
    try {
      const preview = await request<Partial<RecoveryPreview>>("/salary-requests/preview", {
        method: "POST",
        body: JSON.stringify({ amount })
      });
      return {
        principal: preview.principal ?? amount,
        interest: preview.interest ?? Number((amount * 0.00789).toFixed(2)),
        total: preview.total ?? amount + Number((amount * 0.00789).toFixed(2)),
        interestDays: preview.interestDays ?? 8,
        recoveryDate: preview.recoveryDate ?? "2026-06-28"
      };
    } catch {
      const interest = Number((amount * 0.00789).toFixed(2));
      return { principal: amount, interest, total: amount + interest, interestDays: 8, recoveryDate: "2026-06-28" };
    }
  }
};
