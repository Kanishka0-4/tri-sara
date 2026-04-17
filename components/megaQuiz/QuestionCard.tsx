interface Props {
  question: any;
  selected: string | null;
  onSelect: (option: string) => void;
}


const QuestionCard = ({ question, selected, onSelect }: Props) => {
  if (!question) return null;
  return (
    <div className="bg-gray-900 border-2 border-yellow-400 rounded-xl shadow-lg p-6 mb-2">
      <h3 className="text-lg font-semibold text-yellow-200 mb-4">{question.question}</h3>
      <ul className="flex flex-col gap-4">
        {question.options.map((opt: string, idx: number) => (
          <li key={idx} className="w-full">
            <button
              className={`w-full text-left px-5 py-3 rounded-lg border-2 font-medium transition-all break-words whitespace-pre-line max-w-full min-h-[3.5rem] focus:outline-none focus:ring-2 focus:ring-yellow-400
                ${selected === opt
                  ? 'bg-gradient-to-r from-yellow-300 via-yellow-400 to-blue-300 border-yellow-400 text-black shadow-lg'
                  : 'bg-gray-800 border-blue-400 text-yellow-100 hover:bg-blue-900 hover:border-yellow-400'}
              `}
              style={{ wordBreak: 'break-word', whiteSpace: 'pre-line', maxWidth: '100%' }}
              onClick={() => onSelect(opt)}
              type="button"
              tabIndex={0}
              aria-pressed={selected === opt}
            >
              <span className="block w-full text-base md:text-lg leading-snug">{opt}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default QuestionCard;
