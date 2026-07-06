import { useRef } from "react";
import type { View } from "../types/app";
import { AppShell } from "../components/layout/AppShell";
import { ActivityScreen } from "./ActivityScreen";
import { AdvanceScreen } from "./AdvanceScreen";
import { RepaymentScheduleScreen } from "./RepaymentScheduleScreen";
import { DashboardScreen } from "./DashboardScreen";
import { LoginScreen } from "./LoginScreen";
import { ChangePasswordScreen } from "./ChangePasswordScreen";
import { MembershipScreen } from "./MembershipScreen";
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
import { useTheme } from "../hooks/useTheme";

export function EmployeeApp() {
  const app = useEmployeeApp();
  const theme = useTheme();
  const notifBackRef = useRef<View>("home");
  const legalBackRef = useRef<View>("profile");
  const onboardingBackRef = useRef<View>("advance");
  const rootClassName = `app-root app-root--${theme.theme}`;
  const shellClassName = `phone-shell phone-shell--${theme.theme}`;

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
              theme={theme.theme}
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
              theme={theme.theme}
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
            theme={theme.theme}
          />
        </div>
      </div>
    );
  }

  if (app.loadState === "idle" || app.loadState === "loading") {
    return (
      <div className={rootClassName}>
        <div className={shellClassName}>
          <div className="boot-screen">
            <div className="boot-loader" aria-label="Loading MobPae">
              <span /><span /><span />
            </div>
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
      theme={theme.theme}
    >

      {/* ── Onboarding flow ─────────────────────────────────── */}
      {app.activeView === "onboarding-kyc" && (
        <OnboardingKycScreen
          documents={app.appState.documents}
          uploadingKycType={app.uploadingKycType}
          onUpload={app.uploadKycDocument}
          onContinue={navigate}
          bankConnected={app.bankSubmitted}
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
          membershipActive={app.appState.membershipActive}
          membershipSubmitted={app.membershipSubmitted}
          onExplore={() => app.setActiveView("home")}
        />
      )}

      {/* ── Main app ─────────────────────────────────────────── */}
      {app.activeView === "home" && (
        <DashboardScreen
          appState={app.appState}
          notice={app.notice}
          onNavigate={navigate}
          theme={theme.theme}
        />
      )}

      {app.activeView === "profile-membership" && (
        <MembershipScreen
          appState={app.appState}
          activatingMembership={app.activatingMembership}
          couponValidation={app.couponValidation}
          couponError={app.couponError}
          validatingCoupon={app.validatingCoupon}
          onActivateMembership={app.activateMembership}
          onValidateCoupon={app.validateCoupon}
          onClearCoupon={app.clearCoupon}
          onNavigate={navigate}
          onRefresh={app.refresh}
          refreshing={app.refreshing}
          theme={theme.theme}
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
          membershipConfig={app.appState.membershipConfig}
          membershipActive={app.appState.membershipActive}
          membershipRequiredAfterEmployerApproval={app.eligibility?.membershipRequiredAfterEmployerApproval}
          bankAccount={app.appState.bankAccount}
          kycDocumentCount={app.appState.documents.filter((document) => document.status !== "Not Uploaded").length}
          onAmountChange={app.setAdvanceAmount}
          onSubmit={app.submitSalaryAdvance}
          onCancelRequest={app.cancelAdvanceRequest}
          cancellingRequest={app.cancellingAdvance}
          blockerActionLabel={advanceBlockerActionLabel}
          onResolveBlocker={resolveAdvanceBlocker}
          onNavigate={navigate}
          theme={theme.theme}
        />
      )}

      {app.activeView === "repayments" && (
        <RepaymentScheduleScreen
          requests={app.appState.requests}
          bankAccount={app.appState.bankAccount}
          onNavigate={navigate}
          theme={theme.theme}
        />
      )}

      {app.activeView === "activity" && (
        <ActivityScreen
          requests={app.appState.requests}
          bankAccount={app.appState.bankAccount}
          theme={theme.theme}
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
          theme={theme.theme}
        />
      )}

      {app.activeView === "notifications" && (
        <NotificationsScreen
          notifications={app.appState.rawNotifications}
          onBack={() => app.setActiveView(notifBackRef.current)}
          onMarkRead={app.markNotificationRead}
          onMarkAllRead={app.markAllNotificationsRead}
          theme={theme.theme}
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
          theme={theme.theme}
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
          theme={theme.theme}
          onThemeChange={theme.setTheme}
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
