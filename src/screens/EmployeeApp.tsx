import { AppShell } from "../components/layout/AppShell";
import { ActivityScreen } from "./ActivityScreen";
import { AdvanceScreen } from "./AdvanceScreen";
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
import { useEmployeeApp } from "../hooks/useEmployeeApp";
import { AppToast } from "../components/ui/AppToast";

export function EmployeeApp() {
  const app = useEmployeeApp();

  const resolveAdvanceBlocker = () => {
    if (app.activeRequest) return app.setActiveView("activity");
    if (!app.appState.profile.accountActive) return app.setActiveView("home");
    if (!app.kycComplete) return app.setActiveView("profile-kyc");
    if (!app.appState.bankAccount || !app.bankComplete) return app.setActiveView("profile-bank");
    if (!app.appState.membershipActive) return app.setActiveView("profile-membership");
  };

  const advanceBlockerActionLabel = app.activeRequest
    ? "Track request"
    : !app.kycComplete
      ? "Complete KYC"
      : !app.appState.bankAccount || !app.bankComplete
        ? "View bank status"
        : !app.appState.membershipActive
          ? "Activate membership"
          : "View details";

  if (!app.isLoggedIn) {
    if (app.activeView === "forgot-password") {
      return (
        <div className="app-root">
          <div className="phone-shell">
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
        <div className="app-root">
          <div className="phone-shell">
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
      <div className="app-root">
        <div className="phone-shell">
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

  if (app.loadState === "idle" || app.loadState === "loading") {
    return (
      <div className="app-root">
        <div className="phone-shell">
          <div className="splash-screen">
            <div className="splash-mark">M</div>
            <div className="splash-dots">
              <span /><span /><span />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
    <AppShell
      activeView={app.activeView}
      profile={app.appState.profile}
      onNavigate={app.setActiveView}
    >
      {/* ── Onboarding flow ─────────────────────────────────── */}
      {app.activeView === "onboarding-kyc" && (
        <OnboardingKycScreen
          documents={app.appState.documents}
          uploadingKycType={app.uploadingKycType}
          onUpload={app.uploadKycDocument}
          onContinue={app.setActiveView}
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
          onContinue={app.setActiveView}
        />
      )}

      {app.activeView === "onboarding-done" && (
        <OnboardingDoneScreen
          name={app.appState.profile.name}
          kycSubmitted={app.appState.documents.some((d) => d.status !== "Not Uploaded")}
          bankConnected={Boolean(app.appState.bankAccount)}
          onExplore={() => app.setActiveView("home")}
        />
      )}

      {/* ── Main app ─────────────────────────────────────────── */}
      {app.activeView === "home" && (
        <DashboardScreen
          appState={app.appState}
          eligibleForAdvance={app.eligibleForAdvance}
          nextBlocker={app.nextBlocker}
          notice={app.notice}
          refreshing={app.refreshing}
          onRefresh={app.refresh}
          onNavigate={app.setActiveView}
        />
      )}

      {/* Advance tab: show membership activation if not yet a member */}
      {app.activeView === "advance" && !app.appState.membershipActive && (
        <MembershipScreen
          appState={app.appState}
          activatingMembership={app.activatingMembership}
          couponValidation={app.couponValidation}
          couponError={app.couponError}
          validatingCoupon={app.validatingCoupon}
          onActivateMembership={app.activateMembership}
          onValidateCoupon={app.validateCoupon}
          onClearCoupon={app.clearCoupon}
          onNavigate={app.setActiveView}
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
          onNavigate={app.setActiveView}
        />
      )}

      {app.activeView === "advance" && app.appState.membershipActive && (
        <AdvanceScreen
          amount={app.advanceAmount}
          eligible={app.eligibleForAdvance}
          limit={app.appState.profile.salaryLimit}
          nextBlocker={app.nextBlocker}
          preview={app.preview}
          previewLoading={app.previewLoading}
          currentRequest={app.activeRequest}
          submitting={app.submittingAdvance}
          onAmountChange={app.setAdvanceAmount}
          onSubmit={app.submitSalaryAdvance}
          blockerActionLabel={advanceBlockerActionLabel}
          onResolveBlocker={resolveAdvanceBlocker}
        />
      )}

      {app.activeView === "activity" && (
        <ActivityScreen requests={app.appState.requests} />
      )}

      {app.activeView === "change-password" && (
        <ChangePasswordScreen
          loading={app.changingPassword}
          error={app.changePasswordError}
          onSubmit={app.changePassword}
          onClearError={() => app.setChangePasswordError("")}
        />
      )}

      {app.activeView === "notifications" && (
        <NotificationsScreen
          notifications={app.appState.rawNotifications}
          onBack={() => app.setActiveView("home")}
          onMarkRead={app.markNotificationRead}
          onMarkAllRead={app.markAllNotificationsRead}
        />
      )}

      {(app.activeView === "profile" ||
        app.activeView === "profile-kyc" ||
        app.activeView === "profile-bank") && (
        <ProfileScreen
          appState={app.appState}
          onLogout={app.logout}
          onNavigate={app.setActiveView}
          uploadKycDocument={app.uploadKycDocument}
          uploadingKycType={app.uploadingKycType}
          uploadProfilePhoto={app.uploadProfilePhoto}
          uploadSelfie={app.uploadSelfie}
          uploadingPhoto={app.uploadingPhoto}
          uploadingSelfie={app.uploadingSelfie}
          bankForm={app.bankForm}
          editingBank={app.editingBank}
          savingBank={app.savingBank}
          onStartBankEdit={app.startBankEdit}
          onCancelBankEdit={app.cancelBankEdit}
          onSaveBank={app.saveBankAccount}
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
    <AppToast message={app.notice} onDismiss={app.clearNotice} />
    </>
  );
}
