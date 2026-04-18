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

/* ─── Aggressive tag-leak killer ─────────────────────────────── */
function normaliseContent(src: string): string {
  return src
    // Fix newline-broken closing tags  [\n/TEXT] → [/TEXT]
    .replace(/\[\s*\n\s*\/(TEXT|VISUAL|AUDIO)\]/gi, "[/$1]")
    // Bare tag word on its own line  "TEXT\n" or "VISUAL\n"
    .replace(/^(TEXT|VISUAL|AUDIO)\s*$/gim, "")
    // Bare tag word as inline prefix  "TEXT Some content…"
    .replace(/^(TEXT|VISUAL|AUDIO)\s+/gim, "")
    // Bare tag word anywhere inline (not inside brackets)
    .replace(/(?<!\[)\b(TEXT|VISUAL|AUDIO)\b(?!\])/gi, "")
    // Orphan unclosed opening tag  [TEXT] with no matching [/TEXT]
    .replace(/\[\s*(TEXT|VISUAL|AUDIO)\s*\](?![\s\S]*?\[\/\s*\1\s*\])/gi, "")
    // Strip quiz scaffolding
    .replace(/#{1,3}\s*(Quiz|Questions?|Multiple Choice|MCQ).*\n?/gi, "")
    .replace(/\d+\.\s*.*\?\s*\n?(A\)|B\)|C\)|D\)).*\n?/gi, "")
    .replace(/^[A-D]\)\s*.*\n?/gm, "")
    .replace(/Correct\s*(answer|Answer|option|Option).*:?\s*[A-D]\s*\n?/gi, "")
    .replace(/Answer\s*:\s*[A-D]\s*\n?/gi, "")
    // Bullets
    .replace(/^\*\s+/gm, "- ");
}

function stripKeyTakeaways(block: string): string {
  return block.replace(/Key\s*Takeaways[\s\S]*/gi, "").trim();
}

/* ─── Tag parser ─────────────────────────────────────────────── */
function parseTaggedParts(src: string) {
  const parts: { type: "visual" | "audio" | "text"; content: string }[] = [];
  const tagRx = /\[\s*(TEXT|VISUAL|AUDIO)\s*\]([\s\S]*?)\[\s*\/\s*\1\s*\]/gi;
  let last = 0, m: RegExpExecArray | null;

  // Strip residual bare tag prefixes from any extracted chunk
  const clean = (s: string) => s.replace(/^(TEXT|VISUAL|AUDIO)\s*/gim, "").trim();

  while ((m = tagRx.exec(src)) !== null) {
    if (m.index > last) {
      const plain = clean(src.slice(last, m.index));
      if (plain) parts.push({ type: "text", content: plain });
    }
    const t = m[1].toLowerCase() as "visual" | "audio" | "text";
    const c = clean(m[2]);
    if (c) parts.push({ type: t, content: c });
    last = tagRx.lastIndex;
  }
  if (last < src.length) {
    const rest = clean(src.slice(last));
    if (rest) parts.push({ type: "text", content: rest });
  }
  if (!parts.length && src.trim()) parts.push({ type: "text", content: clean(src) });
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
    <div ref={ref} style={{
      opacity:   vis ? 1 : 0,
      transform: vis ? "translateY(0)" : "translateY(16px)",
      transition: `opacity 0.45s ease ${delay}ms, transform 0.45s ease ${delay}ms`,
      willChange: "opacity, transform",
    }}>
      {children}
    </div>
  );
}

export default function MarkdownRenderer({
  content, profile, moduleId, subjectId,
  setAudioContent, quiz = [], onQuizComplete,
}: MarkdownRendererProps) {
  const ranking        = getRanking(profile);
  const isAudioPrimary = ranking[0] === "audio";
  const normalised     = normaliseContent(content);
  const taggedParts    = parseTaggedParts(normalised);

  const audioContent = taggedParts
    .filter(p => p.type === "audio")
    .map(p => stripKeyTakeaways(p.content))
    .join("\n\n");

  useEffect(() => {
    if (setAudioContent && audioContent) setAudioContent(audioContent);
  }, [audioContent, setAudioContent]);

  /* theme */
  const [theme, setTheme] = useState<"dark"|"light">("dark");
  useEffect(() => {
    const saved = (document.documentElement.getAttribute("data-theme") as "dark"|"light") || "dark";
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
          overflow-x: hidden;
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

        /*
         * TEXT BLOCK — no box.
         * Just a subtle left-border timeline, content flows naturally.
         */
        .md-text-block {
          position: relative;
          padding: 0 0 1.75rem 1.35rem;
          border-left: 2px solid var(--ts-border);
          transition: border-color 0.2s;
        }
        .md-text-block:last-of-type { padding-bottom: 0.5rem; }
        .md-text-block:hover        { border-color: var(--ts-border-hi); }
        /* bullet dot on the timeline */
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

        /*
         * VISUAL BLOCK — glassy card, clearly distinct from text.
         */
        .md-visual-block {
          position: relative;
          border-radius: 16px;
          padding: 1.5rem;
          margin-bottom: 1.75rem;
          overflow: hidden;
          background: var(--ts-surface-hi);
          border: 1px solid var(--ts-border-hi);
          box-shadow:
            0 0 0 1px var(--ts-border-hi),
            0 8px 32px var(--ts-violet-glow),
            inset 0 0 48px var(--ts-violet-soft);
          transition: box-shadow 0.25s, border-color 0.25s;
        }
        /* diagonal tint */
        .md-visual-block::before {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(135deg, var(--ts-violet-soft) 0%, transparent 55%, var(--ts-cyan-glow) 100%);
          pointer-events: none; border-radius: inherit; opacity: 0.55;
        }
        /* top shimmer line */
        .md-visual-block::after {
          content: '';
          position: absolute;
          top: 0; left: 15%; width: 70%; height: 1px;
          background: linear-gradient(90deg, transparent, var(--ts-violet), var(--ts-cyan), transparent);
          opacity: 0.65;
        }
        .md-visual-block:hover {
          border-color: var(--ts-violet);
          box-shadow: 0 0 0 1px var(--ts-violet), 0 12px 40px var(--ts-violet-glow), inset 0 0 60px var(--ts-violet-bubble);
        }
        @media (max-width:640px) {
          .md-visual-block { padding: 1.1rem 1rem; border-radius: 12px; margin-bottom: 1.25rem; }
        }

        /* "Visual" badge inside visual block */
        .md-visual-label {
          display: inline-flex; align-items: center; gap: 0.35rem;
          font-size: 0.64rem; font-weight: 700;
          letter-spacing: 0.12em; text-transform: uppercase;
          color: var(--ts-violet);
          margin-bottom: 0.85rem;
          position: relative; z-index: 1;
        }
        .md-visual-label::before {
          content: '';
          display: inline-block; width: 5px; height: 5px;
          border-radius: 50%; background: var(--ts-violet);
          box-shadow: 0 0 6px var(--ts-violet);
        }

        /* AUDIO block — no extra wrapper needed */
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
        .md-root h3 { font-size:clamp(0.95rem,2.5vw,1.05rem); font-weight:600; color:var(--ts-violet); margin-top:1rem; }
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
      `}</style>

      <div className="md-root">

        {/* toggle */}
        <div className="md-toggle-row">
          <button className="md-toggle-btn" onClick={toggleTheme}
            aria-label={theme === "dark" ? "Switch to light" : "Switch to dark"}>
            <span style={{ fontSize: "0.92rem", lineHeight: 1 }}>{theme === "dark" ? "☀" : "🌙"}</span>
            {theme === "dark" ? "Light" : "Dark"}
          </button>
        </div>

        {/* content blocks */}
        {taggedParts.map((part, i) => {
          const delay = Math.min(i * 55, 280);

          if (part.type === "visual") return (
            <FadeIn key={i} delay={delay}>
              <div className="md-visual-block">
                <div className="md-visual-label">Visual</div>
                <div style={{ position: "relative", zIndex: 1 }}>
                  <AdaptiveRenderer block={part.content} type="visual"
                    profile={profile} moduleId={moduleId} subjectId={subjectId} />
                </div>
              </div>
            </FadeIn>
          );

          if (part.type === "audio") return (
            <FadeIn key={i} delay={delay}>
              <div className="md-audio-block">
                <AdaptiveRenderer block={part.content} type="audio"
                  profile={profile} moduleId={moduleId} subjectId={subjectId} />
              </div>
            </FadeIn>
          );

          if (!part.content.trim()) return null;

          if (isAudioPrimary) return (
            <FadeIn key={i} delay={delay}>
              <div className="md-visual-block">
                <div style={{ position: "relative", zIndex: 1 }}>
                  <AdaptiveRenderer block={part.content} type="text"
                    profile={profile} moduleId={moduleId} subjectId={subjectId} />
                </div>
              </div>
            </FadeIn>
          );

          return (
            <FadeIn key={i} delay={delay}>
              <div className="md-text-block">
                <AdaptiveRenderer block={part.content} type="text"
                  profile={profile} moduleId={moduleId} subjectId={subjectId} />
              </div>
            </FadeIn>
          );
        })}

        {/* chapter audio player */}
        {audioContent && (
          <FadeIn delay={200}>
            <div className="md-audio-block" style={{ marginTop: "1.75rem" }}>
              <AudioRenderer block={audioContent} variant="chapter" />
            </div>
          </FadeIn>
        )}

        {/* chapter quiz */}
        {quiz.length > 0 && (
          <FadeIn delay={260}>
            <ChapterQuiz quiz={quiz}
              onComplete={(score, total) => onQuizComplete?.(score, total)} />
          </FadeIn>
        )}

      </div>
    </>
  );
}