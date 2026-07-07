import { useState } from "react";

type Theme = "dark" | "light";

type Props = {
  token: string;
  onBack: () => void;
  onResetPassword: (token: string, newPassword: string) => Promise<void>;
  theme?: Theme;
};

function recoveryPalette(theme: Theme) {
  if (theme === "light") {
    return {
      BACK_BG:      "rgba(0,0,0,0.06)",
      BACK_ICON:    "#191A2E",
      TITLE:        "#191A2E",
      SUB:          "#62657A",
      ICON_BG:      "#ECEBFF",
      ICON_BORDER:  "#A5A7FF",
      ICON_STROKE:  "#7679FF",
      LABEL:        "#191A2E",
      INPUT_BG:     "#FFFFFF",
      INPUT_COLOR:  "#191A2E",
      INPUT_BORDER: "#E4E4EF",
      INPUT_FOCUS:  "#7679FF",
      ACCENT:       "#7679FF",
      ACCENT_DIS:   "#A5A7FF",
      ERROR:        "#EF4444",
    };
  }
  return {
    BACK_BG:      "rgba(255,255,255,0.08)",
    BACK_ICON:    "#F2F0EA",
    TITLE:        "#F2F0EA",
    SUB:          "#7C7C85",
    ICON_BG:      "rgba(107,69,244,0.15)",
    ICON_BORDER:  "rgba(107,69,244,0.4)",
    ICON_STROKE:  "#9A7DF5",
    LABEL:        "#C8C5D0",
    INPUT_BG:     "#141418",
    INPUT_COLOR:  "#F2F0EA",
    INPUT_BORDER: "#29292F",
    INPUT_FOCUS:  "#6B45F4",
    ACCENT:       "#6B45F4",
    ACCENT_DIS:   "rgba(107,69,244,0.45)",
    ERROR:        "#EF4444",
  };
}

export function ResetPasswordScreen({ token, onBack, onResetPassword, theme = "light" }: Props) {
  const [newPassword,     setNewPassword]     = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading,         setLoading]         = useState(false);
  const [done,            setDone]            = useState(false);
  const [error,           setError]           = useState("");
  const p = recoveryPalette(theme);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (newPassword !== confirmPassword) { setError("Passwords do not match."); return; }
    if (newPassword.length < 8)          { setError("Password must be at least 8 characters."); return; }
    setLoading(true);
    try {
      await onResetPassword(token, newPassword);
      setDone(true);
    } catch {
      setError("This reset link is invalid or has expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100%",
        display: "flex",
        flexDirection: "column",
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      {/* Header */}
      <div style={{ padding: "56px 24px 20px", display: "flex", alignItems: "center", gap: 12 }}>
        <button
          onClick={onBack}
          style={{
            width: 36, height: 36, borderRadius: "50%",
            background: p.BACK_BG, border: "none",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", flexShrink: 0,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={p.BACK_ICON} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </button>
        <div>
          <p style={{ fontSize: 12, fontWeight: 700, color: p.TITLE, margin: 0 }}>Set new password</p>
          <p style={{ fontSize: 12, color: p.SUB, margin: "2px 0 0" }}>All active sessions will be signed out</p>
        </div>
      </div>

      <div style={{ flex: 1, padding: "8px 24px 40px" }}>
        {done ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", textAlign: "center" }}>
            <div style={{
              width: 64, height: 64, borderRadius: 20,
              background: p.ICON_BG, border: `1.5px solid ${p.ICON_BORDER}`,
              display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20,
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={p.ICON_STROKE} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <p style={{ fontSize: 12, fontWeight: 700, color: p.TITLE, marginBottom: 10 }}>Password updated!</p>
            <p style={{ fontSize: 13, color: p.SUB, lineHeight: 1.6, marginBottom: 32 }}>
              Your password has been reset. Please sign in again.
            </p>
            <button
              onClick={onBack}
              style={{
                width: "100%", padding: "15px 0",
                background: p.ACCENT, color: "white", borderRadius: 14, border: "none",
                fontSize: 13, fontWeight: 700, cursor: "pointer",
                fontFamily: "'Inter', system-ui, sans-serif",
                boxShadow: "0 4px 16px rgba(107,69,244,0.3)",
              }}
            >
              Sign in
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[
              { label: "New Password",     val: newPassword,     set: setNewPassword     },
              { label: "Confirm Password", val: confirmPassword, set: setConfirmPassword },
            ].map(({ label, val, set }) => (
              <div key={label}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: p.LABEL, marginBottom: 8 }}>
                  {label}
                </label>
                <input
                  type="password" value={val}
                  onChange={e => set(e.target.value)}
                  placeholder="••••••••" required
                  style={{
                    width: "100%", boxSizing: "border-box", padding: "13px 16px",
                    fontSize: 13, color: p.INPUT_COLOR, background: p.INPUT_BG,
                    border: `1.5px solid ${p.INPUT_BORDER}`, borderRadius: 12, outline: "none",
                    fontFamily: "'Inter', system-ui, sans-serif",
                  }}
                  onFocus={e => { e.target.style.borderColor = p.INPUT_FOCUS; }}
                  onBlur={e  => { e.target.style.borderColor = p.INPUT_BORDER; }}
                />
              </div>
            ))}

            {error && (
              <p style={{ fontSize: 12, color: p.ERROR, margin: 0 }}>{error}</p>
            )}

            <button
              type="submit" disabled={loading}
              style={{
                width: "100%", padding: "15px 0", marginTop: 8,
                background: loading ? p.ACCENT_DIS : p.ACCENT,
                color: "white", borderRadius: 14, border: "none",
                fontSize: 13, fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                fontFamily: "'Inter', system-ui, sans-serif",
                boxShadow: loading ? "none" : "0 4px 16px rgba(107,69,244,0.3)",
              }}
            >
              {loading ? "Resetting…" : "Reset password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
