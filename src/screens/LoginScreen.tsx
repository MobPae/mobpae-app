import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

type LoginScreenProps = {
  error: string;
  loading: boolean;
  onLogin: (email: string, password: string) => Promise<void>;
  onForgotPassword?: () => void;
};

export function LoginScreen({ error, loading, onLogin, onForgotPassword }: LoginScreenProps) {
  const [email,       setEmail]       = useState("");
  const [password,    setPassword]    = useState("");
  const [showPass,    setShowPass]    = useState(false);
  const [remember,    setRemember]    = useState(false);

  const submit = () => {
    if (!loading && email && password) void onLogin(email, password);
  };

  return (
    <div className="login-root">

      {/* Logo */}
      <div className="login-logo-wrap">
        <div className="login-logo-icon">
          <svg width="20" height="14" viewBox="0 0 22 16" fill="none">
            <path d="M1 14C1 14 4 3 7 8C10 13 11 2 14 8C17 14 21 3 21 3"
              stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <span className="login-brand">MobPae</span>
      </div>

      {/* Heading */}
      <div>
        <h2 className="login-heading">Welcome back!</h2>
        <p className="login-sub">Log in to continue</p>
      </div>

      {/* Form */}
      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>

        {/* Email field */}
        <div className="lf-field">
          <label className="lf-label" htmlFor="mp-email">Email</label>
          <div className="lf-input-wrap">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="20" height="16" x="2" y="4" rx="2"/>
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
            </svg>
            <input
              id="mp-email"
              className="lf-input"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Enter your email"
              autoComplete="email"
            />
          </div>
        </div>

        {/* Password field */}
        <div className="lf-field">
          <label className="lf-label" htmlFor="mp-pass">Password</label>
          <div className="lf-input-wrap">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="11" x="3" y="11" rx="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <input
              id="mp-pass"
              className="lf-input"
              type={showPass ? "text" : "password"}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
            />
            <button type="button" className="lf-eye" onClick={() => setShowPass(v => !v)} tabIndex={-1}>
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Remember me + Forgot PIN */}
        <div className="lf-forgot-row">
          <label className="lf-remember">
            <input
              type="checkbox"
              checked={remember}
              onChange={e => setRemember(e.target.checked)}
            />
            Remember me
          </label>
          <button type="button" className="lf-forgot" onClick={onForgotPassword}>
            Forgot Password?
          </button>
        </div>

        {/* Error */}
        {error && <div className="lf-error">&#9888; {error}</div>}

        {/* Login button */}
        <button
          type="button"
          className="login-btn"
          disabled={!email || !password || loading}
          onClick={submit}
        >
          {loading ? <span className="cta-spinner" /> : "Log in"}
        </button>

        {/* Register link */}
        <p className="login-register">
          New here?{" "}
          <button type="button" onClick={() => {}}>Create account</button>
        </p>
      </div>

      {/* Footer */}
      <div className="login-footer">
        <div className="login-footer-icon">
          <svg width="10" height="12" viewBox="0 0 24 24" fill="none"
            stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect width="18" height="11" x="3" y="11" rx="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>
        Secured and trusted by 500+ companies
      </div>
    </div>
  );
}
