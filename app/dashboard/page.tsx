"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

/* ─── Types ──────────────────────────────────────────────────── */
type Subject = {
  id: number;
  title: string;
  exam: string | null;
  total_duration: string | null;
  progress: number;
  total_modules: number;
  completed_modules: number;
};

type User = { name: string; email: string };

type SubjectCardProps = {
  subj: Subject;
  onClick: () => void;
  index: number;
};

type StatPillProps = {
  value: string | number;
  label: string;
  accent: string;
};

type ProfileSidebarProps = {
  open: boolean;
  onClose: () => void;
  user: User | null;
  onLogout: () => void;
  theme: string;
  toggleTheme: () => void;
};

type EmptyStateProps = {
  onCta: () => void;
};

/* ─── Design tokens ──────────────────────────────────────────────
   IMPORTANT: --ts-bg is a radial-gradient string in dark mode.
   It cannot be used as an inline `background` on nested divs.
   The body already gets it via globals.css, so we just don't
   set background on the root div — it shows through from <body>.

   --ts-bg-secondary is also a gradient in dark, but works for
   the sidebar because of the backdrop-filter blur overlay.

   All other vars (surface, border, text, violet, cyan, rose) are
   safe to use inline as they are solid rgba/hex values.
   ─────────────────────────────────────────────────────────────── */
const C = {
  bgSecondary: "var(--ts-bg-secondary)",
  surface:     "var(--ts-surface)",
  surfaceHi:   "var(--ts-surface-hi)",
  border:      "var(--ts-border)",
  borderHi:    "var(--ts-border-hi)",
  violet:      "var(--ts-violet)",
  violetGlow:  "var(--ts-violet-glow)",
  violetSoft:  "var(--ts-violet-soft)",
  cyan:        "var(--ts-cyan)",
  cyanGlow:    "var(--ts-cyan-glow)",
  rose:        "var(--ts-rose)",
  roseSoft:    "var(--ts-rose-soft)",
  text:        "var(--ts-text)",
  muted:       "var(--ts-text-muted)",
  dim:         "var(--ts-text-dim)",
};

/* ─── Accent hex by module progress ─────────────────────────── */
function getAccentHex(progress: number): string {
  if (progress >= 80) return "#22d3ee";   // cyan
  if (progress >= 40) return "#a78bfa";   // violet
  return "#fb7185";                        // rose
}

/* ─── Animated background orbs ──────────────────────────────── */
function Orbs() {
  return (
    <>
      <motion.div aria-hidden style={{
        position: "fixed", width: 600, height: 600, borderRadius: "50%",
        background: `radial-gradient(circle, ${C.violetGlow} 0%, transparent 65%)`,
        top: -200, left: -180, pointerEvents: "none", zIndex: 0,
      }}
        animate={{ scale: [1, 1.06, 1], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div aria-hidden style={{
        position: "fixed", width: 500, height: 500, borderRadius: "50%",
        background: `radial-gradient(circle, ${C.cyanGlow} 0%, transparent 65%)`,
        bottom: -160, right: -140, pointerEvents: "none", zIndex: 0,
      }}
        animate={{ scale: [1, 1.09, 1], opacity: [0.6, 0.9, 0.6] }}
        transition={{ duration: 13, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />
      <motion.div aria-hidden style={{
        position: "fixed", width: 320, height: 320, borderRadius: "50%",
        background: `radial-gradient(circle, ${C.roseSoft} 0%, transparent 70%)`,
        top: "55%", left: "35%", pointerEvents: "none", zIndex: 0,
      }}
        animate={{ y: [0, -30, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      />
    </>
  );
}

/* ─── Grid overlay ───────────────────────────────────────────── */
function GridBg() {
  return (
    <div aria-hidden style={{
      position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
      backgroundImage: `
        linear-gradient(${C.violetSoft} 1px, transparent 1px),
        linear-gradient(90deg, ${C.violetSoft} 1px, transparent 1px)
      `,
      backgroundSize: "64px 64px",
    }} />
  );
}

/* ─── Scan line ──────────────────────────────────────────────── */
function ScanLine() {
  return (
    <motion.div aria-hidden style={{
      position: "fixed", left: 0, right: 0, height: 1,
      background: `linear-gradient(90deg, transparent, ${C.violet}, ${C.cyan}, transparent)`,
      opacity: 0.2, pointerEvents: "none", zIndex: 1,
    }}
      animate={{ top: ["10%", "90%", "10%"] }}
      transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

/* ─── Subject Card ───────────────────────────────────────────── */
function SubjectCard({ subj, onClick, index }: SubjectCardProps) {
  const modulePercent = subj.total_modules > 0
    ? Math.floor((subj.completed_modules / subj.total_modules) * 100)
    : 0;
  const accentHex = getAccentHex(modulePercent);
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative",
        background: C.surface,   /* rgba(255,255,255,0.04) dark / rgba(167,139,250,0.06) light */
        border: `1px solid ${hovered ? accentHex + "55" : C.border}`,
        borderRadius: 18,
        padding: "26px",
        cursor: "pointer",
        overflow: "hidden",
        transition: "border-color 0.25s ease, box-shadow 0.25s ease, transform 0.25s ease",
        boxShadow: hovered ? `0 8px 40px ${accentHex}18` : "none",
        transform: hovered ? "translateY(-4px)" : "translateY(0)",
      }}
    >
      {/* Top glow strip */}
      <div aria-hidden style={{
        position: "absolute", top: 0, left: "10%", width: "80%", height: "2px",
        background: `linear-gradient(90deg, transparent, ${accentHex}, transparent)`,
        opacity: hovered ? 0.9 : 0.45,
        transition: "opacity 0.25s",
        borderRadius: "0 0 4px 4px",
      }} />

      {hovered && (
        <div aria-hidden style={{
          position: "absolute", top: -40, right: -40, width: 120, height: 120,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${accentHex}20 0%, transparent 70%)`,
          pointerEvents: "none",
        }} />
      )}

      {/* Title row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <h3 style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 16, fontWeight: 700,
          color: C.text, letterSpacing: "-0.3px",
          lineHeight: 1.3, margin: 0,
        }}>
          {subj.title}
        </h3>
        <motion.span
          animate={{ x: hovered ? 3 : 0 }}
          transition={{ duration: 0.2 }}
          style={{ fontSize: 16, color: accentHex, flexShrink: 0, marginLeft: 10 }}
        >
          →
        </motion.span>
      </div>

      {/* Meta tags */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 20 }}>
        {subj.exam && (
          <span style={{
            fontSize: 11, color: C.muted,
            background: `${accentHex}12`,
            border: `1px solid ${accentHex}30`,
            padding: "3px 10px", borderRadius: 20,
            display: "flex", alignItems: "center", gap: 4,
            fontFamily: "'Space Grotesk', sans-serif", fontWeight: 500,
          }}>
            <span style={{ color: accentHex }}>●</span>{subj.exam}
          </span>
        )}
        {subj.total_duration && (
          <span style={{
            fontSize: 11, color: C.muted,
            background: C.surfaceHi,
            border: `1px solid ${C.border}`,
            padding: "3px 10px", borderRadius: 20,
            display: "flex", alignItems: "center", gap: 4,
            fontFamily: "'Space Grotesk', sans-serif",
          }}>
            ◷ {subj.total_duration}
          </span>
        )}
      </div>

      {/* Progress */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
          <span style={{
            fontSize: 10, fontWeight: 600, letterSpacing: "0.08em",
            textTransform: "uppercase", color: C.dim,
          }}>
            Modules
          </span>
          <span style={{
            fontSize: 12, fontWeight: 700, color: accentHex,
            fontFamily: "'Space Grotesk', sans-serif",
          }}>
            {subj.completed_modules}/{subj.total_modules} · {modulePercent}%
          </span>
        </div>
        <div style={{
          width: "100%", height: 4, borderRadius: 99,
          background: C.surfaceHi, overflow: "hidden",
        }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${modulePercent}%` }}
            transition={{ duration: 1, delay: index * 0.07 + 0.3, ease: [0.22, 1, 0.36, 1] }}
            style={{
              height: "100%", borderRadius: 99,
              background: `linear-gradient(90deg, ${C.violet}, ${accentHex})`,
              boxShadow: `0 0 8px ${accentHex}55`,
            }}
          />
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Stat Pill ──────────────────────────────────────────────── */
function StatPill({ value, label, accent }: StatPillProps) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      gap: 4, padding: "0 32px",
    }}>
      <span style={{
        fontSize: 24, fontWeight: 700,
        fontFamily: "'Space Grotesk', sans-serif",
        background: `linear-gradient(135deg, ${accent}, ${C.cyan})`,
        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        letterSpacing: "-0.03em",
      }}>
        {value}
      </span>
      <span style={{
        fontSize: 10, fontWeight: 600, letterSpacing: "0.1em",
        textTransform: "uppercase", color: C.dim,
      }}>
        {label}
      </span>
    </div>
  );
}

/* ─── Profile Sidebar ────────────────────────────────────────── */
function ProfileSidebar({ open, onClose, user, onLogout, theme, toggleTheme }: ProfileSidebarProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: "fixed", inset: 0, zIndex: 100,
              background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)",
            }}
          />
          <motion.aside
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 26, stiffness: 260 }}
            style={{
              position: "fixed", top: 0, right: 0, bottom: 0, width: 300,
              /*
                --ts-bg-secondary works here:
                  dark:  radial-gradient(circle at 70% 60%, #1a0f3d, #0d0918)
                  light: #ffffff
                The backdrop-filter blur makes it feel glassy on top.
              */
              background: C.bgSecondary,
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              borderLeft: `1px solid ${C.border}`,
              zIndex: 101, display: "flex", flexDirection: "column",
              padding: "32px 24px 28px",
              boxShadow: "-8px 0 40px rgba(0,0,0,0.2)",
            }}
          >
            <div aria-hidden style={{
              position: "absolute", top: 0, left: 0, right: 0, height: 2,
              background: `linear-gradient(90deg, ${C.violet}, ${C.cyan}, ${C.rose})`,
            }} />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
              <span style={{
                fontSize: 12, fontWeight: 600, letterSpacing: "0.12em",
                textTransform: "uppercase", color: C.dim,
              }}>
                Profile
              </span>
              <button onClick={onClose} style={{
                background: "none", border: `1px solid ${C.border}`, color: C.muted,
                width: 28, height: 28, borderRadius: 8, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
              }}>×</button>
            </div>

            <div style={{ textAlign: "center", marginBottom: 24 }}>
                <div style={{
                width: 72, height: 72, borderRadius: "50%", margin: "0 auto 14px",
                background: `linear-gradient(135deg, rgba(167,139,250,var(--avatar-opacity,0.9)), rgba(251,113,133,var(--avatar-opacity,0.9)))`,
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: `0 0 24px ${C.roseSoft}`,
                fontSize: 28,
                }}>
                👾
                </div>
              <div style={{
                fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700,
                fontSize: 18, color: C.text, marginBottom: 4,
              }}>
                {user?.name || "Learner"}
              </div>
              <div style={{ fontSize: 12, color: C.rose, fontWeight: 500 }}>
                {user?.email || ""}
              </div>
            </div>

            <div style={{ height: 1, background: C.border, marginBottom: 20 }} />

            
              
           

            <button onClick={onLogout} style={{
              marginTop: "auto", width: "100%", padding: "12px 0",
              background: `linear-gradient(135deg, ${C.violet}, ${C.cyan})`,
              border: "none", borderRadius: 10,
              color: "#0d0918", /* hardcoded dark — always readable on violet/cyan gradient */
              fontSize: 14, fontWeight: 700, cursor: "pointer",
              fontFamily: "'Space Grotesk', sans-serif",
              boxShadow: `0 0 20px ${C.violetGlow}`,
              letterSpacing: "0.01em",
            }}>
              Sign Out
            </button>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

/* ─── Empty State ────────────────────────────────────────────── */
function EmptyState({ onCta }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      style={{
        textAlign: "center", padding: "80px 40px",
        background: C.violetSoft,
        border: `1px dashed ${C.borderHi}`,
        borderRadius: 24,
      }}
    >
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        style={{ fontSize: 52, marginBottom: 16 }}
      >
        📚
      </motion.div>
      <h2 style={{
        fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700,
        fontSize: 22, color: C.text, margin: "0 0 10px",
      }}>
        No subjects yet
      </h2>
      <p style={{ fontSize: 14, color: C.muted, maxWidth: 340, margin: "0 auto 28px", lineHeight: 1.65 }}>
        Generate your first AI-powered study roadmap and start crushing it.
      </p>
      <motion.button
        onClick={onCta}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.97 }}
        style={{
          padding: "12px 24px",
          background: `linear-gradient(135deg, ${C.violet}, ${C.cyan})`,
          border: "none", borderRadius: 12,
          color: "#0d0918",
          fontSize: 14, fontWeight: 700, cursor: "pointer",
          fontFamily: "'Space Grotesk', sans-serif",
          boxShadow: `0 0 24px ${C.violetGlow}`,
          letterSpacing: "0.01em",
        }}
      >
        Generate Roadmap ✦
      </motion.button>
    </motion.div>
  );
}

/* ─── Loading Screen ─────────────────────────────────────────── */
function LoadingScreen() {
  /* body already has var(--ts-bg) from globals.css — no background needed here */
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      gap: 12,
    }}>
      <div style={{ display: "flex", gap: 8 }}>
        {([C.violet, C.cyan, C.rose] as string[]).map((color, i) => (
          <motion.div key={i}
            animate={{ scale: [0.5, 1, 0.5], opacity: [0.25, 1, 0.25] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2, ease: "easeInOut" }}
            style={{ width: 10, height: 10, borderRadius: "50%", background: color }}
          />
        ))}
      </div>
      <span style={{ fontSize: 12, color: C.dim, letterSpacing: "0.1em", textTransform: "uppercase" }}>
        Loading
      </span>
    </div>
  );
}

/* ─── Main Dashboard Page ────────────────────────────────────── */
export default function DashboardPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [theme, setTheme] = useState("dark");
  const router = useRouter();

  /* Sync theme from localStorage */
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

  /* Fetch user */
  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/user/profile", { credentials: "include" });
        if (!res.ok) throw new Error();
        const data = await res.json();
        setUser({ name: data.name, email: data.email });
      } catch {
        setUser(null);
      }
    }
    fetchUser();
  }, []);

  /* Logout */
  const handleLogout = async () => {
    try {
      await fetch("/api/logout", { method: "POST", credentials: "include" });
      localStorage.clear();
      router.push("/login");
    } catch (err) {
      console.error(err);
    }
  };

  /* Fetch subjects */
  useEffect(() => {
    async function fetchSubjects() {
      try {
        const res = await fetch("/api/dashboard/subjects", { credentials: "include" });
        if (!res.ok) throw new Error();
        const data: Subject[] = await res.json();
        setSubjects(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchSubjects();
  }, []);

  if (loading) return <LoadingScreen />;

  const completed = subjects.filter(s => s.progress === 100).length;
  const avgProgress = subjects.length > 0
    ? Math.round(
        subjects.reduce((acc, s) => {
          const p = s.total_modules > 0 ? (s.completed_modules / s.total_modules) * 100 : 0;
          return acc + p;
        }, 0) / subjects.length
      )
    : 0;

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap');`}</style>

      {/*
        No background set here — body already has var(--ts-bg) from globals.css.
        Setting it again as an inline style would fail because --ts-bg resolves
        to a radial-gradient string, which only works on background (not background-color).
      */}
      <div style={{ minHeight: "100vh", color: C.text, position: "relative", overflow: "hidden" }}>
        <Orbs />
        <GridBg />
        <ScanLine />

        {/* Theme toggle — fixed top-right, same position as AuthForm */}
        <button
          onClick={toggleTheme}
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          style={{
            position: "fixed", top: 20, right: 20,
            width: 34, height: 34, borderRadius: 10,
            border: `1px solid ${C.border}`,
            background: C.surface,
            color: C.text,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", zIndex: 50, fontSize: 16,
          }}
        >
          {theme === "dark" ? "☀" : "🌙"}
        </button>

        <ProfileSidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          user={user}
          onLogout={handleLogout}
          theme={theme}
          toggleTheme={toggleTheme}
        />

        {/* Content */}
        <div style={{
          maxWidth: 1100, margin: "0 auto",
          padding: "56px 24px 100px",
          position: "relative", zIndex: 2,
        }}>

          {/* ── HEADER ── */}
          <motion.header
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            style={{
              display: "flex", alignItems: "flex-start",
              justifyContent: "space-between", flexWrap: "wrap",
              gap: 20, marginBottom: 40,
            }}
          >
            {/* Logo + title */}
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <img
                src="/logo.png"
                alt="Tri-Sara"
                style={{
                  width: 44, height: 44, objectFit: "contain",
                  filter: `drop-shadow(0 0 8px ${C.violetGlow})`,
                }}
              />
              <div>
                <div style={{
                  fontSize: 10, fontWeight: 600, letterSpacing: "0.18em",
                  textTransform: "uppercase", color: C.violet, marginBottom: 3,
                }}>
                  Tri-Sara
                </div>
                <h1 style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontWeight: 700, fontSize: "clamp(22px, 4vw, 34px)",
                  letterSpacing: "-0.04em", lineHeight: 1.1, margin: 0,
                  background: `linear-gradient(135deg, ${C.text} 30%, ${C.violet} 100%)`,
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                }}>
                  Your Dashboard
                </h1>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>

              {/*
                Outlined button — works great in both themes.
                dark:  violet border on dark bg = crisp neon outline
                light: violet border on white bg = clean minimal outline
                No filled gradient needed here — the avatar keeps the gradient energy.
              */}
              <motion.button
                onClick={() => router.push("/roadmap")}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                style={{
                  padding: "10px 20px",
                  background: C.violetSoft,
                  border: `1.5px solid ${C.violet}`,
                  borderRadius: 12,
                  color: C.violet,
                  fontSize: 13, fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "'Space Grotesk', sans-serif",
                  letterSpacing: "0.01em",
                  whiteSpace: "nowrap",
                  transition: "opacity 0.2s",
                }}
              >
                + New Roadmap
              </motion.button>

              {/* Profile avatar — keeps gradient, it's an icon not a text CTA */}
              <motion.button
                onClick={() => setSidebarOpen(true)}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  width: 40, height: 40, borderRadius: "50%",
                  background: `linear-gradient(135deg, ${C.violet}, ${C.cyan})`,
                  border: "none", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 18,
                  boxShadow: `0 0 14px ${C.violetGlow}`,
                }}
              >
                👾
              </motion.button>
            </div>
          </motion.header>

          {/* ── DIVIDER ── */}
          <div style={{
            height: 1, marginBottom: 36,
            background: `linear-gradient(90deg, transparent, ${C.violet}55, ${C.cyan}33, transparent)`,
          }} />

          {/* ── STATS BAR ── */}
          {subjects.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              style={{
                display: "flex", alignItems: "center",
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: 16, padding: "20px 0", marginBottom: 48,
                width: "fit-content",
                position: "relative", overflow: "hidden",
              }}
            >
              <div aria-hidden style={{
                position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
                width: 160, height: 2,
                background: `linear-gradient(90deg, transparent, ${C.violet}, ${C.cyan}, transparent)`,
                opacity: 0.7,
              }} />
              <StatPill value={subjects.length} label="Subjects" accent={C.violet} />
              <div style={{ width: 1, background: C.border, alignSelf: "stretch" }} />
              <StatPill value={completed} label="Completed" accent={C.cyan} />
              <div style={{ width: 1, background: C.border, alignSelf: "stretch" }} />
              <StatPill value={`${avgProgress}%`} label="Avg Progress" accent={C.rose} />
            </motion.div>
          )}

          {/* ── EMPTY STATE ── */}
          {subjects.length === 0 && (
            <EmptyState onCta={() => router.push("/roadmap")} />
          )}

          {/* ── SUBJECT GRID ── */}
          {subjects.length > 0 && (
            <section>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
                style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}
              >
                <span style={{
                  fontSize: 10, fontWeight: 600, letterSpacing: "0.14em",
                  textTransform: "uppercase", color: C.dim,
                }}>
                  Your Subjects
                </span>
                <div style={{
                  flex: 1, height: 1,
                  background: `linear-gradient(90deg, ${C.border}, transparent)`,
                }} />
                <span style={{
                  fontSize: 11, color: C.violet, fontWeight: 600,
                  fontFamily: "'Space Grotesk', sans-serif",
                }}>
                  {subjects.length} total
                </span>
              </motion.div>

              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                gap: 14,
              }}>
                {subjects.map((subj, i) => (
                  <SubjectCard
                    key={subj.id}
                    subj={subj}
                    index={i}
                    onClick={() => router.push(`/dashboard/subject/${subj.id}`)}
                  />
                ))}
              </div>
            </section>
          )}

        </div>
      </div>
    </>
  );
}