import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  ChevronRight,
  CreditCard,
  FileText,
  HelpCircle,
  Lock,
  Mail,
  MessageCircle,
  Phone,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import type { View } from "../types/app";
import { SUPPORT_EMAIL } from "../config";

type HelpScreenProps = {
  onBack: () => void;
  onNavigate: (view: View) => void;
};

const TOPICS = [
  { icon: <Banknote size={20} />, title: "Salary Advance", desc: "How advances work" },
  { icon: <CreditCard size={20} />, title: "Repayments", desc: "Payment schedule" },
  { icon: <FileText size={20} />, title: "KYC & Docs", desc: "Verification help" },
  { icon: <Wallet size={20} />, title: "Bank Account", desc: "Account issues" },
  { icon: <Lock size={20} />, title: "Account & Security", desc: "Password & access" },
  { icon: <HelpCircle size={20} />, title: "General", desc: "Other questions" },
];

const FAQS = [
  "How do I request a salary advance?",
  "When will the money reach my account?",
  "How is interest calculated?",
  "What documents do I need for KYC?",
  "How is repayment deducted?",
  "Can I repay early?",
];

export function HelpScreen({ onBack }: HelpScreenProps) {
  return (
    <div className="help-screen">

      {/* Header */}
      <div className="mp-topbar">
        <button type="button" className="mp-topbar-back" onClick={onBack}>
          <ArrowLeft size={16} /> Back
        </button>
        <div style={{ fontSize: 15, fontWeight: 800, color: "#0F0A3C" }}>Help & Support</div>
        <div style={{ width: 60 }} />
      </div>

      <div className="screen-body" style={{ padding: "12px 0" }}>

        {/* Contact card */}
        <div className="help-contact-card">
          <div className="help-contact-icon">
            <MessageCircle size={40} color="#5B3CE3" />
          </div>
          <div className="help-contact-body">
            <div className="help-contact-title">Talk to Support</div>
            <div className="help-contact-sub">
              Our team is available Mon–Sat, 9am–6pm IST to help with any questions.
            </div>
            <button
              type="button"
              className="help-contact-btn"
              onClick={() => { window.location.href = `mailto:${SUPPORT_EMAIL}`; }}
            >
              <Mail size={14} /> Email Support
            </button>
            <div className="help-contact-online">
              <span className="help-contact-dot" /> Online now
            </div>
          </div>
        </div>

        {/* Section label */}
        <div style={{ padding: "4px 16px 8px", fontSize: 12, fontWeight: 800, color: "#6B7280", textTransform: "uppercase", letterSpacing: ".06em" }}>
          Browse Topics
        </div>

        {/* Topic grid */}
        <div className="help-topic-grid">
          {TOPICS.map((t) => (
            <button key={t.title} type="button" className="help-topic-card">
              <div className="help-topic-icon">{t.icon}</div>
              <div className="help-topic-title">{t.title}</div>
              <div className="help-topic-desc">{t.desc}</div>
              <div className="help-topic-arrow"><ChevronRight size={12} /></div>
            </button>
          ))}
        </div>

        {/* FAQ card */}
        <div style={{ padding: "0 0 8px", fontSize: 12, fontWeight: 800, color: "#6B7280", textTransform: "uppercase", letterSpacing: ".06em", margin: "4px 16px 8px" }}>
          Frequently Asked Questions
        </div>
        <div className="help-faq-card">
          {FAQS.map((q) => (
            <div key={q} className="help-faq-row">
              <HelpCircle size={16} className="help-faq-q-icon" />
              <span className="help-faq-q-text">{q}</span>
              <ChevronRight size={14} className="help-faq-arrow" />
            </div>
          ))}
        </div>

        {/* Security note */}
        <div className="help-security-card">
          <ShieldCheck size={20} className="help-security-icon" />
          <div className="help-security-body">
            <div className="help-security-title">Your data is protected</div>
            <div className="help-security-sub">256-bit SSL · RBI compliant · Never share OTPs</div>
          </div>
        </div>

        {/* Phone contact */}
        <div style={{ margin: "0 16px 16px", background: "white", borderRadius: 16, border: "1px solid #F0EEFF", padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
          <Phone size={20} color="#5B3CE3" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#0F0A3C" }}>Call Us</div>
            <div style={{ fontSize: 12, color: "#6B7280" }}>Mon–Sat · 9am–6pm IST</div>
          </div>
          <a href="tel:+918000000000" style={{ color: "#5B3CE3", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
            Call <ArrowRight size={14} />
          </a>
        </div>

        <div className="mp-bottom-space" />
      </div>
    </div>
  );
}
