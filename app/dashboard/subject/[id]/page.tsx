"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

type Module = {
  module_order: number;
  title: string;
  goal: string;
  topics: string[];
  isCompleted?: boolean;
  isLocked?: boolean;
};

type Subject = {
  id: number;
  title: string;
  exam: string | null;
  total_duration: string | null;
};

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
  text:        "var(--ts-text)",
  muted:       "var(--ts-text-muted)",
  dim:         "var(--ts-text-dim)",
};

function getAccentHex(i: number) {
  return ["#a78bfa","#22d3ee","#fb7185","#34d399","#a78bfa","#22d3ee","#fb7185"][i % 7];
}

function Orbs() {
  return (
    <>
      <motion.div aria-hidden style={{ position:"fixed",width:560,height:560,borderRadius:"50%",background:`radial-gradient(circle,${C.violetGlow} 0%,transparent 65%)`,top:-180,left:-160,pointerEvents:"none",zIndex:0 }} animate={{scale:[1,1.06,1],opacity:[0.7,1,0.7]}} transition={{duration:10,repeat:Infinity,ease:"easeInOut"}} />
      <motion.div aria-hidden style={{ position:"fixed",width:480,height:480,borderRadius:"50%",background:`radial-gradient(circle,${C.cyanGlow} 0%,transparent 65%)`,bottom:-150,right:-120,pointerEvents:"none",zIndex:0 }} animate={{scale:[1,1.09,1],opacity:[0.5,0.85,0.5]}} transition={{duration:13,repeat:Infinity,ease:"easeInOut",delay:2}} />
      <motion.div aria-hidden style={{ position:"fixed",width:300,height:300,borderRadius:"50%",background:`radial-gradient(circle,${C.roseSoft} 0%,transparent 70%)`,top:"50%",left:"40%",pointerEvents:"none",zIndex:0 }} animate={{y:[0,-28,0]}} transition={{duration:14,repeat:Infinity,ease:"easeInOut"}} />
    </>
  );
}

function GridBg() {
  return <div aria-hidden style={{ position:"fixed",inset:0,pointerEvents:"none",zIndex:0,backgroundImage:`linear-gradient(${C.violetSoft} 1px,transparent 1px),linear-gradient(90deg,${C.violetSoft} 1px,transparent 1px)`,backgroundSize:"64px 64px" }} />;
}

function ScanLine() {
  return <motion.div aria-hidden style={{ position:"fixed",left:0,right:0,height:1,background:`linear-gradient(90deg,transparent,${C.violet},${C.cyan},transparent)`,opacity:0.18,pointerEvents:"none",zIndex:1 }} animate={{top:["10%","90%","10%"]}} transition={{duration:10,repeat:Infinity,ease:"easeInOut"}} />;
}

function LoadingScreen() {
  return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:12}}>
      <div style={{display:"flex",gap:8}}>
        {[C.violet,C.cyan,C.rose].map((color,i)=>(
          <motion.div key={i} animate={{scale:[0.5,1,0.5],opacity:[0.25,1,0.25]}} transition={{duration:1.2,repeat:Infinity,delay:i*0.2,ease:"easeInOut"}} style={{width:10,height:10,borderRadius:"50%",background:color}} />
        ))}
      </div>
      <span style={{fontSize:12,color:C.dim,letterSpacing:"0.1em",textTransform:"uppercase",marginTop:12}}>Loading</span>
    </div>
  );
}

function ActionButton({ icon, label, onClick }: { icon:string; label:string; onClick?:()=>void }) {
  const [h, setH] = useState(false);
  return (
    <motion.button onClick={onClick} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)} whileHover={{scale:1.03}} whileTap={{scale:0.97}} style={{ display:"flex",alignItems:"center",gap:8,padding:"11px 20px",borderRadius:12,background:h?C.violetBubble:C.surface,border:`1px solid ${h?C.borderHi:C.border}`,color:h?C.violet:C.muted,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"'Space Grotesk',sans-serif",transition:"background 0.2s,border-color 0.2s,color 0.2s",whiteSpace:"nowrap" }}>
      <span style={{fontSize:16}}>{icon}</span>{label}
    </motion.button>
  );
}

function MegaQuizBanner({ onClick }: { onClick:()=>void }) {
  const [h, setH] = useState(false);
  return (
    <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{duration:0.5,ease:[0.22,1,0.36,1]}} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)} onClick={onClick} style={{ position:"relative",borderRadius:18,padding:"24px 28px",marginBottom:40,cursor:"pointer",overflow:"hidden",border:`1px solid ${h?"var(--ts-violet)":"var(--ts-border-hi)"}`,background:h?"var(--ts-violet-bubble)":"var(--ts-surface)",boxShadow:h?`0 0 40px var(--ts-violet-glow),0 0 0 1px var(--ts-violet)`:`0 0 0 1px var(--ts-border-hi),0 8px 32px rgba(0,0,0,0.3),inset 0 0 48px var(--ts-violet-soft)`,transition:"all 0.25s ease",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:16 }}>
      <div style={{position:"absolute",top:0,left:"10%",width:"80%",height:1,background:"linear-gradient(90deg,transparent,var(--ts-violet),var(--ts-cyan),transparent)",opacity:h?0.9:0.5,transition:"opacity 0.25s"}} />
      <motion.div animate={{x:["-30%","130%"]}} transition={{duration:3,repeat:Infinity,ease:"linear"}} style={{position:"absolute",top:0,bottom:0,width:"30%",background:"linear-gradient(90deg,transparent,var(--ts-violet-soft),transparent)",pointerEvents:"none"}} />
      <div style={{display:"flex",alignItems:"center",gap:16,position:"relative",zIndex:1}}>
        <motion.div animate={{rotate:[0,10,-10,0],scale:[1,1.15,1]}} transition={{duration:2.5,repeat:Infinity,ease:"easeInOut"}} style={{fontSize:32,lineHeight:1}}>🚀</motion.div>
        <div>
          <div style={{display:"inline-flex",alignItems:"center",gap:6,background:"var(--ts-violet-soft)",border:"1px solid var(--ts-border-hi)",borderRadius:999,padding:"3px 10px",marginBottom:6}}>
            <span style={{fontSize:9,fontWeight:700,letterSpacing:"0.14em",textTransform:"uppercase",color:"var(--ts-violet)"}}>All modules complete</span>
          </div>
          <h3 style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:"clamp(1rem,2.5vw,1.2rem)",fontWeight:700,color:"var(--ts-text)",margin:0,lineHeight:1.2}}>Take the Mega Quiz</h3>
          <p style={{fontSize:13,color:"var(--ts-text-muted)",margin:"4px 0 0",lineHeight:1.5}}>Final assessment across all modules — show what you've learned.</p>
        </div>
      </div>
      <motion.div whileHover={{x:4}} style={{display:"flex",alignItems:"center",gap:8,padding:"10px 20px",borderRadius:12,background:"linear-gradient(135deg,var(--ts-violet),#818cf8)",color:"#fff",fontSize:13,fontWeight:700,fontFamily:"'Space Grotesk',sans-serif",boxShadow:"0 0 20px var(--ts-violet-glow)",flexShrink:0,position:"relative",zIndex:1,whiteSpace:"nowrap"}}>Start ✦</motion.div>
    </motion.div>
  );
}

function LockTooltip({ prevTitle }: { prevTitle: string }) {
  return (
    <motion.div
      initial={{opacity:0,y:6,scale:0.95}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:4,scale:0.95}} transition={{duration:0.15}}
      style={{
        position:"absolute",bottom:"calc(100% + 10px)",left:"50%",transform:"translateX(-50%)",
        background:"var(--ts-surface)",border:"1px solid var(--ts-border-hi)",
        borderRadius:10,padding:"8px 14px",fontSize:11,fontWeight:600,
        color:"var(--ts-text-muted)",whiteSpace:"nowrap",zIndex:10,
        pointerEvents:"none",boxShadow:"0 4px 20px rgba(0,0,0,0.4)",
      }}
    >
      🔒 Complete <span style={{color:"var(--ts-violet)"}}>{prevTitle}</span> first
      <div style={{position:"absolute",top:"100%",left:"50%",transform:"translateX(-50%)",width:0,height:0,borderLeft:"5px solid transparent",borderRight:"5px solid transparent",borderTop:"5px solid var(--ts-border-hi)"}} />
    </motion.div>
  );
}

function ModuleCard({ mod, index, subjectId, router, prevTitle }: {
  mod: Module; index: number; subjectId: string;
  router: ReturnType<typeof useRouter>; prevTitle?: string;
}) {
  const [hovered, setHovered] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const accentHex = getAccentHex(index);
  const isLocked = !!mod.isLocked;

  function handleNavigate() {
    if (isLocked) return;
    router.push(`/dashboard/subject/${subjectId}/module/${mod.module_order}`);
  }

  return (
    <motion.div
      initial={{opacity:0,y:22}} animate={{opacity:1,y:0}}
      transition={{delay:index*0.06,duration:0.4,ease:[0.22,1,0.36,1]}}
      onMouseEnter={()=>{setHovered(true);if(!isLocked)setFlipped(true);}}
      onMouseLeave={()=>{setHovered(false);setFlipped(false);}}
      onClick={handleNavigate}
      role="button" tabIndex={0}
      onKeyDown={e=>e.key==="Enter"&&handleNavigate()}
      style={{position:"relative",cursor:isLocked?"not-allowed":"pointer",minHeight:180,outline:"none"}}
    >
      <AnimatePresence>
        {isLocked && hovered && prevTitle && <LockTooltip prevTitle={prevTitle} />}
      </AnimatePresence>

      {isLocked ? (
        /* ── LOCKED ── */
        <div style={{
          position:"absolute",inset:0,borderRadius:16,padding:"20px 18px",
          background:"var(--ts-surface)",border:`1px solid var(--ts-border)`,
          opacity:0.45,display:"flex",flexDirection:"column",gap:8,
        }}>
          <div style={{position:"absolute",top:10,right:10,background:"var(--ts-surface-hi)",color:"var(--ts-text-dim)",padding:"3px 8px",borderRadius:8,fontSize:10,fontWeight:600,display:"flex",alignItems:"center",gap:4}}>
            🔒 Locked
          </div>
          <div aria-hidden style={{position:"absolute",top:0,left:"12%",width:"76%",height:2,background:`linear-gradient(90deg,transparent,${C.border},transparent)`,opacity:0.4,borderRadius:"0 0 4px 4px"}} />
          <div style={{width:32,height:32,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,background:"var(--ts-surface-hi)",border:`1px solid var(--ts-border)`,color:"var(--ts-text-dim)",fontFamily:"'Space Grotesk',sans-serif"}}>
            {mod.module_order}
          </div>
          <h3 style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:14,fontWeight:700,color:"var(--ts-text-dim)",paddingTop:8,margin:0,lineHeight:1.35}}>{mod.title}</h3>
          <p style={{fontSize:12,color:"var(--ts-text-dim)",margin:0,lineHeight:1.55,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical" as const,overflow:"hidden"}}>{mod.goal}</p>
          {/* hatch pattern */}
          <div style={{position:"absolute",inset:0,borderRadius:16,background:"repeating-linear-gradient(45deg,transparent,transparent 8px,rgba(255,255,255,0.015) 8px,rgba(255,255,255,0.015) 16px)",pointerEvents:"none"}} />
        </div>
      ) : (
        <>
          {/* ── FRONT ── */}
          <motion.div animate={{opacity:flipped?0:1,y:flipped?-4:0}} transition={{duration:0.22}} style={{
            position:"absolute",inset:0,borderRadius:16,padding:"20px 18px",
            background:mod.isCompleted?"rgba(34,197,94,0.08)":C.surface,
            border:`1px solid ${mod.isCompleted?"rgba(34,197,94,0.25)":C.border}`,
            boxShadow:mod.isCompleted?"0 0 40px rgba(34,197,94,0.15)":"none",
          }}>
            {mod.isCompleted && (
              <div style={{position:"absolute",top:10,right:10,background:"rgba(34,197,94,0.15)",color:"var(--ts-green)",padding:"3px 8px",borderRadius:8,fontSize:10,fontWeight:600}}>✓ Done</div>
            )}
            <div aria-hidden style={{position:"absolute",top:0,left:"12%",width:"76%",height:2,background:`linear-gradient(90deg,transparent,${accentHex},transparent)`,opacity:0.5,borderRadius:"0 0 4px 4px"}} />
            <div style={{width:32,height:32,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,background:mod.isCompleted?"rgba(34,197,94,0.15)":`${accentHex}15`,border:`1px solid ${mod.isCompleted?"rgba(34,197,94,0.4)":`${accentHex}35`}`,color:mod.isCompleted?"var(--ts-green)":accentHex,fontFamily:"'Space Grotesk',sans-serif"}}>
              {mod.module_order}
            </div>
            <h3 style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:14,fontWeight:700,color:C.text,paddingTop:8,margin:0,lineHeight:1.35,letterSpacing:"-0.2px"}}>{mod.title}</h3>
            <p style={{fontSize:12,color:C.muted,margin:0,lineHeight:1.55,display:"-webkit-box",WebkitLineClamp:3,WebkitBoxOrient:"vertical" as const,overflow:"hidden"}}>{mod.goal}</p>
          </motion.div>

          {/* ── BACK ── */}
          <motion.div animate={{opacity:flipped?1:0,y:flipped?0:6}} transition={{duration:0.22}} style={{
            position:"absolute",inset:0,background:C.bgSecondary,
            backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)",
            border:`1px solid ${accentHex}44`,borderRadius:16,padding:"18px",
            display:"flex",flexDirection:"column",gap:8,overflow:"hidden",
            boxShadow:`0 0 28px ${accentHex}18`,
            pointerEvents:flipped?"auto":"none",
          }}>
            <div aria-hidden style={{position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,transparent,${accentHex},transparent)`,opacity:0.7}} />
            <span style={{fontSize:10,fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:accentHex}}>Topics covered</span>
            <ul style={{listStyle:"none",margin:0,padding:0,flex:1,display:"flex",flexDirection:"column",gap:5,overflowY:"auto"}}>
              {mod.topics.map((t,ti)=>(
                <li key={ti} style={{fontSize:12,color:C.muted,lineHeight:1.45,display:"flex",alignItems:"flex-start",gap:6}}>
                  <span style={{color:accentHex,flexShrink:0,marginTop:1}}>›</span>{t}
                </li>
              ))}
            </ul>
            <div style={{fontSize:12,fontWeight:600,color:accentHex,paddingTop:8,borderTop:`1px solid ${C.border}`,marginTop:"auto"}}>Click to open →</div>
          </motion.div>
        </>
      )}
    </motion.div>
  );
}

/* ─── Main ───────────────────────────────────────────────────── */
export default function SubjectLandingPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id==="string"?params.id:Array.isArray(params.id)?params.id[0]:null;

  const [subject,         setSubject        ] = useState<Subject|null>(null);
  const [modules,         setModules        ] = useState<Module[]>([]);
  const [loading,         setLoading        ] = useState(true);
  const [error,           setError          ] = useState("");
  const [theme,           setTheme          ] = useState("dark");
  const [megaEligible,    setMegaEligible   ] = useState(false);
  const [megaAlreadyDone, setMegaAlreadyDone] = useState(false);

  useEffect(()=>{
    const saved=localStorage.getItem("trisara-theme");
    if(saved){setTheme(saved);document.documentElement.setAttribute("data-theme",saved);}
  },[]);

  const toggleTheme=()=>{
    const next=theme==="dark"?"light":"dark";
    setTheme(next);localStorage.setItem("trisara-theme",next);
    document.documentElement.setAttribute("data-theme",next);
  };

  useEffect(()=>{
    if(!id){setError("Invalid subject id");setLoading(false);return;}
    async function fetch_() {
      try {
        const [sRes,cRes,mRes]=await Promise.all([
          fetch(`/api/dashboard/subjects/${id}`),
          fetch(`/api/moduleQuiz/completed?subjectId=${id}`),
          fetch(`/api/mega-quiz/analytics`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({subjectId:id})}),
        ]);
        if(!sRes.ok){setError(`API error ${sRes.status}`);return;}
        const data=await sRes.json();
        setSubject(data.subject);

        let completedCount=0;
        if(cRes.ok){const cd=await cRes.json();completedCount=cd.completed||0;}

        // Lock: module i is locked if the previous module (i-1) is not completed
        const mods:Module[]=(data.modules||[]).map((m:Module,i:number)=>({
          ...m,
          isCompleted: i<completedCount,
          isLocked: i>0 && (i-1)>=completedCount,
        }));
        setModules(mods);
        setMegaEligible(mods.length>0&&mods.every(m=>m.isCompleted));
        if(mRes.ok){const md=await mRes.json();if(md?.analytics)setMegaAlreadyDone(true);}
      } catch(err){console.error(err);setError("Unable to load subject");}
      finally{setLoading(false);}
    }
    fetch_();
  },[id]);

  if(loading)return<LoadingScreen/>;
  if(error||!subject)return(
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <p style={{color:C.rose,fontFamily:"'Space Grotesk',sans-serif"}}>{error||"Subject not found"}</p>
    </div>
  );

  const showMegaBanner=megaEligible&&!megaAlreadyDone;
  const completedCount=modules.filter(m=>m.isCompleted).length;
  const progressPct=modules.length>0?Math.round((completedCount/modules.length)*100):0;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap');
        *{box-sizing:border-box;}
        .sl-module-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:14px;}
        @media(max-width:480px){.sl-module-grid{grid-template-columns:1fr 1fr;}.sl-action-bar{gap:8px!important;}.sl-action-bar button{flex:1;justify-content:center;}}
        @media(max-width:340px){.sl-module-grid{grid-template-columns:1fr;}}
      `}</style>

      <div style={{minHeight:"100vh",color:C.text,position:"relative",overflow:"hidden"}}>
        <Orbs/><GridBg/><ScanLine/>

        <button onClick={toggleTheme} title={theme==="dark"?"Switch to light":"Switch to dark"} style={{position:"fixed",top:20,right:20,width:34,height:34,borderRadius:10,border:`1px solid ${C.border}`,background:C.surface,color:C.text,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",zIndex:50,fontSize:16}}>
          {theme==="dark"?"☀":"🌙"}
        </button>

        <div style={{maxWidth:1100,margin:"0 auto",padding:"40px 20px 100px",position:"relative",zIndex:2}}>

          <motion.button onClick={()=>router.push("/dashboard")} whileHover={{x:-3}} style={{background:"none",border:"none",padding:"0 0 28px",color:C.dim,fontSize:13,cursor:"pointer",fontFamily:"'Space Grotesk',sans-serif",display:"flex",alignItems:"center",gap:6,transition:"color 0.2s"}} onMouseEnter={e=>(e.currentTarget.style.color=C.violet)} onMouseLeave={e=>(e.currentTarget.style.color=C.dim)}>
            ← Back to Dashboard
          </motion.button>

          <motion.header initial={{opacity:0,y:-14}} animate={{opacity:1,y:0}} transition={{duration:0.45,ease:[0.22,1,0.36,1]}} style={{marginBottom:36}}>
            <div style={{fontSize:10,fontWeight:600,letterSpacing:"0.18em",textTransform:"uppercase",color:C.violet,marginBottom:8}}>Subject</div>
            <h1 style={{fontFamily:"'Space Grotesk',sans-serif",fontWeight:700,fontSize:"clamp(22px,4vw,42px)",letterSpacing:"-0.04em",lineHeight:1.1,margin:"0 0 16px",background:`linear-gradient(135deg,${C.text} 30%,${C.violet} 100%)`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>
              {subject.title}
            </h1>
            <div style={{display:"flex",flexWrap:"wrap",gap:8,alignItems:"center"}}>
              {subject.exam&&<span style={{fontSize:12,color:C.muted,background:`${C.violet}12`,border:`1px solid ${C.violet}30`,padding:"4px 12px",borderRadius:20,display:"flex",alignItems:"center",gap:5,fontFamily:"'Space Grotesk',sans-serif",fontWeight:500}}><span style={{color:C.violet}}>●</span>{subject.exam}</span>}
              {subject.total_duration&&<span style={{fontSize:12,color:C.muted,background:C.surfaceHi,border:`1px solid ${C.border}`,padding:"4px 12px",borderRadius:20,display:"flex",alignItems:"center",gap:5,fontFamily:"'Space Grotesk',sans-serif"}}>◷ {subject.total_duration}</span>}
              <span style={{fontSize:12,color:C.violet,fontWeight:700,background:C.violetSoft,border:`1px solid ${C.borderHi}`,padding:"4px 12px",borderRadius:20,fontFamily:"'Space Grotesk',sans-serif"}}>{progressPct}% complete</span>
            </div>
          </motion.header>

          <div style={{height:1,marginBottom:36,background:`linear-gradient(90deg,transparent,${C.violet}55,${C.cyan}33,transparent)`}} />

          <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:0.1,duration:0.4,ease:[0.22,1,0.36,1]}} className="sl-action-bar" style={{display:"flex",flexWrap:"wrap",gap:10,marginBottom:48}}>
            <ActionButton icon="🗺" label="Roadmap"  onClick={()=>router.push(`/dashboard/subject/${id}/roadmap`)} />
            <ActionButton icon="📊" label="Progress" onClick={()=>router.push(`/dashboard/subject/${id}/progress`)} />
            <ActionButton icon="💬" label="Feedback" onClick={()=>router.push(`/dashboard/subject/${id}/feedback`)} />
            {megaAlreadyDone&&<ActionButton icon="🏆" label="Mega Quiz Results" onClick={()=>router.push(`/dashboard/subject/${id}/mega`)} />}
          </motion.div>

          <AnimatePresence>
            {showMegaBanner&&<MegaQuizBanner onClick={()=>router.push(`/dashboard/subject/${id}/mega`)} />}
          </AnimatePresence>

          <section>
            <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.15}} style={{display:"flex",alignItems:"center",gap:10,marginBottom:20}}>
              <span style={{fontSize:10,fontWeight:600,letterSpacing:"0.14em",textTransform:"uppercase",color:C.dim}}>Modules</span>
              <span style={{fontSize:11,background:C.violetBubble,color:C.violet,padding:"2px 8px",borderRadius:99,fontWeight:600,letterSpacing:"0.04em",fontFamily:"'Space Grotesk',sans-serif"}}>{modules.length}</span>
              <div style={{flex:1,height:1,background:`linear-gradient(90deg,${C.border},transparent)`}} />
              <span style={{fontSize:11,color:C.dim,fontFamily:"'Space Grotesk',sans-serif"}}>{completedCount}/{modules.length} done</span>
            </motion.div>

            <div className="sl-module-grid">
              {modules.map((mod,i)=>(
                <ModuleCard key={mod.module_order} mod={mod} index={i} subjectId={id!} router={router} prevTitle={i>0?modules[i-1].title:undefined} />
              ))}
            </div>
          </section>

        </div>
      </div>
    </>
  );
}