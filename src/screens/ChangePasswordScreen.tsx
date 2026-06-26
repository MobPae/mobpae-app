import { useMemo, useState } from "react";
import { Check, Eye, EyeOff, KeyRound, Lock, X } from "lucide-react";
import { SubPageHeader } from "../components/layout/SubPageHeader";

type Props = {
  loading: boolean;
  error: string;
  onSubmit: (currentPassword: string, newPassword: string) => Promise<void>;
  onClearError: () => void;
  onBack: () => void;
};

type Rule = {
  label: string;
  passed: boolean;
};

export function ChangePasswordScreen({ loading, error, onSubmit, onClearError, onBack }: Props) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCur, setShowCur] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [showCon, setShowCon] = useState(false);
  const [localErr, setLocalErr] = useState("");

  const rules = useMemo<Rule[]>(
    () => [
      { label: "At least 8 characters", passed: next.length >= 8 },
      { label: "One uppercase letter", passed: /[A-Z]/.test(next) },
      { label: "One lowercase letter", passed: /[a-z]/.test(next) },
      { label: "One number", passed: /\d/.test(next) },
      { label: "One special character", passed: /[^A-Za-z0-9]/.test(next) },
    ],
    [next],
  );

  const rulesPassed = rules.every((rule) => rule.passed);
  const matches = Boolean(confirm) && next === confirm;
  const canSubmit = Boolean(current) && rulesPassed && matches && !loading;
  const displayError = localErr || error;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalErr("");
    onClearError();

    if (!rulesPassed) {
      setLocalErr("Please complete all password rules before continuing.");
      return;
    }

    if (!matches) {
      setLocalErr("New password and confirm password do not match.");
      return;
    }

    try {
      await onSubmit(current, next);
    } catch {
      // Error state is owned by the app hook.
    }
  };

  return (
    <div className="change-password-screen">
      <SubPageHeader title="Change Password" onBack={onBack} />
      <div className="change-password-hero">
        <div className="change-password-icon">
          <KeyRound size={23} />
        </div>
        <div>
          <span>Account security</span>
          <h2>Change password</h2>
          <p>Use a strong password. You will sign in again after this change.</p>
        </div>
      </div>

      <form className="change-password-card" onSubmit={handleSubmit}>
          <PasswordField
            label="Current password"
            value={current}
            onChange={(value) => {
              setCurrent(value);
              if (displayError) {
                setLocalErr("");
                onClearError();
              }
            }}
            show={showCur}
            onToggle={() => setShowCur((value) => !value)}
            placeholder="Enter current password"
            autoComplete="current-password"
          />

          <PasswordField
            label="New password"
            value={next}
            onChange={(value) => {
              setNext(value);
              if (displayError) {
                setLocalErr("");
                onClearError();
              }
            }}
            show={showNext}
            onToggle={() => setShowNext((value) => !value)}
            placeholder="Create a strong password"
            autoComplete="new-password"
          />

          <div className="password-rules">
            {rules.map((rule) => (
              <div className={rule.passed ? "passed" : ""} key={rule.label}>
                {rule.passed ? <Check size={12} /> : <X size={12} />}
                <span>{rule.label}</span>
              </div>
            ))}
          </div>

          <PasswordField
            label="Confirm new password"
            value={confirm}
            onChange={(value) => {
              setConfirm(value);
              if (displayError) {
                setLocalErr("");
                onClearError();
              }
            }}
            show={showCon}
            onToggle={() => setShowCon((value) => !value)}
            placeholder="Re-enter new password"
            autoComplete="new-password"
          />

          {confirm && (
            <div className={`password-match-note ${matches ? "passed" : ""}`}>
              {matches ? <Check size={12} /> : <X size={12} />}
              <span>{matches ? "Passwords match" : "Passwords do not match"}</span>
            </div>
          )}

          {displayError && (
            <div className="change-password-error">
              {Array.isArray(displayError) ? displayError.join(", ") : displayError}
            </div>
          )}

          <button type="submit" className="change-password-submit" disabled={!canSubmit}>
            {loading ? <span className="cta-spinner" /> : "Update password"}
          </button>
        </form>
    </div>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  show,
  onToggle,
  placeholder,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
  placeholder: string;
  autoComplete: string;
}) {
  return (
    <div className="change-password-field">
      <label>{label}</label>
      <div>
        <Lock size={14} />
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required
        />
        <button type="button" onClick={onToggle} aria-label={show ? "Hide password" : "Show password"}>
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
    </div>
  );
}
