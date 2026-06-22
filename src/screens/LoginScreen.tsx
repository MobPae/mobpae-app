import { useState } from "react";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";

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

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!loading && email && password) void onLogin(email, password);
  };

  return (
    <div className="login-root">

      {/* Logo */}
      <div className="login-logo-wrap">
        <div className="login-logo-icon">
          <svg width="26" height="26" viewBox="0 0 100 100" fill="none" aria-hidden="true">
            <polygon points="6,100 18,100 68,0 56,0" fill="white" opacity="0.9"/>
            <polygon points="30,100 42,100 92,0 80,0" fill="white" opacity="0.9"/>
            <polygon points="54,100 66,100 100,32 100,8" fill="white" opacity="0.9"/>
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
      <form className="login-form" onSubmit={submit}>

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
              required
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
              required
            />
            <button type="button" className="lf-eye" onClick={() => setShowPass(v => !v)} aria-label={showPass ? "Hide password" : "Show password"}>
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <div className="lf-forgot-row login-forgot-only">
          <button type="button" className="lf-forgot" onClick={onForgotPassword}>
            Forgot Password?
          </button>
        </div>

        {/* Error */}
        {error && <div className="lf-error">&#9888; {error}</div>}

        {/* Login button */}
        <button
          type="submit"
          className="login-btn"
          disabled={!email || !password || loading}
        >
          {loading ? <span className="cta-spinner" /> : "Log in"}
        </button>

        <div className="login-account-note">
          <ShieldCheck size={15} />
          <span>Your employer creates and activates your MobPae account.</span>
        </div>
      </form>

      {/* Footer */}
      <div className="login-footer">
        <div className="login-footer-icon">
          <svg width="10" height="12" viewBox="0 0 24 24" fill="none"
            stroke="#7679FF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect width="18" height="11" x="3" y="11" rx="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>
        Secure employer-provided access
      </div>
    </div>
  );
}
