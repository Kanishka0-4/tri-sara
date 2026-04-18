"use client";
import { useParams } from 'next/navigation';
import QuizPage from '@/app/components/megaQuiz/QuizPage';

export default function MegaQuizPage() {
  const params = useParams();
  const subjectId = params.subjectId as string;
  return <QuizPage subjectId={subjectId} />;
}
