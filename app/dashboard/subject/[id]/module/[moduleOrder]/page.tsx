"use client";
import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import MarkdownRenderer from "@/app/components/MarkdownRenderer";
import FloatingChatbot from "@/app/components/FloatingChatbot";
import ModuleQuiz from "@/app/components/ModuleQuiz";

interface Chapter {
  title: string;
  content: string;
}

function parseChapters(markdown: string): Chapter[] {
  const lines = markdown.split("\n");
  const chapters: Chapter[] = [];
  let currentTitle = "";
  let currentLines: string[] = [];

  for (const line of lines) {
    if (/^#{2,3}\s+Chapter\s+\d+/i.test(line)) {
      if (currentTitle) {
        chapters.push({ title: currentTitle, content: currentLines.join("\n").trim() });
      }
      currentTitle = line.replace(/^#{2,3}\s+/, "").trim();
      currentLines = [];
    } else {
      currentLines.push(line);
    }
  }
  if (currentTitle) {
    chapters.push({ title: currentTitle, content: currentLines.join("\n").trim() });
  }
  return chapters;
}

export default function ModulePage() {
  const params      = useParams();
  const subjectId   = params.id as string;
  const moduleOrder = params.moduleOrder as string;
  const router      = useRouter();

  const [chapters,    setChapters   ] = useState<Chapter[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading,     setLoading    ] = useState(true);
  const [error,       setError      ] = useState("");

  const [quiz,                      setQuiz                     ] = useState<any[]>([]);
  const [quizLoading,               setQuizLoading              ] = useState(false);
  const [completedChapterQuizzes,   setCompletedChapterQuizzes  ] = useState<Set<number>>(new Set());
  const [chapterQuizScores,         setChapterQuizScores        ] = useState<Record<number, { score: number; total: number }>>({});

  const [moduleQuiz,           setModuleQuiz          ] = useState<any[]>([]);
  const [moduleQuizLoading,    setModuleQuizLoading   ] = useState(false);
  const [moduleQuizAnswers,    setModuleQuizAnswers   ] = useState<{ [key: number]: string }>({});
  const [moduleQuizScore,      setModuleQuizScore     ] = useState<number | null>(null);
  const [moduleQuizTotal,      setModuleQuizTotal     ] = useState<number | null>(null);
  const [moduleQuizResult,     setModuleQuizResult    ] = useState<any>(null);
  const [showModuleQuiz,       setShowModuleQuiz      ] = useState(false);
  const [moduleQuizAlreadyDone,setModuleQuizAlreadyDone] = useState(false);

  const [nextModuleReady,   setNextModuleReady  ] = useState(false);
  const [nextModuleIsLast,  setNextModuleIsLast ] = useState(false);
  const [nextModulePolling, setNextModulePolling] = useState(false);
  const [retryAfter,        setRetryAfter       ] = useState<number | null>(null);
  const [generatingNext,    setGeneratingNext   ] = useState(false);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [isMobile, setIsMobile] = useState(false);
  const [showMobileDrawer, setShowMobileDrawer] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Close drawer on chapter select (mobile)
  function selectChapter(i: number) {
    setActiveIndex(i);
    setShowMobileDrawer(false);
  }

  useEffect(() => {
    async function fetchContent() {
      try {
        const res = await fetch(`/api/dashboard/subjects/${subjectId}/module/${moduleOrder}`);
        if (!res.ok) { setError("Module content not found"); setLoading(false); return; }
        const data = await res.json();
        setChapters(parseChapters(data.content));
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError("Failed to load module");
        setLoading(false);
      }
    }
    fetchContent();
  }, [subjectId, moduleOrder]);

  useEffect(() => {
    if (!subjectId || !moduleOrder) return;
    async function fetchChapterProgress() {
      try {
        const res = await fetch(`/api/chapterQuiz?subjectId=${subjectId}&moduleOrder=${moduleOrder}`);
        if (res.status === 401) { router.push("/login"); return; }
        const data = await res.json();
        if (data.completed?.length > 0) {
          const completedSet = new Set<number>();
          const scores: Record<number, { score: number; total: number }> = {};
          data.completed.forEach((r: { chapter_index: number; score: number; total: number }) => {
            completedSet.add(r.chapter_index);
            scores[r.chapter_index] = { score: r.score, total: r.total };
          });
          setCompletedChapterQuizzes(completedSet);
          setChapterQuizScores(scores);
        }
      } catch (err) { console.error("Failed to load chapter progress", err); }
    }
    fetchChapterProgress();
  }, [subjectId, moduleOrder]);

  useEffect(() => {
    if (!subjectId || !moduleOrder) return;
    async function fetchModuleQuizProgress() {
      try {
        const res = await fetch(`/api/moduleQuiz?subjectId=${subjectId}&moduleOrder=${moduleOrder}`);
        if (res.status === 401) { router.push("/login"); return; }
        const data = await res.json();
        if (data.retryAfter) {
          const rt = Number(data.retryAfter);
          if (!isNaN(rt)) setRetryAfter(rt);
        }
        if (data.exists) {
          setModuleQuiz(data.mcqs || []);
          if (data.score != null && data.total != null) {
            setModuleQuizScore(data.score);
            setModuleQuizTotal(data.total);
            setModuleQuizAlreadyDone(true);
            checkNextModuleReady();
          }
        }
      } catch (err) { console.error("Failed to load module quiz progress", err); }
    }
    fetchModuleQuizProgress();
  }, [subjectId, moduleOrder]);

  useEffect(() => {
    return () => { if (pollIntervalRef.current) clearInterval(pollIntervalRef.current); };
  }, []);

  async function checkNextModuleReady() {
    const nextOrder = Number(moduleOrder) + 1;
    try {
      const res  = await fetch(`/api/moduleReady?subjectId=${subjectId}&moduleOrder=${nextOrder}`);
      const data = await res.json();
      if (data.isLast)  { setNextModuleIsLast(true); setNextModuleReady(false); return true; }
      if (data.ready)   { setNextModuleReady(true);  setNextModulePolling(false); return true; }
      return false;
    } catch (err) { console.error("Next module check failed", err); return false; }
  }

  function startPollingNextModule() {
    setNextModulePolling(true);
    checkNextModuleReady().then(done => {
      if (done) return;
      pollIntervalRef.current = setInterval(async () => {
        const done = await checkNextModuleReady();
        if (done && pollIntervalRef.current) { clearInterval(pollIntervalRef.current); pollIntervalRef.current = null; }
      }, 5000);
    });
  }

  useEffect(() => {
    if (!chapters[activeIndex]) return;
    if (completedChapterQuizzes.has(activeIndex)) { setQuiz([]); setQuizLoading(false); return; }
    setQuiz([]);
    setQuizLoading(true);
    async function generateQuiz() {
      try {
        const res  = await fetch("/api/generateQuiz", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chapterTitle: chapters[activeIndex].title, chapterContent: chapters[activeIndex].content }),
        });
        const data = await res.json();
        setQuiz(data.quiz || []);
      } catch (err) { console.error("Quiz generation failed", err); }
      finally { setQuizLoading(false); }
    }
    generateQuiz();
  }, [activeIndex, chapters, completedChapterQuizzes]);

  const allChapterQuizzesDone = chapters.length > 0 && chapters.every((_, i) => completedChapterQuizzes.has(i));
  const isLastChapter         = activeIndex === chapters.length - 1;
  const canGoNext             = completedChapterQuizzes.has(activeIndex);

  function getDaysLeft(): number | null {
    if (!retryAfter) return null;
    const msLeft = retryAfter - Date.now();
    if (msLeft <= 0) return 0;
    return Math.ceil(msLeft / (1000 * 60 * 60 * 24));
  }
  const daysLeft = getDaysLeft();

  async function handleChapterQuizComplete(score: number, total: number) {
    setCompletedChapterQuizzes(prev => { const s = new Set(prev); s.add(activeIndex); return s; });
    setChapterQuizScores(prev => ({ ...prev, [activeIndex]: { score, total } }));
    try {
      const res = await fetch("/api/chapterQuiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subjectId, moduleOrder: Number(moduleOrder), chapterIndex: activeIndex, score, total }),
      });
      if (res.status === 401) router.push("/login");
    } catch (err) { console.error("Failed to save chapter quiz score", err); }
  }

  async function handleStartModuleQuiz() {
    setShowModuleQuiz(true);
    if (moduleQuiz.length > 0) return;
    setModuleQuizLoading(true);
    try {
      const res = await fetch("/api/moduleQuiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moduleTitle: `Module ${moduleOrder}`,
          topics: chapters.map(c => c.title),
          profile: { visual: 40, audio: 20, text: 40 },
          subjectId,
          moduleOrder: Number(moduleOrder),
        }),
      });
      if (res.status === 401) { router.push("/login"); return; }
      const data = await res.json();
      console.log("moduleQuiz POST response:", data);
      setModuleQuiz(data.mcqs || []);
      setModuleQuizAnswers({});
    } catch (err) { console.error("Module quiz fetch failed", err); }
    finally { setModuleQuizLoading(false); }
  }

  async function submitModuleQuiz() {
    let correct = 0;
    moduleQuiz.forEach((q: any, i: number) => {
      const idx  = ["A","B","C","D"].indexOf(q.answer);
      if (moduleQuizAnswers[i] === q.options[idx]) correct++;
    });
    setModuleQuizScore(correct);
    setModuleQuizTotal(moduleQuiz.length);
    try {
      const res = await fetch("/api/moduleQuiz/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subjectId, moduleOrder, score: correct, total: moduleQuiz.length, profile: { visual: 40, audio: 20, text: 40 }, quiz: moduleQuiz }),
      });
      if (res.status === 401) { router.push("/login"); return; }
      const data = await res.json();
      setModuleQuizResult(data);
      setModuleQuizAlreadyDone(true);
      startPollingNextModule();
    } catch (err) { console.error("Score save failed", err); }
  }

  async function handleNextModule() {
    const nextOrder = Number(moduleOrder) + 1;
    try {
      const res  = await fetch(`/api/moduleReady?subjectId=${subjectId}&moduleOrder=${nextOrder}`);
      const data = await res.json();
      if (data.isLast)  { router.push(`/dashboard/subject/${subjectId}/mega`); // ← was alert(), now navigates
      return;}
      if (data.ready)   { router.push(`/dashboard/subject/${subjectId}/module/${nextOrder}`); return; }
      setGeneratingNext(true);
      const genRes = await fetch("/api/ai/generateModule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subjectId, moduleOrder: nextOrder }),
      });
      if (!genRes.ok) { alert("Failed to generate module. Try again."); setGeneratingNext(false); return; }
      router.push(`/dashboard/subject/${subjectId}/module/${nextOrder}`);
    } catch (err) { console.error("Next module error:", err); alert("Something went wrong"); setGeneratingNext(false); }
  }

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", minHeight: "100vh", gap: 12 }}>
        <style>{`@keyframes mp-spin{to{transform:rotate(360deg)}}`}</style>
        <div style={{ width: 20, height: 20, borderRadius: "50%", border: "2px solid var(--ts-border)", borderTop: "2px solid var(--ts-violet)", animation: "mp-spin 0.8s linear infinite" }} />
        <span style={{ fontSize: 14, color: "var(--ts-text-muted)", fontFamily: "'Space Grotesk',sans-serif" }}>Loading module…</span>
      </div>
    );
  }
  if (error) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--ts-bg)" }}>
        <p style={{ color: "var(--ts-rose)", fontFamily: "'Space Grotesk',sans-serif" }}>{error}</p>
      </div>
    );
  }

  if (showModuleQuiz) {
    return (
      <ModuleQuiz
        moduleQuiz={moduleQuiz}
        moduleQuizLoading={moduleQuizLoading}
        moduleQuizAnswers={moduleQuizAnswers}
        setModuleQuizAnswers={setModuleQuizAnswers}
        submitModuleQuiz={submitModuleQuiz}
        moduleQuizScore={moduleQuizScore}
        moduleQuizTotal={moduleQuizTotal}
        retryAfter={retryAfter}
        moduleQuizAlreadyDone={moduleQuizAlreadyDone}
        handleNextModule={handleNextModule}
        moduleOrder={moduleOrder}
        onBack={() => setShowModuleQuiz(false)}
        isLastModule={nextModuleIsLast}
      />
    );
  }

  const progressPct = chapters.length > 0
    ? Math.round((completedChapterQuizzes.size / chapters.length) * 100)
    : 0;

  /* ── Sidebar content (shared between desktop sidebar and mobile drawer) ── */
  const SidebarContent = ({ onSelectChapter }: { onSelectChapter: (i: number) => void }) => (
    <>
      {/* Navigation buttons */}
      <div style={{ padding: "16px 12px 12px", borderBottom: "1px solid var(--ts-border)", display: "flex", flexDirection: "column", gap: 4 }}>
        <button className="mp-back-btn" onClick={() => router.push("/dashboard")}>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ flexShrink: 0 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Dashboard
        </button>
        <button className="mp-back-btn" onClick={() => router.push(`/dashboard/subject/${subjectId}`)}>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ flexShrink: 0 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Modules
        </button>
      </div>

      {/* Contents header */}
      <div style={{ padding: "14px 16px 10px", borderBottom: "1px solid var(--ts-border)" }}>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ts-text-dim)", marginBottom: 4 }}>
          Contents
        </p>
        <p style={{ fontSize: 13, color: "var(--ts-text-muted)" }}>
          {chapters.length} chapter{chapters.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Chapter list */}
      <nav style={{ flex: 1, overflowY: "auto", padding: "10px 8px", display: "flex", flexDirection: "column", gap: 2 }}>
        {chapters.map((chapter, i) => {
          const isDone   = completedChapterQuizzes.has(i);
          const isActive = activeIndex === i;
          const scoreData = chapterQuizScores[i];
          return (
            <button
              key={i}
              className={`mp-nav-btn${isActive ? " active" : ""}`}
              onClick={() => onSelectChapter(i)}
            >
              <span style={{
                flexShrink: 0, width: 26, height: 26, borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 700, marginTop: 1,
                background: isDone ? "var(--ts-green)" : isActive ? "var(--ts-violet)" : "var(--ts-surface-hi)",
                color: (isDone || isActive) ? "#0d0918" : "var(--ts-text-muted)",
                transition: "background 0.15s",
              }}>
                {isDone ? "✓" : i + 1}
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{
                  display: "block", fontSize: 13, fontWeight: isActive ? 600 : 400,
                  color: isActive ? "var(--ts-text)" : "var(--ts-text-muted)", lineHeight: 1.4,
                }}>
                  {chapter.title}
                </span>
                {scoreData && (
                  <span style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--ts-green)", marginTop: 2 }}>
                    {scoreData.score}/{scoreData.total} correct
                  </span>
                )}
              </span>
            </button>
          );
        })}

        {/* Module Quiz section */}
        <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--ts-border)" }}>
          <p className="mp-section-label">Module Quiz</p>

          {moduleQuizAlreadyDone ? (
            <div className="mp-quiz-done-card">
              <div className="mp-quiz-score-row">
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ position: "relative", width: 36, height: 36, flexShrink: 0 }}>
                    <svg width="36" height="36" viewBox="0 0 36 36" style={{ transform: "rotate(-90deg)" }}>
                      <circle cx="18" cy="18" r="14" fill="none" stroke="var(--ts-border)" strokeWidth="3" />
                      <circle cx="18" cy="18" r="14" fill="none" stroke="var(--ts-green)" strokeWidth="3"
                        strokeDasharray={`${(moduleQuizScore! / moduleQuizTotal!) * 88} 88`}
                        strokeLinecap="round"
                        style={{ transition: "stroke-dasharray 0.6s ease" }}
                      />
                    </svg>
                    <span style={{
                      position: "absolute", inset: 0, pointerEvents: "none",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 9, fontWeight: 700, color: "var(--ts-green)",
                    }}>
                      {Math.round((moduleQuizScore! / moduleQuizTotal!) * 100)}%
                    </span>
                  </div>
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 700, color: "var(--ts-green)", margin: 0 }}>
                      {moduleQuizScore}/{moduleQuizTotal} correct
                    </p>
                    <p style={{ fontSize: 10, color: "var(--ts-text-muted)", margin: "2px 0 0" }}>
                      Module quiz done
                    </p>
                  </div>
                </div>
                <button onClick={() => setShowModuleQuiz(true)} style={{
                  fontSize: 11, fontWeight: 600, color: "var(--ts-violet)",
                  background: "var(--ts-violet-soft)", border: "1px solid var(--ts-border-hi)",
                  borderRadius: 6, padding: "4px 10px", cursor: "pointer", flexShrink: 0,
                  fontFamily: "'Space Grotesk', sans-serif",
                }}>
                  Review
                </button>
              </div>
              <div className="mp-quiz-retake-row" style={{
                background: daysLeft === 0 ? "var(--ts-green-soft)" : "var(--ts-amber-soft)",
                borderTop: `1px solid ${daysLeft === 0 ? "var(--ts-green-border)" : "var(--ts-amber-border)"}`,
              }}>
                {daysLeft === 0 ? (
                  <button onClick={() => { setModuleQuizAnswers({}); setModuleQuizScore(null); setModuleQuizTotal(null); handleStartModuleQuiz(); }} style={{
                    width: "100%", textAlign: "left", background: "none", border: "none", cursor: "pointer", padding: 0,
                    fontSize: 12, fontWeight: 600, color: "var(--ts-green)", fontFamily: "'Space Grotesk', sans-serif",
                  }}>
                    ↺ Retake available — click to start
                  </button>
                ) : daysLeft !== null ? (
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 600, color: "var(--ts-amber)", margin: "0 0 6px" }}>
                      ⏳ Retake in {daysLeft} {daysLeft === 1 ? "day" : "days"}
                    </p>
                    <div style={{ height: 3, background: "var(--ts-border)", borderRadius: 99, overflow: "hidden" }}>
                      <div style={{
                        height: "100%", borderRadius: 99, background: "var(--ts-amber)",
                        width: `${Math.max(5, 100 - (daysLeft / 7) * 100)}%`, transition: "width 0.4s ease",
                      }} />
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          ) : allChapterQuizzesDone ? (
            <button className="mp-quiz-cta" onClick={handleStartModuleQuiz}>
              <span style={{ fontSize: 14 }}>✦</span>
              Take Module Quiz
            </button>
          ) : (
            <div style={{
              padding: "10px 12px", background: "var(--ts-surface-hi)",
              border: "1px solid var(--ts-border)", borderRadius: 10, margin: "0 2px",
            }}>
              <p style={{ fontSize: 12, color: "var(--ts-text-dim)", margin: 0 }}>
                Complete all chapter quizzes to unlock
              </p>
              <div style={{ marginTop: 8, height: 3, background: "var(--ts-border)", borderRadius: 99, overflow: "hidden" }}>
                <div style={{
                  height: "100%", borderRadius: 99, background: "var(--ts-violet)",
                  width: `${chapters.length > 0 ? (completedChapterQuizzes.size / chapters.length) * 100 : 0}%`,
                  transition: "width 0.4s ease", boxShadow: "0 0 6px var(--ts-violet-glow)",
                }} />
              </div>
              <p style={{ fontSize: 10, color: "var(--ts-text-dim)", marginTop: 5 }}>
                {completedChapterQuizzes.size}/{chapters.length} chapters done
              </p>
            </div>
          )}
        </div>
      </nav>

      {/* Progress footer */}
      <div style={{ padding: "14px 16px", borderTop: "1px solid var(--ts-border)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: "var(--ts-text-dim)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Progress</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--ts-violet)" }}>{progressPct}%</span>
        </div>
        <div style={{ height: 4, background: "var(--ts-surface-hi)", borderRadius: 99, overflow: "hidden" }}>
          <div style={{
            height: "100%", borderRadius: 99,
            background: `linear-gradient(90deg, var(--ts-violet), var(--ts-cyan))`,
            width: `${progressPct}%`, transition: "width 0.5s ease",
            boxShadow: "0 0 8px var(--ts-violet-glow)",
          }} />
        </div>
      </div>
    </>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap');
        @keyframes mp-spin { to { transform: rotate(360deg); } }
        @keyframes mp-pulse { 0%,100%{opacity:.4;transform:scale(.7)} 50%{opacity:1;transform:scale(1)} }
        @keyframes mp-slideup { from { transform: translateY(100%); } to { transform: translateY(0); } }

        .mp-nav-btn {
          width: 100%; text-align: left; display: flex; align-items: flex-start;
          gap: 10px; padding: 10px 12px; border-radius: 10px;
          border: 1px solid transparent; background: transparent; cursor: pointer;
          transition: background 0.15s, border-color 0.15s;
          font-family: 'Space Grotesk', sans-serif; color: var(--ts-text);
        }
        .mp-nav-btn:hover { background: var(--ts-surface-hi); }
        .mp-nav-btn.active { background: var(--ts-violet-soft); border-color: var(--ts-border-hi); }

        .mp-back-btn {
          display: flex; align-items: center; gap: 8px; width: 100%;
          padding: 8px 10px; border-radius: 8px; border: none; background: transparent;
          color: var(--ts-text-muted); font-family: 'Space Grotesk', sans-serif;
          font-size: 13px; font-weight: 500; cursor: pointer;
          transition: background 0.15s, color 0.15s; text-align: left;
        }
        .mp-back-btn:hover { background: var(--ts-surface-hi); color: var(--ts-text); }

        .mp-quiz-done-card {
          border-radius: 10px; border: 1px solid var(--ts-border-hi);
          background: var(--ts-surface); overflow: hidden; margin: 0 2px;
        }
        .mp-quiz-score-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: 10px 14px; border-bottom: 1px solid var(--ts-border);
        }
        .mp-quiz-retake-row { padding: 10px 14px; }

        .mp-section-label {
          font-size: 10px; font-weight: 700; letter-spacing: 0.12em;
          text-transform: uppercase; color: var(--ts-text-dim);
          padding: 0 12px; margin-bottom: 6px;
          font-family: 'Space Grotesk', sans-serif;
        }

        .mp-next-btn {
          display: flex; align-items: center; gap: 8px; padding: 10px 18px;
          border-radius: 10px; border: none; font-family: 'Space Grotesk', sans-serif;
          font-size: 14px; font-weight: 600; cursor: pointer;
          transition: opacity 0.15s, box-shadow 0.15s;
        }
        .mp-next-btn:disabled { cursor: not-allowed; opacity: 0.55; }
        .mp-next-btn:not(:disabled):hover { opacity: 0.88; }

        .mp-quiz-cta {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          width: calc(100% - 8px); margin: 0 4px; padding: 10px 14px;
          border-radius: 10px; border: 1px solid var(--ts-border-hi);
          background: var(--ts-violet-soft); color: var(--ts-violet);
          font-family: 'Space Grotesk', sans-serif; font-size: 13px; font-weight: 600;
          cursor: pointer; transition: background 0.15s, box-shadow 0.15s;
        }
        .mp-quiz-cta:hover { background: var(--ts-violet-bubble); box-shadow: 0 0 14px var(--ts-violet-glow); }

        /* Mobile top bar */
        .mp-mobile-topbar {
          display: none;
          position: sticky;
          top: 0;
          z-index: 40;
          background: var(--ts-surface);
          border-bottom: 1px solid var(--ts-border);
          padding: 0 16px;
          height: 52px;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        /* Mobile drawer overlay */
        .mp-drawer-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.5);
          z-index: 100; backdrop-filter: blur(2px);
        }
        .mp-drawer {
          position: fixed; bottom: 0; left: 0; right: 0;
          background: var(--ts-surface); border-radius: 20px 20px 0 0;
          border-top: 1px solid var(--ts-border);
          z-index: 101; max-height: 85vh; display: flex; flex-direction: column;
          animation: mp-slideup 0.3s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .mp-drawer-handle {
          width: 40px; height: 4px; border-radius: 99px;
          background: var(--ts-border); margin: 12px auto 0;
        }

        @media (max-width: 767px) {
          .mp-mobile-topbar { display: flex; }
          .mp-desktop-sidebar { display: none !important; }
          .mp-main-content { padding: 20px 16px 100px !important; }
          .mp-chapter-title { font-size: 1.4rem !important; }
          .mp-nav-bottom { flex-direction: column; gap: 10px; }
          .mp-nav-bottom > div { width: 100%; }
          .mp-next-btn { width: 100%; justify-content: center; }
        }
      `}</style>

      <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "var(--ts-bg)", fontFamily: "'Space Grotesk', sans-serif" }}>

        {/* ══ DESKTOP SIDEBAR ══ */}
        <div className="mp-desktop-sidebar" style={{ width: 280, flexShrink: 0, display: "flex", flexDirection: "column", overflow: "hidden", background: "var(--ts-surface)", borderRight: "1px solid var(--ts-border)" }}>
          <SidebarContent onSelectChapter={setActiveIndex} />
        </div>

        {/* ══ MAIN SCROLL AREA ══ */}
        <main style={{ flex: 1, overflowY: "auto", background: "var(--ts-bg)", display: "flex", flexDirection: "column" }}>

          {/* Mobile Top Bar */}
          <div className="mp-mobile-topbar">
            <button onClick={() => router.push(`/dashboard/subject/${subjectId}`)} style={{
              background: "none", border: "none", color: "var(--ts-text-muted)",
              display: "flex", alignItems: "center", gap: 6,
              fontSize: 13, fontWeight: 500, cursor: "pointer",
              fontFamily: "'Space Grotesk', sans-serif", padding: 0,
            }}>
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>

            {/* Progress pill */}
            <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ flex: 1, height: 4, background: "var(--ts-surface-hi)", borderRadius: 99, overflow: "hidden" }}>
                <div style={{
                  height: "100%", borderRadius: 99,
                  background: `linear-gradient(90deg, var(--ts-violet), var(--ts-cyan))`,
                  width: `${progressPct}%`, transition: "width 0.5s ease",
                }} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--ts-violet)", whiteSpace: "nowrap" }}>{progressPct}%</span>
            </div>

            {/* Chapters menu button */}
            <button onClick={() => setShowMobileDrawer(true)} style={{
              background: "var(--ts-surface-hi)", border: "1px solid var(--ts-border)",
              borderRadius: 8, padding: "6px 10px", cursor: "pointer",
              color: "var(--ts-text)", fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 6,
            }}>
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              {activeIndex + 1}/{chapters.length}
            </button>
          </div>

          {/* Chapter Content */}
          {chapters[activeIndex] && (
            <div className="mp-main-content" style={{ maxWidth: 800, margin: "0 auto", padding: "48px 40px 80px", width: "100%", boxSizing: "border-box" }}>

              {/* Chapter header */}
              <div style={{ marginBottom: 32, paddingBottom: 24, borderBottom: "1px solid var(--ts-border)" }}>
                <span style={{
                  display: "inline-block", fontSize: 10, fontWeight: 700,
                  letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ts-violet)",
                  background: "var(--ts-violet-soft)", border: "1px solid var(--ts-border-hi)",
                  padding: "4px 12px", borderRadius: 999, marginBottom: 12,
                  fontFamily: "'Space Grotesk', sans-serif",
                }}>
                  Chapter {activeIndex + 1}
                </span>
                <h1 className="mp-chapter-title" style={{
                  fontFamily: "'DM Serif Display', Georgia, serif",
                  fontSize: "clamp(1.4rem, 3vw, 2rem)",
                  fontWeight: 700, color: "var(--ts-text)",
                  lineHeight: 1.25, letterSpacing: "-0.02em", margin: 0,
                }}>
                  {chapters[activeIndex].title.replace(/^Chapter\s+\d+:\s*/i, "")}
                </h1>
              </div>

              {/* Content */}
              <MarkdownRenderer
                content={chapters[activeIndex].content}
                profile={{ visual: 40, audio: 20, text: 40 }}
                moduleId={String(moduleOrder)}
                subjectId={subjectId}
                quiz={quizLoading ? [] : quiz}
                onQuizComplete={handleChapterQuizComplete}
              />

              {/* Completed notice */}
              {completedChapterQuizzes.has(activeIndex) && (
                <div style={{
                  marginTop: 32, padding: "16px 20px", borderRadius: 14,
                  background: "var(--ts-green-soft)", border: "1px solid var(--ts-green-border)",
                  display: "flex", alignItems: "center", gap: 12,
                }}>
                  <span style={{ fontSize: 18, color: "var(--ts-green)" }}>✓</span>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "var(--ts-green)", margin: 0 }}>Quiz completed</p>
                    <p style={{ fontSize: 12, color: "var(--ts-text-muted)", marginTop: 2 }}>
                      You've passed this chapter's quiz. Continue to the next chapter.
                    </p>
                  </div>
                </div>
              )}

              {/* Quiz generating */}
              {quizLoading && (
                <div style={{
                  marginTop: 32, padding: "18px 20px", borderRadius: 14,
                  background: "var(--ts-amber-soft)", border: "1px solid var(--ts-amber-border)",
                  display: "flex", alignItems: "center", gap: 12,
                }}>
                  <div style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid var(--ts-amber)", borderTop: "2px solid transparent", animation: "mp-spin 0.8s linear infinite", flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: "var(--ts-amber)" }}>Generating chapter quiz…</span>
                </div>
              )}

              {/* Bottom navigation */}
              <div className="mp-nav-bottom" style={{
                marginTop: 56, paddingTop: 28, borderTop: "1px solid var(--ts-border)",
                display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12,
              }}>
                {activeIndex > 0 ? (
                  <button
                    onClick={() => setActiveIndex(activeIndex - 1)}
                    style={{
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "10px 16px", borderRadius: 10,
                      border: "1px solid var(--ts-border)", background: "transparent",
                      color: "var(--ts-text-muted)", fontSize: 13, fontWeight: 500,
                      cursor: "pointer", fontFamily: "'Space Grotesk', sans-serif",
                    }}
                  >
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                    Previous
                  </button>
                ) : <div />}

                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, flex: 1 }}>
                  {isLastChapter && moduleQuizScore !== null && (
                    <button onClick={() => setShowModuleQuiz(true)} style={{
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "10px 16px", borderRadius: 10,
                      border: "1px solid var(--ts-green-border)", background: "var(--ts-green-soft)",
                      color: "var(--ts-green)", fontSize: 13, fontWeight: 600, cursor: "pointer",
                      fontFamily: "'Space Grotesk', sans-serif",
                    }}>
                      ✓ Module Quiz — {moduleQuizScore}/{moduleQuizTotal}
                    </button>
                  )}

                  {isLastChapter && allChapterQuizzesDone && !moduleQuizAlreadyDone && (
                    <button onClick={handleStartModuleQuiz} className="mp-next-btn" style={{
                      background: `linear-gradient(135deg, var(--ts-violet), #818cf8)`,
                      color: "#0d0918", boxShadow: "0 0 20px var(--ts-violet-glow)",
                    }}>
                      Take Module Quiz ✦
                    </button>
                  )}

                  {!isLastChapter && (
                    <>
                      {!canGoNext && quiz.length > 0 && (
                        <span style={{ fontSize: 11, fontWeight: 600, color: "var(--ts-amber)" }}>
                          Complete the quiz to continue
                        </span>
                      )}
                      <button
                        className="mp-next-btn"
                        onClick={() => canGoNext && setActiveIndex(activeIndex + 1)}
                        disabled={!canGoNext && quiz.length > 0}
                        style={{
                          background: (canGoNext || quiz.length === 0)
                            ? `linear-gradient(135deg, var(--ts-violet), #818cf8)`
                            : "var(--ts-surface-hi)",
                          color: (canGoNext || quiz.length === 0) ? "#0d0918" : "var(--ts-text-dim)",
                          boxShadow: (canGoNext || quiz.length === 0) ? "0 0 16px var(--ts-violet-glow)" : "none",
                        }}
                      >
                        Next Chapter
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </>
                  )}
                </div>
              </div>

            </div>
          )}
        </main>

        {/* ══ MOBILE DRAWER ══ */}
        {showMobileDrawer && (
          <>
            <div className="mp-drawer-overlay" onClick={() => setShowMobileDrawer(false)} />
            <div className="mp-drawer">
              <div className="mp-drawer-handle" />
              <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
                <SidebarContent onSelectChapter={selectChapter} />
              </div>
            </div>
          </>
        )}

        <FloatingChatbot subjectId={Number(subjectId)} />
      </div>
    </>
  );
}