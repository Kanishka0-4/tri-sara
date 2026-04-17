import React, { useEffect, useState } from "react";

type Score = {
  module_order: number;
  score: number | null;
  total: number | null;
};

export default function ModuleScores({ subjectId }: { subjectId: string }) {
  const [scores, setScores] = useState<Score[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchScores() {
      try {
        const res = await fetch(`/api/moduleQuiz/score?subjectId=${subjectId}`);
        const data = await res.json();
        if (Array.isArray(data.scores)) setScores(data.scores);
        else setScores([]);
      } catch {
        setError("Failed to load module scores");
      } finally {
        setLoading(false);
      }
    }
    fetchScores();
  }, [subjectId]);

  if (loading) return <div style={{ color: "#ff7b00", marginTop: 24 }}>Loading module scores...</div>;
  if (error) return <div style={{ color: "#ff7b00", marginTop: 24 }}>{error}</div>;
  if (!scores.length) return null;

  return (
    <div style={{
      marginTop: 36,
      background: "#fff",
      border: "2px solid #ffb700",
      borderRadius: 20,
      boxShadow: "0 2px 16px #ff7b0012",
      padding: "24px 32px 20px 32px",
      minWidth: 320,
      maxWidth: 500,
      margin: "0 auto",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 10
    }}>
      <div style={{ fontSize: 18, fontWeight: 700, color: "#ff7b00", marginBottom: 10 }}>
        Module Quiz Scores
      </div>
      <div style={{ width: "100%" }}>
        {scores.map((s, i) => (
          <div key={s.module_order} style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "8px 0",
            borderBottom: i !== scores.length - 1 ? "1px solid #ffe6b3" : "none",
            fontSize: 16
          }}>
            <span style={{ color: "#ff7b00", fontWeight: 600 }}>Module {s.module_order}</span>
            {s.score != null && s.total != null ? (
              <span style={{ color: s.score / s.total >= 0.7 ? "#2ecc40" : "#ff7b00", fontWeight: 700 }}>
                {s.score} / {s.total} ({Math.round((s.score / s.total) * 100)}%)
              </span>
            ) : (
              <span style={{ color: "#aaa" }}>Not taken</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}