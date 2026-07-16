import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { emptyBankAccount, emptyState } from "../data/emptyState";
import { employeeApi } from "../services/api";
import type { AppState, BankAccount, EligibilityResult, KycDocumentType, RecoveryPreview, View } from "../types/app";
import { initPushNotifications, removePushToken } from "../services/pushNotifications";

type LoadState = "idle" | "loading" | "ready" | "error";
type RazorpayCheckoutResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};
type RazorpayConstructor = new (options: Record<string, unknown>) => { open: () => void };

const REFRESH_COOLDOWN_MS = 5 * 60_000; // 5 min between silent background refreshes
const ACTIVE_VIEW_KEY = "mobpae_employee_active_view";
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const REQUIRED_KYC_TYPES: KycDocumentType[] = ["PAN", "AADHAR", "SALARY_SLIP"];
const RESTORABLE_VIEWS = new Set<View>([
  "home",
  "advance",
  "repayments",
  "activity",
  "profile",
  "profile-kyc",
  "profile-bank",
  "change-password",
  "onboarding-kyc",
  "onboarding-bank",
  "notifications",
  "help",
]);

function readStoredActiveView(): View | null {
  try {
    const stored = window.localStorage.getItem(ACTIVE_VIEW_KEY) as View | null;
    return stored && RESTORABLE_VIEWS.has(stored) ? stored : null;
  } catch {
    return null;
  }
}

function storeActiveView(view: View) {
  try {
    if (RESTORABLE_VIEWS.has(view)) {
      window.localStorage.setItem(ACTIVE_VIEW_KEY, view);
    } else {
      window.localStorage.removeItem(ACTIVE_VIEW_KEY);
    }
  } catch {
    // Local storage may be unavailable in private browsing; navigation still works in memory.
  }
}

function clearStoredActiveView() {
  try {
    window.localStorage.removeItem(ACTIVE_VIEW_KEY);
  } catch {
    // No-op.
  }
}

function validateUpload(file: File, allowPdf: boolean): string | null {
  if (file.size > MAX_UPLOAD_BYTES) return "File must be smaller than 5 MB.";
  if (!IMAGE_TYPES.has(file.type) && !(allowPdf && file.type === "application/pdf")) {
    return allowPdf
      ? "Upload a PDF, JPG, PNG, or WebP file."
      : "Upload a JPG, PNG, or WebP image.";
  }
  return null;
}

export function useEmployeeApp() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => employeeApi.hasSession());
  const [activeView, setActiveViewRaw] = useState<View>(() => {
    const params = new URLSearchParams(window.location.search);
    const v = params.get("view");
    // Only allow pre-login views to be deep-linked via URL
    if (v === "reset-password" || v === "forgot-password") return v as View;
    return employeeApi.hasSession() ? readStoredActiveView() ?? "home" : "home";
  });
  const lastRefreshAt = useRef<number>(0);
  const [appState, setAppState] = useState<AppState>(emptyState);
  const [loadState, setLoadState] = useState<LoadState>("idle");
  const [notice, setNotice] = useState("");
  const [bankForm, setBankForm] = useState<BankAccount>(emptyBankAccount);
  const [editingBank, setEditingBank] = useState(false);
  const [advanceAmount, setAdvanceAmount] = useState(0);
  const [preview, setPreview] = useState<RecoveryPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [submittingAdvance, setSubmittingAdvance] = useState(false);
  const [savingBank, setSavingBank] = useState(false);
  const [uploadingKycType, setUploadingKycType] = useState<KycDocumentType | null>(null);
  const [payingPlatformFee, setPayingPlatformFee] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [changePasswordError, setChangePasswordError] = useState("");
  // True when backend reports passwordChanged===false on login.
  // While true, the app renders only the ChangePasswordScreen — no other view is accessible.
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [eligibility, setEligibility] = useState<EligibilityResult | null>(null);
  const [cancellingAdvance, setCancellingAdvance] = useState(false);
  const suppressNextSessionExpiredRef = useRef(false);
  const clearNotice = useCallback(() => setNotice(""), []);

  const loadEmployee = async (checkOnboarding = false) => {
    const hasExistingData = loadState === "ready" || Boolean(appState.profile.id);
    setLoadState("loading");
    try {
      // Load app state and eligibility in parallel; eligibility is best-effort
      const [rawState, eligResult] = await Promise.all([
        employeeApi.loadAppState(),
        employeeApi.getEligibility().catch(() => null),
      ]);

      lastRefreshAt.current = Date.now();

      // Enrich dashboard.approvedLimit from eligibility result. The /employees/me
      // endpoint reads from the stale `loanLimit` table and returns 0 when no row
      // exists. The eligibility service always computes the correct limit from
      // EmployerProductConfig overrides (percentage or absolute amount).
      const nextState = eligResult?.limits.approvedLimit && rawState.dashboard
        ? { ...rawState, dashboard: { ...rawState.dashboard, approvedLimit: eligResult.limits.approvedLimit } }
        : rawState;

      setAppState(nextState);
      setEligibility(eligResult);
      setBankForm(nextState.bankAccount ?? emptyBankAccount);
      setEditingBank(false);
      setNotice((current) =>
        current.toLowerCase().includes("backend is unavailable") ? "" : current
      );
      setLoadState("ready");

      if (checkOnboarding) {
        setActiveView("home");
      }
    } catch (error) {
      if (hasExistingData) {
        setLoadState("ready");
        return;
      }

      setAppState(emptyState);
      setNotice(
        error instanceof Error
          ? error.message
          : "Backend is unavailable. Please check your connection."
      );
      setLoadState("error");
    }
  };

  useEffect(() => {
    if (!employeeApi.hasSession()) return;

    setIsLoggedIn(true);
    void loadEmployee(false);
  }, []);

  useEffect(() => {
    if (!notice) return;

    const timer = window.setTimeout(() => {
      setNotice("");
    }, 4500);

    return () => window.clearTimeout(timer);
  }, [notice]);

  // When a 401 is detected in the API layer, clear session state so the login screen shows.
  useEffect(() => {
    const handleExpired = () => {
      if (suppressNextSessionExpiredRef.current) {
        suppressNextSessionExpiredRef.current = false;
        return;
      }
      clearStoredActiveView();
      setIsLoggedIn(false);
      setAppState(emptyState);
      setLoadState("idle");
      setActiveViewRaw("home");
      setLoginError("Your session has expired. Please sign in again.");
    };
    window.addEventListener("mobpae:session:expired", handleExpired);
    return () => window.removeEventListener("mobpae:session:expired", handleExpired);
  }, []);

  const login = async (email: string, password: string) => {
    setLoginError("");
    setLoadState("loading");
    try {
      const passwordChanged = await employeeApi.login(email, password);
      setIsLoggedIn(true);
      if (passwordChanged === false) {
        // First-time login: force the user to set a new password before accessing the app.
        setMustChangePassword(true);
        setLoadState("ready");
      } else {
        await loadEmployee(true);
        // Initialise push notifications after first successful login
        void initPushNotifications((view) => setActiveView(view));
      }
    } catch (error) {
      setLoadState("error");
      setLoginError(error instanceof Error ? error.message : "Unable to sign in. Please try again.");
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    setChangingPassword(true);
    setChangePasswordError("");
    try {
      const result = await employeeApi.changePassword(currentPassword, newPassword);

      if (result?.accessToken && result?.refreshToken) {
        // First-time forced change — backend already stored fresh tokens in localStorage via api.ts.
        // Clear the gate and load the employee profile directly, skipping re-login.
        setMustChangePassword(false);
        await loadEmployee(true);
        void initPushNotifications((view) => setActiveView(view));
      } else {
        // Voluntary change — backend invalidated all sessions; clear state and show login.
        suppressNextSessionExpiredRef.current = true;
        employeeApi.logout();
        clearStoredActiveView();
        setMustChangePassword(false);
        setIsLoggedIn(false);
        setActiveView("home");
        setLoginError("Password changed successfully. Please sign in again.");
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Failed to change password.";
      const displayMessage = msg.toLowerCase().includes("incorrect") || msg.toLowerCase().includes("wrong")
        ? "Current password is incorrect."
        : msg;
      setChangePasswordError(displayMessage);
      throw new Error(displayMessage);
    } finally {
      setChangingPassword(false);
    }
  };

  const logout = () => {
    void removePushToken();
    employeeApi.logout();
    clearStoredActiveView();
    setMustChangePassword(false);
    setIsLoggedIn(false);
    setActiveView("home");
  };

  const forgotPassword = async (email: string) => {
    await employeeApi.forgotPassword(email);
  };

  const resetPassword = async (token: string, newPassword: string) => {
    await employeeApi.resetPassword(token, newPassword);
  };

  // Prefer eligibility.setup for setup-step completion (handles PENDING bank correctly)
  const kycSetup = eligibility?.setup.find((s) => s.key === "KYC");
  const bankSetup = eligibility?.setup.find((s) => s.key === "BANK_ACCOUNT");

  const requiredKycDocuments = REQUIRED_KYC_TYPES.map((type) =>
    appState.documents.find((document) => document.documentType === type)
  );
  const allRequiredKycVerified = requiredKycDocuments.every(
    (document) => document?.status === "Verified"
  );
  const allRequiredKycSubmitted = requiredKycDocuments.every(
    (document) => document?.status === "Verified" || document?.status === "Under Review"
  );

  const kycComplete = allRequiredKycVerified || Boolean(kycSetup?.completed && allRequiredKycSubmitted);
  const kycSubmitted = allRequiredKycSubmitted;
  const bankComplete = bankSetup ? bankSetup.completed : Boolean(appState.bankAccount?.verified);
  // bankSubmitted = bank is at least submitted (PENDING or VERIFIED), not NOT_ADDED
  const bankSubmitted = bankSetup ? bankSetup.status !== "NOT_ADDED" : Boolean(appState.bankAccount);

  // Prefer eligibility.activeRequest (richest, from presentSalaryRequest) over local state
  const activeRequest = eligibility?.activeRequest ?? appState.requests.find(
    (request) => !["Paid", "Recovered", "Rejected", "Cancelled", "Expired"].includes(request.status)
  );
  const activeRecovery = Boolean(activeRequest);

  // Available advance limit: use approvedLimit (maximumEligibleAmount) — always computed
  // correctly by eligibility service even when eligible=false. availableAdvance is 0
  // when denied, which would hide the limit on the slider and the home screen.
  const advanceLimit = eligibility?.limits.approvedLimit ?? eligibility?.limits.availableAdvance ?? appState.profile.salaryLimit;

  const onboardingSteps = useMemo(
    () => [
      { label: "Active account", done: appState.profile.accountActive },
      { label: "KYC", done: kycComplete },
      { label: "Bank", done: bankComplete },
      { label: "Advance", done: appState.requests.length > 0 },
      { label: "Payment", done: !activeRecovery }
    ],
    [activeRecovery, appState.profile.accountActive, appState.requests.length, bankComplete, kycComplete]
  );

  const nextBlocker = useMemo(() => {
    if (!appState.profile.accountActive) return "Employer approval is pending.";
    if (!kycComplete) return kycSubmitted ? "KYC submitted. Pending admin verification." : "Complete KYC verification.";
    if (!appState.bankAccount) return "Add your bank account.";
    if (!bankComplete) return "Bank account pending verification.";
    if (activeRequest) return "You already have an active salary request.";
    return "";
  }, [activeRequest, appState.profile.accountActive, appState.bankAccount, bankComplete, kycComplete, kycSubmitted]);

  // Backend eligibility is authoritative when available
  const eligibleForAdvance = eligibility ? eligibility.eligible : !nextBlocker;

  useEffect(() => {
    if (advanceLimit <= 0) return;
    setAdvanceAmount((cur) => {
      // First load (cur === 0): default to max so interest card is visible immediately
      if (cur === 0) return advanceLimit;
      // Limit updated while user already has a selection: just clamp to new bounds
      return Math.min(Math.max(cur, Math.min(500, advanceLimit)), advanceLimit);
    });
  }, [advanceLimit]);

  useEffect(() => {
    if (!isLoggedIn) return;
    if (advanceAmount < 500 || advanceAmount > advanceLimit) {
      setPreview(null);
      setPreviewLoading(false);
      return;
    }
    let cancelled = false;

    const runPreview = async () => {
      setPreviewLoading(true);
      try {
        const nextPreview = await employeeApi.previewSalaryAdvance(advanceAmount);
        if (!cancelled) {
          setPreview(nextPreview);
        }
      } catch {
        if (!cancelled) setPreview(null);
      } finally {
        if (!cancelled) setPreviewLoading(false);
      }
    };

    void runPreview();
    return () => {
      cancelled = true;
    };
  }, [advanceAmount, appState.profile.salaryLimit, isLoggedIn]);

  const saveBankAccount = async () => {
    setSavingBank(true);
    try {
      const savedBank = await employeeApi.saveBankAccount(appState.profile.id, bankForm);
      // unwrap if the GET /bank-accounts/my response is wrapped
      const bank = (savedBank as Record<string, unknown>)?.bankAccount as BankAccount ?? savedBank;
      setAppState((current) => ({ ...current, bankAccount: bank }));
      setBankForm(bank);
      setEditingBank(false);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to save bank account. Please try again.");
      throw error;
    } finally {
      setSavingBank(false);
    }
  };

  const startBankEdit = () => {
    setBankForm(appState.bankAccount ? { ...appState.bankAccount, accountNumber: "" } : emptyBankAccount);
    setEditingBank(true);
  };

  const cancelBankEdit = () => {
    setBankForm(appState.bankAccount ?? emptyBankAccount);
    setEditingBank(false);
  };

  const updateUpiId = async () => {
    setSavingBank(true);
    try {
      const savedBank = await employeeApi.updateUpiId(appState.profile.id, bankForm.upiId ?? "");
      setAppState((current) => ({ ...current, bankAccount: savedBank }));
      setBankForm(savedBank);
      setNotice("UPI ID updated.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to update UPI ID.");
    } finally {
      setSavingBank(false);
    }
  };

  const uploadProfilePhoto = async (file: File) => {
    const validationError = validateUpload(file, false);
    if (validationError) {
      setNotice(validationError);
      return;
    }
    setUploadingPhoto(true);
    try {
      const filePath = await employeeApi.uploadProfilePhoto(file);
      setAppState((current) => ({
        ...current,
        profile: { ...current.profile, profilePhotoUrl: filePath },
      }));
      setNotice("");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to upload photo. Please try again.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const uploadKycDocument = async (documentType: KycDocumentType, file: File) => {
    const validationError = validateUpload(file, true);
    if (validationError) {
      setNotice(validationError);
      return;
    }
    setUploadingKycType(documentType);
    try {
      // POST /kyc-documents — backend derives employee from JWT, no employeeId needed
      await employeeApi.uploadKycDocument(documentType, file);

      // Refetch GET /kyc-documents/my so state matches what the server persisted
      const refreshedDocs = await employeeApi.fetchKycDocuments();
      setAppState((current) => ({ ...current, documents: refreshedDocs }));
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to upload document. Please try again.");
    } finally {
      setUploadingKycType(null);
    }
  };

  const payPlatformFee = async (loanApplicationId: string) => {
    setPayingPlatformFee(true);
    try {
      const order = await employeeApi.initiatePlatformFeePayment(loanApplicationId);
      if (order.alreadyPaid) {
        await loadEmployee();
        setNotice("Platform fee already cleared.");
        return;
      }

      const RazorpayCtor = (window as unknown as { Razorpay?: RazorpayConstructor }).Razorpay;
      if (!RazorpayCtor || !order.orderId || !order.amount || !order.currency || !order.keyId) {
        throw new Error("Payment service is still loading. Please try again.");
      }

      await new Promise<void>((resolve, reject) => {
        const checkout = new RazorpayCtor({
          key: order.keyId,
          amount: order.amount,
          currency: order.currency,
          name: "MobPae",
          description: order.description ?? "Platform fee",
          order_id: order.orderId,
          prefill: {
            name: order.customer?.name ?? appState.profile.name,
            email: order.customer?.email ?? appState.profile.email,
            contact: order.customer?.contact ?? appState.profile.phone,
          },
          theme: { color: "#5B3CE3" },
          handler: async (response: RazorpayCheckoutResponse) => {
            try {
              await employeeApi.verifyPlatformFeePayment({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              });
              resolve();
            } catch (err) {
              reject(err);
            }
          },
          modal: {
            ondismiss: () => reject(new Error("Payment cancelled.")),
          },
        });
        checkout.open();
      });

      await loadEmployee();
      setNotice("Platform fee paid. Your request is now with MobPae for review.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to process platform fee payment.";
      if (message !== "Payment cancelled.") setNotice(message);
    } finally {
      setPayingPlatformFee(false);
    }
  };

  const submitSalaryAdvance = async (
    purposeCategory?: string,
    purposeNote?: string,
  ): Promise<string | null> => {
    setSubmittingAdvance(true);
    try {
      const submitted = await employeeApi.submitSalaryAdvance(
        appState.profile.id,
        advanceAmount,
        purposeCategory,
        purposeNote,
      );
      // Refresh in background — do NOT navigate; AdvanceScreen shows the submitted state
      void loadEmployee();
      return submitted?.requestDate ?? null;
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to submit salary advance request.");
      return null;
    } finally {
      setSubmittingAdvance(false);
    }
  };

  const cancelAdvanceRequest = async (id: string) => {
    setCancellingAdvance(true);
    try {
      await employeeApi.cancelLoanApplication(id);
      void loadEmployee();
      setNotice("Advance request cancelled.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to cancel request. Please try again.");
    } finally {
      setCancellingAdvance(false);
    }
  };

  // Explicit refresh — can be called from any screen's refresh button
  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadEmployee();
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Tab-switch wrapper: silently background-refresh if cooldown has passed
  const setActiveView = useCallback((view: View) => {
    setActiveViewRaw(view);
    storeActiveView(view);
    const now = Date.now();
    if (
      isLoggedIn &&
      loadState === "ready" &&
      now - lastRefreshAt.current >= REFRESH_COOLDOWN_MS
    ) {
      void loadEmployee();
    }
  }, [isLoggedIn, loadState]);

  return {
    activeRecovery,
    activeRequest,
    activeView,
    advanceAmount,
    advanceLimit,
    appState,
    bankComplete,
    bankSubmitted,
    bankForm,
    cancelBankEdit,
    cancelAdvanceRequest,
    cancellingAdvance,
    editingBank,
    eligibility,
    eligibleForAdvance,
    isLoggedIn,
    kycComplete,
    kycSubmitted,
    loadEmployee,
    loadState,
    login,
    loginError,
    logout,
    forgotPassword,
    resetPassword,
    nextBlocker,
    notice,
    payingPlatformFee,
    clearNotice,
    onboardingSteps,
    preview,
    previewLoading,
    refresh,
    refreshing,
    saveBankAccount,
    savingBank,
    setActiveView,
    setAdvanceAmount,
    setBankForm,
    startBankEdit,
    submitSalaryAdvance,
    submittingAdvance,
    updateUpiId,
    uploadKycDocument,
    uploadingKycType,
    payPlatformFee,
    changePassword,
    changingPassword,
    changePasswordError,
    setChangePasswordError,
    mustChangePassword,
    uploadProfilePhoto,
    uploadingPhoto,
    markNotificationRead: async (id: string) => {
      try {
        await employeeApi.markNotificationRead(id);
        setAppState((prev) => ({
          ...prev,
          rawNotifications: prev.rawNotifications.map((n) =>
            n.id === id ? { ...n, isRead: true } : n
          ),
        }));
      } catch { /* non-critical */ }
    },
    markAllNotificationsRead: async () => {
      const unread = appState.rawNotifications.filter((n) => !n.isRead);
      await Promise.allSettled(unread.map((n) => employeeApi.markNotificationRead(n.id)));
      setAppState((prev) => ({
        ...prev,
        rawNotifications: prev.rawNotifications.map((n) => ({ ...n, isRead: true })),
      }));
    },
  };
}
