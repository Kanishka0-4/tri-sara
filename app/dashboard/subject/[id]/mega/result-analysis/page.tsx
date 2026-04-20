"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

/* ─── Design tokens (same as rest of project) ───────────────── */
const C = {
  surface:      "var(--ts-surface)",
  surfaceHi:    "var(--ts-surface-hi)",
  border:       "var(--ts-border)",
  borderHi:     "var(--ts-border-hi)",
  violet:       "var(--ts-violet)",
  violetGlow:   "var(--ts-violet-glow)",
  violetSoft:   "var(--ts-violet-soft)",
  violetBubble: "var(--ts-violet-bubble)",
  cyan:         "var(--ts-cyan)",
  cyanGlow:     "var(--ts-cyan-glow)",
  rose:         "var(--ts-rose)",
  roseSoft:     "var(--ts-rose-soft)",
  green:        "var(--ts-green)",
  greenSoft:    "var(--ts-green-soft)",
  greenBorder:  "var(--ts-green-border)",
  amber:        "var(--ts-amber)",
  amberSoft:    "var(--ts-amber-soft)",
  text:         "var(--ts-text)",
  muted:        "var(--ts-text-muted)",
  dim:          "var(--ts-text-dim)",
};

/* ─── Background decorations (same pattern as other pages) ──── */
function Orbs() {
  return (
    <>
      <motion.div aria-hidden style={{
        position:"fixed", width:560, height:560, borderRadius:"50%",
        background:`radial-gradient(circle, ${C.violetGlow} 0%, transparent 65%)`,
        top:-180, left:-160, pointerEvents:"none", zIndex:0,
      }} animate={{scale:[1,1.06,1],opacity:[0.7,1,0.7]}} transition={{duration:10,repeat:Infinity,ease:"easeInOut"}} />
      <motion.div aria-hidden style={{
        position:"fixed", width:480, height:480, borderRadius:"50%",
        background:`radial-gradient(circle, ${C.cyanGlow} 0%, transparent 65%)`,
        bottom:-150, right:-120, pointerEvents:"none", zIndex:0,
      }} animate={{scale:[1,1.09,1],opacity:[0.5,0.85,0.5]}} transition={{duration:13,repeat:Infinity,ease:"easeInOut",delay:2}} />
    </>
  );
}
function GridBg() {
  return <div aria-hidden style={{
    position:"fixed", inset:0, pointerEvents:"none", zIndex:0,
    backgroundImage:`linear-gradient(${C.violetSoft} 1px,transparent 1px),linear-gradient(90deg,${C.violetSoft} 1px,transparent 1px)`,
    backgroundSize:"64px 64px",
  }} />;
}
function ScanLine() {
  return <motion.div aria-hidden style={{
    position:"fixed", left:0, right:0, height:1,
    background:`linear-gradient(90deg,transparent,${C.violet},${C.cyan},transparent)`,
    opacity:0.15, pointerEvents:"none", zIndex:1,
  }} animate={{top:["10%","90%","10%"]}} transition={{duration:10,repeat:Infinity,ease:"easeInOut"}} />;
}

/* ─── Stat card ──────────────────────────────────────────────── */
function StatCard({ emoji, label, value, color, glow }: {
  emoji: string; label: string; value: string; color: string; glow: string;
}) {
  return (
    <motion.div
      initial={{opacity:0, y:16}} animate={{opacity:1, y:0}}
      transition={{duration:0.4, ease:[0.22,1,0.36,1]}}
      style={{
        background: C.surface,
        border: `1px solid ${C.borderHi}`,
        borderRadius: 16, padding: "24px 32px",
        textAlign: "center", flex: "1 1 160px",
        position: "relative", overflow: "hidden",
        boxShadow: `0 0 24px ${glow}`,
      }}
    >
      <div aria-hidden style={{position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,transparent,${color},transparent)`}} />
      <div style={{fontSize:32, marginBottom:8}}>{emoji}</div>
      <div style={{fontSize:11, fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", color:C.dim, marginBottom:6}}>{label}</div>
      <div style={{fontSize:36, fontWeight:800, color, fontFamily:"'Space Grotesk',sans-serif", lineHeight:1}}>{value}</div>
    </motion.div>
  );
}

/* ─── Performance card ───────────────────────────────────────── */
function PerfCard({ title, entries, accentColor, delay }: {
  title: string; entries: [string, any][]; accentColor: string; delay: number;
}) {
  if (!entries.length) return null;
  return (
    <motion.div
      initial={{opacity:0, y:20}} animate={{opacity:1, y:0}}
      transition={{delay, duration:0.4, ease:[0.22,1,0.36,1]}}
      style={{
        background: C.surface, border:`1px solid ${C.border}`,
        borderRadius:16, padding:"24px 20px",
        position:"relative", overflow:"hidden",
      }}
    >
      <div aria-hidden style={{position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,transparent,${accentColor},transparent)`}} />
      <h2 style={{fontSize:13, fontWeight:700, letterSpacing:"0.14em", textTransform:"uppercase", color:C.dim, marginBottom:20}}>{title}</h2>

      <div style={{display:"flex", flexWrap:"wrap", gap:12}}>
        {entries.map(([key, value]) => {
          const isObj = typeof value === "object" && value !== null;
          const accuracy = isObj
            ? (typeof value.accuracy === "number" ? Math.round(value.accuracy * 100) : null)
            : (typeof value === "number" ? Math.round(value * 100) : null);

          const pct = accuracy ?? 0;
          const barColor = pct >= 70 ? C.green : pct >= 40 ? C.amber : C.rose;

          return (
            <div key={key} style={{
              background: C.surfaceHi, border:`1px solid ${C.border}`,
              borderRadius:12, padding:"16px 18px",
              flex:"1 1 200px", minWidth:180,
            }}>
              <div style={{fontSize:13, fontWeight:700, color:C.text, marginBottom:12}}>{key}</div>

              {isObj ? (
                <>
                  {/* Accuracy bar */}
                  {accuracy !== null && (
                    <div style={{marginBottom:10}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                        <span style={{fontSize:11,color:C.dim,fontWeight:600}}>Accuracy</span>
                        <span style={{fontSize:12,fontWeight:800,color:barColor}}>{accuracy}%</span>
                      </div>
                      <div style={{height:5,borderRadius:99,background:"var(--ts-border)",overflow:"hidden"}}>
                        <motion.div
                          initial={{width:0}} animate={{width:`${pct}%`}}
                          transition={{duration:1,delay:delay+0.2,ease:[0.22,1,0.36,1]}}
                          style={{height:"100%",borderRadius:99,background:barColor,boxShadow:`0 0 8px ${barColor}55`}}
                        />
                      </div>
                    </div>
                  )}
                  <div style={{display:"flex",gap:16,flexWrap:"wrap"}}>
                    {value.total != null && <div style={{fontSize:12,color:C.muted}}>Total: <b style={{color:C.text}}>{value.total}</b></div>}
                    {value.correct != null && <div style={{fontSize:12,color:C.muted}}>Correct: <b style={{color:C.green}}>{value.correct}</b></div>}
                  </div>
                  {/* Handle arbitrary sub-keys (e.g. confidence calibration) */}
                  {Object.entries(value).filter(([k]) => !["total","correct","accuracy"].includes(k)).map(([k,v]) => (
                    <div key={k} style={{fontSize:12,color:C.muted,marginTop:4}}>
                      {k.charAt(0).toUpperCase()+k.slice(1)}: <b style={{color:C.text}}>{typeof v === "number" ? Math.round((v as number)*100)+"%" : String(v)}</b>
                    </div>
                  ))}
                </>
              ) : (
                <div style={{fontSize:28,fontWeight:800,color:barColor,fontFamily:"'Space Grotesk',sans-serif"}}>
                  {typeof value === "number" ? Math.round(value*100)+"%" : String(value)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────── */
export default function MegaQuizResultAnalysisPage() {
  const params = useParams();
  const router = useRouter();
  const subjectId = params.id as string;

  const [data, setData]       = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [theme, setTheme]     = useState("dark");

  /* Theme (default dark, same as other pages) */
  useEffect(() => {
    const saved = localStorage.getItem("trisara-theme") ?? "dark";
    setTheme(saved);
    document.documentElement.setAttribute("data-theme", saved);
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("trisara-theme", next);
    document.documentElement.setAttribute("data-theme", next);
  };

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/mega-quiz/analytics/summary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subjectId }),
        });
        const result = await res.json();
        if (res.ok && result?.summary) {
          setData(result.summary);
        } else {
          setError(result.error || "No summary found.");
        }
      } catch {
        setError("Failed to load summary.");
      }
      setLoading(false);
    }
    fetchData();
  }, [subjectId]);

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;800&display=swap'); * { box-sizing:border-box; }`}</style>
      <div style={{ minHeight:"100vh", color:C.text, position:"relative", overflow:"hidden", fontFamily:"'Space Grotesk',sans-serif" }}>
        <Orbs /><GridBg /><ScanLine />

        {/* Theme toggle */}
        <button onClick={toggleTheme} title={theme==="dark"?"Light mode":"Dark mode"} style={{
          position:"fixed", top:20, right:20, width:34, height:34, borderRadius:10,
          border:`1px solid ${C.border}`, background:C.surface, color:C.text,
          display:"flex", alignItems:"center", justifyContent:"center",
          cursor:"pointer", zIndex:50, fontSize:16,
        }}>
          {theme==="dark" ? "☀" : "🌙"}
        </button>

        {/* Content */}
        <div style={{ maxWidth:900, margin:"0 auto", padding:"48px 20px 100px", position:"relative", zIndex:2 }}>

          {/* Back button */}
          <motion.button
            onClick={() => router.push(`/dashboard/subject/${subjectId}/progress`)}
            whileHover={{x:-3}}
            style={{
              background:"none", border:"none", padding:"0 0 28px",
              color:C.dim, fontSize:13, cursor:"pointer",
              display:"flex", alignItems:"center", gap:6,
              fontFamily:"'Space Grotesk',sans-serif", transition:"color 0.2s",
            }}
            onMouseEnter={e=>e.currentTarget.style.color=C.violet}
            onMouseLeave={e=>e.currentTarget.style.color=C.dim}
          >
            ← Back to Progress
          </motion.button>

          {/* Header */}
          <motion.div initial={{opacity:0,y:-14}} animate={{opacity:1,y:0}} transition={{duration:0.45,ease:[0.22,1,0.36,1]}} style={{marginBottom:40}}>
            <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.18em",textTransform:"uppercase",color:C.violet,marginBottom:6}}>
              Mega Quiz
            </div>
            <h1 style={{
              fontWeight:800, fontSize:"clamp(22px,4vw,40px)", letterSpacing:"-0.04em",
              lineHeight:1.1, margin:"0 0 6px",
              background:`linear-gradient(135deg,${C.text} 30%,${C.violet} 100%)`,
              WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
            }}>
              🏆 Result Analysis
            </h1>
            <p style={{fontSize:14,color:C.muted,margin:0}}>A deep breakdown of your mega quiz performance.</p>
          </motion.div>

          {/* Divider */}
          <div style={{height:1,marginBottom:36,background:`linear-gradient(90deg,transparent,${C.violet}55,${C.cyan}33,transparent)`}} />

          {/* States */}
          {loading && (
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16,padding:"80px 0"}}>
              <div style={{display:"flex",gap:8}}>
                {[C.violet,C.cyan,C.rose].map((color,i)=>(
                  <motion.div key={i} animate={{scale:[0.5,1,0.5],opacity:[0.25,1,0.25]}}
                    transition={{duration:1.2,repeat:Infinity,delay:i*0.2,ease:"easeInOut"}}
                    style={{width:10,height:10,borderRadius:"50%",background:color}} />
                ))}
              </div>
              <span style={{fontSize:12,color:C.dim,letterSpacing:"0.1em",textTransform:"uppercase"}}>Loading analysis…</span>
            </div>
          )}

          {!loading && error && (
            <div style={{
              padding:"24px 28px", borderRadius:16,
              background:"var(--ts-rose-soft)", border:"1px solid var(--ts-rose)",
              color:C.rose, fontSize:14, fontWeight:600, textAlign:"center",
            }}>
              {error}
            </div>
          )}

          {!loading && data && (
            <div style={{display:"flex",flexDirection:"column",gap:20}}>

              {/* Accuracy + Engagement */}
              <div style={{display:"flex",gap:16,flexWrap:"wrap"}}>
                {data.accuracy != null && (
                  <StatCard
                    emoji="🎯" label="Accuracy"
                    value={Math.round(data.accuracy) + "%"}
                    color={data.accuracy >= 70 ? C.green : data.accuracy >= 40 ? C.amber : C.rose}
                    glow={data.accuracy >= 70 ? "rgba(52,211,153,0.2)" : "rgba(251,191,36,0.2)"}
                  />
                )}
                {data.engagement_score != null && (
                  <StatCard
                    emoji="🔥" label="Engagement"
                    value={Math.round(data.engagement_score) + "%"}
                    color={C.violet}
                    glow="rgba(167,139,250,0.2)"
                  />
                )}
              </div>

              {/* Topic Performance */}
              {data.topic_performance && Object.keys(data.topic_performance).length > 0 && (
                <PerfCard
                  title="📚 Topic-wise Performance"
                  entries={Object.entries(data.topic_performance)}
                  accentColor={C.cyan}
                  delay={0.1}
                />
              )}

              {/* Difficulty Performance */}
              {data.difficulty_performance && Object.keys(data.difficulty_performance).length > 0 && (
                <PerfCard
                  title="🧩 Difficulty Performance"
                  entries={Object.entries(data.difficulty_performance)}
                  accentColor={C.amber}
                  delay={0.18}
                />
              )}

              {/* Confidence Calibration */}
              {data.confidence_calibration && Object.keys(data.confidence_calibration).length > 0 && (
                <PerfCard
                  title="🧠 Confidence Calibration"
                  entries={Object.entries(data.confidence_calibration)}
                  accentColor={C.violet}
                  delay={0.26}
                />
              )}

            </div>
          )}
        </div>
      </div>
    </>
  );
}