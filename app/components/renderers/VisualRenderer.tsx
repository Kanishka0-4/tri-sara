"use client";
import { useEffect } from "react";

interface VisualProps { block: string; }

const VISUAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap');

  .vr-root {
    font-family: 'Space Grotesk', sans-serif;
    overflow-x: hidden;
    width: 100%;
  }

  /* Flow */
  .vr-flow-card {
    background: var(--ts-surface-hi);
    border: 1px solid var(--ts-border);
    border-radius: 12px;
    padding: 0.85rem 1rem;
    transition: border-color 0.18s, box-shadow 0.18s;
    min-width: 0;
    word-wrap: break-word;
    overflow-wrap: break-word;
  }
  .vr-flow-card:hover {
    border-color: var(--ts-border-hi);
    box-shadow: 0 2px 16px var(--ts-violet-glow);
  }
  .vr-flow-label {
    font-weight: 700;
    color: var(--ts-violet);
    font-size: 0.9rem;
    line-height: 1.35;
    word-wrap: break-word;
  }
  .vr-flow-desc  {
    font-size: 0.83rem;
    color: var(--ts-text-muted);
    margin-top: 0.3rem;
    line-height: 1.6;
    word-wrap: break-word;
  }
  .vr-flow-sub   {
    font-size: 0.8rem;
    color: var(--ts-text-muted);
    margin-bottom: 0.22rem;
    line-height: 1.55;
  }

  /* Tree / Hierarchy */
  .vr-tree-node  {
    border-radius: 0 10px 10px 0;
    padding: 0.6rem 1rem;
    min-width: 0;
    word-wrap: break-word;
    overflow-wrap: break-word;
  }
  .vr-tree-label {
    font-weight: 700;
    font-size: 0.88rem;
    color: var(--ts-text);
    word-wrap: break-word;
  }
  .vr-tree-desc  {
    font-size: 0.78rem;
    color: var(--ts-text-muted);
    margin-top: 0.22rem;
    line-height: 1.55;
    word-wrap: break-word;
  }

  /* Comparison */
  .vr-compare-feat {
    font-size: 0.81rem;
    color: var(--ts-text-muted);
    margin-bottom: 0.25rem;
    line-height: 1.55;
    word-wrap: break-word;
  }

  /* Cycle */
  .vr-cycle-desc {
    font-size: 0.81rem;
    color: var(--ts-text-muted);
    line-height: 1.55;
    word-wrap: break-word;
  }

  /* Title */
  .vr-title {
    margin: 0 0 1.1rem;
    font-size: clamp(0.95rem, 3vw, 1.05rem);
    font-weight: 700;
    color: var(--ts-text);
    letter-spacing: -0.02em;
    word-wrap: break-word;
  }

  /* Unsupported */
  .vr-unsupported {
    background: var(--ts-rose-soft);
    border: 1px solid var(--ts-rose-border);
    border-top: 3px solid var(--ts-rose);
    color: var(--ts-rose);
    font-size: 0.85rem;
    border-radius: 12px;
    padding: 1rem 1.25rem;
  }

  /* Cycle pills — wrap nicely on mobile */
  .vr-cycle-pills {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.35rem;
    margin-bottom: 1rem;
  }

  /* Comparison grid — single column on mobile */
  .vr-compare-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
  @media (min-width: 480px) {
    .vr-compare-grid-2 { grid-template-columns: repeat(2, 1fr); }
  }
`;

function InjectStyles() {
  useEffect(() => {
    if (!document.getElementById("vr-styles")) {
      const s = document.createElement("style");
      s.id = "vr-styles";
      s.textContent = VISUAL_STYLES;
      document.head.appendChild(s);
    }
  }, []);
  return null;
}

/* ── Parsers ── */
function getMeta(block: string) {
  return {
    type:  block.match(/^type:\s*(.+)/m)?.[1]?.trim() ?? "",
    title: block.match(/^title:\s*(.+)/m)?.[1]?.trim() ?? "",
  };
}
function dataBody(block: string) {
  return block
    .replace(/^type:[^\n]*\n?/m, "")
    .replace(/^title:[^\n]*\n?/m, "")
    .replace(/^data:\s*\n?/m, "");
}
function splitTopLevel(body: string): string[] {
  const items: string[] = [];
  let buf: string[] = [];
  for (const line of body.split("\n")) {
    if (/^- /.test(line) && buf.length > 0) { items.push(buf.join("\n").trim()); buf = []; }
    buf.push(line);
  }
  if (buf.join("").trim()) items.push(buf.join("\n").trim());
  return items.filter(Boolean);
}
function scalar(raw: string, key: string) {
  return raw.match(new RegExp(`^\\s*${key}:\\s*(.+)`, "m"))?.[1]?.trim() ?? "";
}
function subList(raw: string, key: string): string[] {
  const keyIdx = raw.search(new RegExp(`^\\s*${key}:`, "m"));
  if (keyIdx === -1) return [];
  const after = raw.slice(keyIdx);
  const lines = after.split("\n").slice(1);
  const result: string[] = [];
  for (const l of lines) {
    if (/^\s{2,}- /.test(l)) result.push(l.replace(/^\s+- /, "").trim());
    else if (l.trim() && !/^\s/.test(l)) break;
  }
  return result;
}
function parseItem(raw: string) {
  const header = raw.split("\n")[0].replace(/^-\s*/, "").trim();
  return {
    raw,
    header,
    name:           scalar(raw, "name")        || header,
    description:    scalar(raw, "description"),
    concept:        scalar(raw, "concept")      || header,
    step:           scalar(raw, "step")         || header,
    application:    scalar(raw, "application"),
    visual_example: scalar(raw, "visual_example"),
    features:       subList(raw, "features"),
    steps:          subList(raw, "steps"),
  };
}
function bestLabel(item: ReturnType<typeof parseItem>) {
  if (item.step    && item.step    !== item.header) return item.step;
  if (item.concept && item.concept !== item.header) return item.concept;
  return item.name;
}

/* ── Tree parser ── */
interface TreeNode { name: string; description: string; children: TreeNode[]; }
function parseTree(block: string): TreeNode[] {
  const lines = dataBody(block).split("\n");
  function walk(from: number, minIndent: number): { nodes: TreeNode[]; next: number } {
    const nodes: TreeNode[] = [];
    let i = from;
    while (i < lines.length) {
      const line = lines[i];
      if (!line.trim()) { i++; continue; }
      const indent = line.search(/\S/);
      if (indent < minIndent) break;
      if (line.trim().startsWith("- name:")) {
        const name = line.trim().replace(/^- name:\s*/, "");
        let description = "";
        let j = i + 1;
        while (j < lines.length) {
          const nl = lines[j];
          if (!nl.trim()) { j++; continue; }
          const ni = nl.search(/\S/);
          if (ni <= indent) break;
          const dm = nl.trim().match(/^description:\s*(.+)/);
          if (dm) { description = dm[1].trim(); }
          if (nl.trim() === "children:") { j++; break; }
          j++;
        }
        const { nodes: children, next } = walk(j, indent + 2);
        nodes.push({ name, description, children });
        i = next;
      } else { i++; }
    }
    return { nodes, next: i };
  }
  return walk(0, 0).nodes;
}

/* ── Palette ── */
const DEPTH_PALETTE = [
  { accent: "var(--ts-violet)", border: "var(--ts-border-hi)",    bg: "var(--ts-violet-soft)"  },
  { accent: "var(--ts-cyan)",   border: "rgba(34,211,238,0.25)",   bg: "var(--ts-cyan-glow)"    },
  { accent: "var(--ts-green)",  border: "var(--ts-green-border)",  bg: "var(--ts-green-soft)"   },
  { accent: "var(--ts-amber)",  border: "var(--ts-amber-border)",  bg: "var(--ts-amber-soft)"   },
];
const COMPARE_COLORS = [
  { accent: "var(--ts-cyan)",   border: "rgba(34,211,238,0.25)"  },
  { accent: "var(--ts-amber)",  border: "var(--ts-amber-border)" },
  { accent: "var(--ts-green)",  border: "var(--ts-green-border)" },
  { accent: "var(--ts-violet)", border: "var(--ts-border-hi)"    },
];
const CYCLE_COLORS = [
  "var(--ts-violet)",
  "var(--ts-cyan)",
  "var(--ts-green)",
  "var(--ts-amber)",
  "var(--ts-rose)",
];

/* ══ FLOW ══ */
function FlowVisual({ title, block }: { title: string; block: string }) {
  const items = splitTopLevel(dataBody(block)).map(parseItem);
  return (
    <div className="vr-root">
      {title && <h3 className="vr-title">{title}</h3>}
      <div style={{ display: "flex", flexDirection: "column" }}>
        {items.map((item, i) => {
          const label = bestLabel(item);
          const desc  = item.description || item.application;
          const subs  = item.steps.length ? item.steps : item.features;
          const last  = i === items.length - 1;
          return (
            <div key={i} style={{ display: "flex", gap: "0.75rem" }}>
              {/* Spine */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                <div style={{
                  width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
                  background: "linear-gradient(135deg, var(--ts-violet), #818cf8)",
                  color: "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "0.72rem", fontWeight: 700,
                  boxShadow: "0 2px 10px var(--ts-violet-glow)",
                }}>{i + 1}</div>
                {!last && (
                  <div style={{
                    width: 2, flex: 1, minHeight: 16,
                    background: "linear-gradient(var(--ts-violet), transparent)",
                    margin: "3px 0", opacity: 0.35,
                  }} />
                )}
              </div>
              {/* Card */}
              <div className="vr-flow-card" style={{ flex: 1, marginBottom: last ? 0 : "0.4rem", minWidth: 0 }}>
                <div className="vr-flow-label">{label}</div>
                {desc && <div className="vr-flow-desc">{desc}</div>}
                {subs.length > 0 && (
                  <ul style={{ margin: "0.4rem 0 0", paddingLeft: "1rem" }}>
                    {subs.map((s, si) => (
                      <li key={si} className="vr-flow-sub">{s}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ══ HIERARCHY ══ */
function TreeRow({ node, depth }: { node: TreeNode; depth: number }) {
  const c = DEPTH_PALETTE[Math.min(depth, DEPTH_PALETTE.length - 1)];
  // On mobile, reduce indent depth to avoid overflow
  const indentPx = Math.min(depth * 20, 40);
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "flex-start", marginBottom: node.children.length ? "0.25rem" : "0.4rem" }}>
        {depth > 0 && (
          <div style={{ width: indentPx, flexShrink: 0, position: "relative", alignSelf: "stretch" }}>
            <div style={{ position: "absolute", left: indentPx - 12, top: 0, bottom: 0, width: 2, background: `${c.accent}30` }} />
            <div style={{ position: "absolute", left: indentPx - 12, top: 16, width: 10, height: 2, background: `${c.accent}50` }} />
          </div>
        )}
        <div className="vr-tree-node" style={{
          flex: 1, background: c.bg,
          border: `1px solid ${c.border}`,
          borderLeft: `3px solid ${c.accent}`,
          minWidth: 0,
        }}>
          <div className="vr-tree-label">{node.name}</div>
          {node.description && <div className="vr-tree-desc">{node.description}</div>}
        </div>
      </div>
      {node.children.map((child, ci) => <TreeRow key={ci} node={child} depth={depth + 1} />)}
    </div>
  );
}

function HierarchyVisual({ title, block }: { title: string; block: string }) {
  const isTree = block.includes("name:");
  return (
    <div className="vr-root">
      {title && <h3 className="vr-title">{title}</h3>}
      {isTree ? (
        <div style={{ display: "flex", flexDirection: "column" }}>
          {parseTree(block).map((node, i) => <TreeRow key={i} node={node} depth={0} />)}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
          {splitTopLevel(dataBody(block)).map((raw, i) => {
            const item  = parseItem(raw);
            const label = bestLabel(item);
            const c     = DEPTH_PALETTE[i % DEPTH_PALETTE.length];
            return (
              <div key={i} style={{
                display: "flex", gap: "0.65rem", alignItems: "flex-start",
                background: c.bg,
                border: `1px solid ${c.border}`,
                borderLeft: `3px solid ${c.accent}`,
                borderRadius: "0 10px 10px 0",
                padding: "0.6rem 0.9rem",
                minWidth: 0,
              }}>
                <div style={{
                  flexShrink: 0, width: 20, height: 20, borderRadius: "50%",
                  background: c.accent, color: "#0d0918",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "0.62rem", fontWeight: 700,
                  marginTop: 2,
                }}>{i + 1}</div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: "0.88rem", color: "var(--ts-text)", wordWrap: "break-word" }}>{label}</div>
                  {item.description && <div className="vr-tree-desc">{item.description}</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ══ COMPARISON ══ */
function ComparisonVisual({ title, block }: { title: string; block: string }) {
  const items = splitTopLevel(dataBody(block)).map(parseItem);
  const colClass = items.length >= 2 ? "vr-compare-grid vr-compare-grid-2" : "vr-compare-grid";
  return (
    <div className="vr-root">
      {title && <h3 className="vr-title">{title}</h3>}
      <div className={colClass}>
        {items.map((item, i) => {
          const c       = COMPARE_COLORS[i % COMPARE_COLORS.length];
          const label   = bestLabel(item);
          const feats   = item.features.length ? item.features : subList(item.raw, "features");
          const example = item.visual_example;
          return (
            <div key={i} style={{
              background: "var(--ts-surface-hi)",
              border: `1px solid ${c.border}`,
              borderRadius: 14,
              padding: "1rem 1rem",
              position: "relative", overflow: "hidden",
              minWidth: 0,
            }}>
              {/* top accent stripe */}
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: c.accent }} />
              {/* letter badge */}
              <div style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                width: 20, height: 20, borderRadius: "50%",
                background: c.accent, color: "#0d0918",
                fontSize: "0.62rem", fontWeight: 800, marginBottom: "0.5rem",
              }}>{String.fromCharCode(65 + i)}</div>
              {/* label */}
              <div style={{ fontWeight: 700, color: c.accent, fontSize: "0.9rem", lineHeight: 1.3, marginBottom: "0.5rem", wordWrap: "break-word" }}>
                {label}
              </div>
              {feats.length > 0 && (
                <ul style={{ margin: 0, paddingLeft: "1rem", marginBottom: example ? "0.6rem" : 0 }}>
                  {feats.map((f, fi) => (
                    <li key={fi} className="vr-compare-feat">{f}</li>
                  ))}
                </ul>
              )}
              {example && (
                <div style={{
                  marginTop: "0.55rem",
                  background: "var(--ts-surface)",
                  border: `1px solid ${c.border}`,
                  borderRadius: 8,
                  padding: "0.4rem 0.7rem",
                  fontFamily: "'JetBrains Mono','Fira Code',monospace",
                  fontSize: "0.74rem", color: c.accent, wordBreak: "break-all",
                }}>{example}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ══ CYCLE ══ */
function CycleVisual({ title, block }: { title: string; block: string }) {
  const items = splitTopLevel(dataBody(block)).map(parseItem);
  return (
    <div className="vr-root">
      {title && <h3 className="vr-title">{title}</h3>}
      {/* pill row — wraps on mobile */}
      <div className="vr-cycle-pills">
        {items.map((item, i) => {
          const label = bestLabel(item);
          const color = CYCLE_COLORS[i % CYCLE_COLORS.length];
          return (
            <div key={i} style={{ display: "contents" }}>
              <div style={{
                display: "flex", alignItems: "center", gap: "0.35rem",
                background: "var(--ts-surface-hi)",
                border: `1px solid ${color}`,
                borderRadius: 999,
                padding: "0.35rem 0.75rem",
              }}>
                <div style={{
                  width: 18, height: 18, borderRadius: "50%",
                  background: color, color: "#0d0918",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "0.6rem", fontWeight: 700, flexShrink: 0,
                }}>{i + 1}</div>
                <span style={{ fontSize: "0.8rem", fontWeight: 600, color, whiteSpace: "nowrap" }}>{label}</span>
              </div>
              {i < items.length - 1 && (
                <span style={{ color: "var(--ts-text-dim)", fontSize: "0.85rem" }}>→</span>
              )}
            </div>
          );
        })}
        <span style={{ color: "var(--ts-text-dim)", fontSize: "0.85rem" }}>↩</span>
      </div>
      {/* detail rows */}
      {items.some(it => it.description || it.application) && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
          {items.map((item, i) => {
            const label = bestLabel(item);
            const desc  = item.description || item.application;
            const color = CYCLE_COLORS[i % CYCLE_COLORS.length];
            if (!desc) return null;
            return (
              <div key={i} style={{
                display: "flex", gap: "0.65rem", alignItems: "flex-start",
                background: "var(--ts-surface)",
                border: "1px solid var(--ts-border)",
                borderLeft: `3px solid ${color}`,
                borderRadius: "0 10px 10px 0",
                padding: "0.55rem 0.9rem",
                minWidth: 0,
              }}>
                <div style={{
                  flexShrink: 0, width: 18, height: 18, borderRadius: "50%",
                  background: color, color: "#0d0918",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "0.6rem", fontWeight: 700,
                  marginTop: 2,
                }}>{i + 1}</div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: "0.85rem", color, marginBottom: "0.1rem", wordWrap: "break-word" }}>{label}</div>
                  <div className="vr-cycle-desc">{desc}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ══ Wrap styles by type ══ */
const WRAP_STYLES: Record<string, React.CSSProperties> = {
  flow:       { borderTop: "3px solid var(--ts-violet)" },
  hierarchy:  { borderTop: "3px solid var(--ts-violet)" },
  comparison: { borderTop: "3px solid var(--ts-cyan)"   },
  cycle:      { borderTop: "3px solid var(--ts-green)"  },
};

export default function VisualRenderer({ block }: VisualProps) {
  const { type, title } = getMeta(block);
  const base: React.CSSProperties = {
    fontFamily: "'Space Grotesk', sans-serif",
    background: "var(--ts-surface)",
    border: "1px solid var(--ts-border)",
    borderRadius: 14,
    padding: "1.2rem 1.2rem",
    marginTop: "0.25rem",
    boxShadow: "0 2px 18px rgba(0,0,0,0.15)",
    overflow: "hidden",
    width: "100%",
    boxSizing: "border-box" as const,
    ...(WRAP_STYLES[type] ?? {}),
  };

  return (
    <>
      <InjectStyles />
      {type === "flow"       && <div style={base}><FlowVisual       title={title} block={block} /></div>}
      {type === "hierarchy"  && <div style={base}><HierarchyVisual  title={title} block={block} /></div>}
      {type === "comparison" && <div style={base}><ComparisonVisual title={title} block={block} /></div>}
      {type === "cycle"      && <div style={base}><CycleVisual      title={title} block={block} /></div>}
      {!["flow","hierarchy","comparison","cycle"].includes(type) && (
        <div className="vr-unsupported" style={base}>
          Unsupported visual type: <strong>{type || "(none)"}</strong>
        </div>
      )}
    </>
  );
}