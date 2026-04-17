"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

const C = {
  bg:        "var(--ts-bg)",
  surface:   "var(--ts-surface)",
  border:    "var(--ts-border)",
  borderHi:  "var(--ts-border-hi)",
  violet:    "var(--ts-violet)",
  violetGlow:"var(--ts-violet-glow)",
  cyan:      "var(--ts-cyan)",
  cyanGlow:  "var(--ts-cyan-glow)",
  text:      "var(--ts-text)",
  muted:     "var(--ts-text-muted)",
  dim:       "var(--ts-text-dim)",
};

function Orbs() {
  return (
    <>
      <motion.div aria-hidden style={{ position:"absolute", width:480, height:480, borderRadius:"50%", background:`radial-gradient(circle, ${C.violetGlow} 0%, transparent 65%)`, top:-160, left:-140, pointerEvents:"none" }} animate={{ scale:[1,1.08,1], opacity:[0.8,1,0.8] }} transition={{ duration:9, repeat:Infinity, ease:"easeInOut" }} />
      <motion.div aria-hidden style={{ position:"absolute", width:400, height:400, borderRadius:"50%", background:`radial-gradient(circle, ${C.cyanGlow} 0%, transparent 65%)`, bottom:-120, right:-100, pointerEvents:"none" }} animate={{ scale:[1,1.1,1], opacity:[0.7,1,0.7] }} transition={{ duration:11, repeat:Infinity, ease:"easeInOut", delay:2 }} />
      <motion.div aria-hidden style={{ position:"absolute", width:260, height:260, borderRadius:"50%", background:`radial-gradient(circle, rgba(251,113,133,0.13) 0%, transparent 70%)`, top:"55%", left:"30%", pointerEvents:"none" }} animate={{ y:[0,-24,0] }} transition={{ duration:13, repeat:Infinity, ease:"easeInOut" }} />
    </>
  );
}

function Grid() {
  return <div aria-hidden style={{ position:"absolute", inset:0, pointerEvents:"none", backgroundImage:`linear-gradient(rgba(167,139,250,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(167,139,250,0.05) 1px, transparent 1px)`, backgroundSize:"64px 64px", borderRadius:"inherit" }} />;
}

function ScanLine() {
  return <motion.div aria-hidden style={{ position:"absolute", left:0, right:0, height:1, pointerEvents:"none", background:`linear-gradient(90deg, transparent, ${C.violet}, transparent)`, opacity:0.25 }} animate={{ top:["15%","85%","15%"] }} transition={{ duration:8, repeat:Infinity, ease:"easeInOut" }} />;
}

const TAGS = ["Adaptive AI", "Personalized", "No filler", "Built different"];

function LeftPanel() {
  return (
    <div
      style={{
        flex: 2.2,
        padding: "2.5rem",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        borderRight: `1px solid ${C.border}`,
        position: "relative",
      }}
    >
      <div
        style={{
          width: "100%",                         
          background: "rgba(255,255,255,0.03)",
          border: `1px solid ${C.border}`,
          borderRadius: 24,
          padding: "2.5rem",
          backdropFilter: "blur(20px)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* GRID BG */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(167,139,250,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(167,139,250,0.04) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />

        <div style={{ position: "relative", zIndex: 1 }}>
          {/* LOGO (FIXED) */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "1.8rem" }}>
            <img
              src="/logo.png"
              alt="Tri-Sara Logo"
              style={{
                width: 48,
                height: 48,
                objectFit: "contain",
                filter: "brightness(1.1) drop-shadow(0 0 6px rgba(167,139,250,0.5))",
              }}
            />
            <span style={{ fontWeight: 700, fontSize: 26, color: C.text }}>
              Tri-Sara
            </span>
          </div>

          {/* HERO */}
          <h1
            style={{
              fontSize: "3.2rem",
              fontWeight: 700,
              color: C.text,
              lineHeight: 1.25,
              marginBottom: 8,
            }}
          >
            Learn the way your <br />
            <span
              style={{
                background: `linear-gradient(90deg, ${C.violet}, ${C.cyan})`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              brain actually works.
            </span>
          </h1>

          <p style={{ 
  fontSize: 17, 
  color: C.muted, 
  marginBottom: "1.5rem", 
  maxWidth: 600,          
  lineHeight: 1.6         
}}>
            Not everyone learns the same. We figure out your style — even if you
            don’t know it yet — and build a system just for you.
          </p>

          {/* DIVIDER */}
          <div style={{ height: 1, background: C.border, margin: "1.4rem 0" }} />

          {/* MODALITIES */}
          <div style={{ fontSize: 19, color: C.dim, marginBottom: 10, letterSpacing: "1px" }}>
            LEARNING MODALITIES
          </div>

          <div style={{ display: "flex", gap: 8, marginBottom: "1.5rem" }}>
            {[
              { icon: "👁️", label: "Visual" },
              { icon: "🔊", label: "Audio" },
              { icon: "📝", label: "Text" },
            ].map((m) => (
              <div
                key={m.label}
                style={{
                  flex: 0.8,
                  padding: "10px 8px",
                  borderRadius: 12,
                  border: `1px solid ${C.border}`,
                  textAlign: "center",
                  fontSize: 18,
                  color: C.muted,
                }}
              >
                <div style={{ fontSize: 18 }}>{m.icon}</div>
                {m.label}
              </div>
            ))}
          </div>

          {/* FEATURES */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: "1.6rem" }}>
            {[
              "🧠 Style Detection",
              "🗺️ Smart Roadmaps",
              "⚡ Adaptive Modules",
              "📊 Live Tracking",
              "🎯 Subject Dashboards",
            ].map((f, i) => (
              <div
                key={i}
                style={{
                  gridColumn: i === 4 ? "span 2" : "auto",
                  padding: "10px",
                  borderRadius: 10,
                  border: `1px solid ${C.border}`,
                  fontSize: 15.5,
                  color: C.muted,
                }}
              >
                {f}
              </div>
            ))}
          </div>

          {/* HOW IT WORKS */}
          <div style={{ fontSize: 18, color: C.dim, marginBottom: 10, letterSpacing: "1px" }}>
            HOW IT WORKS
          </div>

          {/* STEPS (FIXED PROPER UI) */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            {[
              "Take a quick pre-quiz",
              "We detect your learning style",
              "Get your roadmap",
              "Learn with adaptive content",
              "Adapt as you grow",
            ].map((step, i) => (
              <div key={i} style={{ display: "flex", gap: 12 }}>
                {/* LEFT SIDE */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: "50%",
                      border: `1px solid ${C.border}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 14,
                      color: C.violet,
                      fontWeight: 600,
                    }}
                  >
                    {i + 1}
                  </div>

                  {/* CONNECTOR */}
                  {i !== 4 && (
                    <div
                      style={{
                        width: 1,
                        height: 20,
                        background: `linear-gradient(${C.violet}, ${C.cyan})`,
                        marginTop: 4,
                      }}
                    />
                  )}
                </div>

                {/* TEXT */}
                <div style={{ paddingBottom: 14 }}>
                  <div style={{ fontSize: 18, color: C.text, fontWeight: 600 }}>
                    {step}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* DIVIDER */}
          <div style={{ height: 1, background: C.border, margin: "1.4rem 0" }} />

          {/* TAGS */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {[
              "Learning Style Evaluation",
              "Visual • Audio • Text",
              "Adaptive in Real-Time",
              "Personalized Paths",
            ].map((tag) => (
              <div
                key={tag}
                style={{
                  padding: "4px 10px",
                  borderRadius: 999,
                  border: `1px solid ${C.border}`,
                  fontSize: 14.5,
                  color: C.violet,
                }}
              >
                {tag}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
function InputField({ label, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom:"1rem" }}>
      <label style={{ display:"block", fontSize:10.5, fontWeight:600, letterSpacing:"0.6px", textTransform:"uppercase", color:focused ? C.violet : C.dim, marginBottom:6, transition:"color 0.2s" }}>{label}</label>
      <motion.input onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} style={{ width:"100%", padding:"10px 14px", background:focused ? "rgba(167,139,250,0.07)" : C.surface, border:`1px solid ${focused ? C.borderHi : C.border}`, borderRadius:10, color:C.text, fontSize:13.5, outline:"none", fontFamily:"inherit", boxShadow:focused ? `0 0 0 3px rgba(167,139,250,0.1)` : "none", transition:"all 0.2s" }} whileFocus={{ scale:1.01 }} {...props} />
    </div>
  );
}

function RightPanel({ type }) {
  const [tab, setTab] = useState(type === "login" ? "login" : "signup");
  const isLogin = tab === "login";
  const router = useRouter();
  const [form, setForm] = useState({ name:"", email:"", password:"" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const updatedForm = { ...form, [e.target.name]: e.target.value };
    setForm(updatedForm);
    setError("");

    if (e.target.name === "email") {
      const email = updatedForm.email;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) { setError("Invalid email format"); return; }
      const allowedDomains = ["gmail.com","yahoo.com","outlook.com","hotmail.com","icloud.com"];
      const domain = email.split("@")[1]?.toLowerCase();
      if (domain && !allowedDomains.includes(domain)) { setError("Use Gmail, Yahoo, Outlook, etc."); return; }
    }

    if (e.target.name === "password") {
      const password = updatedForm.password;
      if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
      if (!/[A-Z]/.test(password)) { setError("Must include uppercase letter"); return; }
      if (!/[a-z]/.test(password)) { setError("Must include lowercase letter"); return; }
      if (!/\d/.test(password)) { setError("Must include a number"); return; }
      if (!/[^A-Za-z0-9\s]/.test(password)) { setError("Must include a special character"); return; }
      if (/\s/.test(password)) { setError("Password should not contain spaces"); return; }
      setError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) { setError("Invalid email format"); setLoading(false); return; }

    const allowedDomains = ["gmail.com","yahoo.com","outlook.com","hotmail.com","icloud.com"];
    const domain = form.email.split("@")[1]?.toLowerCase();
    if (!allowedDomains.includes(domain)) { setError("Please use a valid email provider (Gmail, Yahoo, Outlook, etc.)"); setLoading(false); return; }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s])[^\s]{8,}$/;
    if (!form.password || !passwordRegex.test(form.password)) { setError("Password must be 8+ chars, include uppercase, lowercase, number, special character and no spaces"); setLoading(false); return; }

    try {
      const res = await fetch(isLogin ? "/api/login" : "/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      if (isLogin) {
        router.push(data.quiz_completed === false ? "/quiz/welcome" : "/");
      } else {
        router.push("/quiz/welcome");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      flex: 0.7,                   
      display: "flex",
      alignItems: "flex-start",     
      justifyContent: "center",
      padding: "4rem 2rem 2rem",    
    }}>      
    <motion.div whileHover={{ y:-4 }} style={{ width:"100%", maxWidth:280, background:"rgba(255,255,255,0.05)", border:`1px solid ${C.border}`, borderRadius:20, padding:"1.75rem", boxShadow:`0 8px 40px rgba(0,0,0,0.4), 0 0 40px rgba(167,139,250,0.08)`, backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)" }}>
        
        {/* Tab toggle */}
        <div style={{ display:"flex", gap:4, padding:4, borderRadius:12, background:C.surface, border:`1px solid ${C.border}`, marginBottom:"1.75rem" }}>
          {["login","signup"].map((t) => (
            <button key={t} onClick={() => { setTab(t); setError(""); setForm({ name:"", email:"", password:"" }); }} style={{ flex:1, padding:"8px 0", borderRadius:9, background:tab===t ? "rgba(167,139,250,0.15)" : "transparent", color:tab===t ? C.violet : C.dim, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'Space Grotesk', sans-serif", border:tab===t ? `1px solid rgba(167,139,250,0.3)` : "1px solid transparent", transition:"all 0.2s" }}>
              {t === "login" ? "Sign in" : "Sign up"}
            </button>
          ))}
        </div>

        {/* Greeting */}
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-6 }} transition={{ duration:0.2 }}>
            <h2 style={{ fontFamily:"'Space Grotesk', sans-serif", fontWeight:700, fontSize:"1.35rem", color:C.text, marginBottom:4, letterSpacing:"-0.3px" }}>
              {isLogin ? "Welcome back 👾" : "Let's build you in 🚀"}
            </h2>
            <p style={{ fontSize:12.5, color:C.muted, marginBottom:"1.4rem" }}>
              {isLogin ? "Pick up where you left off" : "No boring onboarding, promise"}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <AnimatePresence>
            {!isLogin && (
              <motion.div key="name" initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:"auto" }} exit={{ opacity:0, height:0 }} transition={{ duration:0.25 }}>
                <InputField label="Name" name="name" placeholder="What do we call you?" value={form.name} onChange={handleChange} required />
              </motion.div>
            )}
          </AnimatePresence>

          <InputField label="Email" name="email" type="email" placeholder="you@gmail.com" value={form.email} onChange={handleChange} required />
          <InputField label="Password" name="password" type="password" placeholder="••••••••" value={form.password} onChange={handleChange} required />

          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity:0, y:-4 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }} style={{ display:"flex", alignItems:"flex-start", gap:8, background:"rgba(251,113,133,0.08)", border:"1px solid rgba(251,113,133,0.25)", borderRadius:8, padding:"8px 10px", fontSize:12, color:"#fb7185", marginTop:"0.5rem" }}>
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none" style={{ flexShrink:0, marginTop:1 }}>
                  <circle cx="7" cy="7" r="6.5" stroke="#fb7185" />
                  <path d="M7 4v3.5M7 9.5v.5" stroke="#fb7185" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button type="submit" disabled={loading} whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }} style={{ width:"100%", padding:"11px 0", border:"none", borderRadius:10, background:`linear-gradient(135deg, ${C.violet}, ${C.cyan})`, color:"var(--ts-bg)", fontSize:14, fontWeight:700, fontFamily:"'Space Grotesk', sans-serif", cursor:loading ? "wait" : "pointer", letterSpacing:"0.1px", boxShadow:`0 0 28px rgba(167,139,250,0.35)`, transition:"opacity 0.2s", opacity:loading ? 0.75 : 1, marginTop:"1rem" }}>
            {loading ? "Loading..." : isLogin ? "Sign In" : "Create Account"}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}

export default function AuthForm({ type }) {
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    const saved = localStorage.getItem("trisara-theme");
    if (saved) {
      setTheme(saved);
      document.documentElement.setAttribute("data-theme", saved);
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("trisara-theme", next);
    document.documentElement.setAttribute("data-theme", next);
  };

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap');`}</style>
        <div style={{ 
          position:"relative", 
          minHeight:"100vh", 
          overflow:"hidden", 
          background:C.bg, 
          display:"flex", 
          alignItems:"stretch",   // ✅ FIX
          justifyContent:"center", 
          padding:"1.5rem" 
        }}>
          <button onClick={toggleTheme} style={{ position:"absolute", top:20, right:20, width:34, height:34, borderRadius:10, border:"1px solid var(--ts-border)", background:"var(--ts-surface)", color:"var(--ts-text)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", zIndex:10 }}>
          {theme === "dark" ? "☀" : "🌙"}
        </button>
        <Orbs />
        <ScanLine />
        <motion.div initial={{ opacity:0, scale:0.97, y:12 }} animate={{ opacity:1, scale:1, y:0 }} transition={{ duration:0.5, ease:[0.22,1,0.36,1] }} style={{ position:"relative", width:"100%", maxWidth:1500, minHeight:560, borderRadius:28, backdropFilter:"blur(24px)", WebkitBackdropFilter:"blur(24px)", background:"rgba(255,255,255,0.03)", border:`1px solid ${C.border}`, boxShadow:`0 24px 80px rgba(0,0,0,0.6), 0 0 60px rgba(167,139,250,0.07)`, display:"flex", overflow:"hidden" }}>
          <Grid />
          <div aria-hidden style={{ position:"absolute", top:0, left:"50%", transform:"translateX(-50%)", width:240, height:2, background:`linear-gradient(90deg, transparent, ${C.violet}, ${C.cyan}, transparent)`, opacity:0.7 }} />
          <LeftPanel />
          <RightPanel type={type} />
        </motion.div>

        
      </div>
      <div
  style={{
    textAlign: "center",
    fontSize: 12,
    color: C.dim,
    marginTop: "1rem",
    opacity: 0.8,
  }}
>
  © {new Date().getFullYear()} Tri-Sara • Built for how you learn
</div>
    </>
  );
}