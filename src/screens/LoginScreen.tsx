import { useState } from "react";
import { ArrowRight, Eye, EyeOff, Lock, Mail, ShieldCheck } from "lucide-react";

type Theme = "dark" | "light";

type LoginScreenProps = {
  error: string;
  loading: boolean;
  onLogin: (email: string, password: string) => Promise<void>;
  onForgotPassword?: () => void;
  theme?: Theme;
};

function loginPalette(theme: Theme) {
  if (theme === "light") {
    return {
      SURFACE:    "#FFFFFF",
      PANEL:      "#F5F3FB",
      PANEL_SOFT: "#FAFAFA",
      BORDER:     "#E9E6F1",
      BORDER_FOC: "#C4BBE8",
      TEXT:       "#17151F",
      MUTED:      "#6B6878",
      DIM:        "#9A97A8",
      CREAM:      "#5B3CE3",
      CREAM_DIS:  "rgba(91,60,227,0.32)",
      CTA_TEXT:   "#FFFFFF",
      CTA_ICON_BG:"#FFFFFF",
      CTA_ICON_C: "#5B3CE3",
      GREEN:      "#1F9E67",
      WARM:       "#B4591F",
      GLOW:       "radial-gradient(circle at 50% 4%, rgba(91,60,227,0.06), transparent 38%), #FFFFFF",
      CARD_BG:    "linear-gradient(180deg, rgba(91,60,227,0.04), rgba(91,60,227,0.015))",
      CARD_BORDER:"rgba(91,60,227,0.1)",
      DIVIDER:    "linear-gradient(90deg, transparent, #DDD9F0, transparent)",
    };
  }
  return {
    SURFACE:    "#0C0C0E",
    PANEL:      "#141418",
    PANEL_SOFT: "#17171B",
    BORDER:     "#29292F",
    BORDER_FOC: "#3C3C42",
    TEXT:       "#F2F0EA",
    MUTED:      "#8A8892",
    DIM:        "#5C5C64",
    CREAM:      "#F4F1E8",
    CREAM_DIS:  "rgba(242,240,234,0.42)",
    CTA_TEXT:   "#0C0C0E",
    CTA_ICON_BG:"#0C0C0E",
    CTA_ICON_C: "#F4F1E8",
    GREEN:      "#20A46A",
    WARM:       "#B4591F",
    GLOW:       "radial-gradient(circle at 50% 4%, rgba(242,240,234,0.055), transparent 38%), #0C0C0E",
    CARD_BG:    "linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.012))",
    CARD_BORDER:"rgba(255,255,255,0.035)",
    DIVIDER:    "linear-gradient(90deg, transparent, #1E1E22, transparent)",
  };
}

function LogoMark({ bg, shadow }: { bg: string; shadow: string }) {
  return (
    <div
      style={{
        width: 82,
        height: 82,
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
        style={{ width: 56, height: 40, objectFit: "contain" }}
      />
    </div>
  );
}

function AuthField({
  label,
  type,
  value,
  onChange,
  autoComplete,
  placeholder,
  icon,
  rightSlot,
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
  p: ReturnType<typeof loginPalette>;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <label style={{ display: "block", marginBottom: 20 }}>
      <span
        style={{
          display: "block",
          marginBottom: 10,
          color: p.MUTED,
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
          minHeight: 62,
          border: `1px solid ${focused ? p.BORDER_FOC : p.BORDER}`,
          borderRadius: 16,
          background: p.PANEL,
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "0 16px",
          transition: "border-color 0.18s ease, background 0.18s ease",
        }}
      >
        <span style={{ color: focused ? p.TEXT : p.MUTED, display: "grid", placeItems: "center" }}>
          {icon}
        </span>
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          placeholder={placeholder}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          required
          style={{
            flex: 1,
            minWidth: 0,
            border: 0,
            outline: 0,
            color: p.TEXT,
            background: "transparent",
            fontFamily: "'Inter', system-ui, sans-serif",
            fontSize: 15,
            fontWeight: 650,
            letterSpacing: "0.06em",
          }}
        />
        {rightSlot}
      </div>
    </label>
  );
}

export function LoginScreen({ error, loading, onLogin, onForgotPassword, theme = "dark" }: LoginScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const isSuccessMessage = error.toLowerCase().includes("successfully");
  const canSubmit = Boolean(email && password && !loading);
  const p = loginPalette(theme);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (canSubmit) void onLogin(email, password);
  };

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
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
        <div style={{ display: "grid", placeItems: "center", gap: 14, marginBottom: 34 }}>
          <LogoMark
            bg={theme === "light" ? "#FFFFFF" : p.CREAM}
            shadow={theme === "light"
              ? "0 8px 28px rgba(91,60,227,0.18), 0 0 0 1.5px rgba(91,60,227,0.12)"
              : "0 14px 40px rgba(242,240,234,0.12)"}
          />
          <div
            style={{
              color: p.TEXT,
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: "0.34em",
              textTransform: "uppercase",
            }}
          >
            MobPae
          </div>
        </div>

        <form onSubmit={submit} style={{ padding: "0 0 28px" }}>
          <div style={{ marginBottom: 26 }}>
            <h1
              style={{
                margin: 0,
                color: p.TEXT,
                fontSize: 28,
                lineHeight: 1.08,
                fontWeight: 700,
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
                fontWeight: 500,
              }}
            >
              Sign in to access your salary advances.
            </p>
          </div>

          <AuthField
            label="Email ID"
            type="email"
            value={email}
            onChange={setEmail}
            autoComplete="email"
            placeholder="you@company.com"
            icon={<Mail size={17} strokeWidth={1.9} />}
            p={p}
          />

          <div style={{ position: "relative" }}>
            <AuthField
              label="Password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={setPassword}
              autoComplete="current-password"
              placeholder="Password"
              icon={<Lock size={17} strokeWidth={1.9} />}
              p={p}
              rightSlot={
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
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
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
            />
            {onForgotPassword && (
              <button
                type="button"
                onClick={onForgotPassword}
                style={{
                  position: "absolute",
                  top: 0,
                  right: 0,
                  border: 0,
                  background: "transparent",
                  color: theme === "light" ? "#5B3CE3" : p.TEXT,
                  fontFamily: "'Inter', system-ui, sans-serif",
                  fontSize: 12,
                  fontWeight: 650,
                  cursor: "pointer",
                }}
              >
                Forgot?
              </button>
            )}
          </div>

          {error && (
            <div
              style={{
                margin: "2px 0 18px",
                border: `1px solid ${isSuccessMessage ? "rgba(31,158,103,0.35)" : "rgba(180,89,31,0.4)"}`,
                background: isSuccessMessage ? "rgba(31,158,103,0.1)" : "rgba(180,89,31,0.12)",
                color: isSuccessMessage ? p.GREEN : "#D9905A",
                borderRadius: 14,
                padding: "12px 14px",
                fontSize: 13,
                lineHeight: 1.35,
                fontWeight: 600,
              }}
            >
              {error}
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
              background: canSubmit ? p.CREAM : p.CREAM_DIS,
              color: p.CTA_TEXT,
              fontFamily: "'Inter', system-ui, sans-serif",
              fontSize: 16,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 8px 0 26px",
              cursor: canSubmit ? "pointer" : "not-allowed",
              boxShadow: canSubmit
                ? (theme === "light"
                  ? "0 16px 42px rgba(91,60,227,0.22)"
                  : "0 16px 42px rgba(242,240,234,0.12)")
                : "none",
            }}
          >
            <span>{loading ? "Signing in..." : "Sign in"}</span>
            <span
              style={{
                width: 50,
                height: 50,
                borderRadius: 14,
                background: p.CTA_ICON_BG,
                color: p.CTA_ICON_C,
                display: "grid",
                placeItems: "center",
              }}
            >
              {loading ? <span className="cta-spinner" /> : <ArrowRight size={24} strokeWidth={2.2} />}
            </span>
          </button>

          <div
            style={{
              marginTop: 34,
              height: 1,
              background: p.DIVIDER,
            }}
          />

          <div
            style={{
              marginTop: 28,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              color: p.DIM,
              fontSize: 12,
              fontWeight: 500,
              textAlign: "center",
            }}
          >
            <ShieldCheck size={14} strokeWidth={1.8} />
            <span>Bank-grade encryption. Your data stays private.</span>
          </div>
        </form>
    </div>
  );
}
