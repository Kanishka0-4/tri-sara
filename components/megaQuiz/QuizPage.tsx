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

const QuizPage = ({ subjectId }: QuizPageProps) => {
  const [quiz, setQuiz] = useState<QuizQuestion[]>([]);
  const [current, setCurrent] = useState<number>(0);
  const [responses, setResponses] = useState<QuizResponse[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<string>('Medium');
  const [timer, setTimer] = useState<number>(0);
  const [showResult, setShowResult] = useState<boolean>(false);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Fetch quiz on mount
  useEffect(() => {
    const sid = subjectId ?? null;
    if (!sid) return;
    fetch('/api/mega-quiz/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subjectId: sid })
    })
      .then(async res => {
        try {
          return await res.json();
        } catch {
          return { quiz: [] };
        }
      })
      .then(data => setQuiz(data.quiz || []))
      .catch(() => setQuiz([]));
  }, [subjectId === undefined ? null : subjectId]);

  // Timer logic
  useEffect(() => {
    if (showResult || !quiz.length) return;
    const interval = setInterval(() => setTimer(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, [current, showResult, quiz.length]);

  const handleSelect = (option: string) => setSelected(option);
  const handleConfidence = (level: string) => setConfidence(level);

  const handleNext = () => {
    if (!quiz[current]) return;
    setResponses([
      ...responses,
      {
        question_id: quiz[current].id,
        selected_answer: selected,
        correct_answer: quiz[current].correctAnswer,
        is_correct: selected === quiz[current].correctAnswer,
        time_taken: timer,
        confidence_level: confidence,
        difficulty: quiz[current].difficulty,
        topic: quiz[current].topic,
        question_type: quiz[current].questionType,
        timestamp: new Date().toISOString()
      }
    ]);
    setSelected(null);
    setConfidence('Medium');
    setTimer(0);
    setCurrent(c => c + 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    // Submit responses to API
    const res = await fetch('/api/mega-quiz/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 1, subjectId, responses }) // TODO: dynamic userId
    });
    const data = await res.json();
    setResult(data.result);
    setShowResult(true);
    setLoading(false);
  };

  if (!quiz.length) return (
    <div className="flex items-center justify-center min-h-[300px] bg-black text-yellow-300 rounded-xl border-2 border-yellow-400 shadow-lg p-8">
      Loading quiz...
    </div>
  );
  if (showResult) return <ResultDashboard result={result} />;

  const q = quiz[current];
  if (!q) return (
    <div className="flex flex-col items-center justify-center bg-black text-yellow-300 rounded-xl border-2 border-yellow-400 shadow-lg p-8 mt-8">
      <h2 className="text-2xl font-bold mb-4">Quiz Complete!</h2>
      <button
        className="px-6 py-3 bg-yellow-400 text-black rounded-lg font-semibold hover:bg-yellow-500 transition-colors mt-2"
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading ? 'Submitting...' : 'View Results'}
      </button>
    </div>
  );

  // Progress bar
  const progress = ((current + 1) / quiz.length) * 100;

  // Game challenge theme colors and motivational messages
  const stages = [
    'Rookie',
    'Challenger',
    'Pro',
    'Master',
    'Legend'
  ];
  const stage = stages[Math.min(Math.floor((current / quiz.length) * stages.length), stages.length - 1)];
  const motivational = [
    '🔥 Ready for the Challenge?',
    '🚀 Keep Going!',
    '💪 You Got This!',
    '🏆 Almost There!',
    '🎉 Final Stretch!'
  ];
  const motivation = motivational[Math.min(Math.floor((current / quiz.length) * motivational.length), motivational.length - 1)];

  return (
    <div className="max-w-xl mx-auto mt-10 bg-gradient-to-br from-blue-900 via-black to-yellow-900 rounded-2xl border-4 border-yellow-400 shadow-2xl p-8 flex flex-col gap-6 animate-fade-in">
      <div className="flex flex-col gap-2 mb-2">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
          <h2 className="text-3xl font-extrabold text-yellow-300 tracking-wider drop-shadow-lg flex items-center gap-2">
            🎮 Mega Quiz Challenge
            <span className="ml-2 px-3 py-1 bg-yellow-400 text-black rounded-full text-base font-bold border-2 border-blue-400 animate-pulse">{stage}</span>
          </h2>
          <Timer time={timer} />
        </div>
        <div className="w-full bg-gray-700 rounded-full h-4 mt-4 shadow-inner border-2 border-blue-400 relative overflow-hidden">
          <div
            className="bg-gradient-to-r from-yellow-400 via-yellow-300 to-blue-400 h-4 rounded-full transition-all duration-700 ease-out shadow-lg"
            style={{ width: `${progress}%` }}
          />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-xs text-black font-bold tracking-wider">{Math.round(progress)}%</span>
        </div>
        <div className="text-center text-lg text-yellow-200 mt-3 font-semibold animate-bounce">{motivation}</div>
        <div className="text-right text-xs text-yellow-200 mt-1">Stage {current + 1} / {quiz.length}</div>
      </div>
      <QuestionCard question={q} selected={selected} onSelect={handleSelect} />
      <div className="flex flex-col sm:flex-row gap-4 items-center mt-2">
        <ConfidenceSelector value={confidence} onChange={handleConfidence} />
        <button
          className={`px-8 py-3 rounded-lg font-extrabold shadow-md transition-all border-2 border-yellow-400 mt-2 sm:mt-0 text-lg tracking-wide
            ${selected ? 'bg-yellow-400 text-black hover:bg-yellow-500 scale-105' : 'bg-gray-800 text-yellow-300 cursor-not-allowed'}`}
          onClick={handleNext}
          disabled={!selected}
        >
          {current + 1 === quiz.length ? 'Finish' : 'Next'}
        </button>
      </div>
    </div>
  );
};

export default QuizPage;
