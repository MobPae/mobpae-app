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
import { useState } from "react";
import { SubPageHeader } from "../components/layout/SubPageHeader";
import { SUPPORT_EMAIL } from "../config";

type HelpScreenProps = {
  onBack: () => void;
};

type TopicId = "advance" | "repayments" | "kyc" | "bank" | "security" | "general";

type Topic = {
  id: TopicId;
  icon: typeof Banknote;
  title: string;
  desc: string;
};

const TOPICS: Topic[] = [
  { id: "advance",    icon: Banknote,     title: "Salary Advance", desc: "How advances work" },
  { id: "repayments", icon: CreditCard,   title: "Repayments",     desc: "Payment schedule" },
  { id: "kyc",        icon: FileText,     title: "KYC & Docs",     desc: "Verification help" },
  { id: "bank",       icon: Wallet,       title: "Bank Account",   desc: "Account issues" },
  { id: "security",   icon: Lock,         title: "Account & Security", desc: "Password & access" },
  { id: "general",    icon: HelpCircle,   title: "General",        desc: "Other questions" },
];

const FAQS: { q: string; a: string; topics: TopicId[] }[] = [
  {
    q: "How do I request a salary advance?",
    a: "Go to the Advance tab, enter the amount you need, and submit your request. Your employer will review and approve it.",
    topics: ["advance", "general"],
  },
  {
    q: "When will the money reach my account?",
    a: "Once your employer approves the advance, funds are typically credited within 24 hours to your linked bank account.",
    topics: ["advance", "bank"],
  },
  {
    q: "How is interest calculated?",
    a: "Interest is calculated on the principal amount from the date of disbursal to your next payday. The exact rate is shown before you confirm your request.",
    topics: ["advance", "repayments", "general"],
  },
  {
    q: "What documents do I need for KYC?",
    a: "You need to upload your PAN card, Aadhaar card (both sides as one image), and a recent salary slip. All files must be clear and under 5 MB.",
    topics: ["kyc"],
  },
  {
    q: "How is repayment deducted?",
    a: "Repayment is automatically deducted from your salary account on your payday. Ensure your account has sufficient funds.",
    topics: ["repayments", "bank"],
  },
  {
    q: "Can I repay early?",
    a: "Early repayment is not yet supported. Your advance will be recovered on the scheduled payday date.",
    topics: ["repayments", "general"],
  },
  {
    q: "I forgot my password. What do I do?",
    a: "On the login screen, tap 'Forgot password?' and enter your registered email. You will receive a reset link.",
    topics: ["security", "general"],
  },
  {
    q: "Why is my KYC document showing 'Rejected'?",
    a: "A rejected document usually means the image was unclear, incomplete, or did not match the required type. Upload a clear, well-lit image and re-submit.",
    topics: ["kyc"],
  },
];

export function HelpScreen({ onBack }: HelpScreenProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activeTopic, setActiveTopic] = useState<TopicId | null>(null);

  const filteredFaqs = activeTopic
    ? FAQS.filter((faq) => faq.topics.includes(activeTopic))
    : FAQS;

  const handleTopicClick = (id: TopicId) => {
    setActiveTopic((prev) => (prev === id ? null : id));
    setOpenFaq(null);
  };

  return (
    <div className="help-screen">
      <SubPageHeader title="Help & Support" onBack={onBack} />

      <div className="help-content" style={{ padding: "12px 0" }}>

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
          {TOPICS.map((topic) => {
            const Icon = topic.icon;
            const isActive = activeTopic === topic.id;
            return (
              <button
                key={topic.id}
                type="button"
                onClick={() => handleTopicClick(topic.id)}
                className={`help-topic-card${isActive ? " help-topic-card--active" : ""}`}
                style={{ textAlign: "left", fontFamily: "inherit", cursor: "pointer" }}
              >
                <div className="help-topic-icon"><Icon size={20} /></div>
                <div className="help-topic-title">{topic.title}</div>
                <div className="help-topic-desc">{topic.desc}</div>
              </button>
            );
          })}
        </div>

        {/* ── FAQ ── */}
        <div className="help-section-label">
          {activeTopic
            ? `${TOPICS.find((t) => t.id === activeTopic)?.title ?? "Topic"} — Questions`
            : "Common Questions"}
        </div>
        <div className="help-faq-card">
          {filteredFaqs.length === 0 ? (
            <div style={{ padding: "20px 16px", color: "#8A8892", fontSize: 13, fontWeight: 600 }}>
              No questions for this topic yet.
            </div>
          ) : (
            filteredFaqs.map((faq, i) => {
              const globalIdx = FAQS.indexOf(faq);
              return (
                <div
                  key={globalIdx}
                  style={{ borderBottom: i < filteredFaqs.length - 1 ? "1px solid #F3F1FF" : "none" }}
                >
                  <button
                    type="button"
                    className="help-faq-row"
                    onClick={() => setOpenFaq(openFaq === globalIdx ? null : globalIdx)}
                    style={{ width: "100%", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}
                  >
                    <HelpCircle size={15} className="help-faq-q-icon" />
                    <span className="help-faq-q-text">{faq.q}</span>
                    <ChevronRight
                      size={14}
                      className="help-faq-arrow"
                      style={{ transform: openFaq === globalIdx ? "rotate(90deg)" : undefined, transition: "transform 0.2s", flexShrink: 0 }}
                    />
                  </button>
                  {openFaq === globalIdx && (
                    <div className="help-faq-answer">{faq.a}</div>
                  )}
                </div>
              );
            })
          )}
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
