import { useState } from "react";
import { Eye, EyeOff, Lock, Phone, ShieldCheck } from "lucide-react";

type LoginScreenProps = {
  error: string;
  loading: boolean;
  onLogin: (email: string, password: string) => Promise<void>;
  onForgotPassword?: () => void;
};

export function LoginScreen({ error, loading, onLogin, onForgotPassword }: LoginScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loading && email && password) void onLogin(email, password);
  };

  return (
    <div className="login-screen">

      {/* Logo */}
      <div className="login-logo-row">
        <div className="login-logo-icon">
          <svg width="32" height="32" viewBox="0 0 100 100" fill="none">
            <rect width="100" height="100" rx="18" fill="#5B3CE3"/>
            <polygon points="12,88 24,88 62,12 50,12" fill="white" opacity="0.9"/>
            <polygon points="36,88 48,88 86,12 74,12" fill="white" opacity="0.9"/>
          </svg>
        </div>
        <span className="login-brand">MobPae</span>
      </div>

      <h2 className="login-heading">Welcome back! 👋</h2>
      <p className="login-sub">Sign in to access your salary advance and manage your finances.</p>

      <form className="login-form" onSubmit={submit}>

        {/* Email field */}
        <div className="mp-field">
          <label className="mp-label" htmlFor="mp-email">Email</label>
          <div className="mp-input-wrap">
            <span className="mp-input-icon"><Phone size={16} /></span>
            <input
              id="mp-email"
              className="mp-input"
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
        <div className="mp-field">
          <label className="mp-label" htmlFor="mp-pass">Password</label>
          <div className="mp-input-wrap">
            <span className="mp-input-icon"><Lock size={16} /></span>
            <input
              id="mp-pass"
              className="mp-input"
              type={showPass ? "text" : "password"}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              className="mp-eye-btn"
              onClick={() => setShowPass(v => !v)}
              aria-label={showPass ? "Hide password" : "Show password"}
            >
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Remember + Forgot */}
        <div className="login-footer-row">
          <label className="login-remember">
            <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} />
            Remember me
          </label>
          <button type="button" className="login-forgot" onClick={onForgotPassword}>
            Forgot Password?
          </button>
        </div>

        {/* Error */}
        {error && <div className="login-error">⚠ {error}</div>}

        {/* Log In button */}
        <button
          type="submit"
          className="mp-btn-primary"
          disabled={!email || !password || loading}
          style={{ marginBottom: 16 }}
        >
          {loading ? <span className="mp-spinner" /> : <>Log In →</>}
        </button>

        {/* Divider */}
        <div className="login-divider">
          <span>or continue with</span>
        </div>

        {/* Google button */}
        <button type="button" className="login-google-btn">
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        {/* Security note */}
        <div className="login-security-note">
          <ShieldCheck size={14} color="#5B3CE3" style={{ flexShrink: 0, marginTop: 1 }} />
          <span>Your employer activates your MobPae account. Contact HR if you haven't received your credentials.</span>
        </div>
      </form>

      <div className="login-new-row">
        New to MobPae? <a href="#contact-hr">Contact HR →</a>
      </div>
    </div>
  );
}
