import { useMemo, useState, type CSSProperties } from "react";
import { Bell, Check, ChevronLeft, Eye, EyeOff, Lock, RefreshCw, ShieldCheck } from "lucide-react";
import type { Theme } from "../hooks/useTheme";

type Props = {
  loading: boolean;
  error: string;
  onSubmit: (currentPassword: string, newPassword: string) => Promise<void>;
  onClearError: () => void;
  onBack: () => void;
  onNotifications?: () => void;
  onRefresh?: () => void;
  refreshing?: boolean;
  theme?: Theme;
};

type Rule = {
  label: string;
  passed: boolean;
};

const SURFACE = "var(--cp-surface, #0C0C0E)";
const PANEL = "var(--cp-panel, #141418)";
const PANEL_SOFT = "var(--cp-panel-soft, #17171B)";
const BORDER = "var(--cp-border, #29292F)";
const TEXT = "var(--cp-text, #F2F0EA)";
const MUTED = "var(--cp-muted, #8A8892)";
const DIM = "var(--cp-dim, #5C5C64)";
const CREAM = "var(--cp-cream, #F4F1E8)";
const GREEN = "var(--cp-green, #20A46A)";
const WARM = "var(--cp-warm, #B4591F)";

function changePasswordVars(theme: Theme): CSSProperties {
  if (theme === "light") {
    return {
      "--cp-surface": "#FFFFFF",
      "--cp-panel": "#FFFFFF",
      "--cp-panel-soft": "#F7F5FC",
      "--cp-border": "#E9E6F1",
      "--cp-text": "#17151F",
      "--cp-muted": "#6B6878",
      "--cp-dim": "#9A97A8",
      "--cp-cream": "#5B3CE3",
      "--cp-green": "#1F9E67",
      "--cp-warm": "#B4591F",
      "--cp-glow": "rgba(91,60,227,0.055)",
      "--cp-track": "#EEEBF6",
    } as CSSProperties;
  }

  return {
    "--cp-surface": "#0C0C0E",
    "--cp-panel": "#141418",
    "--cp-panel-soft": "#17171B",
    "--cp-border": "#29292F",
    "--cp-text": "#F2F0EA",
    "--cp-muted": "#8A8892",
    "--cp-dim": "#5C5C64",
    "--cp-cream": "#F4F1E8",
    "--cp-green": "#20A46A",
    "--cp-warm": "#B4591F",
    "--cp-glow": "rgba(242,240,234,0.055)",
    "--cp-track": "#28282D",
  } as CSSProperties;
}

export function ChangePasswordScreen({
  loading,
  error,
  onSubmit,
  onClearError,
  onBack,
  onNotifications,
  onRefresh,
  refreshing,
  theme = "dark",
}: Props) {
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
      { label: "Uppercase, lowercase and number", passed: /[A-Z]/.test(next) && /[a-z]/.test(next) && /\d/.test(next) },
      { label: "One special character", passed: /[^A-Za-z0-9]/.test(next) },
    ],
    [next],
  );

  const passedCount = rules.filter((rule) => rule.passed).length;
  const rulesPassed = rules.every((rule) => rule.passed);
  const matches = Boolean(confirm) && next === confirm;
  const canSubmit = Boolean(current) && rulesPassed && matches && !loading;
  const displayError = localErr || error;
  const strengthLabel = passedCount === 3 ? "Strong" : passedCount === 2 ? "Good" : passedCount === 1 ? "Weak" : "Start";
  const strengthColor = passedCount === 3 ? GREEN : passedCount >= 1 ? WARM : DIM;

  const clearErrors = () => {
    if (displayError) {
      setLocalErr("");
      onClearError();
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLocalErr("");
    onClearError();

    if (!rulesPassed) {
      setLocalErr("Please complete the password rules before continuing.");
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
    <div
      style={{
        ...changePasswordVars(theme),
        minHeight: "100%",
        flex: 1,
        background:
          "radial-gradient(circle at 50% 4%, var(--cp-glow), transparent 40%), var(--cp-surface)",
        color: TEXT,
        padding: "max(24px, env(safe-area-inset-top, 0px)) 22px 30px",
        fontFamily: "'Space Grotesk', sans-serif",
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          style={{
            width: 42,
            height: 42,
            borderRadius: "50%",
            border: `1px solid ${BORDER}`,
            background: SURFACE,
            color: TEXT,
            display: "grid",
            placeItems: "center",
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          <ChevronLeft size={22} strokeWidth={2.1} />
        </button>
        <div
          style={{
            color: MUTED,
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.32em",
            textTransform: "uppercase",
          }}
        >
          Change password
        </div>
        <div style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 10 }}>
          {onNotifications && (
            <button
              type="button"
              onClick={onNotifications}
              aria-label="Notifications"
              style={{
                width: 42,
                height: 42,
                borderRadius: "50%",
                border: `1px solid ${BORDER}`,
                background: SURFACE,
                color: TEXT,
                display: "grid",
                placeItems: "center",
                cursor: "pointer",
              }}
            >
              <Bell size={18} strokeWidth={2.05} />
            </button>
          )}
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={refreshing}
              aria-label="Refresh"
              style={{
                width: 42,
                height: 42,
                borderRadius: "50%",
                border: `1px solid ${BORDER}`,
                background: SURFACE,
                color: TEXT,
                display: "grid",
                placeItems: "center",
                cursor: refreshing ? "wait" : "pointer",
                opacity: refreshing ? 0.7 : 1,
              }}
            >
              <RefreshCw size={18} strokeWidth={2.05} className={refreshing ? "spin" : ""} />
            </button>
          )}
        </div>
      </header>

      <form onSubmit={handleSubmit}>
        <div style={{ display: "grid", gap: 18, marginBottom: 28 }}>
          <div>
            <h1
              style={{
                margin: 0,
                color: TEXT,
                fontSize: 24,
                lineHeight: 1.12,
                fontWeight: 700,
                letterSpacing: "-0.035em",
              }}
            >
              Update your password
            </h1>
            <p
              style={{
                margin: "10px 0 0",
                color: MUTED,
                fontSize: 14,
                lineHeight: 1.45,
                fontWeight: 500,
              }}
            >
              Choose a strong password you do not use anywhere else.
            </p>
          </div>
        </div>

        <PasswordField
          label="Current password"
          value={current}
          onChange={(value) => {
            setCurrent(value);
            clearErrors();
          }}
          show={showCur}
          onToggle={() => setShowCur((value) => !value)}
          autoComplete="current-password"
        />

        <PasswordField
          label="New password"
          value={next}
          onChange={(value) => {
            setNext(value);
            clearErrors();
          }}
          show={showNext}
          onToggle={() => setShowNext((value) => !value)}
          autoComplete="new-password"
        />

        <PasswordField
          label="Confirm new password"
          value={confirm}
          onChange={(value) => {
            setConfirm(value);
            clearErrors();
          }}
          show={showCon}
          onToggle={() => setShowCon((value) => !value)}
          autoComplete="new-password"
        />

        <div
          style={{
            marginTop: 2,
            border: `1px solid ${BORDER}`,
            borderRadius: 16,
            background: PANEL,
            padding: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <span style={{ color: MUTED, fontSize: 13, fontWeight: 600 }}>Password strength</span>
            <span style={{ color: strengthColor, fontSize: 13, fontWeight: 700 }}>{strengthLabel}</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, marginTop: 12 }}>
            {[0, 1, 2, 3].map((index) => (
              <span
                key={index}
                style={{
                  height: 5,
                  borderRadius: 999,
                  background: index < Math.max(1, passedCount + (rulesPassed ? 1 : 0)) ? strengthColor : "var(--cp-track)",
                }}
              />
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gap: 10, margin: "18px 0 18px" }}>
          {rules.map((rule) => (
            <div
              key={rule.label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                color: rule.passed ? GREEN : DIM,
                fontSize: 13,
                fontWeight: 550,
              }}
            >
              <Check size={14} strokeWidth={2} />
              <span>{rule.label}</span>
            </div>
          ))}
          {confirm && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                color: matches ? GREEN : WARM,
                fontSize: 13,
                fontWeight: 550,
              }}
            >
              <Check size={14} strokeWidth={2} />
              <span>{matches ? "Passwords match" : "Passwords do not match"}</span>
            </div>
          )}
        </div>

        {displayError && (
          <div
            style={{
              marginBottom: 16,
              border: "1px solid rgba(180,89,31,0.4)",
              background: "rgba(180,89,31,0.12)",
              color: "#D9905A",
              borderRadius: 14,
              padding: "12px 14px",
              fontSize: 13,
              lineHeight: 1.35,
              fontWeight: 600,
            }}
          >
            {Array.isArray(displayError) ? displayError.join(", ") : displayError}
          </div>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          style={{
            width: "100%",
            height: 64,
            border: 0,
            borderRadius: 18,
            background: canSubmit ? CREAM : "var(--cp-panel-soft)",
            color: canSubmit
              ? theme === "light" ? "#FFFFFF" : SURFACE
              : MUTED,
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 16,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 8px 0 26px",
            cursor: canSubmit ? "pointer" : "not-allowed",
            boxShadow: canSubmit ? "0 16px 42px rgba(242,240,234,0.12)" : "none",
          }}
        >
          <span>{loading ? "Updating..." : "Update password"}</span>
          <span
            style={{
              width: 50,
              height: 50,
              borderRadius: 14,
              background: theme === "light" ? "#FFFFFF" : SURFACE,
              color: theme === "light" ? "#5B3CE3" : CREAM,
              display: "grid",
              placeItems: "center",
            }}
          >
            {loading ? <span className="cta-spinner" /> : <Check size={24} strokeWidth={2.4} />}
          </span>
        </button>

        <div
          style={{
            marginTop: 22,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            color: DIM,
            fontSize: 12,
            fontWeight: 500,
            textAlign: "center",
          }}
        >
          <ShieldCheck size={14} strokeWidth={1.8} />
          <span>All active sessions will be refreshed after this change.</span>
        </div>
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
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  show: boolean;
  onToggle: () => void;
  autoComplete: string;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <label style={{ display: "block", marginBottom: 18 }}>
      <span
        style={{
          display: "block",
          marginBottom: 10,
          color: MUTED,
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: "0.28em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>
      <div
        style={{
          minHeight: 60,
          border: `1px solid ${focused ? "#3C3C42" : BORDER}`,
          borderRadius: 16,
          background: PANEL_SOFT,
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "0 16px",
        }}
      >
        <Lock size={17} strokeWidth={1.9} color={focused ? TEXT : MUTED} />
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          required
          style={{
            flex: 1,
            minWidth: 0,
            border: 0,
            outline: 0,
            color: TEXT,
            background: "transparent",
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 15,
            fontWeight: 650,
            letterSpacing: "0.08em",
          }}
        />
        <button
          type="button"
          onClick={onToggle}
          aria-label={show ? "Hide password" : "Show password"}
          style={{
            width: 32,
            height: 32,
            border: 0,
            borderRadius: "50%",
            background: "transparent",
            color: MUTED,
            display: "grid",
            placeItems: "center",
            cursor: "pointer",
          }}
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </label>
  );
}
