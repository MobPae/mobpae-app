import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { emptyBankAccount, emptyState } from "../data/mockData";
import { employeeApi } from "../services/api";
import type { AppState, BankAccount, CouponValidation, KycDocumentType, RecoveryPreview, View } from "../types/app";

type LoadState = "idle" | "loading" | "ready" | "error";

const REFRESH_COOLDOWN_MS = 30_000; // 30 s between auto-refreshes on tab switch

export function useEmployeeApp() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => employeeApi.hasSession());
  const [activeView, setActiveViewRaw] = useState<View>("home");
  const lastRefreshAt = useRef<number>(0);
  const [appState, setAppState] = useState<AppState>(emptyState);
  const [loadState, setLoadState] = useState<LoadState>("idle");
  const [notice, setNotice] = useState("Using local data until your backend returns employee records.");
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

  const loadEmployee = async (checkOnboarding = false) => {
    setLoadState("loading");
    try {
      const nextState = await employeeApi.loadAppState();
      lastRefreshAt.current = Date.now();
      setAppState(nextState);
      setBankForm(nextState.bankAccount ?? emptyBankAccount);
      setEditingBank(false);
      setCouponValidation(null);
      setCouponError("");
      setNotice("Employee app connected. Live records will show where the backend has data.");
      setLoadState("ready");

      if (checkOnboarding) {
        setActiveView("home");
      }
    } catch {
      setAppState(emptyState);
      setNotice("Backend is unavailable. Please check your connection.");
      setLoadState("error");
    }
  };

  useEffect(() => {
    if (!employeeApi.hasSession()) return;

    setIsLoggedIn(true);
    void loadEmployee(false);
  }, []);

  // When a 401 is detected in the API layer, clear session state so the login screen shows.
  useEffect(() => {
    const handleExpired = () => {
      setIsLoggedIn(false);
      setAppState(emptyState);
      setLoadState("idle");
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
      employeeApi.logout();
      setIsLoggedIn(false);
      setActiveView("home");
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
    setIsLoggedIn(false);
    setActiveView("home");
  };

  const forgotPassword = async (email: string) => {
    await employeeApi.forgotPassword(email);
  };

  const resetPassword = async (token: string, newPassword: string) => {
    await employeeApi.resetPassword(token, newPassword);
  };

  const kycComplete =
    appState.documents.length >= 3 &&
    appState.documents.every((document) => document.status === "Verified") &&
    appState.profile.selfieStatus === "VERIFIED";
  const bankComplete = Boolean(appState.bankAccount?.verified);
  const activeRecovery = appState.requests.some((request) => request.recoveryStatus === "Scheduled");
  const membershipFee = appState.membershipConfig.fee;

  const onboardingSteps = useMemo(
    () => [
      { label: "Active account", done: appState.profile.accountActive },
      { label: "KYC", done: kycComplete },
      { label: "Bank", done: bankComplete },
      { label: "Membership", done: appState.membershipActive },
      { label: "Advance", done: appState.requests.length > 0 },
      { label: "Payment", done: !activeRecovery }
    ],
    [activeRecovery, appState.membershipActive, appState.profile.accountActive, appState.requests.length, bankComplete, kycComplete]
  );

  const nextBlocker = useMemo(() => {
    if (!appState.profile.accountActive) return "Employer approval is pending.";
    if (!kycComplete) return "Complete KYC verification.";
    if (!appState.bankAccount) return "Add your bank account.";
    if (!bankComplete) return "Bank account verification is pending.";
    if (!appState.membershipActive) return "Activate membership.";
    if (activeRecovery) return "Payment is already scheduled.";
    return "";
  }, [activeRecovery, appState.membershipActive, appState.profile.accountActive, bankComplete, kycComplete]);

  const eligibleForAdvance = !nextBlocker;

  useEffect(() => {
    const limit = appState.profile.salaryLimit;
    if (limit <= 0) return;
    // Clamp current selection to [500, limit] when limit changes
    setAdvanceAmount((cur) => Math.min(Math.max(cur, Math.min(500, limit)), limit));
  }, [appState.profile.salaryLimit]);

  useEffect(() => {
    if (!isLoggedIn) return;
    if (advanceAmount < 500 || advanceAmount > appState.profile.salaryLimit) {
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
      setNotice(bank.verified ? "Bank account updated successfully." : "Bank account saved. Pending verification.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to save bank account. Please try again.");
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
    const savedBank = await employeeApi.updateUpiId(appState.profile.id, bankForm.upiId ?? "");
    setAppState((current) => ({ ...current, bankAccount: savedBank }));
    setBankForm(savedBank);
    setSavingBank(false);
    setNotice("UPI ID updated.");
  };

  const uploadProfilePhoto = async (file: File) => {
    setUploadingPhoto(true);
    try {
      const filePath = await employeeApi.uploadProfilePhoto(file);
      setAppState((current) => ({
        ...current,
        profile: { ...current.profile, profilePhotoUrl: filePath },
      }));
      setNotice("Profile photo updated.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to upload photo. Please try again.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const uploadSelfie = async (file: File) => {
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
    setUploadingKycType(documentType);
    try {
      // POST /kyc-documents — backend derives employee from JWT, no employeeId needed
      await employeeApi.uploadKycDocument(documentType, file);

      // Refetch GET /kyc-documents/my so state matches what the server persisted
      const refreshedDocs = await employeeApi.fetchKycDocuments();
      setAppState((current) => ({ ...current, documents: refreshedDocs }));

      setNotice(`✓ ${documentType.replaceAll("_", " ")} uploaded successfully. Pending admin verification.`);
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

  const activateMembership = async () => {
    setActivatingMembership(true);
    try {
      const result = await employeeApi.activateMembership(couponValidation?.couponCode);
      setAppState((current) => ({
        ...current,
        membershipActive: Boolean(result.active ?? true),
        membershipConfig: {
          ...current.membershipConfig,
          planName: result.planName ?? current.membershipConfig.planName,
          daysRemaining: result.daysRemaining ?? current.membershipConfig.daysRemaining,
          memberSince: result.memberSince ?? current.membershipConfig.memberSince,
          validTill: result.validTill ?? current.membershipConfig.validTill,
        }
      }));
      setCouponValidation(null);
      setCouponError("");
      setNotice("Membership activated successfully.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to activate membership.");
    } finally {
      setActivatingMembership(false);
    }
  };

  const submitSalaryAdvance = async () => {
    setSubmittingAdvance(true);
    try {
      const savedRequest = await employeeApi.submitSalaryAdvance(appState.profile.id, advanceAmount);
      setAppState((current) => ({
        ...current,
        requests: [savedRequest, ...current.requests],
        dashboard: current.dashboard
          ? {
              ...current.dashboard,
              activeRequestStatus: "SUBMITTED"
            }
          : current.dashboard,
        notifications: [`Request ${savedRequest.id} submitted for employer approval.`, ...current.notifications].slice(0, 5)
      }));
      setNotice("Salary advance request submitted for employer approval.");
      setActiveView("activity");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to submit salary advance request.");
    } finally {
      setSubmittingAdvance(false);
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
    activeView,
    activatingMembership,
    advanceAmount,
    appState,
    bankComplete,
    bankForm,
    cancelBankEdit,
    couponError,
    couponValidation,
    clearCoupon,
    editingBank,
    eligibleForAdvance,
    isLoggedIn,
    kycComplete,
    loadEmployee,
    loadState,
    login,
    loginError,
    logout,
    forgotPassword,
    resetPassword,
    membershipFee,
    nextBlocker,
    notice,
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
  };
}
