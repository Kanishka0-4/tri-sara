"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

const questions = [
  { id: 1,  text: "How much did this course improve your understanding of the subject?",       options: ["Not At All", "Slightly", "Moderately", "Significantly", "Extremely"] },
  { id: 2,  text: "How confident do you feel about the topics after completing the course?",   options: ["Not Confident", "Slightly Confident", "Moderately Confident", "Confident", "Very Confident"] },
  { id: 3,  text: "How well did the content match your preferred learning style?",             options: ["Not Matched", "Slightly Matched", "Moderately Matched", "Well Matched", "Perfectly Matched"] },
  { id: 4,  text: "Did the system adapt content based on your quiz performance?",             options: ["Not At All", "Slightly", "Moderately", "Effectively", "Very Effectively"] },
  { id: 5,  text: "How relevant were the quiz questions to the content?",                      options: ["Not Relevant", "Slightly Relevant", "Moderately Relevant", "Relevant", "Highly Relevant"] },
  { id: 6,  text: "Did the difficulty level adjust appropriately as you progressed?",          options: ["Not Adjusted", "Slightly Adjusted", "Moderately Adjusted", "Well Adjusted", "Perfectly Adjusted"] },
  { id: 7,  text: "How engaging was the course content?",                                      options: ["Not Engaging", "Slightly Engaging", "Moderately Engaging", "Engaging", "Highly Engaging"] },
  { id: 8,  text: "Was the module-by-module structure helpful for learning?",                  options: ["Not Helpful", "Slightly Helpful", "Moderately Helpful", "Helpful", "Very Helpful"] },
  { id: 9,  text: "How easy was it to navigate through the platform?",                         options: ["Not Easy", "Slightly Easy", "Moderately Easy", "Easy", "Very Easy"] },
  { id: 10, text: "How would you rate the overall effectiveness of this adaptive learning system?", options: ["Very Poor", "Poor", "Average", "Good", "Excellent"] },
  { id: 11, text: "Would you prefer this system over traditional learning methods?",           options: ["Definitely No", "Maybe No", "Not Sure", "Maybe Yes", "Definitely Yes"] },
  { id: 12, text: "How likely are you to recommend this course to others?",                   options: ["Definitely No", "Maybe No", "Not Sure", "Maybe Yes", "Definitely Yes"] },
];

const scaleColors = [
  "var(--ts-rose)",
  "#f97316",
  "var(--ts-amber)",
  "#84cc16",
  "var(--ts-green)",
];

export default function FeedbackPage() {
  const [answers,    setAnswers   ] = useState<Record<number, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted,  setSubmitted ] = useState(false);
  const router    = useRouter();
  const params    = useParams();
  const subjectId = typeof params.id === "string" ? params.id : Array.isArray(params.id) ? params.id[0] : null;

  const handleChange = (qid: number, optionIdx: number) => {
    setAnswers(prev => ({ ...prev, [qid]: optionIdx + 1 }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subjectId, answers }),
      });
      setSubmitted(true);
    } catch {
      alert("Failed to submit feedback.");
    } finally {
      setSubmitting(false);
    }
  };

  const answered    = Object.keys(answers).length;
  const total       = questions.length;
  const progressPct = Math.round((answered / total) * 100);
  const allAnswered  = answered === total;

  /* ── Success screen ── */
  if (submitted) return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap');
        @keyframes fb-pop { 0%{transform:scale(0.8);opacity:0} 70%{transform:scale(1.06)} 100%{transform:scale(1);opacity:1} }
      `}</style>
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center",
        justifyContent: "center", background: "var(--ts-bg)",
        fontFamily: "'Space Grotesk', sans-serif", padding: 24,
      }}>
        <div style={{
          borderRadius: 24, padding: "48px 40px", textAlign: "center",
          background: "var(--ts-surface)", border: "1px solid var(--ts-border-hi)",
          boxShadow: "0 0 0 1px var(--ts-border-hi), 0 12px 48px rgba(0,0,0,0.5), inset 0 0 60px var(--ts-violet-soft)",
          maxWidth: 440, width: "100%",
          animation: "fb-pop 0.5s cubic-bezier(0.22,1,0.36,1) both",
          position: "relative", overflow: "hidden",
        }}>
          <div style={{
            position: "absolute", top: 0, left: "15%", width: "70%", height: 1,
            background: "linear-gradient(90deg, transparent, var(--ts-violet), var(--ts-cyan), transparent)",
          }} />
          <div style={{ fontSize: 52, marginBottom: 16 }}>🎉</div>
          <h2 style={{ fontSize: "1.4rem", fontWeight: 700, color: "var(--ts-text)", marginBottom: 8 }}>
            Thank you!
          </h2>
          <p style={{ color: "var(--ts-text-muted)", fontSize: 14, lineHeight: 1.6, marginBottom: 28 }}>
            Your feedback helps us improve the adaptive learning experience for everyone.
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            style={{
              padding: "11px 28px", borderRadius: 12,
              background: "linear-gradient(135deg, var(--ts-violet), #818cf8)",
              color: "#fff", border: "none",
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 14, fontWeight: 700, cursor: "pointer",
              boxShadow: "0 0 20px var(--ts-violet-glow)",
            }}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap');
        @keyframes fb-fadein { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fb-shimmer {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }

        .fb-root {
          min-height: 100vh;
          background: var(--ts-bg);
          font-family: 'Space Grotesk', sans-serif;
          padding: 0 0 80px;
        }

        /* sticky header */
        .fb-header {
          position: sticky;
          top: 0;
          z-index: 20;
          background: var(--ts-surface);
          border-bottom: 1px solid var(--ts-border);
          padding: 14px 32px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }

        .fb-progress-track {
          flex: 1;
          min-width: 120px;
          max-width: 260px;
          height: 4px;
          border-radius: 99px;
          background: var(--ts-surface-hi);
          overflow: hidden;
          position: relative;
        }
        .fb-progress-fill {
          height: 100%;
          border-radius: 99px;
          background: linear-gradient(90deg, var(--ts-violet), var(--ts-cyan));
          box-shadow: 0 0 8px var(--ts-violet-glow);
          transition: width 0.4s ease;
          position: relative;
          overflow: hidden;
        }
        .fb-progress-fill::after {
          content: '';
          position: absolute;
          top: 0; left: 0; bottom: 0; width: 40%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent);
          animation: fb-shimmer 2s linear infinite;
        }

        .fb-content {
          max-width: 780px;
          margin: 0 auto;
          padding: 48px 24px 0;
        }

        .fb-q-card {
          border-radius: 18px;
          padding: 28px;
          background: var(--ts-surface);
          border: 1px solid var(--ts-border-hi);
          box-shadow: 0 0 0 1px var(--ts-border-hi), 0 8px 32px rgba(0,0,0,0.35), inset 0 0 40px var(--ts-violet-soft);
          animation: fb-fadein 0.4s ease both;
          position: relative;
          overflow: hidden;
          margin-bottom: 16px;
        }
        .fb-q-card::before {
          content: '';
          position: absolute;
          top: 0; left: 15%; width: 70%; height: 1px;
          background: linear-gradient(90deg, transparent, var(--ts-violet), var(--ts-cyan), transparent);
          opacity: 0.4;
        }

        .fb-q-num {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--ts-violet);
          margin-bottom: 8px;
        }

        .fb-q-text {
          font-size: clamp(0.9rem, 2vw, 1rem);
          font-weight: 600;
          color: var(--ts-text);
          line-height: 1.55;
          margin-bottom: 20px;
        }

        .fb-scale {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .fb-scale-btn {
          flex: 1;
          min-width: 80px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          padding: 12px 8px;
          border-radius: 12px;
          border: 1px solid var(--ts-border);
          background: var(--ts-surface-hi);
          color: var(--ts-text-muted);
          font-family: 'Space Grotesk', sans-serif;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.18s;
          text-align: center;
          line-height: 1.3;
        }
        .fb-scale-btn:hover:not(.selected) {
          border-color: var(--ts-border-hi);
          background: var(--ts-surface);
          color: var(--ts-text);
        }
        .fb-scale-btn.selected {
          color: #fff;
          border-color: transparent;
          box-shadow: 0 0 14px rgba(0,0,0,0.2);
        }

        .fb-submit {
          display: block;
          margin: 40px auto 0;
          padding: 14px 40px;
          border-radius: 14px;
          border: none;
          font-family: 'Space Grotesk', sans-serif;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          letter-spacing: 0.02em;
        }
        .fb-submit:not(:disabled) {
          background: linear-gradient(135deg, var(--ts-violet), #818cf8);
          color: #fff;
          box-shadow: 0 0 24px var(--ts-violet-glow);
        }
        .fb-submit:not(:disabled):hover {
          opacity: 0.88;
          transform: translateY(-1px);
        }
        .fb-submit:disabled {
          background: var(--ts-surface-hi);
          color: var(--ts-text-dim);
          cursor: not-allowed;
        }

        @media (max-width: 540px) {
          .fb-scale { gap: 6px; }
          .fb-scale-btn { min-width: 60px; font-size: 10px; padding: 10px 6px; }
          .fb-header { padding: 12px 16px; }
          .fb-content { padding: 28px 16px 0; }
        }
      `}</style>

      <div className="fb-root">

        {/* Sticky header */}
        <div className="fb-header">
          <button
            onClick={() => router.back()}
            style={{
              background: "none", border: "none", padding: 0,
              color: "var(--ts-text-muted)", fontSize: 13, fontWeight: 500,
              cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
              fontFamily: "'Space Grotesk', sans-serif",
            }}
          >
            ← Back
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, justifyContent: "center" }}>
            <div className="fb-progress-track">
              <div className="fb-progress-fill" style={{ width: `${progressPct}%` }} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--ts-violet)", whiteSpace: "nowrap" }}>
              {answered}/{total}
            </span>
          </div>

          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: "var(--ts-violet-soft)", border: "1px solid var(--ts-border-hi)",
            borderRadius: 999, padding: "4px 12px",
            fontSize: 10, fontWeight: 700, letterSpacing: "0.12em",
            textTransform: "uppercase", color: "var(--ts-violet)",
          }}>
            Feedback
          </div>
        </div>

        <div className="fb-content">

          {/* Page title */}
          <div style={{ marginBottom: 36 }}>
            <h1 style={{
              fontSize: "clamp(1.3rem, 3vw, 1.8rem)",
              fontWeight: 700, color: "var(--ts-text)",
              margin: "0 0 8px", lineHeight: 1.2,
            }}>
              Course Feedback
            </h1>
            <p style={{ color: "var(--ts-text-muted)", fontSize: 14, margin: 0 }}>
              Share your honest experience — it takes about 2 minutes.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            {questions.map((q, qi) => {
              const selected = answers[q.id];
              return (
                <motion.div
                  key={q.id}
                  className="fb-q-card"
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: qi * 0.04, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  style={{ animationDelay: `${qi * 40}ms` }}
                >
                  <div className="fb-q-num">Question {q.id}</div>
                  <div className="fb-q-text">{q.text}</div>

                  <div className="fb-scale">
                    {q.options.map((opt, idx) => {
                      const isSelected = selected === idx + 1;
                      const color = scaleColors[idx];
                      return (
                        <button
                          key={opt}
                          type="button"
                          className={`fb-scale-btn${isSelected ? " selected" : ""}`}
                          style={isSelected ? { background: color } : {}}
                          onClick={() => handleChange(q.id, idx)}
                        >
                          {/* dot indicator */}
                          <span style={{
                            width: 8, height: 8, borderRadius: "50%",
                            background: isSelected ? "rgba(255,255,255,0.6)" : color,
                            flexShrink: 0,
                            boxShadow: isSelected ? "none" : `0 0 6px ${color}`,
                            transition: "all 0.18s",
                          }} />
                          {opt}
                        </button>
                      );
                    })}
                  </div>

                  {/* answered checkmark */}
                  {selected && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.7 }}
                      animate={{ opacity: 1, scale: 1 }}
                      style={{
                        position: "absolute", top: 16, right: 16,
                        width: 22, height: 22, borderRadius: "50%",
                        background: "var(--ts-green)", color: "#fff",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 11, fontWeight: 700,
                      }}
                    >
                      ✓
                    </motion.div>
                  )}
                </motion.div>
              );
            })}

            {!allAnswered && (
              <p style={{ textAlign: "center", fontSize: 13, color: "var(--ts-text-dim)", marginTop: 8 }}>
                Answer all {total} questions to submit
              </p>
            )}

            <button
              type="submit"
              disabled={!allAnswered || submitting}
              className="fb-submit"
            >
              {submitting ? "Submitting…" : "Submit Feedback ✦"}
            </button>
          </form>

        </div>
      </div>
    </>
  );
}