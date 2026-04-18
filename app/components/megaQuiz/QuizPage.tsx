"use client";
import React, { useEffect, useState } from 'react';
import QuestionCard from './QuestionCard';
import Timer from './Timer';
import ConfidenceSelector from './ConfidenceSelector';
import ResultDashboard from './ResultDashboard';

type QuizQuestion = {
  id: number;
  question: string;
  options: string[];
  correctAnswer: string;
  difficulty: string;
  topic: string;
  questionType: string;
};

type QuizResponse = {
  question_id: number;
  selected_answer: string | null;
  correct_answer: string;
  is_correct: boolean;
  time_taken: number;
  confidence_level: string;
  difficulty: string;
  topic: string;
  question_type: string;
  timestamp: string;
};

interface QuizPageProps {
  subjectId?: string | number | null;
}

const stages = ['Rookie', 'Challenger', 'Pro', 'Master', 'Legend'];
const stageColors = [
  'var(--ts-text-muted)',
  '#60a5fa',
  'var(--ts-cyan)',
  'var(--ts-violet)',
  '#f59e0b',
];

const QuizPage = ({ subjectId }: QuizPageProps) => {
  const [quiz,       setQuiz      ] = useState<QuizQuestion[]>([]);
  const [current,   setCurrent   ] = useState(0);
  const [responses, setResponses ] = useState<QuizResponse[]>([]);
  const [selected,  setSelected  ] = useState<string | null>(null);
  const [confidence,setConfidence] = useState('Medium');
  const [timer,     setTimer     ] = useState(0);
  const [showResult,setShowResult] = useState(false);
  const [result,    setResult    ] = useState<any>(null);
  const [loading,   setLoading   ] = useState(false);
  const [fetching,  setFetching  ] = useState(true);

  useEffect(() => {
    const sid = subjectId ?? null;
    if (!sid) return;
    setFetching(true);
    fetch('/api/mega-quiz/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subjectId: sid }),
    })
      .then(async res => { try { return await res.json(); } catch { return { quiz: [] }; } })
      .then(data => setQuiz(data.quiz || []))
      .catch(() => setQuiz([]))
      .finally(() => setFetching(false));
  }, [subjectId === undefined ? null : subjectId]);

  useEffect(() => {
    if (showResult || !quiz.length) return;
    const interval = setInterval(() => setTimer(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, [current, showResult, quiz.length]);

  const handleNext = () => {
    if (!quiz[current]) return;
    setResponses(prev => [...prev, {
      question_id:     quiz[current].id,
      selected_answer: selected,
      correct_answer:  quiz[current].correctAnswer,
      is_correct:      selected === quiz[current].correctAnswer,
      time_taken:      timer,
      confidence_level: confidence,
      difficulty:      quiz[current].difficulty,
      topic:           quiz[current].topic,
      question_type:   quiz[current].questionType,
      timestamp:       new Date().toISOString(),
    }]);
    setSelected(null);
    setConfidence('Medium');
    setTimer(0);
    setCurrent(c => c + 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/mega-quiz/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subjectId, responses }),
      });
      const data = await res.json();
      setResult(data.result);
      setShowResult(true);
    } catch (err) {
      console.error('Submit failed', err);
    }
    setLoading(false);
  };

  /* ── Loading state ── */
  if (fetching) return (
    <>
      <style>{`@keyframes qp-spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', minHeight: 320,
        gap: 16, fontFamily: "'Space Grotesk', sans-serif",
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          border: '2px solid var(--ts-border)',
          borderTop: '2px solid var(--ts-violet)',
          animation: 'qp-spin 0.8s linear infinite',
        }} />
        <p style={{ color: 'var(--ts-text-muted)', fontSize: 14 }}>Generating your quiz…</p>
      </div>
    </>
  );

  /* ── Result ── */
  if (showResult) return <ResultDashboard result={result} />;

  /* ── Finished — show submit ── */
  const q = quiz[current];
  if (!q) return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap');
        @keyframes qp-fadein { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
      <div style={{
        maxWidth: 520, margin: '48px auto', padding: '0 24px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24,
        fontFamily: "'Space Grotesk', sans-serif",
        animation: 'qp-fadein 0.4s ease',
      }}>
        <div style={{
          width: '100%', borderRadius: 20, padding: '40px 36px',
          background: 'var(--ts-surface)', border: '1px solid var(--ts-border-hi)',
          boxShadow: '0 0 0 1px var(--ts-border-hi), 0 12px 48px rgba(0,0,0,0.5), inset 0 0 60px var(--ts-violet-soft)',
          textAlign: 'center', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: 0, left: '15%', width: '70%', height: 1,
            background: 'linear-gradient(90deg, transparent, var(--ts-violet), var(--ts-cyan), transparent)',
            opacity: 0.6,
          }} />
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--ts-text)', marginBottom: 8 }}>
            All Done!
          </h2>
          <p style={{ color: 'var(--ts-text-muted)', fontSize: 14, marginBottom: 28 }}>
            You've answered all {quiz.length} questions. Ready to see your results?
          </p>
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              padding: '12px 32px', borderRadius: 12,
              background: loading ? 'var(--ts-surface-hi)' : 'linear-gradient(135deg, var(--ts-violet), #818cf8)',
              color: loading ? 'var(--ts-text-muted)' : '#fff',
              border: 'none', fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: loading ? 'none' : '0 0 20px var(--ts-violet-glow)',
              transition: 'all 0.18s',
            }}
          >
            {loading ? 'Submitting…' : '🚀 View Results'}
          </button>
        </div>
      </div>
    </>
  );

  /* ── Quiz in progress ── */
  const progress  = ((current) / quiz.length) * 100;
  const stageIdx  = Math.min(Math.floor((current / quiz.length) * stages.length), stages.length - 1);
  const stage     = stages[stageIdx];
  const stageColor = stageColors[stageIdx];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap');
        @keyframes qp-fadein { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        @keyframes qp-spin   { to { transform: rotate(360deg); } }
        @keyframes qp-shimmer {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
        .qp-root {
          max-width: 680px;
          margin: 0 auto;
          padding: 40px 24px 80px;
          font-family: 'Space Grotesk', sans-serif;
          display: flex;
          flex-direction: column;
          gap: 24px;
          animation: qp-fadein 0.35s ease both;
        }
        .qp-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
        }
        .qp-stage-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 14px;
          border-radius: 999px;
          border: 1px solid var(--ts-border-hi);
          background: var(--ts-surface-hi);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .qp-progress-track {
          position: relative;
          height: 5px;
          border-radius: 99px;
          background: var(--ts-surface-hi);
          overflow: hidden;
        }
        .qp-progress-fill {
          height: 100%;
          border-radius: 99px;
          background: linear-gradient(90deg, var(--ts-violet), var(--ts-cyan));
          box-shadow: 0 0 10px var(--ts-violet-glow);
          transition: width 0.5s ease;
          position: relative;
          overflow: hidden;
        }
        .qp-progress-fill::after {
          content: '';
          position: absolute;
          top: 0; left: 0; bottom: 0;
          width: 40%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
          animation: qp-shimmer 2s ease infinite;
        }
        .qp-counter {
          font-size: 12px;
          font-weight: 600;
          color: var(--ts-text-dim);
          text-align: right;
        }
        .qp-next-btn {
          padding: 13px 32px;
          border-radius: 12px;
          border: none;
          font-family: 'Space Grotesk', sans-serif;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.18s;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .qp-next-btn:disabled {
          background: var(--ts-surface-hi);
          color: var(--ts-text-dim);
          cursor: not-allowed;
          box-shadow: none;
        }
        .qp-next-btn:not(:disabled) {
          background: linear-gradient(135deg, var(--ts-violet), #818cf8);
          color: #fff;
          box-shadow: 0 0 18px var(--ts-violet-glow);
        }
        .qp-next-btn:not(:disabled):hover {
          opacity: 0.88;
          transform: translateY(-1px);
        }
        .qp-bottom {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        @media (min-width: 540px) {
          .qp-bottom {
            flex-direction: row;
            align-items: flex-end;
            justify-content: space-between;
          }
        }
      `}</style>

      <div className="qp-root">

        {/* Top bar */}
        <div className="qp-topbar">
          <div className="qp-stage-badge" style={{ color: stageColor, borderColor: stageColor + '55' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: stageColor, boxShadow: `0 0 6px ${stageColor}`, flexShrink: 0 }} />
            {stage}
          </div>
          <Timer time={timer} />
        </div>

        {/* Progress */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div className="qp-progress-track">
            <div className="qp-progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <div className="qp-counter">
            Question {current + 1} of {quiz.length}
          </div>
        </div>

        {/* Topic chip */}
        {q.topic && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '4px 12px', borderRadius: 999,
            background: 'var(--ts-violet-soft)', border: '1px solid var(--ts-border-hi)',
            fontSize: 11, fontWeight: 600, color: 'var(--ts-violet)',
            letterSpacing: '0.06em', textTransform: 'uppercase',
            alignSelf: 'flex-start',
          }}>
            {q.topic}
          </div>
        )}

        {/* Question */}
        <QuestionCard question={q} selected={selected} onSelect={setSelected} />

        {/* Bottom controls */}
        <div className="qp-bottom">
          <ConfidenceSelector value={confidence} onChange={setConfidence} />
          <button
            className="qp-next-btn"
            onClick={handleNext}
            disabled={!selected}
          >
            {current + 1 === quiz.length ? 'Finish ✦' : 'Next →'}
          </button>
        </div>

      </div>
    </>
  );
};

export default QuizPage;