"use client";
import ReactMarkdown from "react-markdown";

interface TextRendererProps { block: string; }

const STRUCTURAL_HEADING_RX = /^#{1,4}\s*(Analogy|Real.?World\s+(?:Application|Example)|Key\s+Takeaways?|Summary|Introduction|Overview|Example|Definition|Explanation|Application|Concept|Context|Background|Conclusion)\s*$/gim;

function fixBullets(text: string): string {
  return text
    .replace(/^•\s+/gm, "- ")
    .replace(/ • /g, "\n- ");
}

function cleanBlock(text: string): string {
  return text
    .replace(STRUCTURAL_HEADING_RX, "")
    // Also strip any orphan closing tags that slipped through
    .replace(/\[\s*\/\s*(TEXT|VISUAL|AUDIO)\s*\]/gi, "")
    .replace(/\[\s*(TEXT|VISUAL|AUDIO)\s*\]/gi, "");
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
      <ReactMarkdown>{fixBullets(cleanBlock(block))}</ReactMarkdown>
    </div>
  );
}