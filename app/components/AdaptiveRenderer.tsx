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
  const startTimeRef = useRef<number>(Date.now());
  const saveParamsRef = useRef({ moduleId, subjectId, type });

  useEffect(() => {
    saveParamsRef.current = { moduleId, subjectId, type };
  }, [moduleId, subjectId, type]);

  useEffect(() => {
    // Don't track time here for audio — AudioRenderer handles it directly
    if (type === "audio") return;

    startTimeRef.current = Date.now();

    return () => {
      const elapsed = Math.round((Date.now() - startTimeRef.current) / 1000);
      const { moduleId, subjectId, type } = saveParamsRef.current;

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
          keepalive: true,
        }).catch(() => {});
      }
    };
  }, [block, type]);

  if (type === "visual") {
    return <VisualRenderer block={block} />;
  }

  if (type === "audio") {
    return <AudioRenderer block={block} moduleId={moduleId} subjectId={subjectId} />;
  }

  return (
    <div className="md-prose">
      <TextRenderer block={block} />
    </div>
  );
}