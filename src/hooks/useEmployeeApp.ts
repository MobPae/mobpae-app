import { useEffect, useMemo, useState } from "react";
import { emptyBankAccount, mockState } from "../data/mockData";
import { employeeApi } from "../services/api";
import type { AppState, BankAccount, RecoveryPreview, View } from "../types/app";

type LoadState = "idle" | "loading" | "ready" | "error";

export function useEmployeeApp() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeView, setActiveView] = useState<View>("dashboard");
  const [appState, setAppState] = useState<AppState>(mockState);
  const [loadState, setLoadState] = useState<LoadState>("idle");
  const [notice, setNotice] = useState("Using local MVP data until your backend returns employee records.");
  const [bankForm, setBankForm] = useState<BankAccount>(emptyBankAccount);
  const [advanceAmount, setAdvanceAmount] = useState(5000);
  const [preview, setPreview] = useState<RecoveryPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [savingBank, setSavingBank] = useState(false);

  const loadEmployee = async () => {
    setLoadState("loading");
    try {
      const nextState = await employeeApi.loadAppState();
      setAppState(nextState);
      setBankForm(nextState.bankAccount ?? emptyBankAccount);
      setNotice("Employee app connected. Live records will show where the backend has data.");
      setLoadState("ready");
    } catch {
      setAppState(mockState);
      setNotice("Backend is unavailable, so the app is showing MVP demo data.");
      setLoadState("error");
    }
  };

  const login = async (email: string, password: string) => {
    setLoadState("loading");
    await employeeApi.login(email, password);
    setIsLoggedIn(true);
    await loadEmployee();
  };

  const logout = () => {
    employeeApi.logout();
    setIsLoggedIn(false);
    setActiveView("dashboard");
  };

  const kycComplete = appState.documents.every((document) => document.status === "Verified");
  const bankComplete = Boolean(appState.bankAccount);
  const activeRecovery = appState.requests.some((request) => request.recoveryStatus === "Scheduled");
  const membershipFee = Math.max(0, appState.membershipConfig.fee - appState.membershipConfig.couponDiscount);

  const onboardingSteps = useMemo(
    () => [
      { label: "Active account", done: appState.profile.accountActive },
      { label: "KYC", done: kycComplete },
      { label: "Bank", done: bankComplete },
      { label: "Membership", done: appState.membershipActive },
      { label: "Advance", done: appState.requests.length > 0 },
      { label: "Recovery", done: !activeRecovery }
    ],
    [activeRecovery, appState.membershipActive, appState.profile.accountActive, appState.requests.length, bankComplete, kycComplete]
  );

  const nextBlocker = useMemo(() => {
    if (!appState.profile.accountActive) return "Employer approval is pending.";
    if (!kycComplete) return "Complete KYC verification.";
    if (!bankComplete) return "Add your bank account.";
    if (!appState.membershipActive) return "Activate membership.";
    if (activeRecovery) return "Existing recovery is still scheduled.";
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
    setNotice("Bank account saved for salary advance disbursal.");
  };

  const completeDemoKyc = () => {
    // MVP action: keeps the flow testable until file upload screens are added.
    setAppState((current) => ({
      ...current,
      documents: current.documents.map((document) => ({ ...document, status: "Verified", note: "Verified for MVP flow." }))
    }));
    setNotice("KYC marked verified for MVP testing.");
  };

  const activateMembership = () => {
    setAppState((current) => ({ ...current, membershipActive: true }));
    setNotice("Membership activated for this employee account.");
  };

  return {
    activeRecovery,
    activeView,
    advanceAmount,
    appState,
    bankComplete,
    bankForm,
    completeDemoKyc,
    eligibleForAdvance,
    isLoggedIn,
    kycComplete,
    loadEmployee,
    loadState,
    login,
    logout,
    membershipFee,
    nextBlocker,
    notice,
    onboardingSteps,
    preview,
    previewLoading,
    saveBankAccount,
    savingBank,
    setActiveView,
    setAdvanceAmount,
    setBankForm,
    activateMembership
  };
}
