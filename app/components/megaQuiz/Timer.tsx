import React from 'react';

const Timer = ({ time }: { time: number }) => {
  const min = Math.floor(time / 60);
  const sec = time % 60;
  const isWarning = time > 60 && time % 60 < 10;

  return (
    <>
      <style>{`
        @keyframes timer-pulse {
          0%, 100% { box-shadow: 0 0 0 0 var(--ts-violet-glow); }
          50% { box-shadow: 0 0 16px 4px var(--ts-violet-glow); }
        }
        @keyframes timer-warn {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.3); }
          50% { box-shadow: 0 0 16px 4px rgba(239,68,68,0.3); }
        }
        .timer-wrap {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 8px 18px;
          border-radius: 999px;
          border: 1px solid var(--ts-border-hi);
          background: var(--ts-surface-hi);
          font-family: 'JetBrains Mono', 'Fira Code', monospace;
          animation: timer-pulse 2s ease-in-out infinite;
          transition: all 0.3s;
        }
        .timer-wrap.warn {
          border-color: rgba(239,68,68,0.6);
          animation: timer-warn 1s ease-in-out infinite;
        }
        .timer-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: var(--ts-violet);
          box-shadow: 0 0 6px var(--ts-violet);
          animation: timer-pulse 1s ease-in-out infinite;
        }
        .timer-wrap.warn .timer-dot {
          background: #ef4444;
          box-shadow: 0 0 6px #ef4444;
        }
      `}</style>
      <div className={`timer-wrap${isWarning ? ' warn' : ''}`}>
        <span className="timer-dot" />
        <span style={{
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: '0.08em',
          color: isWarning ? '#ef4444' : 'var(--ts-violet)',
        }}>
          {min.toString().padStart(2, '0')}:{sec.toString().padStart(2, '0')}
        </span>
      </div>
    </>
  );
};

export default Timer;