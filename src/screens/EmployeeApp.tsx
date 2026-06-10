import { AppShell } from "../components/layout/AppShell";
import { AdvanceScreen } from "./AdvanceScreen";
import { DashboardScreen } from "./DashboardScreen";
import { KycScreen } from "./KycScreen";
import { LoginScreen } from "./LoginScreen";
import { ProfileScreen } from "./ProfileScreen";
import { TrackingScreen } from "./TrackingScreen";
import { useEmployeeApp } from "../hooks/useEmployeeApp";

export function EmployeeApp() {
  const app = useEmployeeApp();

  if (!app.isLoggedIn) {
    return <LoginScreen error={app.loginError} loading={app.loadState === "loading"} onLogin={app.login} />;
  }

  if (app.loadState === "idle" || app.loadState === "loading") {
    return (
      <main className="app-shell">
        <div className="phone-shell">
          <div className="employee-loading">
            <span />
            <strong>Loading your MobPae account</strong>
            <p>Syncing salary, requests, KYC, bank, and membership details.</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <AppShell activeView={app.activeView} profile={app.appState.profile} onNavigate={app.setActiveView}>
      {app.activeView === "dashboard" ? (
        <DashboardScreen
          appState={app.appState}
          eligibleForAdvance={app.eligibleForAdvance}
          nextBlocker={app.nextBlocker}
          notice={app.notice}
          onNavigate={app.setActiveView}
        />
      ) : null}
      {app.activeView === "kyc" ? (
        <KycScreen
          bankVerified={Boolean(app.appState.bankAccount?.verified)}
          documents={app.appState.documents}
          onNavigate={app.setActiveView}
          onUpload={app.uploadKycDocument}
          uploadingType={app.uploadingKycType}
        />
      ) : null}
      {app.activeView === "advance" ? (
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
      ) : null}
      {app.activeView === "tracking" ? <TrackingScreen requests={app.appState.requests} /> : null}
      {app.activeView === "profile" ? (
        <ProfileScreen
          appState={app.appState}
          bankForm={app.bankForm}
          editingBank={app.editingBank}
          membershipFee={app.membershipFee}
          notice={app.notice}
          savingBank={app.savingBank}
          couponCode={app.couponCode}
          applyingCoupon={app.applyingCoupon}
          activatingMembership={app.activatingMembership}
          onApplyCoupon={app.applyMembershipCoupon}
          onActivateMembership={app.activateMembership}
          onBankFormChange={app.setBankForm}
          onCancelBankEdit={app.cancelBankEdit}
          onCouponCodeChange={app.setCouponCode}
          onEditBank={app.startBankEdit}
          onSaveBank={app.saveBankAccount}
          onUpdateUpi={app.updateUpiId}
          onLogout={app.logout}
        />
      ) : null}
    </AppShell>
  );
}
