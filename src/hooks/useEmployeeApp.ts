import { useEffect, useMemo, useState } from "react";
import { emptyBankAccount, mockState } from "../data/mockData";
import { employeeApi } from "../services/api";
import type { AppState, BankAccount, KycDocumentType, RecoveryPreview, View } from "../types/app";

type LoadState = "idle" | "loading" | "ready" | "error";

export function useEmployeeApp() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => employeeApi.hasSession());
  const [activeView, setActiveView] = useState<View>("dashboard");
  const [appState, setAppState] = useState<AppState>(mockState);
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
  const [couponCode, setCouponCode] = useState("");
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [activatingMembership, setActivatingMembership] = useState(false);
  const [loginError, setLoginError] = useState("");

  const loadEmployee = async () => {
    setLoadState("loading");
    try {
      const nextState = await employeeApi.loadAppState();
      setAppState(nextState);
      setBankForm(nextState.bankAccount ?? emptyBankAccount);
      setEditingBank(false);
      setCouponCode(nextState.membershipConfig.couponCode ?? "");
      setNotice("Employee app connected. Live records will show where the backend has data.");
      setLoadState("ready");
    } catch {
      setAppState(mockState);
      setNotice("Backend is unavailable, so the app is showing local demo data.");
      setLoadState("error");
    }
  };

  useEffect(() => {
    if (!employeeApi.hasSession()) return;

    setIsLoggedIn(true);
    void loadEmployee();
  }, []);

  const login = async (email: string, password: string) => {
    setLoginError("");
    setLoadState("loading");
    try {
      await employeeApi.login(email, password);
      setIsLoggedIn(true);
      await loadEmployee();
    } catch (error) {
      setLoadState("error");
      setLoginError(error instanceof Error ? error.message : "Unable to sign in. Please try again.");
    }
  };

  const logout = () => {
    employeeApi.logout();
    setIsLoggedIn(false);
    setActiveView("dashboard");
  };

  const kycComplete = appState.documents.every((document) => document.status === "Verified");
  const bankComplete = Boolean(appState.bankAccount?.verified);
  const activeRecovery = appState.requests.some((request) => request.recoveryStatus === "Scheduled");
  const membershipFee = appState.membershipConfig.amountPayable ?? Math.max(0, appState.membershipConfig.fee - appState.membershipConfig.couponDiscount);

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
    if (!isLoggedIn) return;
    let cancelled = false;

    const runPreview = async () => {
      setPreviewLoading(true);
      const nextPreview = await employeeApi.previewSalaryAdvance(advanceAmount);
      if (!cancelled) {
        setPreview(nextPreview);
        setPreviewLoading(false);
      }
    };

    void runPreview();
    return () => {
      cancelled = true;
    };
  }, [advanceAmount, isLoggedIn]);

  const saveBankAccount = async () => {
    setSavingBank(true);
    const savedBank = await employeeApi.saveBankAccount(appState.profile.id, bankForm);
    setAppState((current) => ({ ...current, bankAccount: savedBank }));
    setSavingBank(false);
    setEditingBank(false);
    setNotice(savedBank.verified ? "Payout details updated." : "Bank account saved. Admin verification is pending.");
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

  const uploadKycDocument = async (documentType: KycDocumentType, file: File) => {
    setUploadingKycType(documentType);
    try {
      const savedDocument = await employeeApi.uploadKycDocument(appState.profile.id, documentType, file);
      setAppState((current) => ({
        ...current,
        documents: current.documents.map((document) =>
          document.documentType === documentType || document.label.toUpperCase().replace("AADHAAR", "AADHAR").replaceAll(" ", "_") === documentType
            ? {
                ...document,
                ...savedDocument,
                documentType,
                status: "Under Review",
                note: "Uploaded. Waiting for admin verification."
              }
            : document
        )
      }));
      setNotice("KYC document uploaded for admin verification.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to upload KYC document.");
    } finally {
      setUploadingKycType(null);
    }
  };

  const applyMembershipCoupon = async () => {
    if (!couponCode.trim()) return;
    setApplyingCoupon(true);
    try {
      const result = await employeeApi.applyMembershipCoupon(appState.profile.id, couponCode);
      setAppState((current) => ({
        ...current,
        membershipConfig: {
          ...current.membershipConfig,
          couponCode: result.couponCode ?? couponCode.trim().toUpperCase(),
          couponDiscount: Number(result.couponDiscount ?? 0),
          amountPayable: Number(result.amountPayable ?? current.membershipConfig.fee)
        }
      }));
      setCouponCode(result.couponCode ?? couponCode.trim().toUpperCase());
      setNotice("Coupon applied to your membership fee.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to apply coupon.");
    } finally {
      setApplyingCoupon(false);
    }
  };

  const activateMembership = async () => {
    setActivatingMembership(true);
    try {
      const result = await employeeApi.activateMembership(appState.profile.id, couponCode);
      setAppState((current) => ({
        ...current,
        membershipActive: Boolean(result.active ?? true),
        membershipConfig: {
          ...current.membershipConfig,
          couponCode: result.couponCode ?? current.membershipConfig.couponCode,
          couponDiscount: Number(result.couponDiscount ?? current.membershipConfig.couponDiscount),
          amountPayable: Number(result.amountPayable ?? membershipFee)
        }
      }));
      setNotice("Membership activated for this employee account.");
      setActiveView("dashboard");
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
      setActiveView("tracking");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to submit salary advance request.");
    } finally {
      setSubmittingAdvance(false);
    }
  };

  return {
    activeRecovery,
    activeView,
    activatingMembership,
    advanceAmount,
    applyingCoupon,
    appState,
    bankComplete,
    bankForm,
    cancelBankEdit,
    editingBank,
    eligibleForAdvance,
    isLoggedIn,
    kycComplete,
    loadEmployee,
    loadState,
    login,
    loginError,
    logout,
    membershipFee,
    nextBlocker,
    notice,
    onboardingSteps,
    preview,
    previewLoading,
    couponCode,
    saveBankAccount,
    savingBank,
    setActiveView,
    setAdvanceAmount,
    setBankForm,
    setCouponCode,
    startBankEdit,
    submitSalaryAdvance,
    submittingAdvance,
    updateUpiId,
    uploadKycDocument,
    uploadingKycType,
    applyMembershipCoupon,
    activateMembership
  };
}
