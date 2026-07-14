// ── ChangePasswordScreen.tsx ──────────────────────────────────────────────────
// Allows authenticated users to update their password.
// Tokens are applied via CSS custom properties on the root element
// so child components (PasswordField) can reference them without prop-drilling.

import { useMemo, useState, type CSSProperties } from "react";
import { Bell, Check, ChevronLeft, Eye, EyeOff, Lock, RefreshCw, ShieldCheck } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type Props = {
  loading: boolean;
  error: string;
  onSubmit: (currentPassword: string, newPassword: string) => Promise<void>;
  onClearError: () => void;
  onBack: () => void;
  onNotifications?: () => void;
  onRefresh?: () => void;
  refreshing?: boolean;
  // When true, the user MUST change their password before accessing the app.
  // The back button becomes "Log out" and optional header icons are hidden.
  forced?: boolean;
};

type Rule = { label: string; passed: boolean };

// ── CSS custom property references ────────────────────────────────────────────
// These strings resolve against the vars injected by changePasswordVars()
// on the root <div>. Fallbacks cover the rare case where vars aren't set.

const TEXT   = "var(--cp-text,   #17151F)";
const MUTED  = "var(--cp-muted,  #6B6878)";
const DIM    = "var(--cp-dim,    #9A97A8)";
const PANEL  = "var(--cp-panel,  #F8F8FA)";
const BORDER = "var(--cp-border, #E9E6F1)";
const GREEN  = "var(--cp-green,  #1F9E67)";
const WARN   = "var(--cp-warn,   #D97706)";
const TRACK  = "var(--cp-track,  #EEEBF6)";

// ── Tokens ────────────────────────────────────────────────────────────────────

function changePasswordVars(): CSSProperties {
  return {
    "--cp-surface": "#FFFFFF",
    "--cp-panel":   "#F8F8FA",
    "--cp-border":  "#E9E6F1",
    "--cp-text":    "#17151F",
    "--cp-muted":   "#6B6878",
    "--cp-dim":     "#9A97A8",
    "--cp-green":   "#1F9E67",
    "--cp-warn":    "#D97706",
    "--cp-track":   "#EEEBF6",
  } as CSSProperties;
}

// ── ChangePasswordScreen ───────────────────────────────────────────────────────

export function ChangePasswordScreen({
  loading,
  error,
  onSubmit,
  onClearError,
  onBack,
  onNotifications,
  onRefresh,
  refreshing,
  forced = false,
}: Props) {
  const [current, setCurrent] = useState("");
  const [next, setNext]       = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCur,  setShowCur]  = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [showCon,  setShowCon]  = useState(false);
  const [localErr, setLocalErr] = useState("");

  // ── Password strength rules ────────────────────────────────────────────────
  // Re-evaluated only when `next` changes.

  const rules = useMemo<Rule[]>(() => [
    { label: "At least 8 characters",          passed: next.length >= 8 },
    { label: "Uppercase, lowercase and number", passed: /[A-Z]/.test(next) && /[a-z]/.test(next) && /\d/.test(next) },
    { label: "One special character",           passed: /[^A-Za-z0-9]/.test(next) },
  ], [next]);

  const passedCount  = rules.filter((r) => r.passed).length;
  const rulesPassed  = passedCount === rules.length;
  const matches      = Boolean(confirm) && next === confirm;
  const displayError = localErr || error;

  // Strength label and bar colour — mirrors the 3 rules (Weak / Good / Strong)
  const strengthLabel = passedCount === 3 ? "Strong" : passedCount === 2 ? "Good" : passedCount === 1 ? "Weak" : "—";
  const strengthColor = passedCount === 3 ? GREEN : passedCount >= 1 ? WARN : DIM;

  // ── Helpers ────────────────────────────────────────────────────────────────

  const clearErrors = () => {
    if (localErr) setLocalErr("");
    if (error)    onClearError();
  };

  // ── Submit ─────────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();

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
      // Error is surfaced via the `error` prop from the parent hook.
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div
      style={{
        ...changePasswordVars(),
        minHeight: "100%",
        flex: 1,
        background: "var(--cp-surface, #FFFFFF)",
        color: TEXT,
        padding: "max(24px, env(safe-area-inset-top, 0px)) 22px 30px",
      }}
    >
      {/* ── Header ───────────────────────────────────────────────────────────
           Normal mode : back chevron on the left, optional notification/refresh on right.
           Forced mode : "Log out" text link on the left, no right-side icons.
                         The user cannot navigate anywhere else until they change password.
      ──────────────────────────────────────────────────────────────────────── */}
      <header style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
        {forced ? (
          <button
            type="button"
            onClick={onBack}
            aria-label="Log out"
            style={{ border: 0, background: "transparent", color: "#315eff", fontSize: 13, fontWeight: 500, cursor: "pointer", padding: "4px 0" }}
          >
            Log out
          </button>
        ) : (
          <button
            type="button"
            onClick={onBack}
            aria-label="Back"
            style={{ border: 0, background: "transparent", color: TEXT, display: "grid", placeItems: "center", cursor: "pointer", padding: 4 }}
          >
            <ChevronLeft size={20} strokeWidth={2} />
          </button>
        )}

        <span style={{ color: MUTED, fontSize: 11.5, fontWeight: 500, letterSpacing: "0.28em", textTransform: "uppercase" }}>
          {forced ? "Set your password" : "Change password"}
        </span>

        {!forced && (
          <div style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 14 }}>
            {onNotifications && (
              <button
                type="button"
                onClick={onNotifications}
                aria-label="Notifications"
                style={{ border: 0, background: "transparent", color: TEXT, display: "grid", placeItems: "center", cursor: "pointer", padding: 4 }}
              >
                <Bell size={18} strokeWidth={1.9} />
              </button>
            )}
            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                disabled={refreshing}
                aria-label="Refresh"
                style={{ border: 0, background: "transparent", color: TEXT, display: "grid", placeItems: "center", cursor: refreshing ? "wait" : "pointer", padding: 4, opacity: refreshing ? 0.5 : 1 }}
              >
                <RefreshCw size={18} strokeWidth={1.9} className={refreshing ? "spin" : ""} />
              </button>
            )}
          </div>
        )}
      </header>

      <form onSubmit={handleSubmit}>

        {/* ── Page heading ──────────────────────────────────────────────────── */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ margin: 0, color: TEXT, fontSize: 26, lineHeight: 1.12, fontWeight: 500, letterSpacing: "-0.035em" }}>
            {forced ? "Create your password" : "Update your password"}
          </h1>
          <p style={{ margin: "10px 0 0", color: MUTED, fontSize: 14, lineHeight: 1.45, fontWeight: 400 }}>
            {forced
              ? "Your account was created with a temporary password. Set a personal one to continue."
              : "Choose a strong password you do not use anywhere else."}
          </p>
        </div>

        {/* ── Password fields ───────────────────────────────────────────────── */}
        <PasswordField
          label="Current password"
          value={current}
          onChange={(v) => { setCurrent(v); clearErrors(); }}
          show={showCur}
          onToggle={() => setShowCur((v) => !v)}
          autoComplete="current-password"
        />
        <PasswordField
          label="New password"
          value={next}
          onChange={(v) => { setNext(v); clearErrors(); }}
          show={showNext}
          onToggle={() => setShowNext((v) => !v)}
          autoComplete="new-password"
        />
        <PasswordField
          label="Confirm new password"
          value={confirm}
          onChange={(v) => { setConfirm(v); clearErrors(); }}
          show={showCon}
          onToggle={() => setShowCon((v) => !v)}
          autoComplete="new-password"
        />

        {/* ── Strength bar + rules as pills ────────────────────────────────── */}
        <div style={{ marginTop: 4, marginBottom: 16 }}>
          {/* 3-segment bar */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 5, marginBottom: 10 }}>
            {[0, 1, 2].map((i) => (
              <span key={i} style={{ height: 3, borderRadius: 99, background: i < passedCount ? strengthColor : TRACK, transition: "background 0.2s ease" }} />
            ))}
          </div>

          {/* Rule pills */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {rules.map((rule) => (
              <span
                key={rule.label}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  padding: "4px 10px", borderRadius: 99, fontSize: 11.5,
                  border: `1px solid ${rule.passed ? "rgba(31,158,103,0.3)" : BORDER}`,
                  background: rule.passed ? "rgba(31,158,103,0.07)" : PANEL,
                  color: rule.passed ? GREEN : DIM,
                  transition: "all 0.2s ease",
                }}
              >
                <Check size={10} strokeWidth={2.5} />
                {rule.label}
              </span>
            ))}
            {confirm && (
              <span
                style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  padding: "4px 10px", borderRadius: 99, fontSize: 11.5,
                  border: `1px solid ${matches ? "rgba(31,158,103,0.3)" : "rgba(217,119,6,0.3)"}`,
                  background: matches ? "rgba(31,158,103,0.07)" : "rgba(217,119,6,0.07)",
                  color: matches ? GREEN : WARN,
                  transition: "all 0.2s ease",
                }}
              >
                <Check size={10} strokeWidth={2.5} />
                {matches ? "Passwords match" : "Doesn't match"}
              </span>
            )}
          </div>
        </div>

        {/* ── Error banner ──────────────────────────────────────────────────── */}
        {displayError && (
          <div
            style={{
              marginBottom: 16,
              border: "1px solid rgba(239,68,68,0.3)",
              background: "rgba(239,68,68,0.08)",
              color: "#DC2626",
              borderRadius: 12,
              padding: "11px 14px",
              fontSize: 13,
              lineHeight: 1.4,
            }}
          >
            {Array.isArray(displayError) ? displayError.join(", ") : displayError}
          </div>
        )}

        {/* ── Submit — always blue, dims while loading ──────────────────────── */}
        <button
          type="submit"
          style={{
            width: "100%",
            height: 48,
            border: 0,
            borderRadius: 12,
            background: "#315eff",
            color: "#FFFFFF",
            fontSize: 15,
            fontWeight: 500,
            letterSpacing: "-0.01em",
            cursor: loading ? "default" : "pointer",
            opacity: loading ? 0.7 : 1,
            transition: "opacity 0.15s ease",
          }}
        >
          {loading ? "Updating…" : "Update password"}
        </button>

        {/* ── Trust note ────────────────────────────────────────────────────── */}
        <div
          style={{
            marginTop: 22,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            color: DIM,
            fontSize: 12,
          }}
        >
          <ShieldCheck size={14} strokeWidth={1.8} />
          <span>All active sessions will be refreshed after this change.</span>
        </div>
      </form>
    </div>
  );
}

// ── PasswordField ──────────────────────────────────────────────────────────────
// Shared input row for all three password fields.
// Height and border-radius match the login screen inputs for consistency.

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
    <div style={{ marginBottom: 12 }}>
      {/* Label */}
      <span
        style={{
          display: "block",
          marginBottom: 5,
          color: MUTED,
          fontSize: 11,
          fontWeight: 500,
          letterSpacing: "0.20em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>

      {/* Input row */}
      <div
        style={{
          height: 48,
          border: `1.5px solid ${focused ? "#315eff" : BORDER}`,
          borderRadius: 12,
          background: PANEL,
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "0 12px",
          boxShadow: focused ? "0 0 0 4px rgba(49,94,255,0.12)" : "none",
          transition: "border-color 0.15s ease, box-shadow 0.15s ease",
        }}
      >
        <Lock size={17} strokeWidth={1.9} color={focused ? TEXT : MUTED} style={{ flexShrink: 0 }} />
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            flex: 1,
            minWidth: 0,
            border: 0,
            outline: 0,
            color: TEXT,
            background: "transparent",
            fontSize: 15,
            fontWeight: 400,
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
            flexShrink: 0,
          }}
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );
}
