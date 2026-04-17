"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";

const questions = [
  {
    id: 1,
    text: "Q1. How much did this course improve your understanding of the subject?",
    options: ["Not At All", "Slightly", "Moderately", "Significantly", "Extremely"],
  },
  {
    id: 2,
    text: "Q2. How confident do you feel about the topics after completing the course?",
    options: ["Not Confident", "Slightly Confident", "Moderately Confident", "Confident", "Very Confident"],
  },
  {
    id: 3,
    text: "Q3. How well did the content match your preferred learning style?",
    options: [ "Not Matched", "Slightly Matched", "Moderately Matched", "Well Matched", "Perfectly Matched"],
  },
  {
    id: 4,
    text: "Q4. Did the system adapt content based on your quiz performance?",
    options: ["Not At All", "Slightly", "Moderately", "Effectively", "Very Effectively"],
  },
  {
    id: 5,
    text: "Q5. How relevant were the quiz questions to the content?",
    options: ["Not Relevant", "Slightly Relevant", "Moderately Relevant", "Relevant", "Highly Relevant"],
  },
  {
    id: 6,
    text: "Q6. Did the difficulty level adjust appropriately as you progressed?",
    options: ["Not Adjusted", "Slightly Adjusted", "Moderately Adjusted", "Well Adjusted", "Perfectly Adjusted"],
  },
  {
    id: 7,
    text: "Q7. How engaging was the course content?",
    options: ["Not Engaging", "Slightly Engaging", "Moderately Engaging", "Engaging", "Highly Engaging"],
  },
  {
    id: 8,
    text: "Q8. Was the module-by-module structure helpful for learning?",
    options: ["Not Helpful", "Slightly Helpful", "Moderately Helpful", "Helpful", "Very Helpful"],
  },
  {
    id: 9,
    text: "Q9. How easy was it to navigate through the platform?",
    options: ["Not Easy", "Slightly Easy", "Moderately Easy", "Easy", "Very Easy"],
  },
  {
    id: 10,
    text: "Q10. How would you rate the overall effectiveness of this adaptive learning system?",
    options: ["Very Poor", "Poor", "Average", "Good", "Excellent"],
  },
  {
    id: 11,
    text: "Q11. Would you prefer this system over traditional learning methods?",
    options: ["Definitely No", "Maybe No", "Not Sure", "Maybe Yes", "Definitely Yes"],
  },
  {
    id: 12,
    text: "Q12. How likely are you to recommend this course to others?",
    options: ["Definitely No", "Maybe No", "Not Sure", "Maybe Yes", "Definitely Yes"],
  },
];

export default function FeedbackPage() {
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const router = useRouter();
  const params = useParams();
  const subjectId = typeof params.id === "string" ? params.id : Array.isArray(params.id) ? params.id[0] : null;

  // Store option number (1-based) instead of text
  const handleChange = (qid, optionIdx) => {
    setAnswers((prev) => ({ ...prev, [qid]: optionIdx + 1 }));
  };

  const handleSubmit = async (e) => {
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

  if (submitted) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <h2 style={{ color: "var(--ts-violet)" }}>Thank you for your feedback!</h2>
        <button style={{ marginTop: 24 }} onClick={() => router.push("/dashboard")}>Back to Dashboard</button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 900, margin: "48px auto", background: "var(--ts-surface-hi)", borderRadius: 20, boxShadow: "0 4px 32px var(--ts-violet)30", padding: 40, border: "1.5px solid var(--ts-border)" }}>
      <h2 style={{ color: "var(--ts-violet)", marginBottom: 28, fontWeight: 800, fontSize: 35, textAlign: "center", letterSpacing: 0.5 }}>Subject Feedback</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 36 }}>
        {questions.map((q) => (
          <div key={q.id} style={{
            padding: 28,
            background: "linear-gradient(90deg, var(--ts-surface) 0%, var(--ts-surface-hi) 100%)",
            borderRadius: 14,
            boxShadow: "0 2px 12px var(--ts-violet)12",
            minHeight: 90,
            width: "100%",
            border: "1px solid var(--ts-border)",
            margin: "0 auto"
          }}>
            <div style={{ fontWeight: 700, marginBottom: 14, fontSize: 16, color: "var(--ts-text)", letterSpacing: 0.1 }}>{q.text}</div>
            <div style={{ display: "flex", flexDirection: "row", gap: 36, flexWrap: "nowrap", width: "100%", justifyContent: "center" }}>
              {q.options.map((opt, idx) => (
                <label key={opt} style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                 background: answers[q.id] === idx + 1 ? "var(--ts-violet-soft)" : "var(--ts-surface)",
                  border: answers[q.id] === idx + 1 ? "2px solid var(--ts-violet)" : "1.5px solid var(--ts-border)",
                  borderRadius: 8,
                  padding: "8px 18px",
                  fontWeight: 500,
                  fontSize: 14,
                  color: answers[q.id] === idx + 1 ? "var(--ts-violet)" : "var(--ts-text)",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}>
                  <input
                    type="radio"
                    name={`q${q.id}`}
                    value={idx + 1}
                    checked={answers[q.id] === idx + 1}
                    onChange={() => handleChange(q.id, idx)}
                    required
                    style={{ accentColor: "var(--ts-violet)", width: 18, height: 18 }}
                  />
                  {opt}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
      <button
        type="submit"
        disabled={submitting}
        style={{
          background: submitting ? "var(--ts-surface-hi)" : "var(--ts-violet)",
          color: "#fff",
          border: "none",
          borderRadius: 10,
          padding: "12px 28px",
          fontWeight: 700,
          fontSize: 15,
          cursor: submitting ? "not-allowed" : "pointer",
          margin: "32px auto 0 auto",
          display: "block",
          boxShadow: "0 2px 12px var(--ts-violet)30",
          letterSpacing: 0.2
        }}
      >
        {submitting ? "Submitting..." : "Submit Feedback"}
      </button>
    </form>
  );
}
