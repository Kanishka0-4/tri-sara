"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";

const CONTENT_SECONDS = 30;
type VisualItemProps = {
  item: {
    question_text: string;
  };
  isContent: boolean;
  timer: number | string;
};

type ParsedData =
  | {
      type: "flow" | "cycle";
      data: { step: string; description: string }[];
      subject?: string;
      topic?: string;
    }
  | {
      type: "hierarchy";
      data: {
        name: string;
        description?: string;
        children?: { name: string; description?: string }[];
      }[];
      subject?: string;
      topic?: string;
    }
  | {
      type: "comparison";
      data: {
        concept: string;
        features?: string[];
        example?: string;
      }[];
      subject?: string;
      topic?: string;
    }
  | null;
/* ─── Design tokens (mirrors globals.css) ──────────────────── */
const C = {
  bg:          "var(--ts-bg)",
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

  green:       "var(--ts-green)",
  greenSoft:   "var(--ts-green-soft)",
  greenBorder: "var(--ts-green-border)",

  rose:        "var(--ts-rose)",
  roseSoft:    "var(--ts-rose-soft)",
  roseBorder:  "var(--ts-rose-border)",

  amber:       "var(--ts-amber)",
  amberSoft:   "var(--ts-amber-soft)",
  amberBorder: "var(--ts-amber-border)",

  text:        "var(--ts-text)",
  muted:       "var(--ts-text-muted)",
  dim:         "var(--ts-text-dim)",
};

/* ─── Visual palette for content cards (6 colour pairs) ─── */
const VISUAL_COLORS = [
  { accent: "var(--ts-violet)", soft: "var(--ts-violet-soft)", border: "var(--ts-border-hi)" },
  { accent: "var(--ts-cyan)",   soft: "var(--ts-cyan-glow)",   border: "rgba(34,211,238,0.25)" },
  { accent: "var(--ts-green)",  soft: "var(--ts-green-soft)",  border: "var(--ts-green-border)" },
  { accent: "var(--ts-amber)",  soft: "var(--ts-amber-soft)",  border: "var(--ts-amber-border)" },
  { accent: "var(--ts-rose)",   soft: "var(--ts-rose-soft)",   border: "var(--ts-rose-border)" },
  { accent: "var(--ts-violet)", soft: "var(--ts-violet-bubble)", border: "var(--ts-border-hi)" },
];

/* ─── TTS helper ──────────────────────────────────────────── */
function speak(text: string, onEnd?: () => void) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-US";
  u.onend = () => onEnd?.();
  window.speechSynthesis.speak(u);
}

/* ─── Badge ───────────────────────────────────────────────── */
function Badge({
  label,
  accentColor,
  softColor,
  borderColor,
}: {
  label: string;
  accentColor: string;
  softColor: string;
  borderColor: string;
}) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "4px 12px", borderRadius: 999,
      background: softColor,
      border: `1px solid ${borderColor}`,
      fontSize: 10, fontWeight: 700, letterSpacing: "0.1em",
      textTransform: "uppercase" as const,
      color: accentColor,
      marginBottom: 20,
      fontFamily: "'Space Grotesk', sans-serif",
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: accentColor, flexShrink: 0 }} />
      {label}
    </span>
  );
}

/* ─── Timer ring ──────────────────────────────────────────── */
function TimerRing({ value }: { value: number }) {
  const radius = 20;
  const circ   = 2 * Math.PI * radius;
  const pct    = value / CONTENT_SECONDS;
  const dash   = circ * pct;

  return (
    <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
      <div style={{ position: "relative", width: 56, height: 56 }}>
        <svg width="56" height="56" viewBox="0 0 56 56" style={{ transform: "rotate(-90deg)" }}>
          <circle cx="28" cy="28" r={radius} fill="none" stroke={C.surface} strokeWidth="3" />
          <circle
            cx="28" cy="28" r={radius} fill="none"
            stroke={C.violet} strokeWidth="3"
            strokeDasharray={`${dash} ${circ}`}
            strokeLinecap="round"
            style={{ transition: "stroke-dasharray 0.9s linear" }}
          />
        </svg>
        <span style={{
          position: "absolute", inset: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "'Space Grotesk', sans-serif",
          fontWeight: 700, fontSize: 14, color: C.violet,
        }}>
          {value}
        </span>
      </div>
    </div>
  );
}

/* ─── Audio Item ──────────────────────────────────────────── */
function AudioItem({ item, onNext }: { item: any; onNext: () => void }) {
  const [playing, setPlaying] = useState(false);
  const [done,    setDone   ] = useState(false);

  const handlePlay = () => {
    setPlaying(true);
    speak(item.question_text, () => {
      setPlaying(false);
      setDone(true);
      onNext();
    });
  };

  return (
    <>
      <Badge label="Audio" accentColor={C.green} softColor={C.greenSoft} borderColor={C.greenBorder} />

      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        gap: 16, padding: "2rem",
        background: C.greenSoft,
        border: `1px solid ${C.greenBorder}`,
        borderRadius: 16, textAlign: "center",
      }}>
        {/* icon */}
        <div style={{
          width: 56, height: 56, borderRadius: "50%",
          background: `linear-gradient(135deg, ${C.green}, ${C.cyan})`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 24,
        }}>
          🎧
        </div>

        <p style={{ fontSize: 14, color: C.green, fontWeight: 600, margin: 0 }}>
          {playing ? "Listen carefully…" : "Press play when you're ready"}
        </p>

        {playing ? (
          <style>{`
            @keyframes qt-wave { 0%,100%{transform:scaleY(0.4)} 50%{transform:scaleY(1.3)} }
          `}</style>
        ) : null}

        {playing ? (
          <div style={{ display: "flex", gap: 4, alignItems: "center", height: 28 }}>
            {[1,2,3,4,5].map(b => (
              <div key={b} style={{
                width: 4, height: `${8 + b * 4}px`, borderRadius: 99,
                background: C.green, opacity: 0.7,
                animation: `qt-wave 0.8s ease-in-out ${b * 0.12}s infinite alternate`,
              }} />
            ))}
          </div>
        ) : (
          <button
            onClick={handlePlay}
            disabled={done}
            style={{
              padding: "10px 28px", borderRadius: 999,
              border: `1px solid ${C.greenBorder}`,
              background: done ? C.greenSoft : `linear-gradient(135deg, ${C.green}, ${C.cyan})`,
              color: done ? C.green : "#0d0918",
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700, fontSize: 13,
              cursor: done ? "default" : "pointer",
              letterSpacing: "0.02em",
            }}
          >
            {done ? "✓ Done" : "▶ Play"}
          </button>
        )}
      </div>
    </>
  );
}

/* ─── MCQ Item ────────────────────────────────────────────── */
function McqItem({
  item,
  onSaveAnswer,
  onNext,
}: {
  item: any;
  onSaveAnswer: (idx: number) => Promise<boolean>;
  onNext: () => void;
}) {
  const LETTERS = ["A", "B", "C", "D"];
  const [saving, setSaving] = useState(false);
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <>
      <Badge label="Question" accentColor={C.amber} softColor={C.amberSoft} borderColor={C.amberBorder} />

      <p style={{
        fontFamily: "'Space Grotesk', sans-serif",
        fontSize: 18, fontWeight: 700,
        color: C.text, lineHeight: 1.4,
        letterSpacing: "-0.02em",
        marginBottom: 24,
      }}>
        {item.question_text}
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {(() => {
          const cleanOptions = (item.options || []).map((opt: string) =>
            opt.replace(/^[A-D]\)\s*/, "")
          );

          return cleanOptions.map((opt: string, idx: number) => {
            const isHov = hovered === idx;
            return (
              <button
                key={idx}
                disabled={saving}
                onMouseEnter={() => setHovered(idx)}
                onMouseLeave={() => setHovered(null)}
                onClick={async () => {
                  if (saving) return;
                  setSaving(true);
                  const ok = await onSaveAnswer(idx);
                  if (ok) onNext();
                  setSaving(false);
                }}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  width: "100%", textAlign: "left",
                  padding: "14px 16px", borderRadius: 12,
                  border: `1px solid ${isHov ? C.violet : C.border}`,
                  background: isHov ? C.violetSoft : C.surface,
                  color: isHov ? C.violet : C.text,
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: 14, fontWeight: 500,
                  cursor: saving ? "not-allowed" : "pointer",
                  opacity: saving ? 0.6 : 1,
                  transform: isHov ? "translateX(4px)" : "translateX(0)",
                  transition: "all 0.15s ease",
                }}
              >
                <span style={{
                  width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: isHov ? C.violet : C.surfaceHi,
                  border: `1px solid ${isHov ? C.violet : C.border}`,
                  fontSize: 11, fontWeight: 700,
                  color: isHov ? "#0d0918" : C.dim,
                  transition: "all 0.15s ease",
                }}>
                  {LETTERS[idx]}
                </span>
                {opt}
              </button>
            );
          });
        })()}
      </div>
    </>
  );
}

/* ─── Visual Item ─────────────────────────────────────────── */
function VisualItem({ item, isContent, timer }: VisualItemProps) {  let parsed: ParsedData = null;
  try { parsed = JSON.parse(item.question_text) as ParsedData; } catch {}

  const colors = [
    "var(--ts-violet)",
    "var(--ts-cyan)",
    "var(--ts-green)",
    "var(--ts-amber)",
    "var(--ts-rose)",
    "var(--ts-violet)",
  ];
  const bgs = [
    "var(--ts-violet-soft)",
    "var(--ts-cyan-glow)",
    "var(--ts-green-soft)",
    "var(--ts-amber-soft)",
    "var(--ts-rose-soft)",
    "var(--ts-violet-bubble)",
  ];

  const renderVisual = () => {
    if (!parsed?.data) return <p className="qt-content-text">{item.question_text}</p>;

    /* ── FLOW ── */
    if (parsed.type === "flow") {
      return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
          {parsed.data.map((d, i) => {
            const color  = colors[i % colors.length];
            const bg     = bgs[i % bgs.length];
            const isLast = i === parsed.data.length - 1;
            return (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
                <div style={{
                  width: "100%", maxWidth: 480,
                  background: bg, border: `2px solid ${color}`,
                  borderRadius: 12, padding: "0.75rem 1.25rem",
                }}>
                  <p style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: "0.85rem", fontWeight: 700, color, marginBottom: "0.2rem" }}>
                    {d.step}
                  </p>
                  <p style={{ fontSize: "0.8rem", color: C.muted, lineHeight: 1.5 }}>{d.description}</p>
                </div>
                {!isLast && (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", margin: "0.2rem 0" }}>
                    <div style={{ width: 2, height: 16, background: color, opacity: 0.4 }} />
                    <div style={{ width: 0, height: 0, borderLeft: "6px solid transparent", borderRight: "6px solid transparent", borderTop: `8px solid ${color}`, opacity: 0.5 }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      );
    }

    /* ── CYCLE ── */
    if (parsed.type === "cycle") {
      return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
          {parsed.data.map((d, i) => {
            const color  = colors[i % colors.length];
            const bg     = bgs[i % bgs.length];
            const isLast = i === parsed.data.length - 1;
            return (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
                <div style={{
                  width: "100%", maxWidth: 480,
                  background: bg, border: `2px solid ${color}`,
                  borderRadius: 12, padding: "0.75rem 1.25rem",
                  display: "flex", alignItems: "center", gap: "0.75rem",
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%",
                    background: color, color: C.bg, flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: "'Bricolage Grotesque', sans-serif",
                    fontSize: "0.75rem", fontWeight: 800,
                  }}>
                    {i + 1}
                  </div>
                  <div>
                    <p style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: "0.85rem", fontWeight: 700, color, marginBottom: "0.15rem" }}>
                      {d.step}
                    </p>
                    <p style={{ fontSize: "0.8rem", color: C.muted, lineHeight: 1.5 }}>{d.description}</p>
                  </div>
                </div>
                {!isLast ? (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", margin: "0.2rem 0" }}>
                    <div style={{ width: 2, height: 16, background: color, opacity: 0.4 }} />
                    <div style={{ width: 0, height: 0, borderLeft: "6px solid transparent", borderRight: "6px solid transparent", borderTop: `8px solid ${color}`, opacity: 0.5 }} />
                  </div>
                ) : (
                  <div style={{ marginTop: "0.5rem", fontSize: "0.72rem", fontWeight: 700, color: C.dim, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                    ↺ cycle repeats
                  </div>
                )}
              </div>
            );
          })}
        </div>
      );
    }

    /* ── HIERARCHY ── */
    if (parsed.type === "hierarchy") {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", width: "100%" }}>
          {parsed.data.map((parent, i) => {
            const color = colors[i % colors.length];
            const bg    = bgs[i % bgs.length];
            return (
              <div key={i}>
                <div style={{
                  background: color, borderRadius: 10,
                  padding: "0.65rem 1rem", marginBottom: "0.4rem",
                }}>
                  <p style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: "0.88rem", fontWeight: 700, color: C.bg, marginBottom: "0.15rem" }}>
                    {parent.name}
                  </p>
                  {parent.description && (
                    <p style={{ fontSize: "0.78rem", color: C.bg, lineHeight: 1.4, opacity: 0.85 }}>{parent.description}</p>
                  )}
                </div>
                {(parent.children || []).map((child, j) => (
                  <div key={j} style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", marginLeft: "1.25rem", marginBottom: "0.35rem" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 6 }}>
                      <div style={{ width: 2, height: 10, background: color, opacity: 0.4 }} />
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, opacity: 0.7 }} />
                    </div>
                    <div style={{
                      flex: 1, background: bg,
                      border: `1.5px solid ${color}`,
                      borderRadius: 8, padding: "0.5rem 0.85rem",
                    }}>
                      <p style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: "0.82rem", fontWeight: 700, color, marginBottom: "0.1rem" }}>
                        {child.name}
                      </p>
                      {child.description && (
                        <p style={{ fontSize: "0.78rem", color: C.muted, lineHeight: 1.4 }}>{child.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      );
    }

    /* ── COMPARISON ── */
    if (parsed.type === "comparison") {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", width: "100%" }}>
          {parsed.data.map((item, i) => {
            const color = colors[i % colors.length];
            const bg    = bgs[i % bgs.length];
            return (
              <div key={i} style={{
                background: bg, border: `2px solid ${color}`,
                borderRadius: 12, padding: "0.85rem 1.1rem",
              }}>
                <p style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: "0.9rem", fontWeight: 700, color, marginBottom: "0.5rem" }}>
                  {item.concept}
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", marginBottom: item.example ? "0.5rem" : 0 }}>
                  {(item.features || []).map((f, fi) => (
                    <div key={fi} style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
                      <div style={{ width: 5, height: 5, borderRadius: "50%", background: color, flexShrink: 0, marginTop: 6 }} />
                      <p style={{ fontSize: "0.8rem", color: C.muted, lineHeight: 1.5 }}>{f}</p>
                    </div>
                  ))}
                </div>
                {item.example && (
                  <div style={{
                    marginTop: "0.5rem", padding: "0.4rem 0.75rem",
                    background: C.surface, borderRadius: 6,
                    border: `1px solid ${color}`,
                  }}>
                    <span style={{ fontSize: "0.7rem", fontWeight: 700, color, letterSpacing: "0.05em", textTransform: "uppercase" }}>Example: </span>
                    <span style={{ fontSize: "0.78rem", color: C.muted }}>{item.example}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      );
    }

    return <p className="qt-content-text">{item.question_text}</p>;
  };

  return (
    <>
      <span className="qt-badge qt-badge-blue">
        <span className="qt-badge-dot" style={{ background: "#2563eb" }} />
        Visual
      </span>

      {(parsed?.subject || parsed?.topic) && (
        <div style={{ marginBottom: "1.25rem" }}>
          {parsed.subject && (
            <p style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: C.dim, marginBottom: "0.25rem" }}>
              {parsed.subject}
            </p>
          )}
          {parsed.topic && (
            <p style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: "1.1rem", fontWeight: 700, color: C.text, letterSpacing: "-0.01em" }}>
              {parsed.topic}
            </p>
          )}
        </div>
      )}

      {isContent && <TimerRing value={Number(timer)} />}

      {renderVisual()}
    </>
  );
}

/* ─── Text content ────────────────────────────────────────── */
function TextItem({ item, isContent, timer }: { item: any; isContent: boolean; timer: number }) {
  return (
    <>
      <Badge label="Read" accentColor={C.violet} softColor={C.violetSoft} borderColor={C.borderHi} />
      {isContent && <TimerRing value={timer} />}
      <p style={{ fontSize: 15, color: C.text, lineHeight: 1.75, margin: 0 }}>
        {item.question_text}
      </p>
    </>
  );
}

/* ─── Item View dispatcher ────────────────────────────────── */
function ItemView({
  item, stageType, timer, isContent, onNext, onSaveAnswer,
}: {
  item: any;
  stageType: string | null;
  timer: number;
  isContent: boolean;
  onNext: () => void;
  onSaveAnswer: (idx: number) => Promise<boolean>;
}) {
  if (item.type === "audio")  return <AudioItem  item={item} onNext={onNext} />;
  if (item.type === "visual") return <VisualItem  item={item} isContent={isContent} timer={timer} />;
  if (item.type === "mcq")    return <McqItem     item={item} onSaveAnswer={onSaveAnswer} onNext={onNext} />;
  return <TextItem item={item} isContent={isContent} timer={timer} />;
}

/* ─── Main page ───────────────────────────────────────────── */
export default function QuizTakePage() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

const toggleTheme = () => {
  const next = theme === "dark" ? "light" : "dark";
  setTheme(next);
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem("trisara-theme", next);
};

useEffect(() => {
  const saved = localStorage.getItem("trisara-theme") as "dark" | "light" | null;
  if (saved) {
    setTheme(saved);
    document.documentElement.setAttribute("data-theme", saved);
  }
}, []);
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [loading,      setLoading     ] = useState(true);
  const [quizId,       setQuizId      ] = useState<string | null>(null);
  const [items,        setItems       ] = useState<any[]>([]);
  const [pointer,      setPointer     ] = useState(0);
  const [stageType,    setStageType   ] = useState<string | null>(null);
  const [timer,        setTimer       ] = useState(CONTENT_SECONDS);
  const [contentReady, setContentReady] = useState(false);

  const answerStartRef   = useRef<number>(Date.now());
  const initializedRef   = useRef(false);

  /* init */
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    async function init() {
      const subjectId = searchParams.get("subject_id");
      const res  = await fetch("/api/quiz/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ subject_id: subjectId }),
      });
      const data = await res.json();

      if (!data || !Array.isArray(data.items)) {
        console.error("Quiz API returned invalid response:", data);
        alert("Quiz generation failed.");
        router.push("/dashboard");
        return;
      }

      const firstContentIndex = data.items.findIndex((i: any) => i.type !== "mcq");
      setQuizId(data.quiz_id);
      setItems(data.items);
      setPointer(firstContentIndex);
      setStageType(data.items[firstContentIndex].type);
      setTimer(CONTENT_SECONDS);
      answerStartRef.current = Date.now();
      setContentReady(true);
      setLoading(false);
    }

    init();
  }, []);

  /* countdown */
  useEffect(() => {
    if (!contentReady) return;
    if (stageType === "mcq" || stageType === "audio") return;
    if (timer <= 0) { nextItem(); return; }
    const t = setTimeout(() => setTimer(p => p - 1), 1000);
    return () => clearTimeout(t);
  }, [timer, stageType, contentReady]);

  async function saveAnswer(selectedIndex: number) {
    const item = items[pointer];
    if (!item?.id) return false;
    const res = await fetch("/api/quiz/answer", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        quiz_item_id:    item.id,
        selected_option: selectedIndex,
        time_taken_ms:   Date.now() - answerStartRef.current,
      }),
    });
    return res.ok;
  }

  function nextItem() {
    window.speechSynthesis?.cancel();
    const next = pointer + 1;
    if (next >= items.length) {
      router.push(`/quiz/results?quiz_id=${quizId}`);
      return;
    }
    setPointer(next);
    setStageType(items[next].type);
    setTimer(CONTENT_SECONDS);
    answerStartRef.current = Date.now();
  }

  /* ── Loading ── */
  if (loading) {
    return (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap');
          @keyframes qt-spin { to { transform: rotate(360deg); } }
          @keyframes qt-pulse { 0%,100%{opacity:0.3;transform:scale(0.7)} 50%{opacity:1;transform:scale(1)} }
        `}</style>
        <div style={{
          minHeight: "100vh",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          gap: 14,
        }}>
          <div style={{ display: "flex", gap: 8 }}>
            {([C.violet, C.cyan, C.rose] as string[]).map((color, i) => (
              <div key={i} style={{
                width: 10, height: 10, borderRadius: "50%", background: color,
                animation: `qt-pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
              }} />
            ))}
          </div>
          <p style={{
            fontSize: 12, color: C.dim,
            letterSpacing: "0.1em", textTransform: "uppercase",
            fontFamily: "'Space Grotesk', sans-serif",
          }}>
            Preparing your quiz…
          </p>
        </div>
      </>
    );
  }

  const current  = items[pointer];
  const progress = ((pointer + 1) / items.length) * 100;
  const isContent = stageType !== "mcq" && stageType !== "audio";

  return (

    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes qt-fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes qt-wave {
          0%,100% { transform: scaleY(0.4); }
          50%      { transform: scaleY(1.3); }
        }
      `}</style>

      {/* body already has var(--ts-bg) — no background override needed */}
      <div style={{
        minHeight: "100vh",
        display: "flex", flexDirection: "column", alignItems: "center",
        padding: "0 1.5rem 4rem",
        position: "relative",
        fontFamily: "'Space Grotesk', sans-serif",
      }}>


<button
  onClick={toggleTheme}
  title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
  style={{
    position: "fixed",
    top: 20,
    right: 20,
    width: 34,
    height: 34,
    borderRadius: 10,
    border: `1px solid ${C.border}`,
    background: C.surface,
    color: C.text,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    zIndex: 50,
    fontSize: 16,
  }}
>
  {theme === "dark" ? "☀" : "🌙"}
</button>

        {/* ── Top bar ── */}
        <div style={{
          width: "100%", maxWidth: 680,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "1.5rem 0 1.25rem",
        }}>
          {/* Brand */}
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <div style={{
              width: 7, height: 7, borderRadius: "50%",
              background: `linear-gradient(135deg, ${C.violet}, ${C.cyan})`,
            }} />
            <span style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700, fontSize: 14, letterSpacing: "-0.02em", color: C.text,
            }}>
              Quiz
            </span>
          </div>

          {/* Counter */}
          <span style={{
            fontSize: 11, fontWeight: 600, letterSpacing: "0.1em",
            textTransform: "uppercase" as const, color: C.dim,
          }}>
            {pointer + 1} / {items.length}
          </span>
        </div>

        {/* ── Progress bar ── */}
        <div style={{
          width: "100%", maxWidth: 680, height: 3,
          background: C.surface, borderRadius: 99,
          marginBottom: "2rem", overflow: "hidden",
        }}>
          <div style={{
            height: "100%", borderRadius: 99,
            background: `linear-gradient(90deg, ${C.violet}, ${C.cyan})`,
            width: `${progress}%`, transition: "width 0.4s ease",
            boxShadow: `0 0 8px ${C.violetGlow}`,
          }} />
        </div>

        {/* ── Card ── */}
        <div
          key={pointer}
          style={{
            width: "100%", maxWidth: 680,
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 20,
            padding: "2rem 2.25rem",
            position: "relative", overflow: "hidden",
            animation: "qt-fadeUp 0.3s ease both",
          }}
        >
          {/* top glow strip */}
          <div aria-hidden style={{
            position: "absolute", top: 0, left: "15%", width: "70%", height: 1,
            background: `linear-gradient(90deg, transparent, ${C.violet}, ${C.cyan}, transparent)`,
            opacity: 0.5,
          }} />

          <ItemView
            item={current}
            stageType={stageType}
            timer={timer}
            isContent={isContent}
            onNext={nextItem}
            onSaveAnswer={saveAnswer}
          />
        </div>

      </div>
    </>
  );
}