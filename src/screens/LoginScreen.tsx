import { useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";

type LoginScreenProps = {
  error: string;
  loading: boolean;
  onLogin: (email: string, password: string) => Promise<void>;
  onForgotPassword?: () => void;
};

const P  = "#5B3CE3";
const PD = "#4A2FD4";
const PL = "#7B64FF";

/* ── Floating-label outlined input ───────────────────────────── */
function FloatingInput({
  label, type, value, onChange, autoComplete, rightSlot,
}: {
  label: string; type: string; value: string;
  onChange: (v: string) => void; autoComplete?: string;
  rightSlot?: React.ReactNode;
}) {
  const [focused, setFocused] = useState(false);
  const active = focused || value.length > 0;

  return (
    <div style={{ position: "relative", marginBottom: 22 }}>
      <div style={{
        display: "flex", alignItems: "center",
        border: `2px solid ${focused ? P : "#A78BFA"}`,
        borderRadius: 14,
        padding: "15px 16px",
        minHeight: 56,
        background: focused ? "#FAFAFE" : "white",
        transition: "border-color 0.2s, background 0.2s, box-shadow 0.2s",
        boxShadow: focused ? `0 0 0 4px rgba(91,60,227,0.12)` : "none",
      }}>
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          autoComplete={autoComplete}
          required
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            flex: 1, border: "none", outline: "none",
            fontSize: 15, fontWeight: 500, color: "#1a1a2e",
            fontFamily: "'Inter', sans-serif",
            background: "transparent",
          }}
        />
        {rightSlot}
      </div>
      {/* Floating label */}
      <label style={{
        position: "absolute",
        left: 14,
        top: active ? -10 : "50%",
        transform: active ? "none" : "translateY(-50%)",
        fontSize: active ? 11 : 15,
        fontWeight: 800,
        fontFamily: "'Inter', sans-serif",
        color: active ? (focused ? P : P) : "#A78BFA",
        background: "white",
        padding: "0 5px",
        pointerEvents: "none",
        transition: "all 0.2s ease",
        letterSpacing: active ? "0.08em" : 0,
        textTransform: active ? "uppercase" : "none",
      }}>
        {label}
      </label>
    </div>
  );
}

export function LoginScreen({ error, loading, onLogin, onForgotPassword }: LoginScreenProps) {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const isSuccessMessage = error.toLowerCase().includes("successfully");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loading && email && password) void onLogin(email, password);
  };

  return (
    <div style={{
      position: "relative", display: "flex", flexDirection: "column",
      flex: 1, background: "white", overflow: "hidden",
      fontFamily: "Inter, sans-serif",
    }}>

      {/* ══════════════════════════════════════════
          PURPLE HERO — top 46% with gradient + deco
          ══════════════════════════════════════════ */}
      <div style={{
        position: "relative",
        background: `linear-gradient(145deg, ${PD} 0%, ${P} 55%, ${PL} 100%)`,
        paddingTop: 56,
        paddingBottom: 80,
        overflow: "hidden",
        flexShrink: 0,
      }}>

        {/* Decorative glowing circles */}
        <div style={{
          position: "absolute", top: -50, right: -50,
          width: 200, height: 200, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,255,255,0.14) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", bottom: 40, left: -60,
          width: 160, height: 160, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,255,255,0.10) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />
        {/* Small sparkle dots */}
        {[
          { x: "75%", y: "20%", r: 3 },
          { x: "15%", y: "60%", r: 2 },
          { x: "85%", y: "65%", r: 4 },
          { x: "30%", y: "15%", r: 2.5 },
        ].map((d, i) => (
          <div key={i} style={{
            position: "absolute", left: d.x, top: d.y,
            width: d.r * 2, height: d.r * 2, borderRadius: "50%",
            background: "rgba(255,255,255,0.45)",
            pointerEvents: "none",
          }} />
        ))}

        {/* Logo + branding */}
        <div style={{
          display: "flex", flexDirection: "column",
          alignItems: "center", gap: 14,
          position: "relative", zIndex: 1,
        }}>
          <div style={{
            width: 72, height: 72, borderRadius: 22,
            background: "rgba(255,255,255,0.18)",
            backdropFilter: "blur(8px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
          }}>
            <img
              src="/logo-icon.svg" alt="MobPae"
              width="44" height="29"
              style={{ filter: "brightness(0) invert(1)", objectFit: "contain" }}
            />
          </div>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: 26, fontWeight: 800, color: "white", margin: 0, letterSpacing: "-0.5px" }}>
              MobPae
            </p>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", margin: "4px 0 0", fontWeight: 400 }}>
              Your salary, when you need it.
            </p>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          MULTI-LAYER WAVE — transitions hero → form
          ══════════════════════════════════════════ */}
      <div style={{
        position: "relative", marginTop: -70,
        flexShrink: 0, lineHeight: 0,
      }}>
        <svg viewBox="0 0 390 90" preserveAspectRatio="none"
          style={{ width: "100%", height: 90, display: "block" }}>
          {/* Back wave — bright lavender */}
          <path
            d="M0,30 C60,70 130,0 210,35 C280,65 340,10 390,28 L390,90 L0,90 Z"
            fill="rgba(167,139,250,0.65)"
          />
          {/* Mid wave — medium purple */}
          <path
            d="M0,50 C80,10 160,75 260,45 C330,25 370,55 390,42 L390,90 L0,90 Z"
            fill="rgba(124,97,255,0.50)"
          />
          {/* Front wave — white */}
          <path
            d="M0,65 C70,30 170,80 270,58 C350,40 375,68 390,60 L390,90 L0,90 Z"
            fill="white"
          />
        </svg>
      </div>

      {/* ══════════════════════════════════════════
          FORM SECTION
          ══════════════════════════════════════════ */}
      <div style={{
        flex: 1, background: "white",
        padding: "0 28px 36px",
        display: "flex", flexDirection: "column",
        position: "relative",
      }}>

        {/* Subtle bottom-right accent */}
        <svg viewBox="0 0 160 160" style={{
          position: "absolute", bottom: 0, right: 0,
          width: 140, height: 140, pointerEvents: "none", opacity: 0.07,
        }}>
          <circle cx="140" cy="140" r="100" fill={P} />
          <circle cx="140" cy="140" r="60"  fill={PL} />
        </svg>

        {/* Section title */}
        <div style={{ marginBottom: 28 }}>
          <h2 style={{
            fontSize: 22, fontWeight: 800, color: "#1a1a2e",
            margin: "0 0 4px", letterSpacing: "-0.4px",
          }}>
            Welcome back 👋
          </h2>
          <p style={{ fontSize: 13, color: "#8B92A5", margin: 0, fontWeight: 400 }}>
            Sign in to access your account
          </p>
        </div>

        <form onSubmit={submit} style={{ position: "relative", zIndex: 1 }}>

          <FloatingInput
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            autoComplete="email"
          />

          <FloatingInput
            label="Password"
            type={showPass ? "text" : "password"}
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
            rightSlot={
              <button
                type="button"
                onClick={() => setShowPass(v => !v)}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  padding: 0, display: "flex", flexShrink: 0, color: P,
                }}
              >
                {showPass ? <EyeOff size={20} /> : <Lock size={20} />}
              </button>
            }
          />

          {/* Forgot password */}
          {onForgotPassword && (
            <div style={{ textAlign: "right", marginTop: -12, marginBottom: 20 }}>
              <button
                type="button" onClick={onForgotPassword}
                style={{
                  background: "none", border: "none", color: P,
                  fontSize: 13, fontWeight: 600, cursor: "pointer",
                  fontFamily: "Inter, sans-serif",
                }}
              >
                Forgot password?
              </button>
            </div>
          )}

          {/* Message */}
          {error && (
            <div style={{
              background: isSuccessMessage ? "#DCFCE7" : "#FEE2E2",
              color: isSuccessMessage ? "#15803D" : "#B91C1C",
              borderRadius: 12,
              padding: "11px 14px", fontSize: 13, marginBottom: 16,
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <span>{isSuccessMessage ? "✓" : "⚠"}</span> {error}
            </div>
          )}

          {/* Login button */}
          <button
            type="submit"
            disabled={!email || !password || loading}
            style={{
              width: "100%",
              background: !email || !password || loading
                ? "#A09CF0"
                : `linear-gradient(135deg, ${PD} 0%, ${PL} 100%)`,
              color: "white", border: "none",
              borderRadius: 16, padding: "17px",
              fontSize: 16, fontWeight: 700,
              fontFamily: "Inter, sans-serif",
              cursor: loading || !email || !password ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: !email || !password || loading
                ? "none"
                : "0 8px 24px rgba(91,60,227,0.38)",
              transition: "all 0.2s",
              letterSpacing: "0.02em",
            }}
          >
            {loading ? <span className="mp-spinner" /> : "Login"}
          </button>

          {/* Bottom hint */}
          <p style={{
            textAlign: "center", fontSize: 12, color: "#B0B7C3",
            marginTop: 20, lineHeight: 1.6,
          }}>
            Your account is created by your employer.<br />
            Contact HR if you haven't received credentials.
          </p>
        </form>
      </div>
    </div>
  );
}
