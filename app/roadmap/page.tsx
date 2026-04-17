"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

/* ─── Design tokens ──────────────────────────────────────────── */
const C = {
  bgSecondary: "var(--ts-bg-secondary)",
  surface:     "var(--ts-surface)",
  surfaceHi:   "var(--ts-surface-hi)",
  border:      "var(--ts-border)",
  borderHi:    "var(--ts-border-hi)",
  violet:      "var(--ts-violet)",
  violetGlow:  "var(--ts-violet-glow)",
  violetSoft:  "var(--ts-violet-soft)",
  violetBubble:"var(--ts-violet-bubble)",
  cyan:        "var(--ts-cyan)",
  cyanGlow:    "var(--ts-cyan-glow)",
  rose:        "var(--ts-rose)",
  roseSoft:    "var(--ts-rose-soft)",
  roseBorder:  "var(--ts-rose-border)",
  green:       "var(--ts-green)",
  greenSoft:   "var(--ts-green-soft)",
  greenBorder: "var(--ts-green-border)",
  amber:       "var(--ts-amber)",
  amberSoft:   "var(--ts-amber-soft)",
  amberBorder: "var(--ts-amber-border)",
  text:        "var(--ts-text)",
  muted:       "var(--ts-text-muted)",
  dim:         "var(--ts-text-dim)",
};

/* ─── Types ──────────────────────────────────────────────────── */
type PreQuizQuestion = {
  q: string;
  options: string[];
  correct: number;
  question_id: number;
};

type RoadmapWeek = {
  week: string;
  focus_topics: string[];
  subtopics: string[];
  expected_outcome: string;
};

/* ─── Background orbs ────────────────────────────────────────── */
function Orbs() {
  return (
    <>
      <motion.div aria-hidden style={{ position:"fixed",width:600,height:600,borderRadius:"50%",background:`radial-gradient(circle,${C.violetGlow} 0%,transparent 65%)`,top:-200,left:-180,pointerEvents:"none",zIndex:0 }}
        animate={{scale:[1,1.06,1],opacity:[0.7,1,0.7]}} transition={{duration:10,repeat:Infinity,ease:"easeInOut"}} />
      <motion.div aria-hidden style={{ position:"fixed",width:480,height:480,borderRadius:"50%",background:`radial-gradient(circle,${C.cyanGlow} 0%,transparent 65%)`,bottom:-150,right:-120,pointerEvents:"none",zIndex:0 }}
        animate={{scale:[1,1.09,1],opacity:[0.5,0.85,0.5]}} transition={{duration:13,repeat:Infinity,ease:"easeInOut",delay:2}} />
    </>
  );
}
function GridBg() {
  return <div aria-hidden style={{ position:"fixed",inset:0,pointerEvents:"none",zIndex:0,backgroundImage:`linear-gradient(${C.violetSoft} 1px,transparent 1px),linear-gradient(90deg,${C.violetSoft} 1px,transparent 1px)`,backgroundSize:"64px 64px" }} />;
}
function ScanLine() {
  return <motion.div aria-hidden style={{ position:"fixed",left:0,right:0,height:1,background:`linear-gradient(90deg,transparent,${C.violet},${C.cyan},transparent)`,opacity:0.18,pointerEvents:"none",zIndex:1 }}
    animate={{top:["10%","90%","10%"]}} transition={{duration:10,repeat:Infinity,ease:"easeInOut"}} />;
}

/* ─── Section label ──────────────────────────────────────────── */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:20 }}>
      <span style={{ fontSize:10,fontWeight:700,letterSpacing:"0.16em",textTransform:"uppercase",color:C.dim }}>{children}</span>
      <div style={{ flex:1,height:1,background:`linear-gradient(90deg,${C.border},transparent)` }} />
    </div>
  );
}

/* ─── Pre-Quiz Form ──────────────────────────────────────────── */
const LETTERS = ["A","B","C","D"];

const PreQuizForm: React.FC<{ onSubmit: () => void; questions: PreQuizQuestion[]; moduleId: number }> = ({ onSubmit, questions, moduleId }) => {
  const [answers, setAnswers]   = useState<number[]>(Array(questions.length).fill(-1));
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore]       = useState<number | null>(null);
  const [current, setCurrent]   = useState(0);
  const [revealed, setRevealed] = useState(false); // show correct/wrong before advancing

  const q = questions[current];
  const total = questions.length;
  const progress = ((current) / total) * 100;

  async function handleSubmitAll(finalAnswers: number[]) {
    const correct = questions.reduce((acc, q, i) => acc + (finalAnswers[i] === q.correct ? 1 : 0), 0);
    setScore(correct);
    setSubmitted(true);

    const responses = questions.map((q, i) => ({
      question_id: q.question_id,
      selected_option: finalAnswers[i],
    }));

    try {
      await fetch("/api/ai/preQuiz/attempt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ module_id: moduleId, score: correct, responses }),
      });
    } catch {}

    setTimeout(onSubmit, 1800);
  }

  function selectOption(optIdx: number) {
    if (revealed || submitted) return;
    const newAnswers = answers.map((a, i) => i === current ? optIdx : a);
    setAnswers(newAnswers);
    setRevealed(true);
    // Auto-advance after 1.2s
    setTimeout(() => {
      if (current < total - 1) {
        setCurrent(c => c + 1);
        setRevealed(false);
      } else {
        handleSubmitAll(newAnswers);
      }
    }, 1200);
  }

  if (submitted && score !== null) {
    const pct = Math.round((score / total) * 100);
    const good = pct >= 60;
    return (
      <motion.div initial={{opacity:0,scale:0.95}} animate={{opacity:1,scale:1}} style={{ textAlign:"center", padding:"40px 20px" }}>
        <div style={{ fontSize:52, marginBottom:12 }}>{good ? "🎉" : "📖"}</div>
        <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:800, fontSize:28, color:good?C.green:C.amber, marginBottom:8 }}>
          {score} / {total}
        </div>
        <div style={{ fontSize:14, color:C.muted }}>
          {good ? "Great baseline! Your roadmap is saved." : "Good effort! There's lots to learn — that's why you're here."}
        </div>
        <div style={{ marginTop:16, fontSize:12, color:C.dim }}>Redirecting to dashboard…</div>
      </motion.div>
    );
  }

  return (
    <div>
      {/* Mini progress bar */}
      <div style={{ height:3, borderRadius:99, background:C.surfaceHi, marginBottom:24, overflow:"hidden" }}>
        <motion.div animate={{ width:`${progress}%` }} transition={{ duration:0.4 }}
          style={{ height:"100%", borderRadius:99, background:`linear-gradient(90deg,${C.violet},${C.cyan})`, boxShadow:`0 0 8px ${C.violet}55` }} />
      </div>

      <div style={{ fontSize:10, fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", color:C.dim, marginBottom:10 }}>
        Question {current+1} of {total}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={current}
          initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}}
          transition={{duration:0.25,ease:[0.22,1,0.36,1]}}
        >
          <p style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:17, color:C.text, lineHeight:1.45, marginBottom:20 }}>
            {q.q}
          </p>

          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {q.options.map((opt, j) => {
              const selected = answers[current] === j;
              const isCorrect = j === q.correct;
              let bg = C.surface;
              let border = C.border;
              let textColor = C.text;
              let icon = null;

              if (revealed && selected && isCorrect) {
                bg = C.greenSoft; border = C.greenBorder; textColor = C.green;
                icon = "✓";
              } else if (revealed && selected && !isCorrect) {
                bg = C.roseSoft; border = C.roseBorder; textColor = C.rose;
                icon = "✗";
              } else if (revealed && !selected && isCorrect) {
                bg = C.greenSoft; border = C.greenBorder; textColor = C.green;
                icon = "✓";
              }

              return (
                <motion.button key={j}
                  onClick={() => selectOption(j)}
                  whileHover={!revealed ? { x:4, borderColor: C.violet } : {}}
                  whileTap={!revealed ? { scale:0.98 } : {}}
                  style={{
                    display:"flex", alignItems:"center", gap:12,
                    width:"100%", textAlign:"left",
                    padding:"12px 16px", borderRadius:12,
                    background:bg, border:`1px solid ${border}`,
                    color:textColor, fontSize:14, fontWeight:selected?700:500,
                    cursor:revealed?"default":"pointer",
                    fontFamily:"'Space Grotesk',sans-serif",
                    transition:"background 0.2s,border-color 0.2s,color 0.2s",
                  }}
                >
                  <span style={{
                    width:28, height:28, borderRadius:8, flexShrink:0,
                    background: revealed && (selected||isCorrect) ? `${textColor}20` : C.surfaceHi,
                    border: `1px solid ${revealed && (selected||isCorrect) ? border : C.border}`,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontSize:12, fontWeight:800, color: revealed && (selected||isCorrect) ? textColor : C.dim,
                    transition:"all 0.2s",
                  }}>
                    {icon || LETTERS[j]}
                  </span>
                  {opt}
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

/* ─── Week card on the roadmap ───────────────────────────────── */
const WEEK_ACCENTS = [C.violet, C.cyan, C.rose, C.green, C.amber];

function WeekCard({ week, index, total }: { week: RoadmapWeek; index: number; total: number }) {
  const [open, setOpen] = useState(false);
  const accent = WEEK_ACCENTS[index % WEEK_ACCENTS.length];

  return (
    <motion.div
      initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}
      transition={{delay:index*0.06,duration:0.4,ease:[0.22,1,0.36,1]}}
      style={{ display:"flex", gap:16, position:"relative" }}
    >
      {/* Timeline spine */}
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", flexShrink:0 }}>
        <div style={{
          width:36, height:36, borderRadius:"50%", flexShrink:0,
          background:`linear-gradient(135deg,${accent},${C.cyan})`,
          display:"flex", alignItems:"center", justifyContent:"center",
          fontFamily:"'Space Grotesk',sans-serif", fontWeight:800, fontSize:14,
          color:"#0d0918", boxShadow:`0 0 16px ${accent}55`, zIndex:1,
        }}>
          {index+1}
        </div>
        {index < total-1 && (
          <div style={{
            width:2, flex:1, minHeight:24,
            background:`linear-gradient(180deg,${accent}55,transparent)`,
            margin:"4px 0",
          }} />
        )}
      </div>

      {/* Card */}
      <div style={{
        flex:1, marginBottom:16,
        background:C.surface, border:`1px solid ${C.border}`,
        borderRadius:16, overflow:"hidden",
        position:"relative",
      }}>
        {/* Top accent strip */}
        <div aria-hidden style={{ position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,${accent},${C.cyan},transparent)` }} />

        <div style={{ padding:"20px 22px" }}>
          {/* Week label */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
            <div>
              <div style={{ fontSize:10,fontWeight:700,letterSpacing:"0.14em",textTransform:"uppercase",color:accent,marginBottom:4 }}>
                Module {index+1}
              </div>
              <h3 style={{
                fontFamily:"'Space Grotesk',sans-serif", fontWeight:700,
                fontSize:16, color:C.text, margin:0, lineHeight:1.3,
              }}>
                {week.week}
              </h3>
            </div>
          </div>

          {/* Focus topics */}
          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:10,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:C.dim,marginBottom:8 }}>
              Focus Topics
            </div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
              {week.focus_topics.map((t,i) => (
                <span key={i} style={{
                  fontSize:12, fontWeight:500, color:accent,
                  background:`${accent}12`, border:`1px solid ${accent}30`,
                  padding:"3px 10px", borderRadius:20,
                  fontFamily:"'Space Grotesk',sans-serif",
                }}>
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Subtopics toggle */}
          {week.subtopics.length > 0 && (
            <div style={{ marginBottom:14 }}>
              <button
                onClick={() => setOpen(o=>!o)}
                style={{
                  display:"flex", alignItems:"center", gap:6,
                  background:"none", border:`1px solid ${C.border}`,
                  borderRadius:8, padding:"5px 12px", cursor:"pointer",
                  fontSize:12, fontWeight:600, color:C.muted,
                  fontFamily:"'Space Grotesk',sans-serif",
                  transition:"all 0.2s",
                }}
              >
                <motion.span animate={{rotate:open?90:0}} transition={{duration:0.2}}>›</motion.span>
                {open?"Hide":"View"} Subtopics ({week.subtopics.length})
              </button>
              <AnimatePresence>
                {open && (
                  <motion.div
                    initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}}
                    transition={{duration:0.25}} style={{overflow:"hidden"}}
                  >
                    <div style={{
                      marginTop:10, padding:"12px 14px",
                      background:C.surfaceHi, borderRadius:10,
                      display:"flex", flexDirection:"column", gap:6,
                    }}>
                      {week.subtopics.map((s,i) => (
                        <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:8, fontSize:13, color:C.muted }}>
                          <span style={{ color:accent, flexShrink:0, marginTop:1 }}>›</span>{s}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Expected outcome */}
          {week.expected_outcome && (
            <div style={{
              borderTop:`1px solid ${C.border}`, paddingTop:12,
              display:"flex", gap:10, alignItems:"flex-start",
            }}>
              <span style={{ fontSize:14, flexShrink:0, marginTop:1 }}>🎯</span>
              <div>
                <div style={{ fontSize:10,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:C.dim,marginBottom:3 }}>
                  Expected Outcome
                </div>
                <p style={{ fontSize:13, color:C.muted, lineHeight:1.6, margin:0 }}>
                  {week.expected_outcome}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────── */
export default function RoadmapGeneratorPage() {
  const router = useRouter();
  const [theme, setTheme]                     = useState("dark");
  const [input, setInput]                     = useState("");
  const [roadmap, setRoadmap]                 = useState<RoadmapWeek[]>([]);
  const [subjectTitle, setSubjectTitle]       = useState("");
  const [loading, setLoading]                 = useState(false);
  const [saving, setSaving]                   = useState(false);
  const [saved, setSaved]                     = useState(false);
  const [error, setError]                     = useState("");
  const [subjectId, setSubjectId]             = useState<number | null>(null);
  const [preQuizQuestions, setPreQuizQuestions] = useState<PreQuizQuestion[]>([]);
  const [showPreQuizModal, setShowPreQuizModal] = useState(false);
  const [preQuizSubmitted, setPreQuizSubmitted] = useState(false);

  /* Theme sync */
  useEffect(() => {
    const saved = localStorage.getItem("trisara-theme");
    if (saved) { setTheme(saved); document.documentElement.setAttribute("data-theme", saved); }
  }, []);
  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("trisara-theme", next);
    document.documentElement.setAttribute("data-theme", next);
  };

  /* Generate */
  async function generateRoadmap() {
    if (!input.trim()) return;
    setLoading(true); setError(""); setSaved(false); setRoadmap([]);
    try {
      const res = await fetch("/api/roadmap/generate", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ message: input }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data?.error || "Failed to generate roadmap"); return; }
      if (!data?.roadmap || !Array.isArray(data.roadmap)) { setError("Unexpected response from server"); return; }
      setSubjectTitle(data.subjectTitle || "");
      setRoadmap(data.roadmap.map((w: any, i: number) => ({
        week: typeof w.week === "string" ? w.week : `Week ${i+1}`,
        focus_topics: Array.isArray(w.focus_topics) ? w.focus_topics : [w.focus_topics].filter(Boolean),
        subtopics:    Array.isArray(w.subtopics)    ? w.subtopics    : [w.subtopics].filter(Boolean),
        expected_outcome: typeof w.expected_outcome === "string" ? w.expected_outcome : "",
      })));
    } catch { setError("Network or server error"); }
    finally { setLoading(false); }
  }

  /* Save */
  async function saveRoadmap() {
    if (!roadmap.length) return;
    setSaving(true); setError("");
    try {
      const res = await fetch("/api/roadmap/save", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ roadmap, subjectTitle: subjectTitle || input, duration:`${roadmap.length} weeks`, exam:null }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data?.error || "Failed to save roadmap"); return; }
      setSubjectId(data.subjectId);

      /* Generate pre-quiz questions */
      const topics = Array.from(new Set(roadmap.flatMap(w => [...w.focus_topics,...w.subtopics]))).slice(0,6);
      try {
        const aiRes = await fetch("/api/ai/generatePreQuiz", {
          method:"POST", headers:{"Content-Type":"application/json"},
          body:JSON.stringify({ topics, module_id: data.subjectId }),
        });
        const aiData = await aiRes.json();
        if (aiData.quiz && Array.isArray(aiData.quiz)) {
          setPreQuizQuestions(aiData.quiz.map((q: any) => ({
            q: q.question, options: q.options, correct: q.correct, question_id: q.question_id || 0,
          })));
        }
      } catch {}

      setSaved(true);
    } catch { setError("Failed to save roadmap"); }
    finally { setSaving(false); }
  }

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;800&display=swap');`}</style>

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

        {/* Pre-quiz modal */}
        <AnimatePresence>
  {showPreQuizModal && subjectId && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={() => !preQuizSubmitted && setShowPreQuizModal(false)}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(6px)",
        zIndex: 200,

        // ✅ CENTERING FIX
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.93, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.93, y: 20 }}
        transition={{ type: "spring", damping: 26, stiffness: 260 }}
        onClick={(e) => e.stopPropagation()} // ✅ prevent closing on click inside
        style={{
          width: "min(96vw, 560px)",
          maxHeight: "88vh",
          overflowY: "auto",
          background: C.bgSecondary,
          border: `1px solid ${C.border}`,
          borderRadius: 20,
          padding: "32px 28px",
          zIndex: 201,
          boxShadow: `0 24px 80px rgba(0,0,0,0.4)`,
          backdropFilter: "blur(20px)",
          position: "relative",
        }}
      >
        {/* Top strip */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 2,
            background: `linear-gradient(90deg,${C.violet},${C.cyan},${C.rose})`,
            borderRadius: "20px 20px 0 0",
          }}
        />

        {!preQuizSubmitted ? (
          <>
            <div style={{ marginBottom: 24 }}>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: C.violet,
                  marginBottom: 6,
                }}
              >
                Initial Knowledge Check
              </div>

              <h2
                style={{
                  fontFamily: "'Space Grotesk',sans-serif",
                  fontWeight: 800,
                  fontSize: 22,
                  color: C.text,
                  margin: "0 0 8px",
                  letterSpacing: "-0.02em",
                }}
              >
                Pre-Quiz 📝
              </h2>

              <p
                style={{
                  fontSize: 13,
                  color: C.muted,
                  margin: 0,
                  lineHeight: 1.6,
                }}
              >
                Help us understand your starting knowledge. This shapes how your content is personalised.
              </p>
            </div>

            <div style={{ height: 1, background: C.border, marginBottom: 24 }} />

            {preQuizQuestions.length > 0 ? (
              <PreQuizForm
                questions={preQuizQuestions}
                moduleId={subjectId}
                onSubmit={() => setPreQuizSubmitted(true)}
              />
            ) : (
              <div
                style={{
                  textAlign: "center",
                  padding: "32px 0",
                  color: C.dim,
                  fontSize: 14,
                }}
              >
                No questions available.
              </div>
            )}
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ textAlign: "center", padding: "20px 0" }}
          >
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>

            <h3
              style={{
                fontFamily: "'Space Grotesk',sans-serif",
                fontWeight: 800,
                fontSize: 22,
                color: C.green,
                marginBottom: 8,
              }}
            >
              Pre-quiz complete!
            </h3>

            <p
              style={{
                fontSize: 14,
                color: C.muted,
                marginBottom: 28,
                lineHeight: 1.6,
              }}
            >
              Your roadmap is saved and personalised. Time to start learning!
            </p>

            <motion.button
              onClick={() => router.push("/dashboard")}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              style={{
                padding: "13px 32px",
                background: `linear-gradient(135deg,${C.violet},${C.cyan})`,
                border: "none",
                borderRadius: 12,
                color: "#0d0918",
                fontSize: 14,
                fontWeight: 800,
                cursor: "pointer",
                fontFamily: "'Space Grotesk',sans-serif",
                boxShadow: `0 0 24px ${C.violetGlow}`,
              }}
            >
              Go to Dashboard →
            </motion.button>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>

        {/* Main content */}
        <div style={{ maxWidth:860,margin:"0 auto",padding:"56px 24px 100px",position:"relative",zIndex:2 }}>

          {/* Header */}
          <motion.div initial={{opacity:0,y:-14}} animate={{opacity:1,y:0}} transition={{duration:0.45,ease:[0.22,1,0.36,1]}} style={{marginBottom:40}}>
            <div style={{ display:"flex",alignItems:"center",gap:14,marginBottom:16 }}>
              <img src="/logo.png" alt="Tri-Sara" style={{ width:40,height:40,objectFit:"contain",filter:`drop-shadow(0 0 8px ${C.violetGlow})` }} />
              <div>
                <div style={{ fontSize:10,fontWeight:700,letterSpacing:"0.18em",textTransform:"uppercase",color:C.violet,marginBottom:2 }}>AI-Powered</div>
                <h1 style={{
                  fontFamily:"'Space Grotesk',sans-serif",fontWeight:800,
                  fontSize:"clamp(24px,4vw,36px)",letterSpacing:"-0.04em",lineHeight:1.1,margin:0,
                  background:`linear-gradient(135deg,${C.text} 30%,${C.violet} 100%)`,
                  WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",
                }}>
                  Study Roadmap Generator
                </h1>
              </div>
            </div>
            <p style={{ fontSize:14,color:C.muted,margin:0 }}>
              Describe what you want to study and get a personalised, structured roadmap in seconds.
            </p>
          </motion.div>

          {/* Divider */}
          <div style={{ height:1,marginBottom:36,background:`linear-gradient(90deg,transparent,${C.violet}55,${C.cyan}33,transparent)` }} />

          {/* Input card */}
          <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:0.08,duration:0.45,ease:[0.22,1,0.36,1]}}
            style={{
              background:C.surface, border:`1px solid ${C.border}`,
              borderRadius:20, padding:"28px", marginBottom:36,
              position:"relative", overflow:"hidden",
            }}
          >
            <div aria-hidden style={{ position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,${C.violet},${C.cyan},transparent)` }} />
            <SectionLabel>What do you want to study?</SectionLabel>

            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key==="Enter" && (e.metaKey||e.ctrlKey)) generateRoadmap(); }}
              placeholder="e.g. Computer Networks in 8 weeks, Data Structures for GATE CS in 4 weeks in C++, Quantum Physics 2 weeks.
               Be sure to mention the time period. Also mention any specific programming language or topics if applicable."
              rows={4}
              style={{
                width:"100%", padding:"14px 16px",
                background:C.surfaceHi, border:`1px solid ${C.border}`,
                borderRadius:12, resize:"none",
                fontFamily:"'Space Grotesk',sans-serif", fontSize:14,
                color:C.text, lineHeight:1.65,
                outline:"none", boxSizing:"border-box",
                transition:"border-color 0.2s",
              }}
              onFocus={e => e.target.style.borderColor=C.violet}
              onBlur={e => e.target.style.borderColor=C.border}
            />

            <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:16,flexWrap:"wrap",gap:10 }}>
              <motion.button
                onClick={generateRoadmap}
                disabled={loading || !input.trim()}
                whileHover={!loading&&input.trim()?{scale:1.04}:{}}
                whileTap={!loading&&input.trim()?{scale:0.97}:{}}
                style={{
                  padding:"11px 28px",
                  background:loading||!input.trim() ? C.surfaceHi : `linear-gradient(135deg,${C.violet},${C.cyan})`,
                  border:`1px solid ${loading||!input.trim()?C.border:"transparent"}`,
                  borderRadius:12, color:loading||!input.trim()?C.dim:"#0d0918",
                  fontSize:14, fontWeight:800, cursor:loading||!input.trim()?"not-allowed":"pointer",
                  fontFamily:"'Space Grotesk',sans-serif",
                  boxShadow:loading||!input.trim()?"none":`0 0 20px ${C.violetGlow}`,
                  transition:"all 0.2s", letterSpacing:"0.01em",
                }}
              >
                {loading ? (
                  <span style={{ display:"flex",alignItems:"center",gap:8 }}>
                    <motion.span animate={{rotate:360}} transition={{duration:0.8,repeat:Infinity,ease:"linear"}} style={{ display:"inline-block" }}>⟳</motion.span>
                    Generating…
                  </span>
                ) : "Generate Roadmap ✦"}
              </motion.button>
            </div>

            {error && (
              <motion.div initial={{opacity:0,y:6}} animate={{opacity:1,y:0}}
                style={{ marginTop:14,padding:"10px 14px",background:C.roseSoft,border:`1px solid ${C.roseBorder}`,borderRadius:10,fontSize:13,color:C.rose }}>
                {error}
              </motion.div>
            )}
          </motion.div>

          {/* Roadmap output */}
          <AnimatePresence>
            {roadmap.length > 0 && (
              <motion.section initial={{opacity:0}} animate={{opacity:1}} transition={{duration:0.4}}>

                {/* Subject detected */}
                {subjectTitle && (
                  <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}
                    style={{
                      display:"inline-flex",alignItems:"center",gap:8,
                      padding:"5px 14px",marginBottom:24,
                      background:C.violetBubble,border:`1px solid ${C.borderHi}`,
                      borderRadius:99,fontSize:12,fontWeight:600,color:C.violet,
                    }}
                  >
                    ✦ Subject: {subjectTitle}
                  </motion.div>
                )}

                <SectionLabel>Generated Roadmap · {roadmap.length} Modules</SectionLabel>

                {/* Timeline */}
                <div style={{ marginBottom:36 }}>
                  {roadmap.map((week, i) => (
                    <WeekCard key={i} week={week} index={i} total={roadmap.length} />
                  ))}
                </div>

                {/* Save / CTA row */}
                {!saved ? (
                  <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:0.3}}
                    style={{ display:"flex",alignItems:"center",gap:14,flexWrap:"wrap" }}>
                    <motion.button
                      onClick={saveRoadmap}
                      disabled={saving}
                      whileHover={!saving?{scale:1.04}:{}}
                      whileTap={!saving?{scale:0.97}:{}}
                      style={{
                        padding:"13px 32px",
                        background:saving?C.surfaceHi:`linear-gradient(135deg,${C.violet},${C.cyan})`,
                        border:`1px solid ${saving?C.border:"transparent"}`,
                        borderRadius:12, color:saving?C.dim:"#0d0918",
                        fontSize:14, fontWeight:800, cursor:saving?"not-allowed":"pointer",
                        fontFamily:"'Space Grotesk',sans-serif",
                        boxShadow:saving?"none":`0 0 24px ${C.violetGlow}`,
                        letterSpacing:"0.01em",
                      }}
                    >
                      {saving ? (
                        <span style={{display:"flex",alignItems:"center",gap:8}}>
                          <motion.span animate={{rotate:360}} transition={{duration:0.8,repeat:Infinity,ease:"linear"}} style={{display:"inline-block"}}>⟳</motion.span>
                          Saving…
                        </span>
                      ) : "Save Roadmap →"}
                    </motion.button>
                    <span style={{ fontSize:12,color:C.dim }}>Saving will also generate your pre-quiz</span>
                  </motion.div>
                ) : (
                  <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}}
                    style={{
                      display:"flex",flexDirection:"column",gap:16,
                      padding:"24px 28px",
                      background:C.greenSoft,border:`1px solid ${C.greenBorder}`,
                      borderRadius:16,
                    }}
                  >
                    <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                      <span style={{ fontSize:20 }}>✅</span>
                      <div>
                        <div style={{ fontSize:15,fontWeight:700,color:C.green,marginBottom:2 }}>Roadmap saved successfully!</div>
                        <div style={{ fontSize:13,color:C.muted }}>
                          Take a quick pre-quiz to help us personalise your learning content.
                        </div>
                      </div>
                    </div>

                    <div style={{ display:"flex",gap:12,flexWrap:"wrap" }}>
                      {/* Primary: take pre-quiz */}
                      <motion.button
                        onClick={() => setShowPreQuizModal(true)}
                        disabled={preQuizSubmitted}
                        whileHover={!preQuizSubmitted?{scale:1.04}:{}}
                        whileTap={!preQuizSubmitted?{scale:0.97}:{}}
                        style={{
                          padding:"12px 26px",
                          background:preQuizSubmitted?C.surfaceHi:`linear-gradient(135deg,${C.violet},${C.cyan})`,
                          border:`1px solid ${preQuizSubmitted?C.border:"transparent"}`,
                          borderRadius:12, color:preQuizSubmitted?C.dim:"#0d0918",
                          fontSize:14, fontWeight:800, cursor:preQuizSubmitted?"default":"pointer",
                          fontFamily:"'Space Grotesk',sans-serif",
                          boxShadow:preQuizSubmitted?"none":`0 0 20px ${C.violetGlow}`,
                          letterSpacing:"0.01em",
                        }}
                      >
                        {preQuizSubmitted ? "✓ Pre-quiz done" : "📝 Take Pre-Quiz"}
                      </motion.button>

                      {/* Secondary: skip to dashboard */}
                      <motion.button
                        onClick={() => router.push("/dashboard")}
                        whileHover={{scale:1.03}}
                        whileTap={{scale:0.97}}
                        style={{
                          padding:"12px 22px",
                          background:"transparent",
                          border:`1.5px solid ${C.border}`,
                          borderRadius:12, color:C.muted,
                          fontSize:14, fontWeight:600, cursor:"pointer",
                          fontFamily:"'Space Grotesk',sans-serif",
                        }}
                      >
                        Skip → Dashboard
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </motion.section>
            )}
          </AnimatePresence>

        </div>
      </div>
    </>
  );
}