"use client";

import { Suspense } from "react";
import ResultsContent from "./ResultsContent";

export default function QuizResultsPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40 }}>Loading...</div>}>
      <ResultsContent />
    </Suspense>
  );
}