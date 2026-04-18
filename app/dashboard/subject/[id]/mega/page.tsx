"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import QuizPage from "@/app/components/megaQuiz/QuizPage";
import ResultDashboard from "@/app/components/megaQuiz/ResultDashboard";

export default function MegaQuizPage() {
  const params    = useParams();
  const router    = useRouter();
  const subjectId = params.id as string;

  const [result,  setResult ] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchResult() {
      setLoading(true);
      try {
        const res  = await fetch("/api/mega-quiz/analytics", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subjectId }),
        });
        const data = await res.json();
        if (data?.analytics) setResult(data.analytics);
      } catch {}
      setLoading(false);
    }
    fetchResult();
  }, [subjectId]);

  const commonStyles = `
    @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap');
    @keyframes mq-spin { to { transform: rotate(360deg); } }
    @keyframes mq-shimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(400%)} }
  `;

  /* ── Header shared by both result + quiz screens ── */
  const Header = ({ subtitle }: { subtitle: string }) => (
    <div style={{
      position: "sticky", top: 0, zIndex: 20,
      borderBottom: "1px solid var(--ts-border)",
      background: "var(--ts-surface)",
      padding: "14px 24px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      gap: 16, flexWrap: "wrap",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button
          onClick={() => router.push(`/dashboard/subject/${subjectId}`)}
          style={{
            background: "none", border: "none", padding: 0,
            color: "var(--ts-text-muted)", fontSize: 13, fontWeight: 500,
            cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
            fontFamily: "'Space Grotesk', sans-serif",
          }}
        >
          ← Back
        </button>
        <div style={{ width: 1, height: 16, background: "var(--ts-border)" }} />
        <span style={{
          fontSize: 10, fontWeight: 700, letterSpacing: "0.12em",
          textTransform: "uppercase", color: "var(--ts-violet)",
          background: "var(--ts-violet-soft)", border: "1px solid var(--ts-border-hi)",
          padding: "4px 12px", borderRadius: 999,
        }}>
          ✦ Mega Quiz
        </span>
        <span style={{ color: "var(--ts-text-muted)", fontSize: 13 }}>{subtitle}</span>
      </div>

      {/* Dashboard button */}
      <button
        onClick={() => router.push("/dashboard")}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "8px 16px", borderRadius: 10,
          border: "1px solid var(--ts-border)",
          background: "var(--ts-surface-hi)",
          color: "var(--ts-text-muted)", fontSize: 12, fontWeight: 600,
          cursor: "pointer", fontFamily: "'Space Grotesk', sans-serif",
          transition: "all 0.18s",
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = "var(--ts-border-hi)";
          e.currentTarget.style.color = "var(--ts-text)";
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = "var(--ts-border)";
          e.currentTarget.style.color = "var(--ts-text-muted)";
        }}
      >
        🏠 Dashboard
      </button>
    </div>
  );

  /* ── Loading ── */
  if (loading) return (
    <>
      <style>{commonStyles}</style>
      <div style={{
        minHeight: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        background: "var(--ts-bg)", fontFamily: "'Space Grotesk', sans-serif", gap: 16,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: "50%",
          border: "2px solid var(--ts-border)",
          borderTop: "2px solid var(--ts-violet)",
          animation: "mq-spin 0.8s linear infinite",
        }} />
        <p style={{ color: "var(--ts-text-muted)", fontSize: 14 }}>Loading Mega Quiz…</p>
      </div>
    </>
  );

  /* ── Results screen ── */
  if (result) return (
    <>
      <style>{commonStyles}</style>
      <div style={{ minHeight: "100vh", background: "var(--ts-bg)", fontFamily: "'Space Grotesk', sans-serif" }}>
        <Header subtitle="Results" />
        <ResultDashboard result={result} />
      </div>
    </>
  );

  /* ── Quiz screen ── */
  return (
    <>
      <style>{commonStyles}</style>
      <div style={{ minHeight: "100vh", background: "var(--ts-bg)", fontFamily: "'Space Grotesk', sans-serif" }}>
        <Header subtitle="Final assessment" />

        {/* Intro + passing criteria card */}
        <div style={{ maxWidth: 720, margin: "40px auto 0", padding: "0 24px" }}>
          <div style={{
            borderRadius: 20, padding: "32px 36px",
            background: "var(--ts-surface)", border: "1px solid var(--ts-border-hi)",
            boxShadow: "0 0 0 1px var(--ts-border-hi), 0 12px 48px rgba(0,0,0,0.5), inset 0 0 60px var(--ts-violet-soft)",
            marginBottom: 28, position: "relative", overflow: "hidden",
          }}>
            {/* shimmer line */}
            <div style={{ position:"absolute",top:0,left:"15%",width:"70%",height:1,background:"linear-gradient(90deg,transparent,var(--ts-violet),var(--ts-cyan),transparent)",opacity:0.6 }} />

            <div style={{ display:"flex",alignItems:"center",gap:8,background:"var(--ts-violet-soft)",border:"1px solid var(--ts-border-hi)",borderRadius:999,padding:"6px 16px",marginBottom:20,width:"fit-content" }}>
              <span style={{fontSize:16}}>🚀</span>
              <span style={{fontSize:11,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"var(--ts-violet)"}}>Final Challenge</span>
            </div>

            <h1 style={{ fontSize:"clamp(1.4rem,3vw,2rem)",fontWeight:700,color:"var(--ts-text)",lineHeight:1.25,marginBottom:10 }}>
              Mega Quiz
            </h1>
            <p style={{ color:"var(--ts-text-muted)",fontSize:14,lineHeight:1.7,marginBottom:24 }}>
              Final assessment covering everything you've learned across all modules. Take your time and do your best!
            </p>

            {/* Passing criteria */}
            <div style={{
              display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: 12,
            }}>
              {[
                { label: "Passing Score", value: "60%", icon: "🎯", color: "var(--ts-green)" },
                { label: "Questions", value: "Mixed", icon: "📝", color: "var(--ts-violet)" },
                { label: "All Topics", value: "Covered", icon: "📚", color: "var(--ts-cyan)" },
                { label: "Difficulty", value: "Adaptive", icon: "⚡", color: "var(--ts-amber)" },
              ].map(item => (
                <div key={item.label} style={{
                  padding: "12px 16px", borderRadius: 12,
                  background: "var(--ts-surface-hi)", border: "1px solid var(--ts-border)",
                  display: "flex", flexDirection: "column", gap: 4,
                }}>
                  <span style={{ fontSize: 18 }}>{item.icon}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ts-text-dim)" }}>{item.label}</span>
                  <span style={{ fontSize: 15, fontWeight: 700, color: item.color }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          <QuizPage subjectId={subjectId} />
        </div>
      </div>
    </>
  );
}