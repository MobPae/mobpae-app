import { useState } from "react";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Field } from "../components/ui/Field";
import { PrimaryButton } from "../components/ui/PrimaryButton";

type LoginScreenProps = {
  error: string;
  loading: boolean;
  onLogin: (email: string, password: string) => Promise<void>;
};

export function LoginScreen({ error, loading, onLogin }: LoginScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <main className="login-shell">
      <section className="login-card">
        <div className="brand-lockup">
          <span className="brand-mark">
            <ShieldCheck size={28} />
          </span>
          <div>
            <p className="eyebrow">MobPae Employee</p>
            <h1>Salary access, inside one clean app.</h1>
          </div>
        </div>
        <p className="login-copy">Use the employee login created by your backend or employer admin.</p>
        <Field label="Email" value={email} onChange={(event) => setEmail(event.target.value)} />
        <Field label="Password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
        {error ? <p className="form-error">{error}</p> : null}
        <PrimaryButton icon={<ArrowRight size={18} />} disabled={loading || !email || !password} onClick={() => onLogin(email, password)}>
          {loading ? "Signing in" : "Sign in"}
        </PrimaryButton>
      </section>
    </main>
  );
}
