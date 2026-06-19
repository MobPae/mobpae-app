import { useState } from "react";

type Props = {
  token: string;
  onBack: () => void;
  onResetPassword: (token: string, newPassword: string) => Promise<void>;
};

export function ResetPasswordScreen({ token, onBack, onResetPassword }: Props) {
  const [newPassword,     setNewPassword]     = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading,         setLoading]         = useState(false);
  const [done,            setDone]            = useState(false);
  const [error,           setError]           = useState("");

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
    <div className="recovery-screen">

        {/* Header */}
        <div style={{ padding: "56px 24px 20px", display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={onBack} style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(0,0,0,0.06)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          </button>
          <div>
            <p style={{ fontSize: 18, fontWeight: 700, color: "#111", margin: 0 }}>Set new password</p>
            <p style={{ fontSize: 13, color: "#888", margin: "2px 0 0" }}>All active sessions will be signed out</p>
          </div>
        </div>

        <div style={{ flex: 1, padding: "8px 24px 40px" }}>
          {done ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", textAlign: "center" }}>
              <div style={{ width: 64, height: 64, borderRadius: 20, background: "#f0fdf4", border: "1.5px solid #bbf7d0", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <p style={{ fontSize: 18, fontWeight: 700, color: "#111", marginBottom: 10 }}>Password updated!</p>
              <p style={{ fontSize: 14, color: "#888", lineHeight: 1.6, marginBottom: 32 }}>
                Your password has been reset. Please sign in again.
              </p>
              <button onClick={onBack} style={{
                width: "100%", padding: "15px 0",
                background: "linear-gradient(135deg, #059669 0%, #10B981 100%)",
                color: "white", borderRadius: 14, border: "none",
                fontSize: 15, fontWeight: 700, cursor: "pointer",
                boxShadow: "0 4px 16px rgba(5,150,105,0.30)",
              }}>
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
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#333", marginBottom: 8 }}>{label}</label>
                  <input
                    type="password" value={val} onChange={e => set(e.target.value)}
                    placeholder="••••••••" required
                    style={{
                      width: "100%", boxSizing: "border-box", padding: "13px 16px",
                      fontSize: 14, color: "#111", background: "white",
                      border: "1.5px solid #e8e0d8", borderRadius: 12, outline: "none",
                    }}
                    onFocus={e => { e.target.style.borderColor = "#10B981"; }}
                    onBlur={e  => { e.target.style.borderColor = "#e8e0d8"; }}
                  />
                </div>
              ))}

              {error && (
                <p style={{ fontSize: 13, color: "#e11d48", margin: 0 }}>{error}</p>
              )}

              <button type="submit" disabled={loading} style={{
                width: "100%", padding: "15px 0", marginTop: 8,
                background: loading ? "#34D399" : "linear-gradient(135deg, #059669 0%, #10B981 100%)",
                color: "white", borderRadius: 14, border: "none",
                fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
                boxShadow: loading ? "none" : "0 4px 16px rgba(5,150,105,0.30)",
              }}>
                {loading ? "Resetting…" : "Reset password"}
              </button>
            </form>
          )}
        </div>
    </div>
  );
}
