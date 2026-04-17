"use client";

import { useState, useRef, useEffect } from "react";

// Markdown → HTML parser
function parseMarkdown(text) {
  return text
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code>$1</code>")
    .replace(/!\[.*?\]\(.*?\)/g, "")                                  // strip images
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/^\d+\. (.+)$/gm, "<li>$1</li>")
    .replace(/^[\*\-] (.+)$/gm, "<li>$1</li>")
    .replace(/(<li>[\s\S]*?<\/li>)(\n<li>[\s\S]*?<\/li>)*/g, (m) => `<ul>${m}</ul>`)
    .replace(/\n(?!<[huo])/g, "<br/>");
}

function MarkdownBubble({ text }) {
  return (
    <div
      className="chat-md"
      dangerouslySetInnerHTML={{ __html: parseMarkdown(text) }}
      style={{ fontSize: 13, lineHeight: 1.65, color: "inherit" }}
    />
  );
}

const BOT_ICON = (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="#6c57f7">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
  </svg>
);

export default function FloatingChatbot({ subjectId }) {
  const [open, setOpen] = useState(false);
  const [maximized, setMaximized] = useState(false);
  const [messages, setMessages] = useState([
    { role: "bot", text: "Hi there! Ask me anything about your subject." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: "user", text: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subjectId, message: input }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "bot", text: data.reply || "No response" }]);
    } catch {
      setMessages((prev) => [...prev, { role: "bot", text: "Something went wrong. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  // Panel size switches between compact and fullscreen
 const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

const panelStyle = maximized
  ? {
      position: isMobile ? "fixed" : "fixed",
      top: isMobile ? "auto" : 0,
      left: isMobile ? "auto" : 0,
      right: 0,
      bottom: 0,
      width: isMobile ? "100%" : "100%",
      height: isMobile ? "85vh" : "100vh",   // 🔥 NOT full screen on mobile
      borderRadius: isMobile ? "16px 16px 0 0" : 0,
      background: "#fff",
      display: "flex",
      flexDirection: "column",
      zIndex: 999,
    }
  : {
      position: "fixed",
      bottom: 24,
      right: 24,
      width: isMobile ? "90%" : 340,
      height: isMobile ? "70vh" : 500,
      borderRadius: 16,
      background: "#fff",
      border: "1px solid rgba(0,0,0,0.08)",
      boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      zIndex: 100,
    };

  const innerMax = maximized ? { maxWidth: 720, margin: "0 auto", width: "100%", boxSizing: "border-box" } : {};

  return (
    <>
      {/* FAB */}
      {!open && (
        <button onClick={() => setOpen(true)} style={s.fab}>
          <svg viewBox="0 0 24 24" width="22" height="22" fill="white">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" />
          </svg>
        </button>
      )}

      {/* Panel */}
      {open && (
        <div style={panelStyle}>
          {/* Header */}
          <div style={{ ...s.header, ...(maximized ? { borderRadius: 0 } : {}) }}>
            <div style={s.headerLeft}>
              <div style={s.avatar}>{BOT_ICON}</div>
              <div>
                <p style={s.headerTitle}>Ask a doubt</p>
                <p style={s.headerSub}><span style={s.dot} />Online</p>
              </div>
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              <button onClick={() => setMaximized((v) => !v)} style={s.iconBtn} title={maximized ? "Minimize" : "Expand"}>
                {maximized
                  ? <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="10" y1="14" x2="3" y2="21"/><line x1="21" y1="3" x2="14" y2="10"/></svg>
                  : <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
                }
              </button>
              <button onClick={() => { setOpen(false); setMaximized(false); }} style={s.iconBtn}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "14px 12px", display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={innerMax}>
              {messages.map((m, i) => (
                <div key={i} style={{ ...s.msgRow, justifyContent: m.role === "user" ? "flex-end" : "flex-start", marginBottom: 12 }}>
                  {m.role === "bot" && <div style={s.botIcon}>{BOT_ICON}</div>}
                  <div style={{ ...s.bubble, ...(m.role === "user" ? s.userBubble : s.botBubble), maxWidth: maximized ? "65%" : "78%" }}>
                    {m.role === "bot" ? <MarkdownBubble text={m.text} /> : m.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div style={{ ...s.msgRow, justifyContent: "flex-start" }}>
                  <div style={s.botIcon}>{BOT_ICON}</div>
                  <div style={{ ...s.bubble, ...s.botBubble }}>
                    <div style={s.typing}>
                      {[0, 0.15, 0.3].map((d, i) => <span key={i} style={{ ...s.typingDot, animationDelay: `${d}s` }} />)}
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input */}
          <div style={{ ...s.inputRow }}>
            <div style={{ ...innerMax, display: "flex", gap: 8, alignItems: "center", padding: maximized ? "10px 0" : 0, width: "100%" }}>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="Type your question..."
                style={s.input}
              />
              <button onClick={send} disabled={loading} style={s.sendBtn}>
                <svg viewBox="0 0 24 24" width="15" height="15" fill="white">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-5px)} }
        .chat-md h1{font-size:16px;font-weight:600;margin:10px 0 5px}
        .chat-md h2{font-size:15px;font-weight:600;margin:8px 0 4px}
        .chat-md h3{font-size:14px;font-weight:600;margin:6px 0 3px;color:#6c57f7}
        .chat-md ul{margin:6px 0;padding-left:20px}
        .chat-md li{margin-bottom:5px}
        .chat-md strong{font-weight:600}
        .chat-md em{font-style:italic}
        .chat-md code{background:rgba(0,0,0,0.07);border-radius:4px;padding:1px 5px;font-family:'Space Grotesk';font-size:12px}
        .chat-md a{color:#6c57f7;text-decoration:underline}
      `}</style>
    </>
  );
}

const s = {
  fab: { position:"fixed", bottom:24, right:24, width:52, height:52, borderRadius:"50%", background:"#6c57f7", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 4px 14px rgba(108,87,247,0.4)", zIndex:9999 },
  header: { padding:"12px 14px", borderBottom:"1px solid rgba(0,0,0,0.07)", display:"flex", alignItems:"center", justifyContent:"space-between", background:"#fff", flexShrink:0 },
  headerLeft: { display:"flex", alignItems:"center", gap:10 },
  avatar: { width:32, height:32, borderRadius:"50%", background:"#ede9fe", display:"flex", alignItems:"center", justifyContent:"center" },
  headerTitle: { margin:0, fontSize:14, fontWeight:500, color:"#111" },
  headerSub: { margin:0, fontSize:11, color:"#22c55e", display:"flex", alignItems:"center", gap:4 },
  dot: { display:"inline-block", width:6, height:6, borderRadius:"50%", background:"#22c55e" },
  iconBtn: { background:"none", border:"none", cursor:"pointer", color:"#888", padding:4, borderRadius:6, display:"flex", alignItems:"center" },
  msgRow: { display:"flex", alignItems:"flex-end", gap:7 },
  botIcon: { width:24, height:24, borderRadius:"50%", background:"#ede9fe", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, alignSelf:"flex-start", marginTop:2 },
  bubble: { padding:"9px 13px", borderRadius:14, wordBreak:"break-word" },
  userBubble: { background:"#6c57f7", color:"#fff", borderBottomRightRadius:4, fontSize:13, lineHeight:1.5 },
  botBubble: { background:"#f5f4f8", color:"#111", border:"1px solid rgba(0,0,0,0.06)", borderBottomLeftRadius:4 },
  typing: { display:"flex", gap:4, alignItems:"center", padding:"2px 0" },
  typingDot: { width:6, height:6, borderRadius:"50%", background:"#a78bfa", display:"inline-block", animation:"bounce 1s infinite" },
  inputRow: { padding:"10px 12px", borderTop:"1px solid rgba(0,0,0,0.07)", background:"#fff", flexShrink:0, display:"flex" },
  input: { flex:1, border:"1px solid rgba(0,0,0,0.12)", borderRadius:20, padding:"9px 16px", fontSize:13, outline:"none", background:"#f9f8fc", color:"#111" },
  sendBtn: { width:36, height:36, borderRadius:"50%", background:"#6c57f7", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 },
};