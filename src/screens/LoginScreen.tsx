import { useState } from "react";
import { ArrowRight, Eye, EyeOff, ShieldCheck, Wallet, Zap } from "lucide-react";

type LoginScreenProps = {
  error: string;
  loading: boolean;
  onLogin: (email: string, password: string) => Promise<void>;
};

export function LoginScreen({ error, loading, onLogin }: LoginScreenProps) {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loading && email && password) void onLogin(email, password);
  };

  return (
    <div className="login-root">
      {/* ── Purple hero ─────────────────────────────────────────── */}
      <div className="login-hero">
        {/* Logo pill */}
        <div className="login-logo">
          <div className="login-logo-icon">
            <Wallet size={16} color="white" />
          </div>
          <span>MobPae</span>
        </div>

        <h1>Your salary,<br />when you need it.</h1>
        <p>Access a portion of your earned salary before payday — instantly, responsibly.</p>

        <div className="login-chips">
          <span className="login-chip">
            <Zap size={12} /> 30-second payout
          </span>
          <span className="login-chip">
            <ShieldCheck size={12} /> RBI-compliant
          </span>
          <span className="login-chip">No CIBIL impact</span>
        </div>
      </div>

      {/* ── Form area ───────────────────────────────────────────── */}
      <div className="login-form-area">
        <div>
          <h2>Sign in to MobPae</h2>
          <p style={{ fontSize: 13, color: "var(--t2)", marginTop: 4 }}>
            Use your work or personal email.
          </p>
        </div>

        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Email */}
          <div className="lf-field">
            <label className="lf-label" htmlFor="mp-email">Email</label>
            <div className="lf-input-wrap">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--t3)" }}>
                <rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
              </svg>
              <input
                id="mp-email"
                className="lf-input"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="email@company.com"
                autoComplete="email"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="lf-field">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <label className="lf-label" htmlFor="mp-pass">Password</label>
              <span className="lf-forgot">Forgot?</span>
            </div>
            <div className="lf-input-wrap">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--t3)" }}>
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <input
                id="mp-pass"
                className="lf-input"
                type={showPass ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••••••"
                autoComplete="current-password"
                required
              />
              <button type="button" className="lf-eye" onClick={() => setShowPass(v => !v)} tabIndex={-1}>
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && <div className="lf-error">⚠ {error}</div>}

          <button
            type="submit"
            className="login-cta"
            disabled={loading || !email || !password}
            style={{ marginTop: 4 }}
          >
            {loading
              ? <span className="cta-spinner" />
              : <><span>Sign in</span><ArrowRight size={18} /></>
            }
          </button>
        </form>

        <p className="login-new">
          New to MobPae? <a href="#create">Create account</a>
        </p>

        <p className="login-legal">
          By continuing you agree to MobPae's{" "}
          <a href="#terms">Terms</a> and <a href="#privacy">Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
}
