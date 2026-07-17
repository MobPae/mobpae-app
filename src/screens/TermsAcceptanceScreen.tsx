// ── TermsAcceptanceScreen.tsx ─────────────────────────────────────────────────
// Shown once after first-time forced password change.
// User must accept Terms & Conditions before accessing the app.

import { useState } from "react";
import { FileText } from "lucide-react";

type Props = {
  onAccept: () => Promise<void>;
  onLogout?: () => void;
};

export function TermsAcceptanceScreen({ onAccept, onLogout }: Props) {
  const [accepting, setAccepting] = useState(false);
  const [checked, setChecked] = useState(false);
  const [error, setError] = useState("");

  const handleAccept = async () => {
    if (!checked) {
      setError("Please read and accept the Terms & Conditions to continue.");
      return;
    }
    setAccepting(true);
    setError("");
    try {
      await onAccept();
    } catch {
      setError("Something went wrong. Please try again.");
      setAccepting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        background: "#ffffff",
        padding: "24px 20px",
        paddingTop: "env(safe-area-inset-top, 24px)",
        paddingBottom: "calc(env(safe-area-inset-bottom, 16px) + 8px)",
        boxSizing: "border-box",
      }}
    >
      {/* Log out link — shown top-right so user isn't permanently trapped */}
      {onLogout && (
        <div style={{ textAlign: "right", marginBottom: 4 }}>
          <button
            type="button"
            onClick={onLogout}
            style={{
              border: 0,
              background: "transparent",
              color: "#6B6878",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              padding: "4px 0",
            }}
          >
            Log out
          </button>
        </div>
      )}

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            background: "#315eff18",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
          }}
        >
          <FileText size={26} color="#315eff" strokeWidth={1.6} />
        </div>
        <h1
          style={{
            fontSize: 22,
            fontWeight: 500,
            color: "#111",
            margin: 0,
            lineHeight: 1.3,
          }}
        >
          Terms &amp; Conditions
        </h1>
        <p
          style={{
            fontSize: 14,
            color: "#666",
            margin: "8px 0 0",
            lineHeight: 1.5,
          }}
        >
          Please read and accept our terms before using MobPae.
        </p>
      </div>

      {/* Scrollable T&C text */}
      <div
        style={{
          flex: 1,
          background: "#f7f7fb",
          borderRadius: 16,
          border: "1px solid #e8e6f0",
          padding: "16px 18px",
          overflowY: "auto",
          marginBottom: 20,
          fontSize: 13,
          color: "#444",
          lineHeight: 1.7,
        }}
      >
        <p style={{ margin: "0 0 12px", fontWeight: 500, color: "#111" }}>
          MobPae Employee Salary Advance — Terms of Use
        </p>

        <p style={{ margin: "0 0 10px" }}>
          By using the MobPae platform, you agree to the following terms and
          conditions. Please read them carefully.
        </p>

        <p style={{ margin: "0 0 6px", fontWeight: 500, color: "#333" }}>
          1. Eligibility
        </p>
        <p style={{ margin: "0 0 12px" }}>
          The salary advance service is available only to employees whose
          employer has enrolled with MobPae and who have completed the required
          KYC verification.
        </p>

        <p style={{ margin: "0 0 6px", fontWeight: 500, color: "#333" }}>
          2. Salary Advance
        </p>
        <p style={{ margin: "0 0 12px" }}>
          Advances are limited to a percentage of your earned salary as
          determined by your employer's configuration. The advance amount,
          applicable fees, and repayment schedule will be displayed before
          you confirm any request.
        </p>

        <p style={{ margin: "0 0 6px", fontWeight: 500, color: "#333" }}>
          3. Repayment
        </p>
        <p style={{ margin: "0 0 12px" }}>
          Repayment is automatically deducted from your salary on the next
          payroll date. You are responsible for ensuring your salary account
          details are accurate.
        </p>

        <p style={{ margin: "0 0 6px", fontWeight: 500, color: "#333" }}>
          4. Fees &amp; Charges
        </p>
        <p style={{ margin: "0 0 12px" }}>
          A platform fee may apply for each advance transaction. This fee will
          be clearly disclosed before you confirm your request. No hidden
          charges apply.
        </p>

        <p style={{ margin: "0 0 6px", fontWeight: 500, color: "#333" }}>
          5. Data Privacy
        </p>
        <p style={{ margin: "0 0 12px" }}>
          Your personal and financial data is processed in accordance with our
          Privacy Policy. We do not sell your data to third parties.
        </p>

        <p style={{ margin: "0 0 6px", fontWeight: 500, color: "#333" }}>
          6. Account Security
        </p>
        <p style={{ margin: "0 0 12px" }}>
          You are responsible for maintaining the confidentiality of your login
          credentials. Report any unauthorised access immediately.
        </p>

        <p style={{ margin: "0 0 6px", fontWeight: 500, color: "#333" }}>
          7. Amendments
        </p>
        <p style={{ margin: "0 0 0" }}>
          MobPae reserves the right to update these terms at any time.
          Continued use of the platform constitutes acceptance of the revised
          terms.
        </p>
      </div>

      {/* Checkbox */}
      <label
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 12,
          marginBottom: 16,
          cursor: "pointer",
        }}
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => {
            setChecked(e.target.checked);
            if (e.target.checked) setError("");
          }}
          style={{
            width: 18,
            height: 18,
            marginTop: 2,
            accentColor: "#315eff",
            flexShrink: 0,
            cursor: "pointer",
          }}
        />
        <span style={{ fontSize: 13, color: "#444", lineHeight: 1.5 }}>
          I have read and agree to the MobPae Terms &amp; Conditions and Privacy
          Policy.
        </span>
      </label>

      {error && (
        <p
          style={{
            fontSize: 13,
            color: "#e53935",
            margin: "0 0 12px",
            textAlign: "center",
          }}
        >
          {error}
        </p>
      )}

      {/* Accept button */}
      <button
        type="button"
        onClick={handleAccept}
        disabled={accepting}
        style={{
          width: "100%",
          height: 52,
          borderRadius: 14,
          background: checked ? "#315eff" : "#d0d8ff",
          color: "#fff",
          fontSize: 15,
          fontWeight: 500,
          border: "none",
          cursor: checked ? "pointer" : "not-allowed",
          transition: "background 0.2s ease",
        }}
      >
        {accepting ? "Saving…" : "Accept & Continue"}
      </button>
    </div>
  );
}
