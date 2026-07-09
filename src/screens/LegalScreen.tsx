import { ChevronLeft, FileText, Lock, Scale, Shield } from "lucide-react";
import type { Theme } from "../hooks/useTheme";

type LegalScreenProps = {
  onBack: () => void;
  theme?: Theme;
};

const DARK = "#0C0C0E";
const BORDER = "#26262B";
const TEXT = "#F2F0EA";
const MUTED = "#7C7C85";
const DIM = "#5C5C64";
const PANEL = "#141418";
const WARM = "#B4591F";

function legalPalette(theme: Theme) {
  if (theme === "light") {
    return {
      bg: "#FFFFFF",
      panel: "#FFFFFF",
      panelSoft: "#F5F3FB",
      border: "#E9E6F1",
      text: "#17151F",
      muted: "#6B6878",
      dim: "#9A97A8",
      rule: "#F1EEF7",
      warm: WARM,
      headerBg: "#FFFFFF",
    };
  }
  return {
    bg: DARK,
    panel: PANEL,
    panelSoft: "#17171B",
    border: BORDER,
    text: TEXT,
    muted: MUTED,
    dim: DIM,
    rule: "#1C1C20",
    warm: WARM,
    headerBg: DARK,
  };
}

type DocSection = {
  icon: typeof FileText;
  title: string;
  lastUpdated: string;
  paragraphs: string[];
};

const SECTIONS: DocSection[] = [
  {
    icon: Scale,
    title: "Terms & Conditions",
    lastUpdated: "1 July 2026",
    paragraphs: [
      "MobPae provides earned salary advance services to employees of registered employer organisations. By using this application, you agree to these terms in full.",
      "Advances are subject to your employer's approval and MobPae's eligibility criteria. Approved amounts are disbursed to your linked and verified bank account only.",
      "Repayment is recovered automatically from your salary on the next payday. You authorise your employer to deduct the principal plus applicable interest from your salary.",
      "Interest is charged at the rate disclosed before you confirm your advance request. The exact rate and total repayment amount are shown on the review screen.",
      "MobPae reserves the right to modify eligibility rules, fees, or service availability at any time with prior notice. Continued use after notice constitutes acceptance.",
    ],
  },
  {
    icon: Lock,
    title: "Privacy Policy",
    lastUpdated: "1 July 2026",
    paragraphs: [
      "MobPae collects information necessary to deliver the salary advance service: your name, employer details, PAN, Aadhaar, bank account details, and salary slips.",
      "Your data is stored securely on encrypted infrastructure in India. We do not sell or share your personal data with third parties except as required to operate the service (e.g. your employer for payroll deduction).",
      "KYC documents are used solely for identity verification and regulatory compliance. Document images are stored in a private, access-controlled cloud store and are never publicly accessible.",
      "You may request deletion of your account and associated data by contacting support. Certain records must be retained for the period required by law.",
    ],
  },
  {
    icon: FileText,
    title: "Advance Terms",
    lastUpdated: "1 July 2026",
    paragraphs: [
      "A salary advance is a short-term facility allowing you to access a portion of your earned salary before your payday. It is not a loan.",
      "The advance amount you may request is determined by your employer's approved limit, which is typically a percentage of your monthly take-home salary.",
      "By confirming an advance request, you authorise a one-time auto-debit of the full repayment amount (principal + interest) from your salary account on the scheduled recovery date.",
      "If the auto-debit fails, you are responsible for repaying the outstanding amount within 3 business days. Repeated failures may affect your eligibility for future advances.",
      "Early repayment is not currently supported. Interest accrues from the date of disbursal to the recovery date as shown in your advance confirmation.",
    ],
  },
  {
    icon: Shield,
    title: "Data & Security",
    lastUpdated: "1 July 2026",
    paragraphs: [
      "All data transmitted between the app and MobPae servers is encrypted using TLS 1.2 or higher. Document uploads are stored using AES-256 encryption at rest.",
      "Access to your data is restricted to authorised MobPae personnel and your employer solely for advance-related decisions. No third party has access to your documents.",
      "Never share your app password or OTPs with anyone, including MobPae support. We will never ask for your password.",
    ],
  },
];

export function LegalScreen({ onBack, theme = "dark" }: LegalScreenProps) {
  const colors = legalPalette(theme);

  return (
    <div
      style={{
        minHeight: "100%",
        background: colors.bg,
        color: colors.text,
        
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "max(14px, calc(env(safe-area-inset-top, 0px) + 14px)) 20px 12px",
          background: colors.headerBg,
          borderBottom: `1px solid ${colors.border}`,
        }}
      >
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            border: `1px solid ${colors.border}`,
            background: "transparent",
            color: colors.text,
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
          }}
        >
          <ChevronLeft size={22} strokeWidth={2.2} />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              color: colors.muted,
              fontSize: 12,
              fontWeight: 500,
              letterSpacing: "0.28em",
              textTransform: "uppercase",
            }}
          >
            Legal
          </div>
        </div>
      </div>

      {/* Notice */}
      <div
        style={{
          margin: "18px 22px 0",
          padding: "13px 16px",
          borderRadius: 14,
          border: `1px solid ${colors.border}`,
          background: colors.panel,
          color: colors.muted,
          fontSize: 12,
          fontWeight: 400,
          lineHeight: 1.55,
        }}
      >
        These are placeholder documents. Final legal copy will be published before the public launch of MobPae.
      </div>

      {/* Sections */}
      <div style={{ padding: "20px 22px 40px", display: "flex", flexDirection: "column", gap: 24 }}>
        {SECTIONS.map((section) => {
          const Icon = section.icon;
          return (
            <section
              key={section.title}
              style={{
                border: `1px solid ${colors.border}`,
                borderRadius: 20,
                background: colors.panel,
                overflow: "hidden",
              }}
            >
              {/* Section header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "18px 20px 16px",
                  borderBottom: `1px solid ${colors.rule}`,
                }}
              >
                <span
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 12,
                    border: `1px solid ${colors.border}`,
                    background: colors.panelSoft,
                    color: colors.muted,
                    display: "grid",
                    placeItems: "center",
                    flexShrink: 0,
                  }}
                >
                  <Icon size={18} strokeWidth={1.8} />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      color: colors.text,
                      fontSize: 15,
                      fontWeight: 500,
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {section.title}
                  </div>
                  <div
                    style={{
                      color: colors.dim,
                      fontSize: 11,
                      fontWeight: 400,
                      marginTop: 4,
                      
                    }}
                  >
                    Updated {section.lastUpdated}
                  </div>
                </div>
              </div>

              {/* Body */}
              <div style={{ padding: "18px 20px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
                {section.paragraphs.map((para, i) => (
                  <p
                    key={i}
                    style={{
                      margin: 0,
                      color: colors.muted,
                      fontSize: 13.5,
                      fontWeight: 500,
                      lineHeight: 1.65,
                    }}
                  >
                    {para}
                  </p>
                ))}
              </div>
            </section>
          );
        })}

        {/* Contact footer */}
        <div
          style={{
            textAlign: "center",
            color: colors.dim,
            fontSize: 12,
            fontWeight: 400,
            lineHeight: 1.6,
          }}
        >
          Questions? Contact us at{" "}
          <a
            href="mailto:legal@mobpae.com"
            style={{ color: colors.warm, textDecoration: "none" }}
          >
            legal@mobpae.com
          </a>
        </div>
      </div>
    </div>
  );
}
