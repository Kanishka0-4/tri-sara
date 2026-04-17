"use client";

import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
export default function StartContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const subjectId = searchParams.get("subject_id");

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;600;800&family=Instrument+Sans:wght@300;400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes float {
          0%, 100% { transform: translateY(0px) scale(1); }
          50%       { transform: translateY(-20px) scale(1.04); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .qs-root {
          min-height: 100vh;
          background: var(--ts-bg);
          color: var(--ts-text);
          font-family: 'Space Grotesk', sans-serif;;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: 2rem 1.5rem;
          position: relative; overflow: hidden;
        }

        .qs-blob {
          position: absolute; border-radius: 50%;
          filter: blur(80px); pointer-events: none;
        }
        .qs-blob-1 { width: 500px; height: 500px; background: var(--ts-violet-soft); top: -120px; right: -100px; animation: float 9s ease-in-out infinite; }
        .qs-blob-2 { width: 400px; height: 400px; background: var(--ts-cyan-glow); bottom: -100px; left: -80px; animation: float 7s ease-in-out infinite; animation-delay: -4s; }
        .qs-blob-3 { width: 200px; height: 200px; background: var(--ts-violet-bubble); top: 40%; left: 55%; animation: float 11s ease-in-out infinite; animation-delay: -8s; }

        .qs-brand {
          position: absolute; top: 1.75rem; left: 2rem;
          font-family: 'Space Grotesk', sans-serif;
          font-size: 1rem; font-weight: 800;
          color: var(--ts-text); letter-spacing: -0.02em;
          display: flex; align-items: center; gap: 0.4rem;
          z-index: 1;
        }
        

        .qs-card {
          position: relative; z-index: 1;
          width: 100%; max-width: 520px;
          background: var(--ts-surface);
          border: 1px solid var(--ts-border);
          backdrop-filter: blur(10px);
          border-radius: 24px;
          padding: 3rem 2.75rem;
          box-shadow: 0 4px 6px rgba(0,0,0,0.03), 0 24px 64px rgba(249,115,22,0.08);
          animation: fadeUp 0.5s ease both;
          text-align: center;
        }

        /* icon circle */
        .qs-icon {
          width: 64px; height: 64px; border-radius: 50%;
          background: linear-gradient(135deg, #fff7ed, #ffedd5);
          border: 1.5px solid #fed7aa;
          display: flex; align-items: center; justify-content: center;
          font-size: 1.6rem; margin: 0 auto 1.5rem;
          box-shadow: 0 4px 16px rgba(249,115,22,0.15);
        }

        .qs-badge {
          display: inline-flex; align-items: center; gap: 0.35rem;
          background: #fff7ed; border: 1px solid #fed7aa;
          border-radius: 999px; padding: 0.28rem 0.75rem;
          font-size: 0.68rem; font-weight: 700;
          color: var(--ts-violet); letter-spacing: 0.07em;
          text-transform: uppercase; margin-bottom: 1.25rem;
        }
        .qs-badge-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--ts-violet); }

        .qs-title {
          font-family: 'Space Grotesk', sans-serif;;
          font-size: 2.1rem; font-weight: 800;
          color: var(--ts-text); letter-spacing: -0.03em;
          line-height: 1.2; margin-bottom: 1rem;
        }
        .qs-title span { color: var(--ts-violet); }

        .qs-sub {
          font-size: 0.92rem; color: var(--ts-text-muted);
          line-height: 1.7; margin-bottom: 2rem;
          max-width: 360px; margin-left: auto; margin-right: auto;
        }

        /* steps row */
        .qs-steps {
          display: flex; justify-content: center;
          gap: 0; margin-bottom: 2.25rem;
        }
        .qs-step {
          display: flex; flex-direction: column; align-items: center;
          gap: 0.4rem; flex: 1; max-width: 100px;
          position: relative;
        }
        .qs-step:not(:last-child)::after {
          content: '';
          position: absolute; top: 16px; left: 60%;
          width: 80%; height: 1.5px;
          background: linear-gradient(90deg, #fed7aa, #fde68a);
        }
        .qs-step-dot {
          width: 32px; height: 32px; border-radius: 50%;
          background: linear-gradient(135deg, var(--ts-violet), var(--ts-violet));
          color: #fff; display: flex; align-items: center; justify-content: center;
          font-size: 0.75rem; font-weight: 700;
          box-shadow: 0 2px 8px rgba(249,115,22,0.3);
          position: relative; z-index: 1;
        }
        .qs-step-label {
          font-size: 0.68rem; color: var(--ts-text-muted);
          font-weight: 500; text-align: center; line-height: 1.3;
        }

        .qs-divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, #f1e8dc, transparent);
          margin-bottom: 2rem;
        }

        .qs-btn {
          width: 100%; padding: 0.95rem;
          border: none; border-radius: 14px;
          background: linear-gradient(135deg, var(--ts-violet), var(--ts-violet));
          color: #fff;
          font-family: 'Space Grotesk', sans-serif;
          font-size: 1rem; font-weight: 600;
          cursor: pointer; position: relative; overflow: hidden;
          transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
          box-shadow: 0 4px 20px rgba(249,115,22,0.35);
          letter-spacing: 0.01em;
        }
        .qs-btn:hover {
          opacity: 0.93; transform: translateY(-1px);
          box-shadow: 0 6px 28px rgba(249,115,22,0.45);
        }
        .qs-btn:active { transform: translateY(0); }
        .qs-btn::after {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.15) 50%, transparent 60%);
          transform: translateX(-100%); transition: transform 0.5s ease;
        }
        .qs-btn:hover::after { transform: translateX(100%); }

        .qs-note {
          display: flex; align-items: center; justify-content: center;
          gap: 0.4rem; margin-top: 1.1rem;
          font-size: 0.78rem; color: #cbd5e1;
        }
      `}</style>
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

      <div className="qs-root">
        <div className="qs-blob qs-blob-1" />
        <div className="qs-blob qs-blob-2" />
        <div className="qs-blob qs-blob-3" />

        <div className="qs-brand">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img
            src="/logo.png"
            style={{
              width: 40,
              height: 40,
              filter: "drop-shadow(0 0 8px var(--ts-violet-glow))",
            }}
          />
          <span style={{ fontWeight: 700 }}>Tri-Sara</span>
        </div>
      </div>

        <div className="qs-card">

          <div className="qs-badge">
            <div className="qs-badge-dot" />
            Step 2 of 2
          </div>

          <h1 className="qs-title">
            You're almost <span>there!</span>
          </h1>
          <p className="qs-sub">
           You will be provided  with 3 different types of content to study in the span of 30 seconds each. After each section you'll be asked 3 questions to test your understanding. Don't worry, it's all about finding your learning style.
          </p>

          {/* 3-step indicator */}
          <div className="qs-steps">
            {[
              { n: 1, label: "TEXT" },
              { n: 2, label: "AUDIO" },
              { n: 3, label: "VISUAL" },
            ].map((s) => (
              <div key={s.n} className="qs-step">
                <div className="qs-step-dot">{s.n}</div>
                <span className="qs-step-label">{s.label}</span>
              </div>
            ))}
          </div>

          <div className="qs-divider" />

          <button className="qs-btn" onClick={() => router.push(`/quiz/take?subject_id=${subjectId}`)}>
            Start the Quiz →
          </button>

          <div className="qs-note">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M6 1a5 5 0 100 10A5 5 0 006 1zm0 4v3M6 4v.5"
                stroke="#cbd5e1"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
            </svg>
            Only takes a few minutes
          </div>
        </div>
      </div>
    </>
  );
}