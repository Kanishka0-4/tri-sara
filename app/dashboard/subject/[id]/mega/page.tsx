"use client";
import { useEffect, useState } from "react";
import { useParams } from 'next/navigation';
import QuizPage from '@/components/megaQuiz/QuizPage';
import ResultDashboard from '@/components/megaQuiz/ResultDashboard';

export default function MegaQuizPage() {
  const params = useParams();
  const subjectId = params.id as string;
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchResult() {
      setLoading(true);
      try {
        const res = await fetch('/api/mega-quiz/analytics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subjectId })
        });
        const data = await res.json();
        if (data && data.analytics) {
          setResult(data.analytics);
        }
      } catch {}
      setLoading(false);
    }
    fetchResult();
  }, [subjectId]);

  if (loading) return <div className="flex items-center justify-center min-h-[300px] bg-black text-yellow-300 rounded-xl border-2 border-yellow-400 shadow-lg p-8">Loading...</div>;
  if (result) return <ResultDashboard result={result} />;
  return <QuizPage subjectId={subjectId} />;
}
