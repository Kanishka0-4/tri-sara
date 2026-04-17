"use client";

import VisualRenderer from "./renderers/VisualRenderer";
import TextRenderer from "./renderers/TextRenderer";
import AudioRenderer from "./renderers/AudioRenderer";
import { useRef, useEffect } from "react";
interface LearningProfile {
  visual: number;
  audio: number;
  text: number;
}

interface AdaptiveRendererProps {
  block: string;
  type: "visual" | "text" | "audio";
  profile: LearningProfile;
  moduleId: string;
  subjectId: string;
}

export default function AdaptiveRenderer({ block, type, profile, moduleId, subjectId }: AdaptiveRendererProps) {
  // Track time spent in this block (text, visual, audio)
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    startTimeRef.current = Date.now();
    return () => {
      if (startTimeRef.current) {
        const elapsed = Math.round((Date.now() - startTimeRef.current) / 1000);
        if (elapsed > 0 && moduleId && subjectId && type) {
          fetch("/api/moduleBlockTime", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              subjectId,
              moduleId,
              blockType: type,
              timeSpentSeconds: elapsed,
            }),
          }).catch(() => {});
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [block, type, moduleId, subjectId]);

  if (type === "visual") {
    return <VisualRenderer block={block} />;
  }

  if (type === "audio") {
    return <AudioRenderer block={block} />;
  }

  // Default: text
  return (
    <div className="md-prose">
      <TextRenderer block={block} />
    </div>
  );
}