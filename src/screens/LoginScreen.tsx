// ── LoginScreen.tsx ──────────────────────────────────────────────────────────
// Sign-in form. Supports light/dark themes via loginPalette().
// Props:
//   error   — API-level error or success message surfaced by the parent hook
//   loading — true while onLogin() is in-flight
//   onLogin — async callback; parent owns the API call
//   onForgotPassword — optional; hides the link when omitted

import { useState } from "react";
import { Eye, EyeOff, Lock, Mail, ShieldCheck } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type Theme = "dark" | "light";

type LoginScreenProps = {
  error: string;
  loading: boolean;
  onLogin: (email: string, password: string) => Promise<void>;
  onForgotPassword?: () => void;
  theme?: Theme;
};

// ── Palette ───────────────────────────────────────────────────────────────────
// Two complete color sets — swap by passing theme="dark" or theme="light".

function loginPalette(theme: Theme) {
  if (theme === "light") {
    return {
      PANEL:      "#F8F8FA",
      BORDER:     "#E9E6F1",
      BORDER_FOC: "#315eff",
      BORDER_ERR: "#EF4444",
      TEXT:       "#17151F",
      MUTED:      "#6B6878",
      DIM:        "#9A97A8",
      ERR_TEXT:   "#DC2626",
      GREEN:      "#1F9E67",
      GLOW:       "radial-gradient(circle at 50% 4%, rgba(49,94,255,0.08), transparent 42%), #F6F4FF",
      DIVIDER:    "linear-gradient(90deg, transparent, #DDD9F0, transparent)",
    };
  }
  return {
    PANEL:      "#141418",
    BORDER:     "#29292F",
    BORDER_FOC: "#315eff",
    BORDER_ERR: "#EF4444",
    TEXT:       "#F2F0EA",
    MUTED:      "#8A8892",
    DIM:        "#5C5C64",
    ERR_TEXT:   "#F87171",
    GREEN:      "#20A46A",
    GLOW:       "radial-gradient(circle at 50% 4%, rgba(242,240,234,0.055), transparent 38%), #0C0C0E",
    DIVIDER:    "linear-gradient(90deg, transparent, #1E1E22, transparent)",
  };
}

// ── LogoMark ──────────────────────────────────────────────────────────────────
// Circular badge containing the MobPae icon.

function LogoMark({ bg, shadow }: { bg: string; shadow: string }) {
  return (
    <div
      style={{
        width: 80,
        height: 80,
        borderRadius: "50%",
        background: bg,
        display: "grid",
        placeItems: "center",
        boxShadow: shadow,
      }}
    >
      <img
        src="/logo-icon.svg"
        alt="MobPae"
        style={{ width: 44, height: 44, objectFit: "contain" }}
      />
    </div>
  );
}

// ── AuthField ─────────────────────────────────────────────────────────────────
// Reusable labelled input row.
// - Shows a red border + inline error message when `error` is non-empty.
// - Clears the error state when the parent calls onChange (handled upstream).

function AuthField({
  label,
  type,
  value,
  onChange,
  autoComplete,
  placeholder,
  icon,
  rightSlot,
  error,
  p,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  placeholder?: string;
  icon: React.ReactNode;
  rightSlot?: React.ReactNode;
  error?: string;
  p: ReturnType<typeof loginPalette>;
}) {
  const [focused, setFocused] = useState(false);
  const hasError = Boolean(error);

  return (
    <div style={{ marginBottom: 16 }}>
      {/* Label */}
      <span
        style={{
          display: "block",
          marginBottom: 7,
          color: p.MUTED,
          fontSize: 11.5,
          fontWeight: 500,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>

      {/* Input row */}
      <div
        style={{
          height: 44,
          border: `1.5px solid ${hasError ? p.BORDER_ERR : focused ? p.BORDER_FOC : p.BORDER}`,
          borderRadius: 11,
          background: p.PANEL,
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "0 12px",
          transition: "border-color 0.15s ease",
        }}
      >
        <span style={{ color: focused ? p.TEXT : p.MUTED, display: "grid", placeItems: "center", flexShrink: 0 }}>
          {icon}
        </span>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          placeholder={placeholder}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            flex: 1,
            minWidth: 0,
            border: 0,
            outline: 0,
            color: p.TEXT,
            background: "transparent",
            fontSize: 15,
            fontWeight: 400,
          }}
        />
        {rightSlot}
      </div>

      {/* Inline validation error */}
      {hasError && (
        <p style={{ margin: "5px 0 0", fontSize: 12, color: p.ERR_TEXT, fontWeight: 400 }}>
          {error}
        </p>
      )}
    </div>
  );
}

// ── LoginScreen ───────────────────────────────────────────────────────────────

export function LoginScreen({
  error,
  loading,
  onLogin,
  onForgotPassword,
  theme = "dark",
}: LoginScreenProps) {
  const [email, setEmail]               = useState("");
  const [password, setPassword]         = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Field-level errors — set on empty submit, cleared on each keystroke.
  const [fieldErrors, setFieldErrors] = useState({ email: "", password: "" });

  const p = loginPalette(theme);

  // API error from parent can also be a success message (e.g. after reset).
  const isSuccessMessage = error.toLowerCase().includes("successfully");

  // ── Field change handlers ──────────────────────────────────────────────────
  // Clear the field's own error as soon as the user starts typing.

  const onEmailChange = (val: string) => {
    setEmail(val);
    if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: "" }));
  };

  const onPasswordChange = (val: string) => {
    setPassword(val);
    if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: "" }));
  };

  // ── Submit handler ─────────────────────────────────────────────────────────
  // Validates locally first; only calls the parent if both fields are filled.

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    const errors = { email: "", password: "" };
    if (!email.trim()) errors.email = "Email is required";
    if (!password)     errors.password = "Password is required";

    if (errors.email || errors.password) {
      setFieldErrors(errors);
      return;
    }

    void onLogin(email.trim().toLowerCase(), password);
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div
      style={{
        minHeight: "100%",
        flex: 1,
        background: p.GLOW,
        color: p.TEXT,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "28px 24px",
      }}
    >
      {/* Logo + brand name */}
      <div style={{ display: "grid", placeItems: "center", gap: 14, marginBottom: 34 }}>
        <LogoMark
          bg={theme === "light" ? "#EEF1FF" : "#1E1E26"}
          shadow={
            theme === "light"
              ? "0 8px 28px rgba(49,94,255,0.18), 0 0 0 1.5px rgba(49,94,255,0.12)"
              : "0 8px 28px rgba(49,94,255,0.25)"
          }
        />
        <div
          style={{
            color: p.TEXT,
            fontSize: 13,
            fontWeight: 500,
            letterSpacing: "0.20em",
            textTransform: "uppercase",
          }}
        >
          MobPae
        </div>
      </div>

      <form onSubmit={submit} style={{ paddingBottom: 28 }}>

        {/* Heading */}
        <div style={{ marginBottom: 24 }}>
          <h1
            style={{
              margin: 0,
              color: p.TEXT,
              fontSize: 28,
              lineHeight: 1.08,
              fontWeight: 500,
              letterSpacing: "-0.04em",
            }}
          >
            Welcome back
          </h1>
          <p
            style={{
              margin: "10px 0 0",
              color: p.MUTED,
              fontSize: 14,
              lineHeight: 1.45,
              fontWeight: 400,
            }}
          >
            Sign in to access your salary advances.
          </p>
        </div>

        {/* Email input */}
        <AuthField
          label="Email ID"
          type="email"
          value={email}
          onChange={onEmailChange}
          autoComplete="email"
          placeholder="you@company.com"
          icon={<Mail size={17} strokeWidth={1.9} />}
          error={fieldErrors.email}
          p={p}
        />

        {/* Password input */}
        <AuthField
          label="Password"
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={onPasswordChange}
          autoComplete="current-password"
          placeholder="Password"
          icon={<Lock size={17} strokeWidth={1.9} />}
          error={fieldErrors.password}
          p={p}
          rightSlot={
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              style={{
                width: 32,
                height: 32,
                border: 0,
                borderRadius: "50%",
                background: "transparent",
                color: p.MUTED,
                display: "grid",
                placeItems: "center",
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          }
        />

        {/* Forgot password */}
        {onForgotPassword && (
          <div style={{ textAlign: "right", marginTop: -8, marginBottom: 20 }}>
            <button
              type="button"
              onClick={onForgotPassword}
              style={{
                border: 0,
                background: "transparent",
                color: "#315eff",
                fontSize: 12,
                fontWeight: 500,
                cursor: "pointer",
                padding: "4px 0",
              }}
            >
              Forgot password?
            </button>
          </div>
        )}

        {/* API-level error / success banner */}
        {error && (
          <div
            style={{
              margin: "0 0 16px",
              border: `1px solid ${isSuccessMessage ? "rgba(31,158,103,0.35)" : "rgba(239,68,68,0.3)"}`,
              background: isSuccessMessage ? "rgba(31,158,103,0.1)" : "rgba(239,68,68,0.08)",
              color: isSuccessMessage ? p.GREEN : p.ERR_TEXT,
              borderRadius: 12,
              padding: "11px 14px",
              fontSize: 13,
              lineHeight: 1.4,
            }}
          >
            {error}
          </div>
        )}

        {/* Submit button — always blue; dims slightly while loading */}
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
          {loading ? "Signing in…" : "Sign in"}
        </button>

        {/* Divider */}
        <div style={{ marginTop: 32, height: 1, background: p.DIVIDER }} />

        {/* Trust badge */}
        <div
          style={{
            marginTop: 24,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            color: p.DIM,
            fontSize: 12,
            fontWeight: 400,
          }}
        >
          <ShieldCheck size={14} strokeWidth={1.8} />
          <span>Bank-grade encryption. Your data stays private.</span>
        </div>
      </form>
    </div>
  );
}
