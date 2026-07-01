import {
  Banknote,
  ChevronRight,
  CreditCard,
  FileText,
  HelpCircle,
  Lock,
  Mail,
  MessageCircle,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { SubPageHeader } from "../components/layout/SubPageHeader";
import { SUPPORT_EMAIL } from "../config";

type HelpScreenProps = {
  onBack: () => void;
};

const TOPICS = [
  { icon: <Banknote size={20} />, title: "Salary Advance", desc: "How advances work" },
  { icon: <CreditCard size={20} />, title: "Repayments", desc: "Payment schedule" },
  { icon: <FileText size={20} />, title: "KYC & Docs", desc: "Verification help" },
  { icon: <Wallet size={20} />, title: "Bank Account", desc: "Account issues" },
  { icon: <Lock size={20} />, title: "Account & Security", desc: "Password & access" },
  { icon: <HelpCircle size={20} />, title: "General", desc: "Other questions" },
];

const FAQS: { q: string; a: string }[] = [
  { q: "How do I request a salary advance?", a: "Go to the Advance tab, enter the amount you need, and submit your request. Your employer will review and approve it." },
  { q: "When will the money reach my account?", a: "Once your employer approves the advance, funds are typically credited within 24 hours to your linked bank account." },
  { q: "How is interest calculated?", a: "Interest is calculated on the principal amount from the date of disbursal to your next payday. The exact rate is shown before you confirm your request." },
  { q: "What documents do I need for KYC?", a: "You need to upload your PAN card, Aadhaar card (front & back), and a recent salary slip. All files must be clear and under 5 MB." },
  { q: "How is repayment deducted?", a: "Repayment is automatically deducted from your salary account on your payday. Ensure your account has sufficient funds." },
  { q: "Can I repay early?", a: "Early repayment is not yet supported. Your advance will be recovered on the scheduled payday date." },
];

import { useState } from "react";

export function HelpScreen({ onBack }: HelpScreenProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="help-screen">
      <SubPageHeader title="Help & Support" onBack={onBack} />

      <div className="screen-body" style={{ padding: "12px 0" }}>

        {/* ── Contact strip ── */}
        <div className="help-contact-strip">
          <div className="help-contact-strip-left">
            <div className="help-contact-strip-icon"><MessageCircle size={18} color="#5B3CE3" /></div>
            <div>
              <div className="help-contact-strip-title">Support</div>
              <div className="help-contact-strip-sub">Mon–Sat · 9am–6pm IST</div>
            </div>
          </div>
          <a href={`mailto:${SUPPORT_EMAIL}`} className="help-contact-strip-btn">
            <Mail size={13} /> Email us
          </a>
        </div>

        {/* ── Topics ── */}
        <div className="help-section-label">Browse Topics</div>
        <div className="help-topic-grid">
          {TOPICS.map((t) => (
            <div key={t.title} className="help-topic-card">
              <div className="help-topic-icon">{t.icon}</div>
              <div className="help-topic-title">{t.title}</div>
              <div className="help-topic-desc">{t.desc}</div>
            </div>
          ))}
        </div>

        {/* ── FAQ ── */}
        <div className="help-section-label">Common Questions</div>
        <div className="help-faq-card">
          {FAQS.map((faq, i) => (
            <div key={i} style={{ borderBottom: i < FAQS.length - 1 ? "1px solid #F3F1FF" : "none" }}>
              <button
                type="button"
                className="help-faq-row"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                style={{ width: "100%", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}
              >
                <HelpCircle size={15} className="help-faq-q-icon" />
                <span className="help-faq-q-text">{faq.q}</span>
                <ChevronRight
                  size={14}
                  className="help-faq-arrow"
                  style={{ transform: openFaq === i ? "rotate(90deg)" : undefined, transition: "transform 0.2s", flexShrink: 0 }}
                />
              </button>
              {openFaq === i && (
                <div className="help-faq-answer">{faq.a}</div>
              )}
            </div>
          ))}
        </div>

        {/* ── Security note ── */}
        <div className="help-security-card">
          <ShieldCheck size={16} className="help-security-icon" />
          <div className="help-security-body">
            <div className="help-security-title">Your data is protected</div>
            <div className="help-security-sub">256-bit SSL · RBI compliant · Never share OTPs</div>
          </div>
        </div>

        <div className="mp-bottom-space" />
      </div>
    </div>
  );
}
