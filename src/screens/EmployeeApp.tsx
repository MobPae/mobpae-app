import { AppShell } from "../components/layout/AppShell";
import { ActivityScreen } from "./ActivityScreen";
import { AdvanceScreen } from "./AdvanceScreen";
import { DashboardScreen } from "./DashboardScreen";
import { LoginScreen } from "./LoginScreen";
import { MembershipScreen } from "./MembershipScreen";
import { ProfileScreen } from "./ProfileScreen";
import { useEmployeeApp } from "../hooks/useEmployeeApp";

export function EmployeeApp() {
  const app = useEmployeeApp();

  if (!app.isLoggedIn) {
    return (
      <LoginScreen
        error={app.loginError}
        loading={app.loadState === "loading"}
        onLogin={app.login}
      />
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
    <AppShell
      activeView={app.activeView}
      profile={app.appState.profile}
      onNavigate={app.setActiveView}
    >
      {app.activeView === "home" && (
        <DashboardScreen
          appState={app.appState}
          eligibleForAdvance={app.eligibleForAdvance}
          nextBlocker={app.nextBlocker}
          notice={app.notice}
          onNavigate={app.setActiveView}
        />
      )}

      {app.activeView === "advance" && (
        <AdvanceScreen
          amount={app.advanceAmount}
          eligible={app.eligibleForAdvance}
          limit={app.appState.profile.salaryLimit}
          nextBlocker={app.nextBlocker}
          preview={app.preview}
          previewLoading={app.previewLoading}
          currentRequest={app.appState.requests[0]}
          submitting={app.submittingAdvance}
          onAmountChange={app.setAdvanceAmount}
          onSubmit={app.submitSalaryAdvance}
        />
      )}

      {app.activeView === "activity" && (
        <ActivityScreen requests={app.appState.requests} />
      )}

      {app.activeView === "member" && (
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

      {app.activeView === "profile" && (
        <ProfileScreen
          appState={app.appState}
          onLogout={app.logout}
          onNavigate={app.setActiveView}
          uploadKycDocument={app.uploadKycDocument}
          uploadingKycType={app.uploadingKycType}
          bankForm={app.bankForm}
          editingBank={app.editingBank}
          savingBank={app.savingBank}
          onStartBankEdit={app.startBankEdit}
          onCancelBankEdit={app.cancelBankEdit}
          onSaveBank={app.saveBankAccount}
          onBankFormChange={(field, value) =>
            app.setBankForm((prev) => ({ ...prev, [field]: value }))
          }
        />
      )}
    </AppShell>
  );
}
