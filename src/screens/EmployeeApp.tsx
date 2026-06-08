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

  return (
    <AppShell activeView={app.activeView} profile={app.appState.profile} onLogout={app.logout} onNavigate={app.setActiveView}>
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
        <KycScreen documents={app.appState.documents} onNavigate={app.setActiveView} onUpload={app.uploadKycDocument} uploadingType={app.uploadingKycType} />
      ) : null}
      {app.activeView === "advance" ? (
        <AdvanceScreen
          amount={app.advanceAmount}
          eligible={app.eligibleForAdvance}
          limit={app.appState.profile.salaryLimit}
          nextBlocker={app.nextBlocker}
          preview={app.preview}
          previewLoading={app.previewLoading}
          onAmountChange={app.setAdvanceAmount}
        />
      ) : null}
      {app.activeView === "tracking" ? <TrackingScreen requests={app.appState.requests} /> : null}
      {app.activeView === "profile" ? (
        <ProfileScreen
          appState={app.appState}
          bankForm={app.bankForm}
          membershipFee={app.membershipFee}
          savingBank={app.savingBank}
          onActivateMembership={app.activateMembership}
          onBankFormChange={app.setBankForm}
          onSaveBank={app.saveBankAccount}
        />
      ) : null}
    </AppShell>
  );
}
