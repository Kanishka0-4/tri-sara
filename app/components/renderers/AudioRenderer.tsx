"use client";
import { useState, useEffect, useRef } from "react";

interface AudioRendererProps {
  block: string;
  variant?: "default" | "chapter";
}

function toSpeakableText(markdown: string): string {
  return markdown
    .replace(/#{1,6}\s+/g, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^[*\-]\s+/gm, "")
    .replace(/^\d+\.\s+/gm, "")
    .replace(/\n{2,}/g, ". ")
    .replace(/\n/g, " ")
    .trim();
}

const SPEEDS = [
  { label: "0.5×", value: 0.50 },
  { label: "0.75×", value: 0.75 },
  { label: "1×",   value: 1.0  },
  { label: "1.5×", value: 1.5  },
  { label: "2×",   value: 2.0  },
];

export default function AudioRenderer({ block, variant = "default" }: AudioRendererProps) {
  const [playing,   setPlaying  ] = useState(false);
  const [progress,  setProgress ] = useState(0);
  const [speed,     setSpeed    ] = useState(1.0);

  // KEY FIX: default true so component renders on first pass.
  // Previously false caused `if (!supported) return null` to fire before
  // the useEffect ran, permanently hiding the audio player.
  const [supported, setSupported] = useState(true);

  const speedRef    = useRef(1.0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setSupported(false);
    }
    return () => {
      window.speechSynthesis?.cancel();
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    window.speechSynthesis?.cancel();
    setPlaying(false);
    setProgress(0);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, [block]);

  const speak = (rate: number) => {
    const text = toSpeakableText(block);
    if (!text) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate  = rate;
    utterance.pitch = 1;

    const trySpeak = () => {
      const voices = window.speechSynthesis.getVoices();
      const preferred =
        voices.find(v => v.lang === "en-US" && v.localService) ??
        voices.find(v => v.lang.startsWith("en"));
      if (preferred) utterance.voice = preferred;

      utterance.onstart = () => {
        setPlaying(true);
        setProgress(0);
        let elapsed = 0;
        const estimated = (text.length * 55) / rate;
        intervalRef.current = setInterval(() => {
          elapsed += 200;
          setProgress(Math.min((elapsed / estimated) * 100, 95));
        }, 200);
      };
      utterance.onend = () => {
        setPlaying(false);
        setProgress(100);
        if (intervalRef.current) clearInterval(intervalRef.current);
        setTimeout(() => setProgress(0), 800);
      };
      utterance.onerror = () => {
        setPlaying(false);
        setProgress(0);
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
      window.speechSynthesis.speak(utterance);
    };

    const voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) {
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.onvoiceschanged = null;
        trySpeak();
      };
    } else {
      trySpeak();
    }
  };

  const handleSpeedChange = (val: number) => {
    setSpeed(val);
    speedRef.current = val;
    if (!playing) return;
    window.speechSynthesis.cancel();
    if (intervalRef.current) clearInterval(intervalRef.current);
    speak(val);
  };

  const handlePlay = () => {
    if (!supported) return;
    if (playing) {
      window.speechSynthesis.cancel();
      setPlaying(false);
      setProgress(0);
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    speak(speedRef.current);
  };

  if (!supported) return null;

  const labelText = variant === "chapter"
    ? (playing ? "Reading chapter\u2026" : "Listen to this chapter")
    : (playing ? "Reading aloud\u2026"   : "Listen to this section");

  return (
    <div style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      <div style={{
        display: "flex", flexDirection: "column", gap: "0.65rem",
        padding: "0.85rem 1rem",
        background: playing ? "var(--ts-green-soft)" : "var(--ts-surface-hi)",
        border: `1px solid ${playing ? "var(--ts-green-border)" : "var(--ts-border-hi)"}`,
        borderRadius: 12,
        transition: "background 0.2s, border-color 0.2s",
      }}>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <button onClick={handlePlay} aria-label={playing ? "Pause" : "Play"} style={{
            width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
            background: playing
              ? "linear-gradient(135deg, var(--ts-green), #34d399)"
              : "linear-gradient(135deg, var(--ts-violet), #818cf8)",
            border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#0d0918", fontSize: "0.82rem",
            boxShadow: playing ? "0 0 12px var(--ts-green-soft)" : "0 0 12px var(--ts-violet-glow)",
            transition: "background 0.2s, box-shadow 0.2s",
          }}>
            {playing ? "\u23F8" : "\u25B6"}
          </button>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: "0.72rem", fontWeight: 600, marginBottom: "0.3rem",
              color: playing ? "var(--ts-green)" : "var(--ts-violet)",
              letterSpacing: "0.03em", transition: "color 0.2s",
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}>{labelText}</div>
            <div style={{ height: 3, background: "var(--ts-border)", borderRadius: 99, overflow: "hidden" }}>
              <div style={{
                height: "100%",
                background: playing
                  ? "linear-gradient(90deg, var(--ts-green), #34d399)"
                  : "linear-gradient(90deg, var(--ts-violet), #818cf8)",
                width: `${progress}%`,
                transition: "width 0.2s linear, background 0.2s",
                borderRadius: 99,
              }} />
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.2rem", flexWrap: "wrap" }}>
          {SPEEDS.map(s => (
            <button key={s.value} onClick={() => handleSpeedChange(s.value)} style={{
              padding: "0.25rem 0.5rem", borderRadius: 6,
              border: `1px solid ${speed === s.value ? "var(--ts-violet)" : "var(--ts-border)"}`,
              background: speed === s.value ? "var(--ts-violet)" : "transparent",
              color: speed === s.value ? "#0d0918" : "var(--ts-text-muted)",
              fontSize: "0.65rem", fontWeight: speed === s.value ? 700 : 400,
              cursor: "pointer", fontFamily: "'Space Grotesk', sans-serif",
              transition: "background 0.15s, color 0.15s, border-color 0.15s",
              flexShrink: 0,
            }}>{s.label}</button>
          ))}
        </div>
      </div>
    </div>
  );
}