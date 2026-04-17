"use client";
import ReactMarkdown from "react-markdown";

interface TextRendererProps { block: string; }

function fixBullets(text: string): string {
  return text
    .replace(/^•\s+/gm, "- ")
    .replace(/ • /g, "\n- ");
}

export default function TextRenderer({ block }: TextRendererProps) {
  return (
    <div
      className="md-root"
      style={{
        background:   "transparent",
        margin:       0,
        padding:      0,
        maxWidth:     "none",
        color:        "var(--ts-text)",
        fontFamily:   "'Space Grotesk', sans-serif",
      }}
    >
      <ReactMarkdown>{fixBullets(block)}</ReactMarkdown>
    </div>
  );
}