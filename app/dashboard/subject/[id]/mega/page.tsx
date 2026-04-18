"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import QuizPage from "@/app/components/megaQuiz/QuizPage";
import ResultDashboard from "@/app/components/megaQuiz/ResultDashboard";

export default function MegaQuizPage() {
  const params = useParams();
  const subjectId = params.id as string;
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchResult() {
      setLoading(true);
      try {
        const res = await fetch("/api/mega-quiz/analytics", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subjectId }),
        });
        const data = await res.json();
        if (data && data.analytics) {
          setResult(data.analytics);
        }
      } catch {}
      setLoading(false);
    }
    fetchResult();
  }, [subjectId]);

  if (loading) return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap');
        @keyframes mq-spin { to { transform: rotate(360deg); } }
      `}</style>
      <div style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--ts-bg)",
        fontFamily: "'Space Grotesk', sans-serif",
        gap: 16,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: "50%",
          border: "2px solid var(--ts-border)",
          borderTop: "2px solid var(--ts-violet)",
          animation: "mq-spin 0.8s linear infinite",
        }} />
        <p style={{ color: "var(--ts-text-muted)", fontSize: 14 }}>
          Loading Mega Quiz…
        </p>
      </div>
    </>
  );

  if (result) return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap');
      `}</style>
      <div style={{
        minHeight: "100vh",
        background: "var(--ts-bg)",
        fontFamily: "'Space Grotesk', sans-serif",
      }}>
        {/* Header */}
        <div style={{
          borderBottom: "1px solid var(--ts-border)",
          background: "var(--ts-surface)",
          padding: "14px 32px",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}>
          <span style={{
            fontSize: 10, fontWeight: 700, letterSpacing: "0.12em",
            textTransform: "uppercase", color: "var(--ts-violet)",
            background: "var(--ts-violet-soft)", border: "1px solid var(--ts-border-hi)",
            padding: "4px 12px", borderRadius: 999,
          }}>
            Mega Quiz
          </span>
          <span style={{ color: "var(--ts-text-muted)", fontSize: 13 }}>
            Results
          </span>
        </div>
        <ResultDashboard result={result} />
      </div>
    </>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap');
      `}</style>
      <div style={{
        minHeight: "100vh",
        background: "var(--ts-bg)",
        fontFamily: "'Space Grotesk', sans-serif",
      }}>
        {/* Header */}
        <div style={{
          borderBottom: "1px solid var(--ts-border)",
          background: "var(--ts-surface)",
          padding: "14px 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{
              fontSize: 10, fontWeight: 700, letterSpacing: "0.12em",
              textTransform: "uppercase", color: "var(--ts-violet)",
              background: "var(--ts-violet-soft)", border: "1px solid var(--ts-border-hi)",
              padding: "4px 12px", borderRadius: 999,
            }}>
              ✦ Mega Quiz
            </span>
            <span style={{ color: "var(--ts-text-muted)", fontSize: 13 }}>
              Final assessment
            </span>
          </div>
        </div>

        {/* Intro card */}
        <div style={{
          maxWidth: 720, margin: "48px auto 0", padding: "0 24px",
        }}>
          <div style={{
            borderRadius: 20,
            padding: "36px 40px",
            background: "var(--ts-surface)",
            border: "1px solid var(--ts-border-hi)",
            boxShadow: "0 0 0 1px var(--ts-border-hi), 0 12px 48px rgba(0,0,0,0.5), inset 0 0 60px var(--ts-violet-soft)",
            marginBottom: 32,
            position: "relative",
            overflow: "hidden",
          }}>
            {/* shimmer line */}
            <div style={{
              position: "absolute", top: 0, left: "15%", width: "70%", height: 1,
              background: "linear-gradient(90deg, transparent, var(--ts-violet), var(--ts-cyan), transparent)",
              opacity: 0.6,
            }} />
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "var(--ts-violet-soft)", border: "1px solid var(--ts-border-hi)",
              borderRadius: 999, padding: "6px 16px", marginBottom: 20,
            }}>
              <span style={{ fontSize: 16 }}>🚀</span>
              <span style={{
                fontSize: 11, fontWeight: 700, letterSpacing: "0.1em",
                textTransform: "uppercase", color: "var(--ts-violet)",
              }}>
                Final Challenge
              </span>
            </div>

            <h1 style={{
              fontSize: "clamp(1.4rem, 3vw, 2rem)",
              fontWeight: 700, color: "var(--ts-text)",
              lineHeight: 1.25, marginBottom: 12,
            }}>
              Mega Quiz
            </h1>
            <p style={{
              color: "var(--ts-text-muted)", fontSize: 15, lineHeight: 1.7, marginBottom: 0,
            }}>
              This is your final assessment covering everything you've learned across all modules.
              Take your time and do your best!
            </p>
          </div>

          <QuizPage subjectId={subjectId} />
        </div>
      </div>
    </>
  );
}