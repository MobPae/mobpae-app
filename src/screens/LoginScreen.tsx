import { useState } from "react";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Field } from "../components/ui/Field";
import { PrimaryButton } from "../components/ui/PrimaryButton";

type LoginScreenProps = {
  loading: boolean;
  onLogin: (email: string, password: string) => Promise<void>;
};

export function LoginScreen({ loading, onLogin }: LoginScreenProps) {
  const [email, setEmail] = useState("aarav.sharma@northstar.example");
  const [password, setPassword] = useState("password123");

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
        <p className="login-copy">Use employee credentials from the backend. Demo credentials remain filled for quick MVP review.</p>
        <Field label="Email" value={email} onChange={(event) => setEmail(event.target.value)} />
        <Field label="Password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
        <PrimaryButton icon={<ArrowRight size={18} />} disabled={loading} onClick={() => onLogin(email, password)}>
          {loading ? "Signing in" : "Sign in"}
        </PrimaryButton>
      </section>
    </main>
  );
}
