interface Props {
  question: any;
  selected: string | null;
  onSelect: (option: string) => void;
}

const optionLabels = ['A', 'B', 'C', 'D'];

const QuestionCard = ({ question, selected, onSelect }: Props) => {
  if (!question) return null;
  return (
    <>
      <style>{`
        @keyframes qcard-in {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes opt-select {
          0%   { transform: scale(0.97); }
          60%  { transform: scale(1.02); }
          100% { transform: scale(1); }
        }
        .qcard {
          border-radius: 20px;
          padding: 28px;
          background: var(--ts-surface);
          border: 1px solid var(--ts-border-hi);
          box-shadow:
            0 0 0 1px var(--ts-border-hi),
            0 12px 40px rgba(0,0,0,0.5),
            inset 0 0 60px var(--ts-violet-soft);
          animation: qcard-in 0.35s ease both;
          position: relative;
          overflow: hidden;
          font-family: 'Space Grotesk', sans-serif;
        }
        .qcard::before {
          content: '';
          position: absolute;
          top: 0; left: 15%; width: 70%; height: 1px;
          background: linear-gradient(90deg, transparent, var(--ts-violet), var(--ts-cyan), transparent);
          opacity: 0.5;
        }
        .qcard-question {
          font-size: clamp(1rem, 2.5vw, 1.15rem);
          font-weight: 600;
          color: var(--ts-text);
          line-height: 1.6;
          margin-bottom: 22px;
          position: relative;
          z-index: 1;
        }
        .qcard-options {
          display: flex;
          flex-direction: column;
          gap: 10px;
          position: relative;
          z-index: 1;
        }
        .qcard-opt {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 18px;
          border-radius: 12px;
          border: 1px solid var(--ts-border);
          background: var(--ts-surface-hi);
          color: var(--ts-text-muted);
          font-family: 'Space Grotesk', sans-serif;
          font-size: 0.95rem;
          font-weight: 500;
          cursor: pointer;
          text-align: left;
          width: 100%;
          transition: all 0.18s;
          word-break: break-word;
          white-space: pre-line;
        }
        .qcard-opt:hover:not(.selected) {
          border-color: var(--ts-border-hi);
          background: var(--ts-surface);
          color: var(--ts-text);
        }
        .qcard-opt.selected {
          border-color: var(--ts-violet);
          background: var(--ts-violet-soft);
          color: var(--ts-violet);
          box-shadow: 0 0 16px var(--ts-violet-glow);
          animation: opt-select 0.22s ease;
        }
        .qcard-opt-label {
          flex-shrink: 0;
          width: 28px; height: 28px;
          border-radius: 8px;
          border: 1px solid currentColor;
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 700; letter-spacing: 0.04em;
          opacity: 0.7;
          transition: opacity 0.18s;
        }
        .qcard-opt.selected .qcard-opt-label {
          opacity: 1;
          background: var(--ts-violet);
          color: #fff;
          border-color: var(--ts-violet);
        }
      `}</style>
      <div className="qcard">
        <p className="qcard-question">{question.question}</p>
        <div className="qcard-options">
          {question.options.map((opt: string, idx: number) => (
            <button
              key={idx}
              type="button"
              className={`qcard-opt${selected === opt ? ' selected' : ''}`}
              onClick={() => onSelect(opt)}
              aria-pressed={selected === opt}
            >
              <span className="qcard-opt-label">{optionLabels[idx]}</span>
              <span>{opt}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
};

export default QuestionCard;