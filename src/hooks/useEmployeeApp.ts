import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { emptyBankAccount, emptyState } from "../data/emptyState";
import { employeeApi } from "../services/api";
import type { AppState, BankAccount, CouponValidation, EligibilityResult, KycDocumentType, RecoveryPreview, View } from "../types/app";

type LoadState = "idle" | "loading" | "ready" | "error";

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
  "profile-membership",
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
  const [advanceAmount, setAdvanceAmount] = useState(5000);
  const [preview, setPreview] = useState<RecoveryPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [submittingAdvance, setSubmittingAdvance] = useState(false);
  const [savingBank, setSavingBank] = useState(false);
  const [uploadingKycType, setUploadingKycType] = useState<KycDocumentType | null>(null);
  const [couponValidation, setCouponValidation] = useState<CouponValidation | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [activatingMembership, setActivatingMembership] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [changePasswordError, setChangePasswordError] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingSelfie, setUploadingSelfie] = useState(false);
  const [eligibility, setEligibility] = useState<EligibilityResult | null>(null);
  const [cancellingAdvance, setCancellingAdvance] = useState(false);
  const suppressNextSessionExpiredRef = useRef(false);
  const clearNotice = useCallback(() => setNotice(""), []);

  const loadEmployee = async (checkOnboarding = false) => {
    const hasExistingData = loadState === "ready" || Boolean(appState.profile.id);
    setLoadState("loading");
    try {
      // Load app state and eligibility in parallel; eligibility is best-effort
      const [nextState, eligResult] = await Promise.all([
        employeeApi.loadAppState(),
        employeeApi.getEligibility().catch(() => null),
      ]);

      lastRefreshAt.current = Date.now();
      setAppState(nextState);
      setEligibility(eligResult);
      setBankForm(nextState.bankAccount ?? emptyBankAccount);
      setEditingBank(false);
      setCouponValidation(null);
      setCouponError("");
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
        setActiveView("change-password");
        setLoadState("ready");
      } else {
        await loadEmployee(true);
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
      await employeeApi.changePassword(currentPassword, newPassword);
      // Backend invalidates all sessions on password change — clear tokens and force re-login
      suppressNextSessionExpiredRef.current = true;
      employeeApi.logout();
      clearStoredActiveView();
      setIsLoggedIn(false);
      setActiveView("home");
      setLoginError("Password changed successfully. Please sign in again.");
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
    employeeApi.logout();
    clearStoredActiveView();
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

  const membershipSubmitted =
    appState.membershipActive ||
    appState.membershipConfig.status === "PENDING" ||
    Boolean(appState.membershipConfig.paymentScreenshot);

  // Prefer eligibility.activeRequest (richest, from presentSalaryRequest) over local state
  const activeRequest = eligibility?.activeRequest ?? appState.requests.find(
    (request) => !["Paid", "Recovered", "Rejected", "Cancelled", "Expired"].includes(request.status)
  );
  const activeRecovery = Boolean(activeRequest);
  const membershipFee = appState.membershipConfig.fee;

  // Available advance limit: eligibility is most accurate source
  const advanceLimit = eligibility?.limits.availableAdvance ?? appState.profile.salaryLimit;

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
    // Clamp current selection to [500, advanceLimit] when limit changes
    setAdvanceAmount((cur) => Math.min(Math.max(cur, Math.min(500, advanceLimit)), advanceLimit));
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

  const uploadSelfie = async (file: File) => {
    const validationError = validateUpload(file, false);
    if (validationError) {
      setNotice(validationError);
      return;
    }
    setUploadingSelfie(true);
    try {
      const employee = await employeeApi.uploadSelfie(file);
      setAppState((current) => ({
        ...current,
        profile: {
          ...current.profile,
          selfieUrl: employee.selfieUrl ?? current.profile.selfieUrl,
          selfieStatus: employee.selfieStatus ?? "PENDING",
        },
      }));
      setNotice("Selfie uploaded successfully. Pending admin verification.");
      await loadEmployee();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to upload selfie. Please try again.");
    } finally {
      setUploadingSelfie(false);
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

  const validateCoupon = async (code: string) => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    setCouponError("");
    setValidatingCoupon(true);
    try {
      const result = await employeeApi.validateMembershipCoupon(trimmed);
      if (result.valid) {
        setCouponValidation(result);
      } else {
        setCouponValidation(null);
        setCouponError("Invalid coupon code. Please try again.");
      }
    } catch (error) {
      setCouponValidation(null);
      setCouponError(error instanceof Error ? error.message : "Unable to validate coupon.");
    } finally {
      setValidatingCoupon(false);
    }
  };

  const clearCoupon = () => {
    setCouponValidation(null);
    setCouponError("");
  };

  const activateMembership = async (
    paymentScreenshot?: File,
    paymentReference?: string,
    planType: 'MONTHLY' | 'BIANNUAL' = 'BIANNUAL',
  ) => {
    const uploadIssue = paymentScreenshot ? validateUpload(paymentScreenshot, false) : null;
    if (uploadIssue) {
      setNotice(uploadIssue);
      throw new Error(uploadIssue);
    }

    setActivatingMembership(true);
    try {
      const screenshotPath = paymentScreenshot
        ? await employeeApi.uploadMembershipScreenshot(paymentScreenshot)
        : undefined;
      const result = await employeeApi.activateMembership({
        planType,
        couponCode: couponValidation?.couponCode,
        paymentReference: paymentReference?.trim() || undefined,
        paymentScreenshot: screenshotPath,
      });
      const membership = result.membership;
      setAppState((current) => ({
        ...current,
        membershipActive: membership?.status === "ACTIVE",
        membershipConfig: {
          ...current.membershipConfig,
          status: membership?.status ?? "PENDING",
          planType: membership?.planType as 'MONTHLY' | 'BIANNUAL' ?? planType,
          membershipId: membership?.id ?? current.membershipConfig.membershipId,
          planName: membership?.planName ?? current.membershipConfig.planName,
          amountPayable: membership?.amount
            ? Number(membership.amount)
            : current.membershipConfig.amountPayable,
          paymentReference: membership?.paymentReference ?? current.membershipConfig.paymentReference,
          paymentScreenshot: membership?.paymentScreenshot ?? current.membershipConfig.paymentScreenshot,
          submittedAt: new Date().toISOString(),
          remarks: membership?.remarks ?? current.membershipConfig.remarks,
        }
      }));
      setCouponValidation(null);
      setCouponError("");
      setNotice(result.message ?? "Membership payment submitted for verification.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to submit membership payment.";
      setNotice(message);
      throw new Error(message);
    } finally {
      setActivatingMembership(false);
    }
  };

  const submitSalaryAdvance = async () => {
    setSubmittingAdvance(true);
    try {
      await employeeApi.submitSalaryAdvance(appState.profile.id, advanceAmount);
      // Refresh so eligibility + requests reflect the new submission
      void loadEmployee();
      setActiveView("activity");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to submit salary advance request.");
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
    activatingMembership,
    advanceAmount,
    advanceLimit,
    appState,
    bankComplete,
    bankSubmitted,
    bankForm,
    cancelBankEdit,
    cancelAdvanceRequest,
    cancellingAdvance,
    couponError,
    couponValidation,
    clearCoupon,
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
    membershipFee,
    membershipSubmitted,
    nextBlocker,
    notice,
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
    validateCoupon,
    validatingCoupon,
    activateMembership,
    changePassword,
    changingPassword,
    changePasswordError,
    setChangePasswordError,
    uploadProfilePhoto,
    uploadSelfie,
    uploadingPhoto,
    uploadingSelfie,
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
