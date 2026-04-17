"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function WelcomeQuizPage() {
  const router = useRouter();
  const [subjects, setSubjects] = useState([]);
  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/get-subjects");
        const data = await res.json();
        setSubjects(data.subjects || []);
      } catch (e) {
        setError("Failed to load subjects");
      }
    }
    load();
  }, []);

  /* ✅ FORCE THEME LOAD */
  useEffect(() => {
    const saved = localStorage.getItem("trisara-theme") || "dark";
    document.documentElement.setAttribute("data-theme", saved);
  }, []);

  async function handleContinue() {
    if (!selected) return alert("Please choose a subject");
    const subjectObj = subjects.find((s) => s.id === selected);
    if (!subjectObj) return alert("Invalid subject");
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/subtopics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject_id: subjectObj.id, subject_name: subjectObj.name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      router.push(`/quiz/start?subject_id=${subjectObj.id}`);
    } catch (err) {
      console.error(err);
      setError(err.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;600;800&family=Instrument+Sans:wght@300;400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes float {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-20px) scale(1.04); }
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .wq-root {
          min-height: 100vh;
          background: var(--ts-bg);
          color: var(--ts-text);
          font-family: 'Space Grotesk', sans-serif;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem 1.5rem;
          position: relative;
          overflow: hidden;
        }

        .wq-blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          pointer-events: none;
        }

        .wq-blob-1 {
          width: 500px; height: 500px;
          background: var(--ts-violet-soft);
          top: -120px; right: -100px;
          animation: float 9s ease-in-out infinite;
        }

        .wq-blob-2 {
          width: 400px; height: 400px;
          background: var(--ts-cyan-glow);
          bottom: -100px; left: -80px;
          animation: float 7s ease-in-out infinite;
          animation-delay: -4s;
        }

        .wq-blob-3 {
          width: 250px; height: 250px;
          background: var(--ts-violet-bubble);
          top: 50%; left: 60%;
          animation: float 11s ease-in-out infinite;
          animation-delay: -8s;
        }

        .wq-brand {
          position: absolute;
          top: 1.75rem; left: 2rem;
          font-family: 'Space Grotesk', sans-serif;
          font-size: 1rem; font-weight: 800;
          color: var(--ts-text);
          display: flex; align-items: center; gap: 0.4rem;
        }

        .wq-brand-dot {
          width: 8px; height: 8px;
          border-radius: 50%;
          background: var(--ts-violet);
        }

        .wq-card {
          width: 100%;
          max-width: 480px;
          background: var(--ts-surface);
          border: 1px solid var(--ts-border);
          border-radius: 20px;
          padding: 2.75rem 2.5rem;
          backdrop-filter: blur(10px);
          animation: fadeUp 0.4s ease both;
        }

        .wq-badge {
          background: var(--ts-violet-soft);
          border: 1px solid var(--ts-border);
          border-radius: 999px;
          padding: 0.3rem 0.8rem;
          font-size: 0.68rem;
          font-weight: 700;
          color: var(--ts-violet);
          margin-bottom: 1.25rem;
        }

        .wq-title {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 2rem;
          font-weight: 800;
          color: var(--ts-text);
          margin-bottom: 0.6rem;
        }

        .wq-title span {
          color: var(--ts-violet);
        }

        .wq-sub {
          font-size: 0.88rem;
          color: var(--ts-text-muted);
          margin-bottom: 2rem;
        }

        .wq-divider {
          height: 1px;
          background: var(--ts-border);
          margin-bottom: 1.75rem;
        }

        .wq-label {
          font-size: 0.72rem;
          color: var(--ts-text-muted);
          margin-bottom: 0.5rem;
        }

        .wq-select {
        width: 100%;
        background: var(--ts-surface);
        border: 1px solid var(--ts-border);
        border-radius: 12px;
        padding: 0.82rem 1rem;
        margin-bottom: 1.25rem;
        display: block;
        color: var(--ts-text);
        cursor: pointer;
      }
        button, select {
        cursor: pointer;
      }
      /* 🔥 THIS FIXES DROPDOWN */
      .wq-select option {
        background: #1a1030;   /* dark background */
        color: #ffffff;
      }

        .wq-select:focus {
          border-color: var(--ts-violet);
          outline: none;
        }

        .wq-btn {
          width: 100%;
          padding: 0.85rem;
          border-radius: 12px;
          background: var(--ts-violet);
          color: #fff;
          cursor: pointer;
        }

        .wq-error {
          color: var(--ts-rose);
          margin-bottom: 1rem;
        }

        .wq-note {
          margin-top: 1.25rem;
          font-size: 0.78rem;
          color: var(--ts-text-dim);
          text-align: center;
        }
      `}</style>

      {/* ✅ TOGGLE BUTTON */}
      <button
  onClick={() => {
    const current = document.documentElement.getAttribute("data-theme");
    const next = current === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("trisara-theme", next);
  }}
  style={{
    position: "fixed",
    top: 20,
    right: 20,
    width: 34,
    height: 34,
    borderRadius: 10,
    border: "1px solid var(--ts-border)",
    background: "var(--ts-surface)",
    color: "var(--ts-text)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 14,
    zIndex: 9999,
  }}
>
  {typeof window !== "undefined" &&
   document.documentElement.getAttribute("data-theme") === "dark"
    ? "☀"
    : "🌙"}
      </button>

      <div className="wq-root">
        <div className="wq-blob wq-blob-1" />
        <div className="wq-blob wq-blob-2" />
        <div className="wq-blob wq-blob-3" />

        <div className="wq-brand">
  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
    
    <img
      src="/logo.png"
      alt="Tri-Sara"
      style={{
        width: 40,
        height: 40,
        objectFit: "contain",
        filter: "drop-shadow(0 0 8px var(--ts-violet-glow))",
      }}
    />

    <span
      style={{
        fontFamily: "'Bricolage Grotesque', sans-serif",
        fontSize: "1rem",
        fontWeight: 700,
        color: "var(--ts-text)",
        letterSpacing: "0.3px",
      }}
    >
      Tri-Sara
    </span>

  </div>
</div>

        <div className="wq-card">

          <div className="wq-badge">Step 1 of 2</div>

          <h1 className="wq-title">
            Want to know your<br /> <span>learning style?</span>
          </h1>

          <p className="wq-sub">
            Pick a subject and we'll help you find your learning style.
          </p>

          <div className="wq-divider" />

          {error && <div className="wq-error">{error}</div>}

          <select
            className="wq-select"
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
          >
            <option value="">Choose a subject…</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          <button className="wq-btn" onClick={handleContinue} disabled={loading}>
            {loading ? "Preparing…" : "Continue →"}
          </button>

          <div className="wq-note">
            Takes about 2 minutes.
          </div>

        </div>
      </div>
    </>
  );
}