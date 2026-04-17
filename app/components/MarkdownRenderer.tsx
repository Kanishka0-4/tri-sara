"use client";

import React, { useEffect, useState } from "react";
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

function getRanking(profile: LearningProfile): string[] {
  return Object.entries(profile).sort((a, b) => b[1] - a[1]).map(([k]) => k);
}

function normaliseContent(src: string): string {
  return src
    // Fix malformed closing tags that have a newline before the slash
    .replace(/\[\s*\n\s*\/(TEXT|VISUAL|AUDIO)\]/gi, "[/$1]")
    // Strip quiz-related content
    .replace(/#{1,3}\s*(Quiz|Questions?|Multiple Choice|MCQ).*\n?/gi, "")
    .replace(/\d+\.\s*.*\?\s*\n?(A\)|B\)|C\)|D\)).*\n?/gi, "")
    .replace(/^[A-D]\)\s*.*\n?/gm, "")
    .replace(/Correct\s*(answer|Answer|option|Option).*:?\s*[A-D]\s*\n?/gi, "")
    .replace(/Answer\s*:\s*[A-D]\s*\n?/gi, "")
    // Normalise bullet points
    .replace(/^\*\s+/gm, "- ");
  // NOTE: Do NOT strip [TEXT], [VISUAL], [AUDIO] opening tags here —
  // parseTaggedParts needs them to detect block boundaries.
}

function stripKeyTakeaways(block: string): string {
  return block.replace(/Key\s*Takeaways[\s\S]*/gi, "").trim();
}

function parseTaggedParts(src: string) {
  const parts: { type: "visual" | "audio" | "text"; content: string }[] = [];
  // Match [TAG]...[/TAG] — case-insensitive, handles optional whitespace
  const tagRegex = /\[\s*(TEXT|VISUAL|AUDIO)\s*\]([\s\S]*?)\[\s*\/\s*\1\s*\]/gi;
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = tagRegex.exec(src)) !== null) {
    // Any plain text before this tag
    if (m.index > lastIndex) {
      const plain = src.slice(lastIndex, m.index).trim();
      if (plain) parts.push({ type: "text", content: plain });
    }
    const tagType    = m[1].toLowerCase() as "visual" | "audio" | "text";
    const tagContent = m[2].trim();
    if (tagContent) parts.push({ type: tagType, content: tagContent });
    lastIndex = tagRegex.lastIndex;
  }
  // Trailing content after the last closing tag
  if (lastIndex < src.length) {
    const rest = src.slice(lastIndex).trim();
    if (rest) parts.push({ type: "text", content: rest });
  }
  // Fallback: if nothing was tagged, treat the whole thing as text
  if (parts.length === 0 && src.trim()) parts.push({ type: "text", content: src.trim() });
  return parts;
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
  const ranking        = getRanking(profile);
  const isAudioPrimary = ranking[0] === "audio";

  const normalised  = normaliseContent(content);
  const taggedParts = parseTaggedParts(normalised);

  const audioContent = taggedParts
    .filter(p => p.type === "audio")
    .map(p  => stripKeyTakeaways(p.content))
    .join("\n\n");

  useEffect(() => {
    if (setAudioContent && audioContent) setAudioContent(audioContent);
  }, [audioContent, setAudioContent]);

  /* ── Theme ── */
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  useEffect(() => {
    const saved = (document.documentElement.getAttribute("data-theme") as "dark" | "light") || "dark";
    setTheme(saved);
  }, []);
  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try { localStorage.setItem("trisara-theme", next); } catch {}
  };
  const isDark = theme === "dark";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=DM+Serif+Display:ital@0;1&display=swap');

        /* ───── Layout ───── */
        .md-root {
          font-family: 'Space Grotesk', sans-serif;
          color: var(--ts-text);
          max-width: 100%;
          margin: 0 auto;
          line-height: 1.78;
          padding: 0;
          word-wrap: break-word;
          overflow-wrap: break-word;
          overflow-x: hidden;
          position: relative;
        }

        /* ───── Theme toggle ───── */
        .md-toggle-row {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 1.75rem;
        }
        .md-toggle-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          padding: 0.38rem 1.1rem;
          border-radius: 999px;
          border: 1px solid var(--ts-border-hi);
          background: var(--ts-surface-hi);
          color: var(--ts-violet);
          font-family: 'Space Grotesk', sans-serif;
          font-size: 0.8rem;
          font-weight: 600;
          letter-spacing: 0.04em;
          cursor: pointer;
          transition: background 0.18s, box-shadow 0.18s, color 0.18s;
          white-space: nowrap;
        }
        .md-toggle-btn:hover {
          background: var(--ts-violet-bubble);
          box-shadow: 0 0 14px var(--ts-violet-glow);
        }

        /* ───── Content blocks ───── */
        .md-text-block {
          background: var(--ts-surface);
          border: 1px solid var(--ts-border);
          border-radius: 16px;
          padding: 1.4rem 1.6rem;
          margin-bottom: 1.25rem;
          position: relative;
          box-shadow:
            0 0 0 1px var(--ts-border-hi),
            0 10px 40px rgba(0,0,0,0.4),
            0 0 40px var(--ts-violet-soft);
          transition: all 0.25s ease;
          overflow-x: hidden;
        }
        @media (max-width: 640px) {
          .md-text-block {
            padding: 1rem 1rem;
            border-radius: 12px;
          }
        }
        .md-text-block:hover {
          border-color: var(--ts-border-hi);
          box-shadow: 0 2px 20px var(--ts-violet-glow);
        }

        /* Visual block */
        .md-visual-block {
          border-radius: 14px;
          padding: 1.4rem 1.6rem;
          margin-bottom: 1.25rem;
          position: relative;
          overflow: hidden;
          background: var(--ts-surface-hi);
          box-shadow:
            0 0 0 1px var(--ts-border-hi),
            0 4px 28px var(--ts-violet-glow),
            inset 0 0 40px var(--ts-violet-soft);
          transition: box-shadow 0.2s;
        }
        @media (max-width: 640px) {
          .md-visual-block {
            padding: 1rem 0.85rem;
            border-radius: 12px;
          }
        }
        .md-visual-block::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(
            135deg,
            var(--ts-violet-soft) 0%,
            transparent 50%,
            var(--ts-cyan-glow) 100%
          );
          pointer-events: none;
          border-radius: inherit;
          opacity: 0.6;
        }
        .md-visual-block:hover {
          box-shadow:
            0 0 0 1px var(--ts-violet),
            0 6px 36px var(--ts-violet-glow),
            inset 0 0 60px var(--ts-violet-bubble);
        }
        .md-visual-label {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--ts-violet);
          margin-bottom: 1rem;
          opacity: 0.85;
        }
        .md-visual-label::before {
          content: '';
          display: inline-block;
          width: 5px; height: 5px;
          border-radius: 50%;
          background: var(--ts-violet);
          box-shadow: 0 0 6px var(--ts-violet);
        }

        /* ───── Typography inside .md-root ───── */
        .md-root h1,
        .md-root h2,
        .md-root h3 {
          font-family: 'Space Grotesk', sans-serif;
          line-height: 1.25;
          color: var(--ts-text);
        }
        .md-root h1 {
          font-size: clamp(1.3rem, 4vw, 1.85rem);
          margin-bottom: 1rem;
        }
        .md-root h2 {
          font-size: clamp(1.05rem, 3vw, 1.3rem);
          border-bottom: 1px solid var(--ts-border-hi);
          padding-bottom: 0.4rem;
          margin-top: 1.5rem;
          margin-bottom: 0.9rem;
        }
        .md-root h3 {
          font-size: 1.05rem;
          color: var(--ts-violet);
          margin-top: 1.1rem;
        }
        .md-root p {
          color: var(--ts-text);
          margin-bottom: 0.75rem;
          font-size: clamp(0.88rem, 2.5vw, 1rem);
          line-height: 1.75;
        }
        .md-root strong {
          color: var(--ts-violet);
          font-weight: 700;
        }
        .md-root em {
          color: var(--ts-text-muted);
          font-style: italic;
        }

        /* ───── Lists ───── */
        .md-root ul {
          list-style: none;
          padding-left: 0;
          margin-bottom: 0.75rem;
        }
        .md-root ul li {
          padding-left: 1.4rem;
          position: relative;
          margin-bottom: 0.4rem;
          color: var(--ts-text);
          font-size: clamp(0.85rem, 2.5vw, 0.95rem);
          line-height: 1.65;
        }
        .md-root ul li::before {
          content: '▸';
          position: absolute;
          left: 0;
          color: var(--ts-violet);
          font-size: 0.75em;
          top: 0.22em;
        }
        .md-root ol {
          padding-left: 1.5rem;
          margin-bottom: 0.75rem;
        }
        .md-root ol li {
          margin-bottom: 0.4rem;
          color: var(--ts-text);
          font-size: clamp(0.85rem, 2.5vw, 0.95rem);
        }
        .md-root ol li::marker {
          color: var(--ts-violet);
          font-weight: 700;
        }

        /* ───── Blockquote ───── */
        .md-root blockquote {
          border-left: 3px solid var(--ts-violet);
          background: var(--ts-violet-bubble);
          padding: 0.9rem 1.2rem;
          border-radius: 0 10px 10px 0;
          color: var(--ts-text-muted);
          font-style: italic;
          margin: 1.25rem 0;
        }

        /* ───── Code ───── */
        .md-root code {
          background: var(--ts-violet-soft);
          color: var(--ts-cyan);
          padding: 0.18em 0.42em;
          border-radius: 5px;
          font-size: 0.87em;
          font-family: 'JetBrains Mono','Fira Code','Cascadia Code',monospace;
          word-break: break-all;
        }
        .md-root pre {
          background: var(--ts-surface-hi);
          border: 1px solid var(--ts-border);
          border-radius: 12px;
          padding: 1.1rem;
          overflow-x: auto;
          margin: 1rem 0;
          -webkit-overflow-scrolling: touch;
        }
        .md-root pre code {
          background: none;
          padding: 0;
          color: var(--ts-cyan);
          word-break: normal;
        }

        /* ───── Table ───── */
        .md-root table {
          width: 100%;
          border-collapse: collapse;
          margin: 1.25rem 0;
          font-size: clamp(0.78rem, 2vw, 0.88rem);
          display: block;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }
        .md-root table th {
          background: var(--ts-violet-bubble);
          color: var(--ts-violet);
          font-weight: 700;
          text-align: left;
          padding: 0.6rem 0.85rem;
          border-bottom: 2px solid var(--ts-border-hi);
          white-space: nowrap;
        }
        .md-root table td {
          padding: 0.5rem 0.85rem;
          border-bottom: 1px solid var(--ts-border);
          color: var(--ts-text-muted);
        }
        .md-root table tr:hover td {
          background: var(--ts-violet-soft);
          color: var(--ts-text);
        }

        /* ───── Links ───── */
        .md-root a {
          color: var(--ts-cyan);
          text-decoration: underline;
          text-underline-offset: 3px;
        }
        .md-root a:hover { color: var(--ts-violet); }

        /* ───── HR ───── */
        .md-root hr {
          border: none;
          border-top: 1px solid var(--ts-border);
          margin: 2rem 0;
        }
      `}</style>

      <div className="md-root">

        {/* ── Theme toggle ── */}
        <div className="md-toggle-row">
          <button
            className="md-toggle-btn"
            onClick={toggleTheme}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            <span style={{ fontSize: "0.92rem", lineHeight: 1 }}>
              {isDark ? "☀" : "🌙"}
            </span>
            {isDark ? "Light" : "Dark"}
          </button>
        </div>

        {/* ── Content blocks ── */}
        {taggedParts.map((part, index) => {

          /* VISUAL */
          if (part.type === "visual") {
            return (
              <div key={index} className="md-visual-block">
                <div className="md-visual-label">Visual</div>
                <AdaptiveRenderer
                  block={part.content}
                  type="visual"
                  profile={profile}
                  moduleId={moduleId}
                  subjectId={subjectId}
                />
              </div>
            );
          }

          /* AUDIO */
          if (part.type === "audio") {
            return (
              <div key={index} className="md-text-block">
                <AdaptiveRenderer
                  block={part.content}
                  type="audio"
                  profile={profile}
                  moduleId={moduleId}
                  subjectId={subjectId}
                />
              </div>
            );
          }

          /* TEXT — empty guard */
          if (!part.content.trim()) return null;

          /* audio-primary learner → visual block for text too */
          if (isAudioPrimary) {
            return (
              <div key={index} className="md-visual-block">
                <AdaptiveRenderer
                  block={part.content}
                  type="text"
                  profile={profile}
                  moduleId={moduleId}
                  subjectId={subjectId}
                />
              </div>
            );
          }

          return (
            <div key={index} className="md-text-block">
              <AdaptiveRenderer
                block={part.content}
                type="text"
                profile={profile}
                moduleId={moduleId}
                subjectId={subjectId}
              />
            </div>
          );
        })}

        {/* ── Chapter audio player ── */}
        {audioContent && (
          <div style={{ marginTop: "1.5rem" }}>
            <AudioRenderer block={audioContent} variant="chapter" />
          </div>
        )}

        {/* ── Chapter quiz ── */}
        {quiz.length > 0 && (
          <ChapterQuiz
            quiz={quiz}
            onComplete={(score, total) => onQuizComplete?.(score, total)}
          />
        )}

      </div>
    </>
  );
}