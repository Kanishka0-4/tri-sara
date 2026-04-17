"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Circle,
  BookOpen,
} from "lucide-react";

/* ---------------- TYPES ---------------- */

type RoadmapWeek = {
  week: string;
  focus_topics: string[];
  subtopics: string[];
  expected_outcome: string;
};

/* ---------------- THEME TOKENS ---------------- */

const C = {
  bg: "var(--ts-bg)",
  surface: "var(--ts-surface)",
  surfaceHi: "var(--ts-surface-hi)",
  border: "var(--ts-border)",
  borderHi: "var(--ts-border-hi)",

  violet: "var(--ts-violet)",
  violetSoft: "var(--ts-violet-soft)",
  violetGlow: "var(--ts-violet-glow)",

  green: "var(--ts-green)",
  greenSoft: "var(--ts-green-soft)",
  greenBorder: "var(--ts-green-border)",

  text: "var(--ts-text)",
  muted: "var(--ts-text-muted)",
  dim: "var(--ts-text-dim)",
};

export default function RoadmapPage() {
  const { id } = useParams();

  const [roadmap, setRoadmap] = useState<RoadmapWeek[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedWeeks, setExpandedWeeks] = useState<Set<number>>(new Set());
  const [completedWeeks, setCompletedWeeks] = useState<Set<number>>(new Set());

  /* ---------------- THEME ---------------- */

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

  /* ---------------- FETCH ---------------- */

  useEffect(() => {
    if (!id || typeof id !== "string") return;

    async function fetchRoadmap() {
      try {
        const res = await fetch(`/api/roadmap/get?id=${id}`);
        const data = await res.json();

        if (!res.ok || !Array.isArray(data)) {
          setError(data?.error || "Failed to load roadmap");
          return;
        }

        setRoadmap(data);
      } catch (err) {
        console.error(err);
        setError("Network error");
      } finally {
        setLoading(false);
      }
    }

    fetchRoadmap();
  }, [id]);

  /* ---------------- HELPERS ---------------- */

  const toggleWeek = (index: number) => {
    const next = new Set(expandedWeeks);
    next.has(index) ? next.delete(index) : next.add(index);
    setExpandedWeeks(next);
  };

  const toggleComplete = (index: number) => {
    const next = new Set(completedWeeks);
    next.has(index) ? next.delete(index) : next.add(index);
    setCompletedWeeks(next);
  };

  const progressPercentage =
    roadmap.length > 0
      ? (completedWeeks.size / roadmap.length) * 100
      : 0;

  /* ---------------- STATES ---------------- */

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: C.bg }}>
        <div style={{ color: C.muted }}>Loading roadmap...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: C.bg }}>
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, padding: 20, borderRadius: 12, color: C.text }}>
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: C.bg }}>

      {/* THEME TOGGLE */}
      <button
        onClick={toggleTheme}
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
          cursor: "pointer",
        }}
      >
        {theme === "dark" ? "☀" : "🌙"}
      </button>

      <div className="max-w-5xl mx-auto px-4 py-10">

        {/* HEADER */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-3">
            <BookOpen style={{ color: C.violet }} />
            <h1 style={{ color: C.text, fontSize: 30, fontWeight: 700 }}>
              Your Learning Roadmap
            </h1>
          </div>

          <p style={{ color: C.muted }}>
            Follow this structured path to master your subject
          </p>
        </div>

        {/* LEARNING GUIDE */}
        <div
          className="mb-8 p-4 rounded-xl"
          style={{
            background: C.surfaceHi,
            border: `1px solid ${C.border}`,
          }}
        >
          <p style={{ color: C.text, fontWeight: 500, marginBottom: 6 }}>
            📌 Track your learning, not just completion
          </p>
          <p style={{ color: C.muted, fontSize: 14 }}>
            Mark a module as complete only when you truly understand it. Expand each week, review key concepts,
            and focus on mastering subtopics rather than rushing through modules.
          </p>
        </div>

        {/* PROGRESS */}
        <div
          className="rounded-2xl p-6 mb-8"
          style={{
            background: C.surface,
            border: `1px solid ${C.border}`,
          }}
        >
          <div className="flex justify-between mb-3">
            <span style={{ color: C.text }}>Progress</span>
            <span style={{ color: C.violet }}>
              {Math.round(progressPercentage)}%
            </span>
          </div>

          <div style={{ background: C.surfaceHi, height: 10, borderRadius: 10 }}>
            <div
              style={{
                width: `${progressPercentage}%`,
                background: C.violet,
                height: "100%",
                borderRadius: 10,
              }}
            />
          </div>
        </div>

        {/* WEEKS */}
        <div className="space-y-6">
          {roadmap.map((week, index) => {
            const isExpanded = expandedWeeks.has(index);
            const isCompleted = completedWeeks.has(index);

            return (
              <div key={index} className="flex gap-5">

                {/* COMPLETE */}
                <button onClick={() => toggleComplete(index)} style={{ cursor: "pointer" }}>
                  {isCompleted ? (
                    <CheckCircle style={{ color: C.green }} />
                  ) : (
                    <Circle style={{ color: C.dim }} />
                  )}
                </button>

                {/* CARD */}
                <div
                  className="flex-1 rounded-xl p-5"
                  style={{
                    background: isCompleted ? C.greenSoft : C.surface,
                    border: `1px solid ${isCompleted ? C.greenBorder : C.border}`,
                  }}
                >
                  <button
                    onClick={() => toggleWeek(index)}
                    style={{
                      cursor: "pointer",
                      width: "100%",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span style={{ color: C.text, fontWeight: 500 }}>
                      {week.week}
                    </span>

                    <span style={{ cursor: "pointer", color: C.muted }}>
                      {isExpanded ? <ChevronUp /> : <ChevronDown />}
                    </span>
                  </button>

                  {!isExpanded && (
                    <p style={{ color: C.muted, marginTop: 10 }}>
                      {week.expected_outcome}
                    </p>
                  )}

                  {isExpanded && (
                    <div className="mt-4 space-y-3">

                      {/* TOPICS */}
                      <div className="flex flex-wrap gap-2">
                        {week.focus_topics.map((t, i) => (
                          <span
                            key={i}
                            style={{
                              background: C.violetSoft,
                              color: C.violet,
                              padding: "5px 10px",
                              borderRadius: 10,
                              fontSize: 12,
                              border: `1px solid ${C.violetGlow}`,
                            }}
                          >
                            {t}
                          </span>
                        ))}
                      </div>

                      {/* SUBTOPICS */}
                      <div style={{ background: C.surfaceHi, padding: 10, borderRadius: 8 }}>
                        {week.subtopics.map((s, i) => (
                          <div key={i} style={{ color: C.muted }}>
                            • {s}
                          </div>
                        ))}
                      </div>

                      {/* OUTCOME */}
                      <div style={{ color: C.text }}>
                        {week.expected_outcome}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}