import { ArrowLeft } from "lucide-react";
import { useState } from "react";

type Theme = "dark" | "light";

type Props = {
  onBack: () => void;
  onForgotPassword: (email: string) => Promise<void>;
  theme?: Theme;
};

function recoveryPalette(theme: Theme) {
  if (theme === "light") {
    return {
      BACK_BG:      "rgba(0,0,0,0.06)",
      BACK_ICON:    "#191A2E",
      TITLE:        "#191A2E",
      SUB:          "#62657A",
      STRONG:       "#191A2E",
      ICON_BG:      "rgba(49,94,255,0.10)",
      ICON_BORDER:  "rgba(49,94,255,0.22)",
      ICON_STROKE:  "#315eff",
      LABEL:        "#6B6878",
      INPUT_BG:     "#FFFFFF",
      INPUT_COLOR:  "#191A2E",
      INPUT_BORDER: "#E4E4EF",
      INPUT_FOCUS:  "#315eff",
      ACCENT:       "#315eff",
      ACCENT_DIS:   "rgba(49,94,255,0.45)",
      ERROR:        "#EF4444",
      BACK_LINK:    "#315eff",
    };
  }
  return {
    BACK_BG:      "rgba(255,255,255,0.08)",
    BACK_ICON:    "#F2F0EA",
    TITLE:        "#F2F0EA",
    SUB:          "#7C7C85",
    STRONG:       "#F2F0EA",
    ICON_BG:      "rgba(49,94,255,0.14)",
    ICON_BORDER:  "rgba(49,94,255,0.32)",
    ICON_STROKE:  "#7B9FFF",
    LABEL:        "#8A8892",
    INPUT_BG:     "#141418",
    INPUT_COLOR:  "#F2F0EA",
    INPUT_BORDER: "#29292F",
    INPUT_FOCUS:  "#315eff",
    ACCENT:       "#315eff",
    ACCENT_DIS:   "rgba(49,94,255,0.45)",
    ERROR:        "#EF4444",
    BACK_LINK:    "#7B9FFF",
  };
}

export function ForgotPasswordScreen({ onBack, onForgotPassword, theme = "light" }: Props) {
  const [email,   setEmail]   = useState("");
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);
  const [error,   setError]   = useState("");
  const p = recoveryPalette(theme);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await onForgotPassword(email.trim().toLowerCase());
    } catch {
      // Always show success to prevent email enumeration
    } finally {
      setLoading(false);
      setSent(true);
    }
  };

  return (
    <div
      style={{
        minHeight: "100%",
        display: "flex",
        flexDirection: "column",
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
          <p style={{ fontSize: 12, fontWeight: 500, color: p.TITLE, margin: 0 }}>Forgot password?</p>
          <p style={{ fontSize: 12, color: p.SUB, margin: "2px 0 0" }}>We'll send a reset link to your email</p>
        </div>
      </div>

      <div style={{ flex: 1, padding: "8px 24px 40px", display: "flex", flexDirection: "column" }}>
        {sent ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
            <div style={{
              width: 64, height: 64, borderRadius: 20,
              background: p.ICON_BG, border: `1.5px solid ${p.ICON_BORDER}`,
              display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20,
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={p.ICON_STROKE} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <p style={{ fontSize: 12, fontWeight: 500, color: p.TITLE, marginBottom: 10 }}>Check your inbox</p>
            <p style={{ fontSize: 13, color: p.SUB, lineHeight: 1.6, marginBottom: 32 }}>
              If an account exists for{" "}
              <span style={{ color: p.STRONG }}>{email}</span>
              , a reset link has been sent. It expires in 15 minutes.
            </p>
            <button
              onClick={onBack}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                fontSize: 13, fontWeight: 500, color: p.BACK_LINK,
                background: "none", border: "none", cursor: "pointer",
              }}
            >
              <ArrowLeft size={14} strokeWidth={2} />
              Back to sign in
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{
                display: "block", marginBottom: 6,
                fontSize: 11, fontWeight: 500, color: p.LABEL,
                letterSpacing: "0.20em", textTransform: "uppercase",
              }}>
                Email address
              </label>
              <input
                type="email" value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com" required autoComplete="email"
                style={{
                  width: "100%", boxSizing: "border-box", height: 44, padding: "0 14px",
                  fontSize: 15, color: p.INPUT_COLOR, background: p.INPUT_BG,
                  border: `1.5px solid ${p.INPUT_BORDER}`, borderRadius: 11, outline: "none",
                }}
                onFocus={e => { e.target.style.borderColor = p.INPUT_FOCUS; }}
                onBlur={e  => { e.target.style.borderColor = p.INPUT_BORDER; }}
              />
            </div>

            {error && (
              <p style={{ fontSize: 12, color: p.ERROR, margin: 0 }}>{error}</p>
            )}

            <button
              type="submit" disabled={loading}
              style={{
                width: "100%", height: 48, marginTop: 8,
                background: loading ? p.ACCENT_DIS : p.ACCENT,
                color: "white", borderRadius: 12, border: "none",
                fontSize: 15, fontWeight: 500,
                cursor: loading ? "not-allowed" : "pointer",
                boxShadow: loading ? "none" : "0 4px 16px rgba(49,94,255,0.28)",
              }}
            >
              {loading ? "Sending…" : "Send reset link"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
