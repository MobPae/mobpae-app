import { useRef } from "react";
import type { View } from "../types/app";
import { AppShell } from "../components/layout/AppShell";
import { ActivityScreen } from "./ActivityScreen";
import { AdvanceScreen } from "./AdvanceScreen";
import { RepaymentScheduleScreen } from "./RepaymentScheduleScreen";
import { DashboardScreen } from "./DashboardScreen";
import { LoginScreen } from "./LoginScreen";
import { ChangePasswordScreen } from "./ChangePasswordScreen";
import { ProfileScreen } from "./ProfileScreen";
import { OnboardingKycScreen } from "./OnboardingKycScreen";
import { OnboardingBankScreen } from "./OnboardingBankScreen";
import { OnboardingDoneScreen } from "./OnboardingDoneScreen";
import { ForgotPasswordScreen } from "./ForgotPasswordScreen";
import { ResetPasswordScreen } from "./ResetPasswordScreen";
import { NotificationsScreen } from "./NotificationsScreen";
import { HelpScreen } from "./HelpScreen";
import { LegalScreen } from "./LegalScreen";
import { useEmployeeApp } from "../hooks/useEmployeeApp";
import { DashboardSkeleton } from "../components/ui/DashboardSkeleton";

const rootClassName = "app-root app-root--light";
const shellClassName = "phone-shell phone-shell--light";

export function EmployeeApp() {
  const app = useEmployeeApp();
  const notifBackRef = useRef<View>("home");
  const legalBackRef = useRef<View>("profile");
  const onboardingBackRef = useRef<View>("advance");

  const openOnboarding = (view: "onboarding-kyc" | "onboarding-bank", backTo: View = "advance") => {
    onboardingBackRef.current = backTo;
    app.setActiveView(view);
  };

  const resolveAdvanceBlocker = () => {
    if (app.activeRequest) return app.setActiveView("activity");
    if (!app.appState.profile.accountActive) return app.setActiveView("home");
    if (!app.kycComplete) return openOnboarding("onboarding-kyc");
    if (!app.appState.bankAccount || !app.bankComplete) return openOnboarding("onboarding-bank");
  };

  const advanceBlockerActionLabel = app.activeRequest
    ? "Track request"
    : !app.kycComplete
      ? "Complete KYC"
      : !app.appState.bankAccount || !app.bankComplete
        ? app.appState.bankAccount ? "View bank status" : "Add bank account"
        : "View details";

  if (!app.isLoggedIn) {
    if (app.activeView === "forgot-password") {
      return (
        <div className={rootClassName}>
          <div className={shellClassName}>
            <ForgotPasswordScreen
              onBack={() => app.setActiveView("home")}
              onForgotPassword={app.forgotPassword}
            />
          </div>
        </div>
      );
    }
    if (app.activeView === "reset-password") {
      const token = new URLSearchParams(window.location.search).get("token") ?? "";
      // Strip token from URL bar without adding a history entry
      if (window.location.search) {
        window.history.replaceState({}, "", window.location.pathname);
      }
      return (
        <div className={rootClassName}>
          <div className={shellClassName}>
            <ResetPasswordScreen
              token={token}
              onBack={() => app.setActiveView("home")}
              onResetPassword={app.resetPassword}
            />
          </div>
        </div>
      );
    }
    return (
      <div className={rootClassName}>
        <div className={shellClassName}>
          <LoginScreen
            error={app.loginError}
            loading={app.loadState === "loading"}
            onLogin={app.login}
            onForgotPassword={() => app.setActiveView("forgot-password")}
          />
        </div>
      </div>
    );
  }

  // ── Forced password change gate ───────────────────────────────────────────
  // New employees get a default password from the employer. Until they set a
  // personal one, we render ONLY this screen — no AppShell, no tab bar, no
  // navigation to other views. "Back" logs them out; they cannot bypass it.
  if (app.mustChangePassword) {
    return (
      <div className={rootClassName}>
        <div className={shellClassName}>
          <ChangePasswordScreen
            loading={app.changingPassword}
            error={app.changePasswordError}
            onSubmit={app.changePassword}
            onClearError={() => app.setChangePasswordError("")}
            onBack={app.logout}
            forced
          />
        </div>
      </div>
    );
  }

  if (app.loadState === "error") {
    return (
      <div className={rootClassName}>
        <div className={shellClassName}>
          <div className="boot-screen" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: "0 32px", textAlign: "center" }}>
            <div style={{ fontSize: 36 }}>⚠️</div>
            <p style={{ fontSize: 15, color: "#1A1D2E", fontWeight: 500, margin: 0 }}>Something went wrong</p>
            <p style={{ fontSize: 13, color: "#767B9C", margin: 0 }}>We couldn't load your account. Please check your connection and try again.</p>
            <button
              onClick={() => app.loadEmployee(true)}
              style={{
                marginTop: 8,
                padding: "10px 24px",
                borderRadius: 12,
                background: "#315EFF",
                color: "#fff",
                fontSize: 13,
                fontWeight: 500,
                border: "none",
                cursor: "pointer",
              }}
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (app.loadState === "idle" || app.loadState === "loading") {
    return (
      <div className={rootClassName}>
        <div className={shellClassName}>
          <div className="boot-screen" aria-label="Loading MobPae">
            <DashboardSkeleton />
          </div>
        </div>
      </div>
    );
  }

  const navigate = (view: View) => {
    if (view === "notifications") notifBackRef.current = app.activeView as View;
    if (view === "legal") legalBackRef.current = app.activeView as View;
    if (app.activeView === "advance" && (view === "onboarding-kyc" || view === "onboarding-bank")) {
      onboardingBackRef.current = "advance";
    }
    if (app.activeView === "onboarding-kyc" && view === "onboarding-bank") {
      onboardingBackRef.current = "onboarding-kyc";
    }
    if (app.activeView === "onboarding-bank" && view === "onboarding-kyc") {
      onboardingBackRef.current = "onboarding-bank";
    }
    app.setActiveView(view);
  };

  const handleShellBack = () => {
    if (app.activeView === "onboarding-kyc") {
      return app.setActiveView(onboardingBackRef.current === "onboarding-bank" ? "onboarding-bank" : "advance");
    }
    if (app.activeView === "onboarding-bank") {
      return app.setActiveView(onboardingBackRef.current === "onboarding-kyc" ? "onboarding-kyc" : "advance");
    }
    if (app.activeView === "onboarding-done") return app.setActiveView("advance");
    if (app.activeView === "legal") return app.setActiveView(legalBackRef.current);
    if (app.activeView === "help") return app.setActiveView("profile");
    if (app.activeView === "change-password") return app.setActiveView("profile");
    if (app.activeView === "profile-kyc") return app.setActiveView("profile");
    if (app.activeView === "profile-bank") {
      return app.editingBank ? app.cancelBankEdit() : app.setActiveView("profile");
    }
    return app.setActiveView("home");
  };

  return (
    <AppShell
      activeView={app.activeView}
      profile={app.appState.profile}
      unreadCount={app.appState.rawNotifications.filter((n) => !n.isRead).length}
      refreshing={app.refreshing}
      onRefresh={app.refresh}
      onNavigate={navigate}
      onBack={handleShellBack}
      uploadProfilePhoto={app.uploadProfilePhoto}
    >

      {/* ── Onboarding flow ─────────────────────────────────── */}
      {app.activeView === "onboarding-kyc" && (
        <OnboardingKycScreen
          documents={app.appState.documents}
          uploadingKycType={app.uploadingKycType}
          onUpload={app.uploadKycDocument}
          onContinue={navigate}
          bankConnected={app.bankSubmitted}
          step={3}
          totalSteps={4}
        />
      )}

      {app.activeView === "onboarding-bank" && (
        <OnboardingBankScreen
          bankForm={app.bankForm}
          savingBank={app.savingBank}
          onBankFormChange={(field, value) =>
            app.setBankForm((prev) => ({ ...prev, [field]: value }))
          }
          onSaveBank={app.saveBankAccount}
          onContinue={navigate}
          kycSubmitted={app.kycSubmitted}
        />
      )}

      {app.activeView === "onboarding-done" && (
        <OnboardingDoneScreen
          name={app.appState.profile.name}
          kycSubmitted={app.kycSubmitted}
          kycVerified={app.kycComplete}
          bankConnected={app.bankSubmitted}
          onExplore={() => app.setActiveView("home")}
        />
      )}

      {/* ── Main app ─────────────────────────────────────────── */}
      {app.activeView === "home" && (
        <DashboardScreen
          appState={app.appState}
          notice={app.notice}
          onNavigate={navigate}
          setupBlocker={
            !app.appState.profile.accountActive
              ? "Employer approval is pending."
              : !app.kycComplete
              ? (app.kycSubmitted ? "KYC submitted. Pending admin verification." : "Complete KYC verification.")
              : !app.bankComplete
              ? (!app.appState.bankAccount ? "Add your bank account." : "Bank account pending verification.")
              : ""
          }
          onSetupAction={
            !app.appState.profile.accountActive
              ? undefined
              : !app.kycComplete && !app.kycSubmitted
              ? () => navigate("onboarding-kyc")
              : !app.appState.bankAccount || (!app.bankComplete && app.kycComplete)
              ? () => navigate("onboarding-bank")
              : undefined
          }
        />
      )}

      {app.activeView === "advance" && (
        <AdvanceScreen
          amount={app.advanceAmount}
          eligible={app.eligibleForAdvance}
          limit={app.advanceLimit}
          nextBlocker={app.nextBlocker}
          preview={app.preview}
          previewLoading={app.previewLoading}
          currentRequest={app.activeRequest}
          submitting={app.submittingAdvance}
          salaryInHand={app.appState.dashboard?.salaryInHand}
          payrollDay={app.appState.dashboard?.payrollDay}
          kycComplete={app.kycComplete}
          kycSubmitted={app.kycSubmitted}
          bankComplete={app.bankComplete}
          bankSubmitted={app.bankSubmitted}
          platformFeeConfig={app.appState.platformFeeConfig ?? app.eligibility?.platformFee}
          platformFeeRequiredAfterEmployerApproval={app.eligibility?.platformFeeRequiredAfterEmployerApproval}
          payingPlatformFee={app.payingPlatformFee}
          onPayPlatformFee={app.payPlatformFee}
          interestFreeThreshold={app.eligibility?.limits.interestFreeThreshold}
          bankAccount={app.appState.bankAccount}
          kycDocumentCount={app.appState.documents.filter((document) => document.status !== "Not Uploaded").length}
          kycDocuments={app.appState.documents}
          onAmountChange={app.setAdvanceAmount}
          onSubmit={app.submitSalaryAdvance}
          onCancelRequest={app.cancelAdvanceRequest}
          cancellingRequest={app.cancellingAdvance}
          blockerActionLabel={advanceBlockerActionLabel}
          onResolveBlocker={resolveAdvanceBlocker}
          onNavigate={navigate}
        />
      )}

      {app.activeView === "repayments" && (
        <RepaymentScheduleScreen
          requests={app.appState.requests}
          bankAccount={app.appState.bankAccount}
          onNavigate={navigate}
        />
      )}

      {app.activeView === "activity" && (
        <ActivityScreen
          requests={app.appState.requests}
          bankAccount={app.appState.bankAccount}
        />
      )}

      {app.activeView === "change-password" && (
        <ChangePasswordScreen
          loading={app.changingPassword}
          error={app.changePasswordError}
          onSubmit={app.changePassword}
          onClearError={() => app.setChangePasswordError("")}
          onBack={() => app.setActiveView("profile")}
          onNotifications={() => navigate("notifications")}
          onRefresh={app.refresh}
          refreshing={app.refreshing}
        />
      )}

      {app.activeView === "notifications" && (
        <NotificationsScreen
          notifications={app.appState.rawNotifications}
          onBack={() => app.setActiveView(notifBackRef.current)}
          onMarkRead={app.markNotificationRead}
          onMarkAllRead={app.markAllNotificationsRead}
        />
      )}

      {app.activeView === "help" && (
        <HelpScreen
          onBack={() => app.setActiveView("profile")}
        />
      )}

      {app.activeView === "legal" && (
        <LegalScreen
          onBack={() => app.setActiveView(legalBackRef.current)}
        />
      )}

      {(app.activeView === "profile" ||
        app.activeView === "profile-kyc" ||
        app.activeView === "profile-bank") && (
        <ProfileScreen
          appState={app.appState}
          onLogout={app.logout}
          onNavigate={navigate}
          uploadKycDocument={app.uploadKycDocument}
          uploadingKycType={app.uploadingKycType}
          uploadProfilePhoto={app.uploadProfilePhoto}
          uploadingPhoto={app.uploadingPhoto}
          bankForm={app.bankForm}
          editingBank={app.editingBank}
          savingBank={app.savingBank}
          onStartBankEdit={app.startBankEdit}
          onCancelBankEdit={app.cancelBankEdit}
          onSaveBank={app.saveBankAccount}
          onUpdateUpiId={app.updateUpiId}
          onRefresh={app.refresh}
          refreshing={app.refreshing}
          onBankFormChange={(field, value) =>
            app.setBankForm((prev) => ({ ...prev, [field]: value }))
          }
          initialSection={
            app.activeView === "profile-kyc"        ? "kyc" :
            app.activeView === "profile-bank"       ? "bank" :
            undefined
          }
        />
      )}
    </AppShell>
  );
}
