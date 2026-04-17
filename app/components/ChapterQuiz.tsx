"use client";
import { useState } from "react";

interface Question {
  question: string;
  options: string[];
  correct: string;
}

interface ChapterQuizProps {
  quiz: Question[];
  onComplete: (score: number, total: number) => void;
}

export default function ChapterQuiz({ quiz, onComplete }: ChapterQuizProps) {
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);

  const allAnswered = Object.keys(answers).length === quiz.length;

  const submitQuiz = () => {
    let correct = 0;
    quiz.forEach((q, i) => {
      const ci = ["A","B","C","D"].indexOf(q.correct);
      const ct = ci >= 0 ? q.options[ci] : q.correct;
      if (answers[i] === ct) correct++;
    });
    setScore(correct);
    setSubmitted(true);
    onComplete(correct, quiz.length);
  };

  if (!quiz.length) return null;

  return (
    <div
      className="mt-10 rounded-2xl border p-6"
      style={{
        borderColor: "var(--ts-border)",
        background: "var(--ts-surface)",
        boxShadow: `
          0 0 0 1px var(--ts-border-hi),
          0 10px 40px rgba(0,0,0,0.6),
          0 0 80px var(--ts-violet-soft)
        `
      }}
    >

      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <span style={{ color: "var(--ts-violet)", fontSize: 18 }}>📝</span>
        <h2
          className="text-lg font-bold"
          style={{
            color: "var(--ts-text)",
            fontFamily: "'Lora', serif"
          }}
        >
          Chapter Quiz
        </h2>
      </div>

      {/* Questions */}
      {quiz.map((q, i) => (
        <div key={i} className="mb-6 last:mb-0">
          <p
            className="text-sm font-semibold mb-3"
            style={{ color: "var(--ts-text)" }}
          >
            {i + 1}. {q.question}
          </p>

          <div className="space-y-2">
            {q.options.map((opt, j) => {
              const isSelected = answers[i] === opt;
              const correctIndex = ["A","B","C","D"].indexOf(q.correct);
              const correctText = correctIndex >= 0 ? q.options[correctIndex] : q.correct;
              const isCorrect = opt === correctText;

              let style: React.CSSProperties = {
                border: "1px solid var(--ts-border)",
                background: "var(--ts-surface)",
                color: "var(--ts-text)"
              };

              if (submitted) {
                if (isCorrect) {
                  style = {
                    border: "1px solid var(--ts-green)",
                    background: "rgba(34, 197, 94, 0.12)",
                    color: "var(--ts-green)",
                    fontWeight: 500
                  };
                } else if (isSelected && !isCorrect) {
                  style = {
                    border: "1px solid #ef4444",
                    background: "rgba(239, 68, 68, 0.12)",
                    color: "#ef4444"
                  };
                } else {
                  style = {
                    border: "1px solid var(--ts-border)",
                    background: "var(--ts-surface)",
                    color: "var(--ts-text-muted)"
                  };
                }
              } else if (isSelected) {
                style = {
                  border: "2px solid var(--ts-violet)",
                  background: "var(--ts-violet-soft)",
                  color: "var(--ts-violet)",
                  fontWeight: 500,
                  boxShadow: "0 0 12px var(--ts-violet-glow)"
                };
              }

              return (
                <label
                  key={j}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg cursor-pointer transition-all text-sm ${submitted ? "cursor-default" : ""}`}
                  style={style}
                  onMouseEnter={(e) => {
                    if (!submitted && !isSelected) {
                      e.currentTarget.style.background = "var(--ts-surface-hi)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!submitted && !isSelected) {
                      e.currentTarget.style.background = "var(--ts-surface)";
                    }
                  }}
                >
                  <input
                    type="radio"
                    name={`q${i}`}
                    value={opt}
                    disabled={submitted}
                    checked={isSelected}
                    onChange={() => setAnswers({ ...answers, [i]: opt })}
                    style={{ accentColor: "var(--ts-violet)" }}
                  />
                  {opt}

                  {submitted && isCorrect && (
                    <span className="ml-auto text-xs font-bold" style={{ color: "var(--ts-green)" }}>
                      ✓ Correct
                    </span>
                  )}

                  {submitted && isSelected && !isCorrect && (
                    <span className="ml-auto text-xs font-bold" style={{ color: "#ef4444" }}>
                      ✗ Wrong
                    </span>
                  )}
                </label>
              );
            })}
          </div>
        </div>
      ))}

      {/* Submit Button */}
      {!submitted ? (
        <button
          onClick={submitQuiz}
          disabled={!allAnswered}
          className="mt-6 w-full py-2.5 rounded-xl text-sm font-semibold transition-all"
          style={{
            background: allAnswered ? "var(--ts-violet)" : "var(--ts-surface-hi)",
            color: allAnswered ? "#fff" : "var(--ts-text-muted)",
            cursor: allAnswered ? "pointer" : "not-allowed"
          }}
        >
          {allAnswered ? "Submit Quiz" : `Answer all ${quiz.length} questions to submit`}
        </button>
      ) : (
        <div
          className="mt-6 flex items-center justify-between px-4 py-3 rounded-xl"
          style={{
            background: "var(--ts-surface-hi)",
            border: "1px solid var(--ts-border)"
          }}
        >
          <span className="text-sm" style={{ color: "var(--ts-text-muted)" }}>
            Your score
          </span>
          <span
            className="text-lg font-bold"
            style={{ color: "var(--ts-violet)" }}
          >
            {score} / {quiz.length}
          </span>
        </div>
      )}
    </div>
  );
}