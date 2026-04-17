"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function ResultsContent() {
  const [data, setData] = useState<QuizResult | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  type QuizResult = {
  best_learning_style: "text" | "audio" | "visual";
  scores: {
    text: number;
    audio: number;
    visual: number;
  };
  stats: {
    text: { correct: number; total: number; time: number };
    audio: { correct: number; total: number; time: number };
    visual: { correct: number; total: number; time: number };
  };
};

  useEffect(() => {
    async function fetchResults() {
      const quizId = searchParams.get("quiz_id");

      if (!quizId) return; // 🔥 IMPORTANT FIX

      const res = await fetch("/api/quiz/results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quiz_id: quizId }),
      });

      const d = await res.json();
      setData(d);
    }

    fetchResults();
  }, [searchParams]);

  if (!data) {
    return (
      <div style={{ padding: 40 }}>
        Loading results…
      </div>
    );
  }

  const styleMap = {
    text: "Text-based Learner",
    audio: "Auditory Learner",
    visual: "Visual Learner",
  };

  const best = data.best_learning_style;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--ts-bg)",
        color: "var(--ts-text)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 800,
          borderRadius: 16,
          padding: 32,
          background: "var(--ts-surface)",
          border: "1px solid var(--ts-border)",
          backdropFilter: "blur(10px)",
        }}
      >
        {/* ===== LOGO ===== */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 24,
          }}
        >
          <img
            src="/logo.png"
            style={{
              width: 36,
              height: 36,
              filter: "drop-shadow(0 0 8px var(--ts-violet-glow))",
            }}
          />
          <span style={{ fontWeight: 700, fontSize: 16 }}>
            Tri-Sara
          </span>
        </div>

        {/* ===== HEADER ===== */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <p style={{ fontSize: 17, color: "var(--ts-text-muted)", marginBottom: 8 }}>
            Quiz Results
          </p>

          <h1
            style={{
              fontSize: "2.2rem",
              fontWeight: 600,
              color: "var(--ts-violet)",
              marginBottom: 12,
            }}
          >
            {styleMap[best]}
          </h1>

          <p style={{ fontSize: 14, color: "var(--ts-text-muted)" }}>
            This is the learning mode where you performed the strongest overall.
          </p>
        </div>

        {/* ===== BREAKDOWN ===== */}
        <div style={{ display: "grid", gap: 16 }}>
          {(["text", "audio", "visual"] as const).map((type) => (
            <div
              key={type}
              style={{
                padding: 20,
                borderRadius: 12,
                border:
                  type === best
                    ? "1px solid var(--ts-border-hi)"
                    : "1px solid var(--ts-border)",
                background:
                  type === best
                    ? "var(--ts-violet-soft)"
                    : "var(--ts-surface)",
                boxShadow:
                  type === best
                    ? "0 0 20px var(--ts-violet-glow)"
                    : "none",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 8,
                }}
              >
                <p style={{ fontWeight: 500, color: "var(--ts-text)" }}>
                  {styleMap[type]}
                </p>

                <p style={{ fontSize: 13, color: "var(--ts-text-muted)" }}>
                  Score:{" "}
                  {data.scores[type] !== undefined
                    ? data.scores[type].toFixed(3)
                    : "N/A"}
                </p>
              </div>

              <div style={{ fontSize: 13, color: "var(--ts-text)", lineHeight: 1.6 }}>
                <p>
                  Accuracy: {data.stats[type].correct}/{data.stats[type].total}
                </p>

                <p>
                  Avg Time:{" "}
                  {(
                    data.stats[type].time /
                    Math.max(1, data.stats[type].total) /
                    1000
                  ).toFixed(2)}
                  s
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* ===== CTA ===== */}
        <div style={{ marginTop: 40, textAlign: "center" }}>
          <p style={{ fontSize: 14, color: "var(--ts-text-muted)", marginBottom: 16 }}>
            You can now continue learning with courses aligned to your learning
            style.
          </p>

          <button
            onClick={() => router.push("/dashboard")}
            style={{
              padding: "10px 18px",
              borderRadius: 10,
              background: "var(--ts-violet)",
              color: "#fff",
              fontWeight: 500,
              cursor: "pointer",
              boxShadow: "0 6px 20px var(--ts-violet-glow)",
            }}
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}