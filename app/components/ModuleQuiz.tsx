"use client";

import { useState } from "react";

type ModuleQuizProps = {
  moduleQuiz: any[];
  moduleQuizLoading: boolean;
  moduleQuizAnswers: { [key: number]: string };
  setModuleQuizAnswers: React.Dispatch<React.SetStateAction<{ [key: number]: string }>>;
  submitModuleQuiz: () => void;
  moduleQuizScore: number | null;
  moduleQuizTotal: number | null;
  retryAfter: number | null;
  moduleQuizAlreadyDone: boolean;
  handleNextModule: () => void;
  moduleOrder: string;
  onBack: () => void;
  isLastModule: boolean;
  userPassed: boolean;
};

function getDaysLeft(retryAfter: number | null): number | null {
  if (!retryAfter) return null;
  const msLeft = retryAfter - Date.now();
  if (msLeft <= 0) return 0;
  return Math.ceil(msLeft / (1000 * 60 * 60 * 24));
}

const spinnerSvg = (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    style={{ animation: "mq-spin 0.75s linear infinite", flexShrink: 0 }}
  >
    <circle cx="8" cy="8" r="6" stroke="rgba(255,255,255,0.35)" strokeWidth="2" />
    <path d="M8 2a6 6 0 0 1 6 6" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export default function ModuleQuiz({
  moduleQuiz,
  moduleQuizLoading,
  moduleQuizAnswers,
  setModuleQuizAnswers,
  submitModuleQuiz,
  moduleQuizScore,
  moduleQuizTotal,
  retryAfter,
  moduleQuizAlreadyDone,
  handleNextModule,
  moduleOrder,
  onBack,
  isLastModule,
  userPassed,
}: ModuleQuizProps) {
  const [isNavigating, setIsNavigating] = useState(false);

  const daysLeft = getDaysLeft(retryAfter);

  const allAnswered =
    moduleQuiz.length > 0 &&
    moduleQuiz.every((_: any, i: number) => moduleQuizAnswers[i] !== undefined);

  const handleNext = () => {
    setIsNavigating(true);
    handleNextModule();
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--ts-bg)" }}>

      <style>{`
        @keyframes mq-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* Top bar */}
      <div
        className="sticky top-0 z-10 px-6 py-3 flex items-center gap-4 border-b"
        style={{ background: "var(--ts-surface)", borderColor: "var(--ts-border)" }}
      >
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm transition-colors"
          style={{ color: "var(--ts-text-muted)" }}
        >
          ← Back to module
        </button>
        <div className="h-4 w-px" style={{ background: "var(--ts-border)" }} />
        <span className="text-sm font-medium" style={{ color: "var(--ts-text)" }}>
          Module {moduleOrder} Quiz
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center py-12 px-4">
        <div className="w-full max-w-3xl">

          {/* Loading */}
          {moduleQuizLoading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div
                className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
                style={{ borderColor: "var(--ts-violet)" }}
              />
              <p style={{ color: "var(--ts-text-muted)" }}>Loading quiz questions…</p>
            </div>

          ) : moduleQuizScore === null ? (

            /* ── QUIZ FORM ── */
            <div>
              <div className="mb-8">
                <h1 style={{ color: "var(--ts-text)" }} className="text-2xl font-bold">
                  Module {moduleOrder} Quiz
                </h1>
                <p style={{ color: "var(--ts-text-muted)" }}>
                  {moduleQuiz.length} questions · Answer all to submit · Pass mark: 50%
                </p>
              </div>

              <div className="space-y-6">
                {moduleQuiz.map((q: any, i: number) => (
                  <div
                    key={i}
                    className="rounded-2xl p-6 border"
                    style={{
                      background: "var(--ts-surface)",
                      borderColor: "var(--ts-border)",
                      boxShadow: `0 0 0 1px var(--ts-border-hi), 0 10px 40px rgba(0,0,0,0.5), 0 0 60px var(--ts-violet-soft)`
                    }}
                  >
                    <p style={{ color: "var(--ts-text-muted)" }} className="text-sm mb-2">
                      Question {i + 1}
                    </p>
                    <p style={{ color: "var(--ts-text)" }} className="font-medium mb-4">
                      {q.question}
                    </p>

                    <div className="space-y-2">
                      {q.options.map((opt: string, j: number) => {
                        const selected = moduleQuizAnswers[i] === opt;
                        return (
                          <label
                            key={j}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all"
                            style={{
                              borderColor: selected ? "var(--ts-violet)" : "var(--ts-border)",
                              background: selected ? "var(--ts-violet-soft)" : "var(--ts-surface)",
                              color: selected ? "var(--ts-violet)" : "var(--ts-text)",
                            }}
                            onMouseEnter={(e) => {
                              if (!selected) e.currentTarget.style.background = "var(--ts-surface-hi)";
                            }}
                            onMouseLeave={(e) => {
                              if (!selected) e.currentTarget.style.background = "var(--ts-surface)";
                            }}
                          >
                            <input
                              type="radio"
                              name={`mq${i}`}
                              value={opt}
                              checked={selected}
                              onChange={() => setModuleQuizAnswers({ ...moduleQuizAnswers, [i]: opt })}
                              style={{ accentColor: "var(--ts-violet)" }}
                            />
                            <span>{opt}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  onClick={submitModuleQuiz}
                  disabled={!allAnswered}
                  className="px-6 py-3 rounded-xl text-sm font-semibold transition-all"
                  style={{
                    background: allAnswered ? "var(--ts-violet)" : "var(--ts-surface-hi)",
                    color: allAnswered ? "#fff" : "var(--ts-text-muted)",
                    cursor: allAnswered ? "pointer" : "not-allowed",
                  }}
                >
                  Submit Quiz
                </button>
              </div>
            </div>

          ) : (

            /* ── RESULTS ── */
            <div>
              <div className="mb-8">
                <h1 className="text-2xl font-bold" style={{ color: "var(--ts-text)" }}>
                  Quiz Results
                </h1>
                <p style={{ color: "var(--ts-text-muted)" }}>Module {moduleOrder}</p>
              </div>

              <div
                className="rounded-2xl p-8 border mb-6"
                style={{ background: "var(--ts-surface)", borderColor: "var(--ts-border)" }}
              >
                <p style={{ color: "var(--ts-text-muted)" }}>Your score</p>
                <p style={{ color: "var(--ts-text)" }} className="text-5xl font-bold">
                  {moduleQuizScore}/{moduleQuizTotal}
                </p>
                <p style={{ color: "var(--ts-text-muted)", fontSize: 13, marginTop: 4 }}>
                  {Math.round((moduleQuizScore! / moduleQuizTotal!) * 100)}% · Pass mark: 50%
                </p>

                <div
                  className="mt-4 px-4 py-3 rounded-xl"
                  style={{
                    background: userPassed ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)",
                    color: userPassed ? "var(--ts-green)" : "#ef4444",
                  }}
                >
                  {userPassed ? "✅ Passed" : "❌ Not passed — score below 50%"}
                </div>

                {!userPassed && (
                  <div
                    className="mt-6 p-4 rounded-xl border"
                    style={{
                      background: "rgba(239,68,68,0.05)",
                      borderColor: "rgba(239,68,68,0.2)",
                      color: "var(--ts-text)",
                    }}
                  >
                    <p className="font-semibold mb-2">
                      Not quite there yet — but keep going 💪
                    </p>
                    <p className="text-sm mb-3" style={{ color: "var(--ts-text-muted)" }}>
                      You need 50% or more to pass. Revisit the chapters and strengthen your
                      understanding before retaking.
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <p className="text-sm">⏳ Retake available after <strong>7 days</strong></p>
                      <p className="text-sm">🔒 Mega Quiz unlocks only after passing all module quizzes</p>
                      {!isLastModule && (
                        <p className="text-sm">🚀 You can still continue to the next module</p>
                      )}
                    </div>
                  </div>
                )}

                {userPassed && isLastModule && (
                  <div
                    className="mt-6 p-4 rounded-xl border"
                    style={{
                      background: "rgba(167,139,250,0.08)",
                      borderColor: "rgba(167,139,250,0.25)",
                      color: "var(--ts-text)",
                    }}
                  >
                    <p className="font-semibold mb-1" style={{ color: "var(--ts-violet)" }}>
                      🎉 All modules complete!
                    </p>
                    <p className="text-sm" style={{ color: "var(--ts-text-muted)" }}>
                      You've passed every module quiz. The Mega Quiz is now unlocked.
                    </p>
                  </div>
                )}
              </div>

              {/* Action button */}
              <div className="flex justify-end">
                {isLastModule ? (
                  // Last module: only show Mega Quiz button if passed, otherwise show locked message
                  userPassed ? (
                    <button
                      onClick={!isNavigating ? handleNext : undefined}
                      disabled={isNavigating}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold"
                      style={{
                        background: "linear-gradient(90deg, var(--ts-violet), #06b6d4)",
                        color: "#fff",
                        cursor: isNavigating ? "not-allowed" : "pointer",
                        opacity: isNavigating ? 0.8 : 1,
                        transition: "opacity 0.2s",
                      }}
                    >
                      {isNavigating ? (
                        <>{spinnerSvg} Loading…</>
                      ) : (
                        "🚀 Take Mega Quiz"
                      )}
                    </button>
                  ) : (
                    <div
                      style={{
                        display: "flex", alignItems: "center", gap: 10,
                        padding: "10px 16px", borderRadius: 12,
                        background: "rgba(239,68,68,0.08)",
                        border: "1px solid rgba(239,68,68,0.2)",
                        color: "#ef4444", fontSize: 13, fontWeight: 600,
                      }}
                    >
                      🔒 Pass this quiz to unlock the Mega Quiz
                    </div>
                  )
                ) : (
                  // Not last module: always allow navigating to next module regardless of pass/fail
                  <button
                    onClick={!isNavigating ? handleNext : undefined}
                    disabled={isNavigating}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold"
                    style={{
                      background: "var(--ts-violet)",
                      color: "#fff",
                      cursor: isNavigating ? "not-allowed" : "pointer",
                      opacity: isNavigating ? 0.8 : 1,
                      transition: "opacity 0.2s",
                    }}
                  >
                    {isNavigating ? (
                      <>{spinnerSvg} Loading…</>
                    ) : (
                      "Next Module →"
                    )}
                  </button>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}