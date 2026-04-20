"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import QuizPage from "@/app/components/megaQuiz/QuizPage";
import ResultDashboard from "@/app/components/megaQuiz/ResultDashboard";

const RETRY_DAYS = 2;

function formatTimeRemaining(retryAfter: string): string {
  const ms      = new Date(retryAfter).getTime() - Date.now();
  if (ms <= 0)  return "0h 0m";
  const totalMins = Math.ceil(ms / 60000);
  const days      = Math.floor(totalMins / (60 * 24));
  const hours     = Math.floor((totalMins % (60 * 24)) / 60);
  const mins      = totalMins % 60;
  if (days > 0)   return `${days}d ${hours}h`;
  if (hours > 0)  return `${hours}h ${mins}m`;
  return `${mins}m`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export default function MegaQuizPage() {
  const params    = useParams();
  const router    = useRouter();
  const subjectId = params.id as string;

  const [result,      setResult     ] = useState<any>(null);
  const [retryStatus, setRetryStatus] = useState<{
    canRetake: boolean;
    completedAt: string | null;
    retryAfter: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeStr, setTimeStr] = useState("");

  // Live countdown ticker
  useEffect(() => {
    if (!retryStatus?.retryAfter) return;
    const tick = () => setTimeStr(formatTimeRemaining(retryStatus.retryAfter!));
    tick();
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, [retryStatus?.retryAfter]);

  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      try {
        const [analyticsRes, retryRes] = await Promise.all([
          fetch("/api/mega-quiz/analytics", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ subjectId }),
          }),
          fetch("/api/mega-quiz/retry-status", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ subjectId }),
          }),
        ]);

        const analyticsData = await analyticsRes.json();
        const retryData     = await retryRes.json();

        if (analyticsData?.analytics) setResult(analyticsData.analytics);
        if (retryData && !retryData.error) setRetryStatus(retryData);
      } catch {}
      setLoading(false);
    }
    fetchAll();
  }, [subjectId]);

  const commonStyles = `
    @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap');
    @keyframes mq-spin { to { transform: rotate(360deg); } }
    @keyframes mq-shimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(400%)} }
  `;

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
        onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--ts-border-hi)"; e.currentTarget.style.color = "var(--ts-text)"; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--ts-border)";   e.currentTarget.style.color = "var(--ts-text-muted)"; }}
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

  /* ── Already has result + locked (can't retake yet) ── */
  if (result && retryStatus && !retryStatus.canRetake) return (
    <>
      <style>{commonStyles}</style>
      <div style={{ minHeight: "100vh", background: "var(--ts-bg)", fontFamily: "'Space Grotesk', sans-serif" }}>
        <Header subtitle="Results" />
        <ResultDashboard result={result} />

        {/* Retry locked banner */}
        <div style={{ maxWidth: 720, margin: "0 auto 60px", padding: "0 24px" }}>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            style={{
              borderRadius: 16, padding: "20px 24px",
              background: "var(--ts-amber-soft)",
              border: "1px solid var(--ts-amber-border)",
              display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap",
            }}
          >
            <span style={{ fontSize: 28 }}>⏳</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "var(--ts-amber)", margin: 0 }}>
                Retake available in {timeStr || formatTimeRemaining(retryStatus.retryAfter!)}
              </p>
              <p style={{ fontSize: 12, color: "var(--ts-text-muted)", margin: "4px 0 0" }}>
                Last attempt: {retryStatus.completedAt ? formatDate(retryStatus.completedAt) : "—"}
                {" · "}You can retake this quiz {RETRY_DAYS} days after your last attempt.
              </p>
            </div>
            {/* Countdown progress bar */}
            {retryStatus.completedAt && retryStatus.retryAfter && (() => {
              const total   = new Date(retryStatus.retryAfter).getTime() - new Date(retryStatus.completedAt).getTime();
              const elapsed = Date.now() - new Date(retryStatus.completedAt).getTime();
              const pct     = Math.min(100, Math.round((elapsed / total) * 100));
              return (
                <div style={{ width: "100%", marginTop: 8 }}>
                  <div style={{ height: 4, background: "var(--ts-border)", borderRadius: 99, overflow: "hidden" }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8 }}
                      style={{ height: "100%", borderRadius: 99, background: "var(--ts-amber)", boxShadow: "0 0 8px var(--ts-amber)" }}
                    />
                  </div>
                  <p style={{ fontSize: 10, color: "var(--ts-text-dim)", marginTop: 4, textAlign: "right" }}>
                    {pct}% of wait time elapsed
                  </p>
                </div>
              );
            })()}
          </motion.div>
        </div>
      </div>
    </>
  );

  /* ── Has result + can retake ── */
  if (result && retryStatus?.canRetake) return (
    <>
      <style>{commonStyles}</style>
      <div style={{ minHeight: "100vh", background: "var(--ts-bg)", fontFamily: "'Space Grotesk', sans-serif" }}>
        <Header subtitle="Results" />
        <ResultDashboard result={result} />

        {/* Retake CTA */}
        <div style={{ maxWidth: 720, margin: "0 auto 60px", padding: "0 24px" }}>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            style={{
              borderRadius: 16, padding: "20px 24px",
              background: "var(--ts-green-soft)",
              border: "1px solid var(--ts-green-border)",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              gap: 16, flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 28 }}>✅</span>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: "var(--ts-green)", margin: 0 }}>
                  Retake available!
                </p>
                <p style={{ fontSize: 12, color: "var(--ts-text-muted)", margin: "4px 0 0" }}>
                  {RETRY_DAYS} days have passed. You can attempt the mega quiz again.
                </p>
              </div>
            </div>
            <button
              onClick={() => { setResult(null); setRetryStatus(prev => prev ? { ...prev, canRetake: true } : null); }}
              style={{
                padding: "10px 22px", borderRadius: 10,
                background: "linear-gradient(135deg, var(--ts-violet), #818cf8)",
                border: "none", color: "#0d0918",
                fontSize: 13, fontWeight: 700, cursor: "pointer",
                fontFamily: "'Space Grotesk', sans-serif",
                boxShadow: "0 0 16px var(--ts-violet-glow)",
              }}
            >
              ↺ Retake Quiz
            </button>
          </motion.div>
        </div>
      </div>
    </>
  );

  /* ── Quiz screen (first attempt or retake) ── */
  return (
    <>
      <style>{commonStyles}</style>
      <div style={{ minHeight: "100vh", background: "var(--ts-bg)", fontFamily: "'Space Grotesk', sans-serif" }}>
        <Header subtitle="Final assessment" />

        <div style={{ maxWidth: 720, margin: "40px auto 0", padding: "0 24px" }}>
          <div style={{
            borderRadius: 20, padding: "32px 36px",
            background: "var(--ts-surface)", border: "1px solid var(--ts-border-hi)",
            boxShadow: "0 0 0 1px var(--ts-border-hi), 0 12px 48px rgba(0,0,0,0.5), inset 0 0 60px var(--ts-violet-soft)",
            marginBottom: 28, position: "relative", overflow: "hidden",
          }}>
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

            <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(140px, 1fr))",gap:12 }}>
              {[
                { label: "Passing Score", value: "60%",      icon: "🎯", color: "var(--ts-green)"  },
                { label: "Questions",     value: "25",        icon: "📝", color: "var(--ts-violet)" },
                { label: "All Topics",    value: "Covered",   icon: "📚", color: "var(--ts-cyan)"   },
                { label: "Retake After",  value: `${RETRY_DAYS} days`, icon: "⏳", color: "var(--ts-amber)"  },
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