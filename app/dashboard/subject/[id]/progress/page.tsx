"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence, useSpring, useTransform } from "framer-motion";

/* ─── Helpers ────────────────────────────────────────────────── */
function getLocalDateString(d: Date): string {
  return `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2,"0")}-${d.getDate().toString().padStart(2,"0")}`;
}

function getActivityDays(activity: ActivityItem[]): string[] {
  const days = new Set<string>();
  activity.forEach(item => { if (item.date) days.add(getLocalDateString(new Date(item.date))); });
  return Array.from(days).sort();
}

function getCurrentStreak(activityDays: string[]): number {
  if (!activityDays.length) return 0;
  let streak = 0;
  let today = new Date(); today.setHours(0,0,0,0);
  for (let i = activityDays.length - 1; i >= 0; i--) {
    const d = new Date(activityDays[i]); d.setHours(0,0,0,0);
    if (streak === 0 && d.getTime() < today.getTime()) {
      if (today.getTime() - d.getTime() === 86400000) { streak++; today = d; }
      else break;
    } else if (d.getTime() === today.getTime()) { streak++; today.setDate(today.getDate()-1); }
    else break;
  }
  return streak;
}

function getCalendarGrid(activity: ActivityItem[], numDays = 28) {
  const dayMap: Record<string, {quiz:boolean,read:boolean,mega:boolean}> = {};
  activity.forEach(item => {
    if (!item.date) return;
    const k = getLocalDateString(new Date(item.date));
    if (!dayMap[k]) dayMap[k] = {quiz:false,read:false,mega:false};
    if (item.type === "quiz") dayMap[k].quiz = true;
    if (item.type === "read") dayMap[k].read = true;
    if (item.type === "mega-quiz") dayMap[k].mega = true;
  });
  const grid = [];
  const today = new Date(); today.setHours(0,0,0,0);
  for (let i = numDays-1; i >= 0; i--) {
    const d = new Date(today); d.setDate(today.getDate()-i);
    const k = getLocalDateString(d);
    grid.push({ date: k, isToday: i===0, ...(dayMap[k]||{quiz:false,read:false,mega:false}) });
  }
  return grid;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString(undefined, { dateStyle:"medium", timeStyle:"short" });
}

/* ─── Types ──────────────────────────────────────────────────── */
type ActivityItem = { type: string; name?: string; date: string; score?: number };
type ModuleScore  = { module_order: number; score: number; total: number };
type ModuleItem   = { module_order: number; title: string };

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

/* ─── Animated orbs ──────────────────────────────────────────── */
function Orbs() {
  return (
    <>
      <motion.div aria-hidden style={{ position:"fixed",width:600,height:600,borderRadius:"50%",background:`radial-gradient(circle,${C.violetGlow} 0%,transparent 65%)`,top:-200,left:-180,pointerEvents:"none",zIndex:0 }}
        animate={{scale:[1,1.06,1],opacity:[0.7,1,0.7]}} transition={{duration:10,repeat:Infinity,ease:"easeInOut"}} />
      <motion.div aria-hidden style={{ position:"fixed",width:480,height:480,borderRadius:"50%",background:`radial-gradient(circle,${C.cyanGlow} 0%,transparent 65%)`,bottom:-150,right:-120,pointerEvents:"none",zIndex:0 }}
        animate={{scale:[1,1.09,1],opacity:[0.5,0.85,0.5]}} transition={{duration:13,repeat:Infinity,ease:"easeInOut",delay:2}} />
      <motion.div aria-hidden style={{ position:"fixed",width:300,height:300,borderRadius:"50%",background:`radial-gradient(circle,${C.roseSoft} 0%,transparent 70%)`,top:"50%",left:"40%",pointerEvents:"none",zIndex:0 }}
        animate={{y:[0,-28,0]}} transition={{duration:14,repeat:Infinity,ease:"easeInOut"}} />
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

/* ─── Animated counter ───────────────────────────────────────── */
function AnimatedNumber({ value, suffix = "", decimals = 0 }: { value: number; suffix?: string; decimals?: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = value;
    const duration = 1000;
    const step = (end / duration) * 16;
    const timer = setInterval(() => {
      start = Math.min(start + step, end);
      setDisplay(start);
      if (start >= end) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [value]);
  return <>{decimals > 0 ? display.toFixed(decimals) : Math.floor(display)}{suffix}</>;
}

/* ─── Circular progress ring ─────────────────────────────────── */
function DonutRing({ percent, size = 160, stroke = 14, color = C.violet, glowColor = "rgba(167,139,250,0.4)", label }: {
  percent: number; size?: number; stroke?: number; color?: string; glowColor?: string; label?: string;
}) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const [animated, setAnimated] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setAnimated(percent), 200);
    return () => clearTimeout(t);
  }, [percent]);

  return (
    <div style={{ position:"relative", width:size, height:size, flexShrink:0 }}>
      <svg width={size} height={size} style={{ transform:"rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={C.surfaceHi} strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color}
          strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - animated/100)}
          style={{ transition:"stroke-dashoffset 1.2s cubic-bezier(.4,2,.2,1)", filter:`drop-shadow(0 0 8px ${glowColor})` }}
        />
      </svg>
      <div style={{ position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:2 }}>
        <span style={{ fontFamily:"'Space Grotesk',sans-serif",fontSize:size/4.5,fontWeight:800,color,lineHeight:1 }}>
          <AnimatedNumber value={percent} suffix="%" />
        </span>
        {label && <span style={{ fontSize:10,fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase",color:C.dim }}>{label}</span>}
      </div>
    </div>
  );
}

/* ─── Section wrapper card ───────────────────────────────────── */
function Card({ children, delay = 0, style = {} }: { children: React.ReactNode; delay?: number; style?: React.CSSProperties }) {
  return (
    <motion.div
      initial={{ opacity:0, y:20 }}
      animate={{ opacity:1, y:0 }}
      transition={{ delay, duration:0.45, ease:[0.22,1,0.36,1] }}
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 20, padding: "28px 28px",
        position: "relative", overflow: "hidden",
        ...style,
      }}
    >
      {/* Subtle top strip */}
      <div aria-hidden style={{ position:"absolute",top:0,left:"10%",width:"80%",height:1,background:`linear-gradient(90deg,transparent,${C.border},transparent)` }} />
      {children}
    </motion.div>
  );
}

function SectionLabel({ children, accent = C.violet }: { children: React.ReactNode; accent?: string }) {
  return (
    <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:20 }}>
      <span style={{ fontSize:10,fontWeight:700,letterSpacing:"0.16em",textTransform:"uppercase",color:C.dim }}>{children}</span>
      <div style={{ flex:1,height:1,background:`linear-gradient(90deg,${C.border},transparent)` }} />
    </div>
  );
}

/* ─── Heatmap ────────────────────────────────────────────────── */
function HeatmapCell({ cell }: { cell: ReturnType<typeof getCalendarGrid>[0] }) {
  const [tip, setTip] = useState(false);
  let bg = C.surfaceHi;
  let accent = "";
  let typeLabel = "No activity";
  if (cell.mega)  { accent="#a78bfa"; bg=`rgba(167,139,250,0.35)`; typeLabel="Mega-Quiz"; }
  else if (cell.quiz) { accent="#fbbf24"; bg=`rgba(251,191,36,0.3)`;  typeLabel="Quiz"; }
  else if (cell.read) { accent="#22d3ee"; bg=`rgba(34,211,238,0.25)`; typeLabel="Reading"; }
  const glow = accent ? `0 0 10px ${accent}55` : "none";

  return (
    <div style={{ position:"relative" }}
      onMouseEnter={() => setTip(true)}
      onMouseLeave={() => setTip(false)}
    >
      <motion.div
        whileHover={{ scale: 1.25 }}
        style={{
          width:28, height:28, borderRadius:6,
          background: bg,
          border: cell.isToday ? `1.5px dashed ${C.cyan}` : `1px solid ${accent ? accent+"44" : C.border}`,
          boxShadow: glow,
          cursor: accent ? "pointer" : "default",
          transition: "background 0.2s",
        }}
      />
      <AnimatePresence>
        {tip && (
          <motion.div initial={{opacity:0,y:4}} animate={{opacity:1,y:0}} exit={{opacity:0,y:4}} transition={{duration:0.15}}
            style={{
              position:"absolute",bottom:"calc(100% + 6px)",left:"50%",transform:"translateX(-50%)",
              background:C.bgSecondary, border:`1px solid ${C.border}`,borderRadius:8,
              padding:"5px 10px",whiteSpace:"nowrap",zIndex:20,
              fontSize:11,fontWeight:600,color:C.text,
              pointerEvents:"none",
            }}
          >
            {cell.date} · {typeLabel}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Bar chart for time-spent ───────────────────────────────── */
function TimeBar({ value, max, color, label }: { value:number; max:number; color:string; label:string }) {
  const pct = max > 0 ? (value/max)*100 : 0;
  const mins = value / 60;
  const fmt = mins < 10 ? mins.toFixed(1) : Math.round(mins).toString();
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4, flex:1, minWidth:0 }}>
      <span style={{ fontSize:11,fontWeight:700,color,fontFamily:"'Space Grotesk',sans-serif" }}>
        {value > 0 ? `${fmt}m` : "—"}
      </span>
      <div style={{ width:"100%",maxWidth:16,height:80,background:C.surfaceHi,borderRadius:99,overflow:"hidden",alignSelf:"center" }}>
        <motion.div
          initial={{ height:0 }}
          animate={{ height:`${pct}%` }}
          transition={{ duration:1, ease:[0.22,1,0.36,1] }}
          style={{ 
          width:"100%",
          background:color,
          borderRadius:99,
          boxShadow:`0 0 8px ${color}55`,
          position:"absolute" as any,
          bottom:0,
          left:0,
        }}
        />
      </div>
      <span style={{ fontSize:10,color:C.dim,fontWeight:600,letterSpacing:"0.04em" }}>{label}</span>
    </div>
  );
}

/* ─── Learning style bar ─────────────────────────────────────── */
function StyleBar({ label, value, color, icon }: { label:string; value:number; color:string; icon:string }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <span style={{ fontSize:13, fontWeight:600, color:C.muted, display:"flex", alignItems:"center", gap:6 }}>
          <span style={{ fontSize:16 }}>{icon}</span>{label}
        </span>
        <span style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:800, fontSize:20, color }}>
          <AnimatedNumber value={value} suffix="%" />
        </span>
      </div>
      <div style={{ height:6, borderRadius:99, background:C.surfaceHi, overflow:"hidden" }}>
        <motion.div
          initial={{ width:0 }}
          animate={{ width:`${value}%` }}
          transition={{ duration:1.2, ease:[0.22,1,0.36,1] }}
          style={{ height:"100%", borderRadius:99, background:color, boxShadow:`0 0 10px ${color}66` }}
        />
      </div>
    </div>
  );
}

/* ─── Loading ────────────────────────────────────────────────── */
function LoadingScreen() {
  return (
    <div style={{ minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:12 }}>
      {([C.violet,C.cyan,C.rose] as string[]).map((color,i) => (
        <motion.div key={i} animate={{scale:[0.5,1,0.5],opacity:[0.25,1,0.25]}}
          transition={{duration:1.2,repeat:Infinity,delay:i*0.2,ease:"easeInOut"}}
          style={{width:10,height:10,borderRadius:"50%",background:color,position:"absolute",left:`calc(50% + ${(i-1)*22}px)`}} />
      ))}
      <div style={{height:30}}/>
      <span style={{fontSize:12,color:C.dim,letterSpacing:"0.1em",textTransform:"uppercase",marginTop:24}}>Loading progress</span>
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────── */
export default function ProgressPage() {
  const params = useParams();
  const router = useRouter();
  const subjectId = typeof params.id === "string" ? params.id : Array.isArray(params.id) ? params.id[0] : null;

  const [theme, setTheme] = useState("dark");
  const [moduleScores, setModuleScores]     = useState<ModuleScore[]>([]);
  const [megaQuizScore, setMegaQuizScore]   = useState<number|null>(null);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [profile, setProfile]               = useState<{visual:number;audio:number;text:number}|null>(null);
  const [subjectProgress, setSubjectProgress] = useState<{percent:number;completed:number;total:number}|null>(null);
  const [modules, setModules]               = useState<ModuleItem[]>([]);
  const [blockTimes, setBlockTimes]         = useState<Record<string,{text:number;audio:number;visual:number}>>({});
  const [feedbackGiven, setFeedbackGiven]   = useState(false);
  const [pageLoading, setPageLoading]       = useState(true);

  /* Theme */
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

  /* All fetches */
  useEffect(() => {
    if (!subjectId) return;
    Promise.all([
      fetch(`/api/moduleQuiz/score?subjectId=${subjectId}`).then(r=>r.json()),
      fetch("/api/mega-quiz/analytics",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({subjectId})}).then(r=>r.json()),
      fetch(`/api/dashboard/subjects/${subjectId}/activity`).then(r=>r.json()),
      fetch("/api/user/profile").then(r=>r.json()),
      fetch(`/api/dashboard/subjects/${subjectId}`).then(r=>r.json()),
      fetch(`/api/moduleQuiz/completed?subjectId=${subjectId}`).then(r=>r.json()),
      fetch(`/api/feedback?subjectId=${subjectId}`).then(r=>r.json()),
    ]).then(([scores, mega, activity, profile, subjData, completed, feedback]) => {
      if (Array.isArray(scores.scores)) setModuleScores(scores.scores);
      if (mega.analytics?.accuracy != null) setMegaQuizScore(mega.analytics.accuracy);
      if (Array.isArray(activity.activity)) setRecentActivity(activity.activity);
      const p = profile.profile || profile;
      if (typeof p?.text === "number") setProfile(p);
      const mods: ModuleItem[] = subjData.modules || [];
      setModules(mods);
      const total = mods.length;
      const comp  = completed.completed || 0;
      setSubjectProgress({ percent: total > 0 ? Math.floor((comp/total)*100) : 0, completed: comp, total });
      setFeedbackGiven(!!feedback.found);
    }).catch(console.error).finally(() => setPageLoading(false));
  }, [subjectId]);

  /* Block times */
  useEffect(() => {
    if (!subjectId || !modules.length) return;
    Promise.all(modules.map(mod =>
      fetch(`/api/moduleBlockTime?subjectId=${subjectId}&moduleId=${mod.module_order}`).then(r=>r.json())
        .then(data => ({ order: mod.module_order, times: data.times || [] }))
    )).then(results => {
      const map: Record<string,{text:number;audio:number;visual:number}> = {};
      results.forEach(({order, times}) => {
        const obj = { text:0, audio:0, visual:0 };
        times.forEach((row:any) => { (obj as any)[row.block_type] = row.time_spent_seconds; });
        map[order] = obj;
      });
      setBlockTimes(map);
    });
  }, [subjectId, modules]);

  /* Redirect on completion */
  useEffect(() => {
    if (subjectProgress?.percent === 100 && !feedbackGiven) {
      router.push(`/dashboard/subject/${subjectId}/feedback`);
    }
  }, [subjectProgress, feedbackGiven, router, subjectId]);

  if (pageLoading) return <LoadingScreen />;

  const activityDays = getActivityDays(recentActivity);
  const streak = getCurrentStreak(activityDays);
  const calendarGrid = getCalendarGrid(recentActivity, 28);

  const allTimes = modules.map(m => blockTimes[m.module_order] || {text:0,audio:0,visual:0});
  const maxBlockTime = Math.max(...allTimes.flatMap(t => [t.text,t.audio,t.visual]), 1);

  const visibleActivity = recentActivity.filter(a => a.type !== "content").slice(0,6);

  const activityIcons: Record<string,string> = { read:"📖", quiz:"📝", "mega-quiz":"🎮" };
  const activityColors: Record<string,string> = { read:C.cyan, quiz:C.amber, "mega-quiz":C.violet };

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;800&display=swap');`}</style>
      <div style={{ minHeight:"100vh", color:C.text, position:"relative", overflow:"hidden", fontFamily:"'Space Grotesk',sans-serif" }}>
        <Orbs /><GridBg /><ScanLine />

        {/* Theme toggle */}
        <button onClick={toggleTheme} title={theme==="dark"?"Light mode":"Dark mode"} style={{
          position:"fixed",top:20,right:20,width:34,height:34,borderRadius:10,
          border:`1px solid ${C.border}`,background:C.surface,color:C.text,
          display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",zIndex:50,fontSize:16,
        }}>
          {theme==="dark" ? "☀" : "🌙"}
        </button>

        {/* Main */}
        <div style={{ maxWidth:1100,margin:"0 auto",padding:"48px 24px 100px",position:"relative",zIndex:2 }}>

          {/* ── BACK + HEADER ── */}
          <motion.button onClick={() => router.push(`/dashboard/subject/${subjectId}`)}
            whileHover={{x:-3}} style={{ background:"none",border:"none",padding:"0 0 24px",color:C.dim,fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",gap:6 }}
            onMouseEnter={e=>e.currentTarget.style.color=C.violet}
            onMouseLeave={e=>e.currentTarget.style.color=C.dim}
          >
            ← Back to Subject
          </motion.button>

          <motion.div initial={{opacity:0,y:-14}} animate={{opacity:1,y:0}} transition={{duration:0.45,ease:[0.22,1,0.36,1]}} style={{marginBottom:40}}>
            <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.18em",textTransform:"uppercase",color:C.violet,marginBottom:6}}>
              Progress Tracker
            </div>
            <h1 style={{
              fontWeight:800, fontSize:"clamp(26px,4vw,42px)", letterSpacing:"-0.04em",
              lineHeight:1.1, margin:"0 0 6px",
              background:`linear-gradient(135deg,${C.text} 30%,${C.violet} 100%)`,
              WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
            }}>
              Your Learning Progress
            </h1>
            <p style={{fontSize:14,color:C.muted,margin:0}}>A full picture of how far you've come.</p>
          </motion.div>

          {/* ── DIVIDER ── */}
          <div style={{height:1,marginBottom:36,background:`linear-gradient(90deg,transparent,${C.violet}55,${C.cyan}33,transparent)`}} />

          {/* ── TOP ROW: Streak + Completion + Mega Quiz ── */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))", gap:16, marginBottom:20 }}>

            {/* Streak card */}
            <Card delay={0.05}>
              <div aria-hidden style={{position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,${C.amber},${C.rose})`}} />
              <SectionLabel>🔥 Daily Streak</SectionLabel>
              <div style={{display:"flex",alignItems:"flex-end",gap:12}}>
                <span style={{fontWeight:800,fontSize:64,lineHeight:1,background:`linear-gradient(135deg,${C.amber},${C.rose})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>
                  <AnimatedNumber value={streak} />
                </span>
                <div style={{paddingBottom:8}}>
                  <div style={{fontSize:14,fontWeight:700,color:C.text}}>day{streak!==1?"s":""} in a row</div>
                  <div style={{fontSize:12,color:C.dim,marginTop:2}}>{streak===0?"Start learning today!":streak>=7?"You're on fire! 🔥":"Keep it up!"}</div>
                </div>
              </div>

              {/* Mini week indicator */}
              <div style={{display:"flex",gap:4,marginTop:16}}>
                {calendarGrid.slice(-7).map((cell,i) => {
                  const active = cell.mega||cell.quiz||cell.read;
                  return (
                    <div key={i} style={{flex:1,height:4,borderRadius:99,background:active?`linear-gradient(90deg,${C.violet},${C.cyan})`:C.surfaceHi,boxShadow:active?`0 0 6px ${C.violet}55`:"none",transition:"all 0.3s"}} />
                  );
                })}
              </div>
              <div style={{fontSize:10,color:C.dim,marginTop:6,letterSpacing:"0.06em",textTransform:"uppercase"}}>Last 7 days</div>
            </Card>

            {/* Completion donut */}
            {subjectProgress && (
              <Card delay={0.1}>
                <div aria-hidden style={{position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,${C.violet},${C.cyan})`}} />
                <SectionLabel>📚 Subject Completion</SectionLabel>
                <div style={{display:"flex",alignItems:"center",gap:24}}>
                  <DonutRing percent={subjectProgress.percent} size={120} stroke={12} color={C.violet} glowColor="rgba(167,139,250,0.5)" label="Done" />
                  <div style={{display:"flex",flexDirection:"column",gap:12,flex:1}}>
                    <div>
                      <div style={{fontSize:28,fontWeight:800,color:C.text,fontFamily:"'Space Grotesk',sans-serif",lineHeight:1}}>
                        <AnimatedNumber value={subjectProgress.completed} />
                        <span style={{fontSize:14,color:C.dim,fontWeight:500}}> / {subjectProgress.total}</span>
                      </div>
                      <div style={{fontSize:12,color:C.muted,marginTop:2}}>Modules completed</div>
                    </div>
                    <div style={{height:4,borderRadius:99,background:C.surfaceHi,overflow:"hidden"}}>
                      <motion.div initial={{width:0}} animate={{width:`${subjectProgress.percent}%`}} transition={{duration:1.2,ease:[0.22,1,0.36,1]}}
                        style={{height:"100%",borderRadius:99,background:`linear-gradient(90deg,${C.violet},${C.cyan})`,boxShadow:`0 0 10px ${C.violet}66`}} />
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Mega quiz score */}
            <Card delay={0.15}>
              <div aria-hidden style={{position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,${C.cyan},${C.green})`}} />
              <SectionLabel>🎮 Mega Quiz Score</SectionLabel>
              {megaQuizScore != null ? (
                <div style={{display:"flex",alignItems:"center",gap:20}}>
                  <DonutRing percent={Math.round(megaQuizScore*100)} size={120} stroke={12}
                    color={megaQuizScore>=0.7 ? C.green : C.rose}
                    glowColor={megaQuizScore>=0.7 ? "rgba(52,211,153,0.5)" : "rgba(251,113,133,0.5)"}
                    label="Score"
                  />
                  <div>
                    <div style={{fontSize:14,color:megaQuizScore>=0.7?C.green:C.rose,fontWeight:700,marginBottom:6}}>
                      {megaQuizScore>=0.9?"Outstanding! 🏆":megaQuizScore>=0.7?"Good job! ✓":"Keep practicing"}
                    </div>
                    <motion.button onClick={()=>router.push(`/dashboard/subject/${subjectId}/mega/result-analysis`)}
                      whileHover={{scale:1.04}} whileTap={{scale:0.97}}
                      style={{padding:"8px 16px",background:C.violetBubble,border:`1px solid ${C.borderHi}`,borderRadius:10,color:C.violet,fontSize:12,fontWeight:700,cursor:"pointer"}}>
                      View Analysis →
                    </motion.button>
                  </div>
                </div>
              ) : (
                <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:8,padding:"20px 0",opacity:0.6}}>
                  <span style={{fontSize:32}}>🎮</span>
                  <span style={{fontSize:13,color:C.muted,textAlign:"center"}}>No mega quiz taken yet</span>
                </div>
              )}
            </Card>
          </div>

          {/* ── HEATMAP + ACTIVITY ── */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:20}}>

            {/* Heatmap */}
            <Card delay={0.2}>
              <div aria-hidden style={{position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,${C.cyan},${C.violet})`}} />
              <SectionLabel>📅 Activity Heatmap · Last 4 Weeks</SectionLabel>

              {/* Day labels */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:6,marginBottom:6}}>
                {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d=>(
                  <div key={d} style={{fontSize:10,color:C.dim,fontWeight:700,letterSpacing:"0.04em",textAlign:"center"}}>{d}</div>
                ))}
              </div>
              {/* Grid */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:6,marginBottom:14}}>
                {calendarGrid.map((cell,i)=><HeatmapCell key={i} cell={cell} />)}
              </div>
              {/* Legend */}
              <div style={{display:"flex",gap:14,flexWrap:"wrap",fontSize:11,color:C.dim}}>
                {[
                  {color:"rgba(167,139,250,0.35)",border:"rgba(167,139,250,0.6)",label:"Mega Quiz"},
                  {color:"rgba(251,191,36,0.3)",border:"rgba(251,191,36,0.6)",label:"Quiz"},
                  {color:"rgba(34,211,238,0.25)",border:"rgba(34,211,238,0.6)",label:"Reading"},
                  {color:C.surfaceHi,border:C.border,label:"None"},
                ].map(l=>(
                  <span key={l.label} style={{display:"flex",alignItems:"center",gap:5}}>
                    <span style={{width:12,height:12,borderRadius:3,background:l.color,border:`1px solid ${l.border}`,display:"inline-block"}} />
                    {l.label}
                  </span>
                ))}
              </div>
            </Card>

            {/* Recent activity */}
            <Card delay={0.22}>
              <div aria-hidden style={{position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,${C.rose},${C.amber})`}} />
              <SectionLabel>⚡ Recent Activity</SectionLabel>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {visibleActivity.length === 0 ? (
                  <div style={{color:C.dim,fontSize:13,textAlign:"center",padding:"20px 0"}}>No recent activity yet.</div>
                ) : visibleActivity.map((item,idx)=>{
                  const icon = activityIcons[item.type] || "📚";
                  const color = activityColors[item.type] || C.violet;
                  let label = item.name || "Activity";
                  if (item.type==="read") {
                    const m = item.name?.match(/Module (\d+) - Chapter (\d+)/);
                    label = m ? `Module ${m[1]}: Chapter ${Number(m[2])+1} Read` : "Chapter Read";
                  } else if (item.type==="quiz") {
                    const m = item.name?.match(/Module (\d+)/);
                    label = m ? `Module ${m[1]} Quiz` : "Module Quiz";
                  } else if (item.type==="mega-quiz") {
                    label = "Mega-Quiz Taken";
                  }
                  return (
                    <motion.div key={idx} initial={{opacity:0,x:-10}} animate={{opacity:1,x:0}} transition={{delay:0.3+idx*0.05}}
                      style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",borderRadius:10,background:`${color}0d`,border:`1px solid ${color}22`}}>
                      <span style={{fontSize:16,flexShrink:0}}>{icon}</span>
                      <span style={{flex:1,fontSize:13,fontWeight:600,color:C.text}}>{label}</span>
                      {item.type==="mega-quiz" && typeof item.score==="number" && (
                        <span style={{fontSize:12,fontWeight:700,color:item.score>=0.7?C.green:C.rose}}>
                          {(item.score*100).toFixed(0)}%
                        </span>
                      )}
                      <span style={{fontSize:11,color:C.dim,flexShrink:0}}>{formatDate(item.date)}</span>
                    </motion.div>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* ── MODULE QUIZ SCORES ── */}
          {moduleScores.length > 0 && (
            <Card delay={0.28} style={{marginBottom:20}}>
              <div aria-hidden style={{position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,${C.amber},${C.cyan})`}} />
              <SectionLabel>📝 Module Quiz Scores</SectionLabel>
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {moduleScores.map((row,i)=>{
                  const pct = row.total > 0 ? Math.round((row.score/row.total)*100) : 0;
                  const color = pct >= 70 ? C.green : pct >= 40 ? C.amber : C.rose;
                  return (
                    <motion.div key={row.module_order} initial={{opacity:0,x:-12}} animate={{opacity:1,x:0}} transition={{delay:0.35+i*0.05}}
                      style={{display:"flex",alignItems:"center",gap:12}}>
                      <span style={{fontSize:12,fontWeight:700,color:C.dim,width:72,flexShrink:0}}>Module {row.module_order}</span>
                      <div style={{flex:1,height:8,borderRadius:99,background:C.surfaceHi,overflow:"hidden"}}>
                        <motion.div initial={{width:0}} animate={{width:`${pct}%`}} transition={{duration:1,delay:0.4+i*0.05,ease:[0.22,1,0.36,1]}}
                          style={{height:"100%",borderRadius:99,background:color,boxShadow:`0 0 8px ${color}55`}} />
                      </div>
                      <span style={{fontSize:13,fontWeight:800,color,width:40,textAlign:"right",fontFamily:"'Space Grotesk',sans-serif"}}>
                        {pct}%
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* ── LEARNING STYLE + TIME CHART ── */}
          <div style={{display:"grid",gridTemplateColumns:"320px 1fr",gap:16,marginBottom:20}}>

            {/* Learning style */}
            {profile && (
              <Card delay={0.3}>
                <div aria-hidden style={{position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,${C.green},${C.cyan})`}} />
                <SectionLabel>🧠 Learning Style</SectionLabel>
                <div style={{display:"flex",flexDirection:"column",gap:16}}>
                  <StyleBar label="Text-Based"   value={profile.text}   color={C.green}  icon="📝" />
                  <StyleBar label="Visual"        value={profile.visual} color={C.amber}  icon="👁" />
                  <StyleBar label="Auditory"      value={profile.audio}  color={C.violet} icon="🎧" />
                </div>
                <div style={{marginTop:16,padding:"10px 14px",background:C.violetSoft,border:`1px solid ${C.border}`,borderRadius:10}}>
                  <div style={{fontSize:10,fontWeight:700,color:C.dim,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:4}}>Dominant style</div>
                  <div style={{fontSize:14,fontWeight:700,color:C.text}}>
                    {profile.text >= profile.visual && profile.text >= profile.audio ? "📝 Text-Based Learner"
                      : profile.visual >= profile.audio ? "👁 Visual Learner"
                      : "🎧 Auditory Learner"}
                  </div>
                </div>
              </Card>
            )}

            {/* Time per module bar chart */}
            {modules.length > 0 && (
              <Card delay={0.32}>
                <div aria-hidden style={{position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,${C.violet},${C.rose})`}} />
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
                  <SectionLabel>⏱ Time Spent by Content Type (mins)</SectionLabel>
                  <div style={{display:"flex",gap:12,fontSize:11,color:C.dim}}>
                    {[{color:"#4ade80",label:"Text"},{color:C.violet,label:"Audio"},{color:C.amber,label:"Visual"}].map(l=>(
                      <span key={l.label} style={{display:"flex",alignItems:"center",gap:4}}>
                        <span style={{width:10,height:10,borderRadius:2,background:l.color,display:"inline-block"}} />{l.label}
                      </span>
                    ))}
                  </div>
                </div>
                <div style={{display:"flex",gap:16,overflowX:"auto",paddingBottom:4}}>
                  {modules.map((mod,i)=>{
                    const t = blockTimes[mod.module_order]||{text:0,audio:0,visual:0};
                    return (
                      <div key={mod.module_order} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6,minWidth:56}}>
                        {/* Grouped mini bars */}
                        <div style={{display:"flex",gap:3,alignItems:"flex-end",height:90}}>
                          {[{v:t.text,c:"#4ade80"},{v:t.audio,c:C.violet},{v:t.visual,c:C.amber}].map((bar,bi)=>{
                            const h = maxBlockTime > 0 ? Math.max((bar.v/maxBlockTime)*80,0) : 0;
                            const mins = bar.v/60;
                            return (
                              <div key={bi} style={{width:14,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"flex-end",height:90}}>
                                {bar.v > 0 && <span style={{fontSize:9,color:bar.c,fontWeight:700,marginBottom:2}}>{mins<10?mins.toFixed(1):Math.round(mins)}</span>}
                                <motion.div initial={{height:0}} animate={{height:h}} transition={{duration:1,delay:0.4+i*0.06,ease:[0.22,1,0.36,1]}}
                                  style={{width:14,borderRadius:"4px 4px 0 0",background:bar.c,boxShadow:`0 0 6px ${bar.c}55`}} />
                              </div>
                            );
                          })}
                        </div>
                        <span style={{fontSize:10,color:C.dim,fontWeight:700,textAlign:"center",whiteSpace:"nowrap"}}>M{mod.module_order}</span>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}
          </div>

          {/* ── CONTINUE / COMPLETION CTA ── */}
          {subjectProgress && (
            <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:0.4,duration:0.45}}
              style={{display:"flex",justifyContent:"center",gap:14,flexWrap:"wrap",marginTop:8}}>
              {subjectProgress.completed >= subjectProgress.total ? (
                <div style={{
                  padding:"24px 40px",borderRadius:20,textAlign:"center",
                  background:C.greenSoft, border:`1px solid ${C.greenBorder}`,
                  fontSize:18,fontWeight:800,color:C.green,
                  boxShadow:`0 0 32px ${C.green}22`,
                }}>
                  🎉 Congratulations! You've completed all modules!
                </div>
              ) : (() => {
                const nextMod = modules[subjectProgress.completed];
                return nextMod ? (
                  <motion.button onClick={()=>router.push(`/dashboard/subject/${subjectId}/module/${nextMod.module_order}`)}
                    whileHover={{scale:1.04}} whileTap={{scale:0.97}}
                    style={{
                      padding:"14px 32px",background:`linear-gradient(135deg,${C.violet},${C.cyan})`,
                      border:"none",borderRadius:14,color:"#0d0918",fontSize:15,fontWeight:800,
                      cursor:"pointer",boxShadow:`0 0 24px ${C.violetGlow}`,letterSpacing:"0.01em",
                    }}>
                    Continue → Module {nextMod.module_order}
                  </motion.button>
                ) : null;
              })()}
              {recentActivity.some(a=>a.type==="mega-quiz") && (
                <motion.button onClick={()=>router.push(`/dashboard/subject/${subjectId}/mega/result-analysis`)}
                  whileHover={{scale:1.04}} whileTap={{scale:0.97}}
                  style={{
                    padding:"14px 32px",background:C.violetBubble,
                    border:`1.5px solid ${C.violet}`,borderRadius:14,color:C.violet,
                    fontSize:15,fontWeight:800,cursor:"pointer",letterSpacing:"0.01em",
                  }}>
                  🎮 View Mega Quiz Analysis
                </motion.button>
              )}
            </motion.div>
          )}

        </div>
      </div>
    </>
  );
}