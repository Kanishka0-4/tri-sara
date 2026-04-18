import React from 'react';

const levels = [
  { label: "Very High", emoji: "🔥", color: "var(--ts-violet)" },
  { label: "High",      emoji: "💪", color: "#818cf8" },
  { label: "Medium",    emoji: "🤔", color: "var(--ts-cyan)" },
  { label: "Low",       emoji: "😅", color: "#f59e0b" },
  { label: "Guess",     emoji: "🎲", color: "#ef4444" },
];

const ConfidenceSelector = ({ value, onChange }: { value: string; onChange: (level: string) => void }) => {
  return (
    <>
      <style>{`
        @keyframes conf-pop {
          0% { transform: scale(0.92); }
          60% { transform: scale(1.06); }
          100% { transform: scale(1); }
        }
        .conf-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 8px 14px;
          border-radius: 12px;
          border: 1px solid var(--ts-border);
          background: var(--ts-surface-hi);
          color: var(--ts-text-muted);
          font-family: 'Space Grotesk', sans-serif;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.18s;
          white-space: nowrap;
        }
        .conf-btn:hover {
          border-color: var(--ts-border-hi);
          background: var(--ts-surface);
          color: var(--ts-text);
        }
        .conf-btn.active {
          animation: conf-pop 0.25s ease;
          border-color: var(--active-color, var(--ts-violet));
          background: var(--ts-violet-soft);
          color: var(--active-color, var(--ts-violet));
          box-shadow: 0 0 12px var(--ts-violet-glow);
        }
        .conf-emoji {
          font-size: 16px;
          line-height: 1;
        }
      `}</style>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span style={{
          fontSize: 10, fontWeight: 700, letterSpacing: '0.12em',
          textTransform: 'uppercase', color: 'var(--ts-text-dim)',
          fontFamily: "'Space Grotesk', sans-serif",
        }}>
          Confidence
        </span>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {levels.map(l => (
            <button
              key={l.label}
              type="button"
              className={`conf-btn${value === l.label ? ' active' : ''}`}
              style={{ '--active-color': l.color } as React.CSSProperties}
              onClick={() => onChange(l.label)}
            >
              <span className="conf-emoji">{l.emoji}</span>
              {l.label}
            </button>
          ))}
        </div>
      </div>
    </>
  );
};

export default ConfidenceSelector;