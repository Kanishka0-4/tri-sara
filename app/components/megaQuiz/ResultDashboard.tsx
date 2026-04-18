import React from 'react';

const ResultDashboard = ({ result }: { result: any }) => {
  if (!result) return (
    <>
      <style>{`@keyframes rd-spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', minHeight: 300,
        gap: 16, fontFamily: "'Space Grotesk', sans-serif",
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          border: '2px solid var(--ts-border)',
          borderTop: '2px solid var(--ts-violet)',
          animation: 'rd-spin 0.8s linear infinite',
        }} />
        <p style={{ color: 'var(--ts-text-muted)', fontSize: 14 }}>Loading results…</p>
      </div>
    </>
  );

  // Insights
  const insights: string[] = [];
  if (result.confidence_calibration) {
    const conf = result.confidence_calibration;
    if (conf["Very High"]?.accuracy < 0.7) insights.push("High confidence but low accuracy — watch out for overconfidence.");
    if (conf["Low"]?.accuracy > 0.7) insights.push("Low confidence but high accuracy — you underestimate yourself!");
  }
  if (result.topic_performance) {
    const topics = Object.entries(result.topic_performance) as [string, { accuracy: number }][];
    topics.sort((a, b) => (b[1]?.accuracy ?? 0) - (a[1]?.accuracy ?? 0));
    if (topics.length > 0) {
      insights.push(`Strongest topic: ${topics[0][0]}`);
      if (topics.length > 1) insights.push(`Needs work: ${topics[topics.length - 1][0]}`);
    }
  }

  const accuracy = result.accuracy ?? 0;
  const pct = Math.round(accuracy * 100);
  const passed = pct >= 60;
  const circumference = 2 * Math.PI * 44;
  const dash = (accuracy * circumference).toFixed(1);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap');
        @keyframes rd-fadein {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes rd-spin { to { transform: rotate(360deg); } }
        @keyframes rd-draw {
          from { stroke-dasharray: 0 276.5; }
        }
        .rd-root {
          max-width: 760px;
          margin: 0 auto;
          padding: 48px 24px 80px;
          font-family: 'Space Grotesk', sans-serif;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .rd-card {
          border-radius: 18px;
          padding: 24px;
          background: var(--ts-surface);
          border: 1px solid var(--ts-border-hi);
          box-shadow: 0 0 0 1px var(--ts-border-hi), 0 8px 32px rgba(0,0,0,0.4), inset 0 0 48px var(--ts-violet-soft);
          animation: rd-fadein 0.45s ease both;
          position: relative;
          overflow: hidden;
        }
        .rd-card::before {
          content: '';
          position: absolute;
          top: 0; left: 15%; width: 70%; height: 1px;
          background: linear-gradient(90deg, transparent, var(--ts-violet), var(--ts-cyan), transparent);
          opacity: 0.5;
        }
        .rd-label {
          font-size: 10px; font-weight: 700; letter-spacing: 0.12em;
          text-transform: uppercase; color: var(--ts-text-dim);
          margin-bottom: 10px; display: block;
        }
        .rd-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        @media (max-width: 540px) { .rd-grid { grid-template-columns: 1fr; } }
        .rd-stat-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid var(--ts-border);
          font-size: 13px;
          color: var(--ts-text-muted);
        }
        .rd-stat-row:last-child { border-bottom: none; }
        .rd-stat-val {
          font-weight: 700;
          color: var(--ts-violet);
        }
        .rd-insight {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 10px 14px;
          border-radius: 10px;
          background: var(--ts-violet-soft);
          border: 1px solid var(--ts-border-hi);
          font-size: 13px;
          color: var(--ts-text-muted);
          line-height: 1.5;
        }
        .rd-insight::before {
          content: '✦';
          color: var(--ts-violet);
          font-size: 10px;
          flex-shrink: 0;
          margin-top: 2px;
        }
      `}</style>

      <div className="rd-root">

        {/* Header */}
        <div style={{ animation: 'rd-fadein 0.3s ease both' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'var(--ts-violet-soft)', border: '1px solid var(--ts-border-hi)',
            borderRadius: 999, padding: '5px 14px', marginBottom: 14,
          }}>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ts-violet)' }}>
              ✦ Mega Quiz Complete
            </span>
          </div>
          <h1 style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 700, color: 'var(--ts-text)', margin: 0 }}>
            Your Results
          </h1>
        </div>

        {/* Score hero */}
        <div className="rd-card" style={{ animationDelay: '60ms', display: 'flex', alignItems: 'center', gap: 32, flexWrap: 'wrap' }}>
          {/* Ring */}
          <div style={{ position: 'relative', width: 110, height: 110, flexShrink: 0 }}>
            <svg width="110" height="110" viewBox="0 0 110 110" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="55" cy="55" r="44" fill="none" stroke="var(--ts-border)" strokeWidth="6" />
              <circle cx="55" cy="55" r="44" fill="none"
                stroke={passed ? 'var(--ts-violet)' : '#ef4444'}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${dash} ${circumference}`}
                style={{ animation: 'rd-draw 1s ease both', animationDelay: '200ms' }}
              />
            </svg>
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontSize: 22, fontWeight: 700, color: passed ? 'var(--ts-violet)' : '#ef4444' }}>{pct}%</span>
            </div>
          </div>

          <div style={{ flex: 1, minWidth: 180 }}>
            <p style={{ fontSize: 13, color: 'var(--ts-text-muted)', marginBottom: 6 }}>Overall Score</p>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '6px 16px', borderRadius: 999,
              background: passed ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
              border: `1px solid ${passed ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
              color: passed ? 'var(--ts-green)' : '#ef4444',
              fontSize: 13, fontWeight: 700, marginBottom: 12,
            }}>
              {passed ? '✅ Passed' : '❌ Not Passed'}
            </div>
            {result.avg_time != null && (
              <p style={{ fontSize: 13, color: 'var(--ts-text-muted)' }}>
                Avg time per question: <strong style={{ color: 'var(--ts-cyan)' }}>{result.avg_time.toFixed(1)}s</strong>
              </p>
            )}
            {result.engagement_score != null && (
              <p style={{ fontSize: 13, color: 'var(--ts-text-muted)', marginTop: 4 }}>
                Engagement score: <strong style={{ color: 'var(--ts-violet)' }}>{(result.engagement_score * 100).toFixed(1)}%</strong>
              </p>
            )}
          </div>
        </div>

        {/* Topic + Difficulty grid */}
        <div className="rd-grid">
          {result.topic_performance && (
            <div className="rd-card" style={{ animationDelay: '120ms' }}>
              <span className="rd-label">Topic Performance</span>
              {Object.entries(result.topic_performance).map(([topic, perf]: any) => (
                <div key={topic} className="rd-stat-row">
                  <span>{topic}</span>
                  <span className="rd-stat-val">{(perf.accuracy * 100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          )}

          {result.difficulty_performance && (
            <div className="rd-card" style={{ animationDelay: '160ms' }}>
              <span className="rd-label">Difficulty Breakdown</span>
              {Object.entries(result.difficulty_performance).map(([level, perf]: any) => (
                <div key={level} className="rd-stat-row">
                  <span>{level}</span>
                  <span className="rd-stat-val">{(perf.accuracy * 100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          )}

          {result.confidence_calibration && (
            <div className="rd-card" style={{ animationDelay: '200ms', gridColumn: '1 / -1' }}>
              <span className="rd-label">Confidence vs Accuracy</span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
                {Object.entries(result.confidence_calibration).map(([level, perf]: any) => (
                  <div key={level} style={{
                    padding: '12px 16px', borderRadius: 12,
                    background: 'var(--ts-surface-hi)', border: '1px solid var(--ts-border)',
                  }}>
                    <p style={{ fontSize: 11, color: 'var(--ts-text-dim)', marginBottom: 4, fontWeight: 600 }}>{level}</p>
                    <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--ts-violet)', margin: 0 }}>
                      {(perf.accuracy * 100).toFixed(1)}%
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Insights */}
        {insights.length > 0 && (
          <div className="rd-card" style={{ animationDelay: '240ms' }}>
            <span className="rd-label">Insights</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {insights.map((insight, i) => (
                <div key={i} className="rd-insight">{insight}</div>
              ))}
            </div>
          </div>
        )}

        {/* Learning gain */}
        {result.learning_gain != null && (
          <div className="rd-card" style={{ animationDelay: '280ms', textAlign: 'center' }}>
            <span className="rd-label" style={{ display: 'block', textAlign: 'center' }}>Learning Gain</span>
            <p style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 700, color: 'var(--ts-cyan)', margin: 0 }}>
              +{(result.learning_gain * 100).toFixed(1)}%
            </p>
          </div>
        )}

      </div>
    </>
  );
};

export default ResultDashboard;