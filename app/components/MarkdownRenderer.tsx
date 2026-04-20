"use client";

import React, { useEffect, useState, useRef } from "react";
import AdaptiveRenderer from "./AdaptiveRenderer";
import AudioRenderer from "./renderers/AudioRenderer";
import ChapterQuiz from "./ChapterQuiz";

interface LearningProfile { visual: number; audio: number; text: number; }
interface QuizQuestion { question: string; options: string[]; correct: string; }
interface MarkdownRendererProps {
  content:          string;
  profile:          LearningProfile;
  moduleId:         string;
  subjectId:        string;
  setAudioContent?: (text: string) => void;
  quiz?:            QuizQuestion[];
  onQuizComplete?:  (score: number, total: number) => void;
}

function getRanking(p: LearningProfile) {
  return Object.entries(p).sort((a, b) => b[1] - a[1]).map(([k]) => k);
}

/* ─── Structural headings that must never render ─────────────── */
const STRUCTURAL_HEADINGS_RX =
  /^#{1,4}\s*(?:Section\s+)?(?:Analogy|Real[\s-]?World\s*(?:Application|Example)?|Key\s+Takeaways?|Summary|Introduction|Overview|Example|Definition|Explanation|Application|Concept|Context|Background|Conclusion|Quiz|Questions?|Multiple\s+Choice|MCQ)\s*$/gim;

function normaliseContent(src: string): string {
  return src
    .replace(/\n?\s*\[(TEXT|VISUAL|AUDIO)\]\s*/gi, "\n[$1]\n")
    .replace(/\[\s*\n\s*\/(TEXT|VISUAL|AUDIO)\]/gi, "[/$1]")
    .replace(STRUCTURAL_HEADINGS_RX, "")
    .replace(/\d+\.\s*.*\?\s*\n?(A\)|B\)|C\)|D\)).*\n?/gi, "")
    .replace(/^[A-D]\)\s*.*\n?/gm, "")
    .replace(/Correct\s*(answer|option).*:?\s*[A-D]\s*\n?/gi, "")
    .replace(/Answer\s*:\s*[A-D]\s*\n?/gi, "")
    .replace(/^\*\s+/gm, "- ")
    .replace(/^block\s*$/gim, "");
}

const NOISE_LINE_RX = /^(block|data|section)\s*$/gim;

function cleanTextChunk(s: string): string {
  return s
    .replace(/\[\s*\/\s*(TEXT|VISUAL|AUDIO)\s*\]/gi, "")
    .replace(/\[\s*(TEXT|VISUAL|AUDIO)\s*\]/gi, "")
    .replace(/^(TEXT|VISUAL|AUDIO)\s*$/gim, "")
    .replace(NOISE_LINE_RX, "")
    .replace(/^\s*block[ \t]*\n/im, "")
    .replace(/^block\s+(?=[A-Z])/m, "")
    .trim();
}

/* ─── Tag parser — backreference cleanly bounds each block ───── */
function parseTaggedParts(src: string) {
  const parts: { type: "visual" | "audio" | "text"; content: string }[] = [];
  const tagRx = /\[\s*(TEXT|VISUAL|AUDIO)\s*\]([\s\S]*?)\[\/\s*\1\s*\]/gi;
  let last = 0;
  let m: RegExpExecArray | null;

  while ((m = tagRx.exec(src)) !== null) {
    if (m.index > last) {
      const plain = cleanTextChunk(src.slice(last, m.index));
      if (plain) parts.push({ type: "text", content: plain });
    }
    const t = m[1].toLowerCase() as "visual" | "audio" | "text";
    const c = t === "text" ? cleanTextChunk(m[2]) : m[2].trim();
    if (c) parts.push({ type: t, content: c });
    last = tagRx.lastIndex;
  }

  if (last < src.length) {
    const rest = cleanTextChunk(src.slice(last));
    if (rest) parts.push({ type: "text", content: rest });
  }

  if (!parts.length && src.trim())
    parts.push({ type: "text", content: cleanTextChunk(src) });

  return parts;
}

/* ─── Scroll-triggered entrance wrapper ──────────────────────── */
function FadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVis(true); obs.disconnect(); } },
      { threshold: 0.06 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        opacity:    vis ? 1 : 0,
        transform:  vis ? "translateY(0)" : "translateY(16px)",
        transition: `opacity 0.45s ease ${delay}ms, transform 0.45s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

export default function MarkdownRenderer({
  content,
  profile,
  moduleId,
  subjectId,
  setAudioContent,
  quiz = [],
  onQuizComplete,
}: MarkdownRendererProps) {
  const ranking     = getRanking(profile);
  const normalised  = normaliseContent(content);
  const taggedParts = parseTaggedParts(normalised);

  // ─── Chapter narration ────────────────────────────────────────
  // The [AUDIO] block is a model-written narration covering the full
  // chapter. Its depth/length is controlled by audio rank in the prompt:
  //   highest → full lecture style  (220–280 words)
  //   second  → chapter overview    (130–170 words)
  //   lowest  → short recap         (60–90 words)
  // It is NOT rendered inline — only shown in the bottom player.
  const audioParts = taggedParts.filter((p) => p.type === "audio");
  const chapterAudioContent = audioParts.map((p) => p.content.trim()).join("\n\n");

  // Pass narration content up to parent if needed (e.g. for a global player)
  useEffect(() => {
    if (setAudioContent && chapterAudioContent) {
      setAudioContent(chapterAudioContent);
    }
  }, [chapterAudioContent, setAudioContent]);

  /* ─── Theme ─────────────────────────────────────────────────── */
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  useEffect(() => {
    const saved =
      (document.documentElement.getAttribute("data-theme") as "dark" | "light") || "dark";
    setTheme(saved);
  }, []);
  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try { localStorage.setItem("trisara-theme", next); } catch {}
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap');

        .md-root {
          font-family: 'Space Grotesk', sans-serif;
          color: var(--ts-text);
          max-width: 100%;
          line-height: 1.78;
          word-wrap: break-word;
          overflow-wrap: break-word;
        }

        /* toggle */
        .md-toggle-row { display:flex; justify-content:flex-end; margin-bottom:1.75rem; }
        .md-toggle-btn {
          display:inline-flex; align-items:center; gap:0.45rem;
          padding:0.38rem 1.1rem; border-radius:999px;
          border:1px solid var(--ts-border-hi); background:var(--ts-surface-hi);
          color:var(--ts-violet); font-family:'Space Grotesk',sans-serif;
          font-size:0.8rem; font-weight:600; letter-spacing:0.04em;
          cursor:pointer; white-space:nowrap;
          transition:background 0.18s, box-shadow 0.18s;
        }
        .md-toggle-btn:hover { background:var(--ts-violet-bubble); box-shadow:0 0 14px var(--ts-violet-glow); }

        /* TEXT block — subtle left-border timeline */
        .md-text-block {
          position: relative;
          padding: 0 0 1.75rem 1.35rem;
          border-left: 2px solid var(--ts-border);
          transition: border-color 0.2s;
        }
        .md-text-block:last-of-type { padding-bottom: 0.5rem; }
        .md-text-block:hover        { border-color: var(--ts-border-hi); }
        .md-text-block::before {
          content: '';
          position: absolute;
          left: -5px; top: 4px;
          width: 8px; height: 8px;
          border-radius: 50%;
          background: var(--ts-violet);
          opacity: 0.5;
          box-shadow: 0 0 8px var(--ts-violet);
          transition: opacity 0.2s;
        }
        .md-text-block:hover::before { opacity: 1; }
        @media (max-width:640px) {
          .md-text-block { padding-left: 1rem; padding-bottom: 1.25rem; }
        }

        /* VISUAL block */
        .md-visual-block { position: relative; margin-bottom: 1.75rem; }
        @media (max-width:640px) { .md-visual-block { margin-bottom: 1.25rem; } }

        /* AUDIO block */
        .md-audio-block { margin-bottom: 1.75rem; }
        @media (max-width:640px) { .md-audio-block { margin-bottom: 1.25rem; } }

        /* ─── Typography ─── */
        .md-root h1,.md-root h2,.md-root h3 {
          font-family: 'Space Grotesk', sans-serif;
          line-height: 1.28; color: var(--ts-text);
        }
        .md-root h1 { font-size:clamp(1.3rem,4vw,1.85rem); margin-bottom:1rem; font-weight:700; }
        .md-root h2 {
          font-size:clamp(1rem,3vw,1.25rem); font-weight:700;
          border-bottom:1px solid var(--ts-border-hi);
          padding-bottom:0.4rem; margin-top:1.4rem; margin-bottom:0.85rem;
        }
        /* h3 suppressed — section headings must never show */
        .md-root h3 { display: none; }
        .md-root p  { color:var(--ts-text); margin-bottom:0.75rem; font-size:clamp(0.9rem,2.5vw,1rem); line-height:1.78; }
        .md-root strong { color:var(--ts-violet); font-weight:700; }
        .md-root em     { color:var(--ts-text-muted); font-style:italic; }

        /* Lists */
        .md-root ul { list-style:none; padding-left:0; margin-bottom:0.75rem; }
        .md-root ul li {
          padding-left:1.3rem; position:relative;
          margin-bottom:0.38rem; color:var(--ts-text);
          font-size:clamp(0.88rem,2.5vw,0.97rem); line-height:1.65;
        }
        .md-root ul li::before {
          content:'▸'; position:absolute; left:0;
          color:var(--ts-violet); font-size:0.72em; top:0.24em;
        }
        .md-root ol { padding-left:1.4rem; margin-bottom:0.75rem; }
        .md-root ol li { margin-bottom:0.38rem; color:var(--ts-text); font-size:clamp(0.88rem,2.5vw,0.97rem); }
        .md-root ol li::marker { color:var(--ts-violet); font-weight:700; }

        /* Blockquote */
        .md-root blockquote {
          border-left:3px solid var(--ts-violet); background:var(--ts-violet-bubble);
          padding:0.85rem 1.2rem; border-radius:0 10px 10px 0;
          color:var(--ts-text-muted); font-style:italic; margin:1.2rem 0;
        }

        /* Code */
        .md-root code {
          background:var(--ts-violet-soft); color:var(--ts-cyan);
          padding:0.16em 0.4em; border-radius:5px;
          font-size:0.86em; font-family:'JetBrains Mono','Fira Code',monospace;
          word-break:break-all;
        }
        .md-root pre {
          background:var(--ts-surface-hi); border:1px solid var(--ts-border);
          border-radius:12px; padding:1.1rem; overflow-x:auto;
          margin:1rem 0; -webkit-overflow-scrolling:touch;
        }
        .md-root pre code { background:none; padding:0; color:var(--ts-cyan); word-break:normal; }

        /* Table */
        .md-root table {
          width:100%; border-collapse:collapse; margin:1.2rem 0;
          font-size:clamp(0.77rem,2vw,0.88rem);
          display:block; overflow-x:auto; -webkit-overflow-scrolling:touch;
        }
        .md-root table th {
          background:var(--ts-violet-bubble); color:var(--ts-violet);
          font-weight:700; text-align:left; padding:0.55rem 0.85rem;
          border-bottom:2px solid var(--ts-border-hi); white-space:nowrap;
        }
        .md-root table td { padding:0.48rem 0.85rem; border-bottom:1px solid var(--ts-border); color:var(--ts-text-muted); }
        .md-root table tr:hover td { background:var(--ts-violet-soft); color:var(--ts-text); }

        /* Links / HR */
        .md-root a { color:var(--ts-cyan); text-decoration:underline; text-underline-offset:3px; }
        .md-root a:hover { color:var(--ts-violet); }
        .md-root hr { border:none; border-top:1px solid var(--ts-border); margin:1.75rem 0; }

        /* Key Takeaways styled block */
        .md-takeaways {
          background: var(--ts-violet-bubble);
          border: 1px solid var(--ts-border-hi);
          border-left: 3px solid var(--ts-violet);
          border-radius: 0 14px 14px 0;
          padding: 1rem 1.25rem;
          margin: 1.5rem 0 0.5rem;
        }
        .md-takeaways-label {
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--ts-violet);
          margin-bottom: 0.65rem;
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }
        .md-takeaways-label::before {
          content: '';
          display: inline-block;
          width: 5px; height: 5px;
          border-radius: 50%;
          background: var(--ts-violet);
          box-shadow: 0 0 6px var(--ts-violet);
        }

        /* Chapter narration divider */
        .md-narration-block {
          margin-top: 1.75rem;
          border-top: 1px solid var(--ts-border);
          padding-top: 1.25rem;
        }
        .md-narration-label {
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--ts-dim, var(--ts-text-muted));
          margin-bottom: 0.65rem;
        }
      `}</style>

      <div className="md-root">

        {/* theme toggle */}
        <div className="md-toggle-row">
          <button
            className="md-toggle-btn"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Switch to light" : "Switch to dark"}
          >
            <span style={{ fontSize: "0.92rem", lineHeight: 1 }}>
              {theme === "dark" ? "☀" : "🌙"}
            </span>
            {theme === "dark" ? "Light" : "Dark"}
          </button>
        </div>

        {/* ─── Content blocks ──────────────────────────────────────── */}
        {taggedParts.map((part, i) => {
          const delay = Math.min(i * 55, 280);

          // ── VISUAL ──
          if (part.type === "visual") {
            if (!part.content?.trim()) return null;
            return (
              <FadeIn key={i} delay={delay}>
                <div className="md-visual-block">
                  <AdaptiveRenderer
                    block={part.content}
                    type="visual"
                    profile={profile}
                    moduleId={moduleId}
                    subjectId={subjectId}
                  />
                </div>
              </FadeIn>
            );
          }

          // ── AUDIO ──
          // The [AUDIO] block is the model-written chapter narration.
          // It does NOT render inline — it is collected and shown in
          // the "Chapter Narration" player at the bottom of the page.
          // Inline (sectional) audio comes from TTS on [TEXT] blocks.
          if (part.type === "audio") return null;

          // ── TEXT ──
          if (!part.content?.trim()) return null;

          // Takeaways detection: only flag as takeaways if an [AUDIO]
          // block has already appeared before this block in the list.
          // The takeaways [TEXT] always comes after [AUDIO] in the structure,
          // so this correctly distinguishes it from the first [TEXT] block
          // which also starts with "-" bullets.
          const audioAppearedBefore = taggedParts
            .slice(0, i)
            .some((p) => p.type === "audio");
          const isTakeaways = audioAppearedBefore && part.content.trim().startsWith("-");

          return (
            <FadeIn key={i} delay={delay}>
              {isTakeaways ? (
                <div className="md-takeaways">
                  <div className="md-takeaways-label">Key Takeaways</div>
                  <div
                    className="md-text-block"
                    style={{ border: "none", paddingLeft: 0 }}
                  >
                    <AdaptiveRenderer
                      block={part.content}
                      type="text"
                      profile={profile}
                      moduleId={moduleId}
                      subjectId={subjectId}
                    />
                    {/* Sectional TTS: reads this takeaways block aloud */}
                    <AudioRenderer block={part.content.trim()} moduleId={moduleId} subjectId={subjectId} />
                  </div>
                </div>
              ) : (
                <div className="md-text-block">
                  <AdaptiveRenderer
                    block={part.content}
                    type="text"
                    profile={profile}
                    moduleId={moduleId}
                    subjectId={subjectId}
                  />
                  {/* Sectional TTS: reads this text block aloud inline */}
                  <AudioRenderer block={part.content.trim()} moduleId={moduleId} subjectId={subjectId} />
                </div>
              )}
            </FadeIn>
          );
        })}

        {/* ─── Chapter Narration player ─────────────────────────────
            Contains the model-written [AUDIO] block — a narration that
            covers the full chapter. Depth scales with audio rank:
              highest → full lecture style  (220–280 words)
              second  → chapter overview    (130–170 words)
              lowest  → short recap         (60–90 words)
        ──────────────────────────────────────────────────────────── */}
        {chapterAudioContent && (
          <FadeIn delay={200}>
            <div className="md-audio-block md-narration-block">
              <div className="md-narration-label">Chapter Narration</div>
              <AudioRenderer block={chapterAudioContent} variant="chapter" moduleId={moduleId} subjectId={subjectId} />

            </div>
          </FadeIn>
        )}

        {/* ─── Chapter quiz ─────────────────────────────────────────── */}
        {quiz.length > 0 && (
          <FadeIn delay={260}>
            <ChapterQuiz
              quiz={quiz}
              onComplete={(score, total) => onQuizComplete?.(score, total)}
            />
          </FadeIn>
        )}

      </div>
    </>
  );
}