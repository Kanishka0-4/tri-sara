"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function MegaQuizResultAnalysisPage() {
  const params = useParams();
  const router = useRouter();
  const subjectId = params.id as string;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/mega-quiz/analytics/summary`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subjectId })
        });
        const result = await res.json();
        if (res.ok && result && result.summary) {
          setData(result.summary);
        } else {
          setError(result.error || "No summary found.");
        }
      } catch (e) {
        setError("Failed to load summary.");
      }
      setLoading(false);
    }
    fetchData();
  }, [subjectId]);

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      background: 'linear-gradient(135deg, #0a0a0a 0%, #0d47a1 100%)',
      padding: 0,
      margin: 0,
      overflowX: 'hidden',
      position: 'relative'
    }}>
      <div style={{ position: 'absolute', left: 32, top: 32, zIndex: 10 }}>
        <button
          onClick={() => router.push(`/dashboard/subject/${subjectId}/progress`)}
          style={{
            background: 'none',
            border: 'none',
            color: '#ffd600',
            fontWeight: 700,
            fontSize: 18,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: 0,
            textDecoration: 'underline',
          }}
          aria-label="Go to Progress"
        >
          <span style={{ fontSize: 22, lineHeight: 1 }}>←</span> Progress
        </button>
      </div>
      <div style={{
        maxWidth: 800,
        margin: "48px auto",
        background: "#e3eafc",
        borderRadius: 28,
        boxShadow: "0 8px 32px #0d47a1cc",
        padding: 48,
        border: "2px solid #ffd600",
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)'
      }}>
        <h1 style={{ fontSize: 36, fontWeight: 900, color: "#0d47a1", marginBottom: 32, textAlign: "center", letterSpacing: 1.2, textShadow: '0 2px 8px #ffd600' }}>
          <span role="img" aria-label="trophy">🏆</span> Mega-Quiz Result Analysis
        </h1>
        {loading ? (
          <div style={{ color: "#7c2ae8", fontWeight: 700, fontSize: 22, textAlign: 'center' }}>Loading...</div>
        ) : error ? (
          <div style={{ color: "#ff7b00", fontWeight: 700, fontSize: 20, textAlign: 'center' }}>{error}</div>
        ) : data ? (
          <div style={{ fontSize: 18, color: "#fff", lineHeight: 1.7 }}>
          <div style={{ display: 'flex', gap: 32, marginBottom: 28, justifyContent: 'center', flexWrap: 'wrap' }}>
            <div style={{
              background: 'linear-gradient(135deg, #212121 0%, #1976d2 100%)',
              color: '#ffd600',
              borderRadius: 18,
              padding: '24px 40px',
              fontWeight: 700,
              fontSize: 22,
              boxShadow: '0 2px 12px #0d47a1cc',
              border: '2px solid #ffd600',
              minWidth: 200,
              textAlign: 'center',
              transition: 'transform 0.2s',
            }}>
              <span role="img" aria-label="target" style={{ fontSize: 32 }}>🎯</span><br />
              Accuracy<br />
              <span style={{ fontSize: 32, fontWeight: 900 }}>{Math.round(data.accuracy)}%</span>
            </div>
            <div style={{
              background: 'linear-gradient(135deg, #1976d2 0%, #ffd600 100%)',
              color: '#212121',
              borderRadius: 18,
              padding: '24px 40px',
              fontWeight: 700,
              fontSize: 22,
              boxShadow: '0 2px 12px #ffd60099',
              border: '2px solid #ffd600',
              minWidth: 200,
              textAlign: 'center',
              transition: 'transform 0.2s',
            }}>
              <span role="img" aria-label="fire" style={{ fontSize: 32 }}>🔥</span><br />
              Engagement<br />
              <span style={{ fontSize: 32, fontWeight: 900 }}>{Math.round(data.engagement_score)}%</span>
            </div>
          </div>
          <div style={{ marginBottom: 24 }}>
            <b style={{ color: '#0d47a1', fontSize: 22, letterSpacing: 0.5 }}>📚 Topic-wise Performance</b>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, marginTop: 16, justifyContent: 'center' }}>
              {data.topic_performance && Object.entries(data.topic_performance).map(([topic, value]: [string, any], idx) => (
                <div key={topic} style={{
                  background: 'rgba(20, 20, 20, 0.95)',
                  color: '#ffd600',
                  borderRadius: 16,
                  padding: 20,
                  minWidth: 210,
                  marginBottom: 10,
                  boxShadow: '0 2px 10px #ffd60055',
                  flex: '1 1 230px',
                  textAlign: 'center',
                  fontWeight: 600,
                  border: '2px solid #ffd600',
                  transition: 'transform 0.2s',
                  cursor: 'pointer',
                }}
                onMouseOver={e => e.currentTarget.style.transform = 'scale(1.04)'}
                onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <div style={{ fontSize: 20, marginBottom: 8, fontWeight: 700 }}>{topic}</div>
                  {typeof value === 'object' && value !== null ? (
                    <>
                      <div style={{ fontSize: 15, margin: '7px 0' }}>Total: <b>{value.total}</b></div>
                      <div style={{ fontSize: 15, margin: '7px 0' }}>Correct: <b>{value.correct}</b></div>
                      <div style={{ fontSize: 15, margin: '7px 0' }}>Accuracy: <b>{typeof value.accuracy === 'number' ? Math.round(value.accuracy * 100) + '%' : value.accuracy}</b></div>
                    </>
                  ) : (
                    <div style={{ fontSize: 24, fontWeight: 900 }}>{typeof value === 'number' ? Math.round(value * 100) + '%' : value}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 24 }}>
            <b style={{ color: '#0d47a1', fontSize: 22, letterSpacing: 0.5 }}>🧩 Difficulty Performance</b>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, marginTop: 16, justifyContent: 'center' }}>
              {data.difficulty_performance && Object.entries(data.difficulty_performance).map(([level, value]: [string, any], idx) => (
                <div key={level} style={{
                  background: 'rgba(20, 20, 20, 0.95)',
                  color: '#ffd600',
                  borderRadius: 16,
                  padding: 20,
                  minWidth: 210,
                  marginBottom: 10,
                  boxShadow: '0 2px 10px #ffd60055',
                  flex: '1 1 230px',
                  textAlign: 'center',
                  fontWeight: 600,
                  border: '2px solid #ffd600',
                  transition: 'transform 0.2s',
                  cursor: 'pointer',
                }}
                onMouseOver={e => e.currentTarget.style.transform = 'scale(1.04)'}
                onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <div style={{ fontSize: 20, marginBottom: 8, fontWeight: 700 }}>{level}</div>
                  {typeof value === 'object' && value !== null ? (
                    <>
                      <div style={{ fontSize: 15, margin: '7px 0' }}>Total: <b>{value.total}</b></div>
                      <div style={{ fontSize: 15, margin: '7px 0' }}>Correct: <b>{value.correct}</b></div>
                      <div style={{ fontSize: 15, margin: '7px 0' }}>Accuracy: <b>{typeof value.accuracy === 'number' ? Math.round(value.accuracy * 100) + '%' : value.accuracy}</b></div>
                    </>
                  ) : (
                    <div style={{ fontSize: 24, fontWeight: 900 }}>{typeof value === 'number' ? Math.round(value * 100) + '%' : value}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 24 }}>
            <b style={{ color: '#0d47a1', fontSize: 22, letterSpacing: 0.5 }}>🧠 Confidence Calibration</b>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, marginTop: 16, justifyContent: 'center' }}>
              {data.confidence_calibration && Object.entries(data.confidence_calibration).map(([label, value]: [string, any], idx) => (
                <div key={label} style={{
                  background: 'rgba(20, 20, 20, 0.95)',
                  color: '#ffd600',
                  borderRadius: 16,
                  padding: 20,
                  minWidth: 210,
                  marginBottom: 10,
                  boxShadow: '0 2px 10px #ffd60055',
                  flex: '1 1 230px',
                  textAlign: 'center',
                  fontWeight: 600,
                  border: '2px solid #ffd600',
                  transition: 'transform 0.2s',
                  cursor: 'pointer',
                }}
                onMouseOver={e => e.currentTarget.style.transform = 'scale(1.04)'}
                onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <div style={{ fontSize: 20, marginBottom: 8, fontWeight: 700 }}>{label}</div>
                  {typeof value === 'object' && value !== null ? (
                    Object.entries(value).map(([k, v]) => (
                      <div key={k} style={{ fontSize: 15, margin: '7px 0' }}>{k.charAt(0).toUpperCase() + k.slice(1)}: <b>{typeof v === 'number' ? Math.round(v * 100) + '%' : String(v)}</b></div>
                    ))
                  ) : (
                    <div style={{ fontSize: 24, fontWeight: 900 }}>{typeof value === 'number' ? Math.round(value * 100) + '%' : String(value)}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
      </div>
    </div>
  );
}
