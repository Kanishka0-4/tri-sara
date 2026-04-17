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
  const [supported, setSupported] = useState(false);
  const [progress,  setProgress ] = useState(0);
  const [speed,     setSpeed    ] = useState(1.0);
  const speedRef    = useRef(1.0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const [isMobile, setIsMobile] = useState(false);

useEffect(() => {
  const check = () => {
    if (typeof window !== "undefined") {
      setIsMobile(window.innerWidth < 768);
    }
  };
  check();
  window.addEventListener("resize", check);
  return () => window.removeEventListener("resize", check);
}, []);

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "speechSynthesis" in window);
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
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate  = rate;
    utterance.pitch = 1;
    const voices    = window.speechSynthesis.getVoices();
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
    ? (playing ? "Reading chapter…"  : "Listen to this chapter")
    : (playing ? "Reading aloud…"    : "Listen to this section");

  return (
    <div style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      <div style={{
        display: "flex",
        gap: "0.8rem",
        padding: "0.7rem 1rem",
        flexDirection: isMobile ? "column" : "row",
        alignItems: isMobile ? "flex-start" : "center",
        background: playing ? "var(--ts-green-soft)"  : "var(--ts-surface-hi)",
        border:    `1px solid ${playing ? "var(--ts-green-border)" : "var(--ts-border-hi)"}`,
        borderRadius: 12,
        transition: "background 0.2s, border-color 0.2s",
      }}>

        {/* Play / Pause button */}
        <button
          onClick={handlePlay}
          aria-label={playing ? "Pause" : "Play"}
          style={{
            width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
            background: playing
              ? "linear-gradient(135deg, var(--ts-green), #34d399)"
              : "linear-gradient(135deg, var(--ts-violet), #818cf8)",
            border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#0d0918", fontSize: "0.85rem",
            boxShadow: playing
              ? "0 0 14px var(--ts-green-soft)"
              : "0 0 14px var(--ts-violet-glow)",
            transition: "background 0.2s, box-shadow 0.2s",
          }}
        >
          {playing ? "⏸" : "▶"}
        </button>

        {/* Label + progress bar */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: "0.72rem",
            fontWeight: 600,
            marginBottom: "0.32rem",
            color: playing ? "var(--ts-green)" : "var(--ts-violet)",
            letterSpacing: "0.03em",
            transition: "color 0.2s",
          }}>
            <p
              style={{
                writingMode: "horizontal-tb",
                whiteSpace: "normal",
                wordBreak: "break-word",
                width: "100%",
              }}
            >
              {labelText}
            </p>
          </div>
          <div style={{
            height: 3,
            background: "var(--ts-border)",
            borderRadius: 99,
            overflow: "hidden",
          }}>
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

        {/* Speed controls */}
        <div style={{ display: "flex", gap: "0.22rem", flexShrink: 0 }}>
          {SPEEDS.map(s => (
            <button
              key={s.value}
              onClick={() => handleSpeedChange(s.value)}
              style={{
                padding: "0.22rem 0.44rem",
                borderRadius: 6,
                border: `1px solid ${speed === s.value ? "var(--ts-violet)" : "var(--ts-border)"}`,
                background: speed === s.value ? "var(--ts-violet)" : "transparent",
                color: speed === s.value ? "#0d0918" : "var(--ts-text-muted)",
                fontSize: "0.63rem",
                fontWeight: speed === s.value ? 700 : 400,
                cursor: "pointer",
                fontFamily: "'Space Grotesk', sans-serif",
                transition: "background 0.15s, color 0.15s, border-color 0.15s",
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}