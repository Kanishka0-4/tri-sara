"use client";

import { Suspense } from "react";
import StartContent from "./StartContent";

export default function QuizStartPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40 }}>Loading...</div>}>
      <StartContent />
    </Suspense>
  );
}