import { useState, useRef, useEffect } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { doc, getDoc } from "firebase/firestore";
import { db, auth } from "../firebase";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

function AIAssistant() {
  const [healthData, setHealthData] = useState(null);
  const [messages, setMessages]     = useState([]);
  const [input, setInput]           = useState("");
  const [loading, setLoading]       = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const docRef  = doc(db, "users", auth.currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) setHealthData(docSnap.data().healthData);
      } catch (e) { console.log(e); }
    };
    fetchData();
  }, []);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const msg = input.trim();
    setInput("");
    const history = [...messages, { role: "user", text: msg }];
    setMessages(history);
    setLoading(true);

    try {
      const d = healthData;
      const ctx = `User health data: HR=${d?.heartRate || 72}bpm, Sleep=${d?.sleep || 6.4}h, Calories=${d?.calories || 1840}kcal, Water=${d?.water || 1.8}L.`;
      const msgs = history.map(m => ({ role: m.role === "user" ? "user" : "assistant", content: m.text }));

      const prompt = `You are VitalAI, a brilliant personal health AI. ${ctx} Be warm, specific, and concise (2-3 sentences max unless more detail is requested). You have full access to the user's real-time health data — never say otherwise.\n\nConversation:\n${history.map(m => `${m.role === "user" ? "User" : "AI"}: ${m.text}`).join("\n")}`;
      const result = await model.generateContent(prompt);
      const reply = result.response?.text?.() || "I'm here to help!";
      setMessages([...history, { role: "ai", text: reply }]);
    } catch {
      setMessages([...history, { role: "ai", text: "Connection issue. Please retry." }]);
    }
    setLoading(false);
  };

  const card = { background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 20, padding: "18px 22px", backdropFilter: "blur(10px)" };
  const btn  = (c = "#52D68A") => ({ background: `${c}1A`, border: `1px solid ${c}44`, color: c, borderRadius: 10, padding: "9px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "opacity .2s, transform .2s", fontFamily: "inherit" });

  const SUGGESTIONS = [
    "Why is my stress score high today?",
    "How can I improve my HRV?",
    "Should I work out tonight?",
    "What's causing my poor sleep?",
    "Give me a personalised morning routine.",
    "How much water should I drink today?",
  ];

  return (
    <div className="assistant-shell" style={{ display: "flex", minHeight: "100vh", background: "#080C14", color: "#E8EDF5", fontFamily: "'DM Sans','Segoe UI',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:rgba(255,255,255,.1);border-radius:2px}
        button:hover{opacity:.82;transform:translateY(-1px)}
        @keyframes vt-dot{0%,100%{opacity:.25}50%{opacity:.8}}
        @keyframes vt-spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
        @media (max-width: 900px) {
          .assistant-shell { flex-direction: column !important; }
          .assistant-sidebar { width: 100% !important; border-right: none !important; border-bottom: 1px solid rgba(255,255,255,.06) !important; }
          .assistant-main { padding: 18px 16px !important; }
          .assistant-suggestions-grid { grid-template-columns: 1fr !important; padding-left: 0 !important; }
          .assistant-chat-bubble { max-width: 100% !important; }
          .assistant-input-row { flex-direction: column !important; }
          .assistant-input-row input,
          .assistant-input-row button { width: 100% !important; }
        }
      `}</style>

      {/* Ambient */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: -200, right: -100, width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle,rgba(82,214,138,.04) 0%,transparent 70%)" }} />
      </div>

      {/* Sidebar */}
      <div className="assistant-sidebar" style={{ width: 210, background: "rgba(255,255,255,.025)", borderRight: "1px solid rgba(255,255,255,.06)", display: "flex", flexDirection: "column", padding: "26px 14px", gap: 6, flexShrink: 0, zIndex: 10, backdropFilter: "blur(20px)" }}>
        <a href="/dashboard" style={{ textDecoration: "none" }}>
          <div style={{ fontSize: 21, fontWeight: 900, letterSpacing: "-0.02em", background: "linear-gradient(135deg,#52D68A,#4ECDC4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: 28, paddingLeft: 8, cursor: "pointer" }}>VitalAI</div>
        </a>
        {[
          { label: "Dashboard",    icon: "◈", href: "/dashboard"  },
          { label: "AI Assistant", icon: "◆", href: "/assistant"  },
        ].map((l, i) => (
          <a key={i} href={l.href} style={{ textDecoration: "none" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "9px 11px", borderRadius: 11, background: l.href === "/assistant" ? "rgba(82,214,138,.11)" : "transparent", border: l.href === "/assistant" ? "1px solid rgba(82,214,138,.24)" : "1px solid transparent", color: l.href === "/assistant" ? "#52D68A" : "rgba(255,255,255,.45)", fontSize: 13, fontWeight: l.href === "/assistant" ? 600 : 400, cursor: "pointer" }}>
              <span>{l.icon}</span><span>{l.label}</span>
            </div>
          </a>
        ))}

        <div style={{ flex: 1 }} />

        {/* Health snapshot */}
        <div style={{ ...card, padding: "12px 14px" }}>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,.33)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>Live Data</div>
          {[
            { label: "Heart Rate", value: `${healthData?.heartRate || 72} BPM`, color: "#FF6B6B" },
            { label: "Sleep",      value: `${healthData?.sleep || 6.4}h`,        color: "#B8A9E0" },
            { label: "Water",      value: `${healthData?.water || 1.8}L`,        color: "#4ECDC4" },
          ].map((s, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,.38)" }}>{s.label}</span>
              <span style={{ fontSize: 11, color: s.color, fontFamily: "monospace", fontWeight: 700 }}>{s.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main chat area */}
      <div className="assistant-main" style={{ flex: 1, display: "flex", flexDirection: "column", padding: "30px 36px", gap: 20, overflow: "hidden", position: "relative", zIndex: 1 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: "-0.03em", margin: 0, background: "linear-gradient(135deg,#fff 60%,rgba(255,255,255,.4))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>AI Health Assistant</h1>
          <p style={{ margin: "4px 0 0", color: "rgba(255,255,255,.33)", fontSize: 13 }}>Ask anything — I have access to your real-time health data.</p>
        </div>

        {/* Chat window */}
        <div style={{ flex: 1, ...card, display: "flex", flexDirection: "column", overflow: "hidden", minHeight: 0 }}>
          <div style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column", gap: 10, paddingBottom: 8 }}>

            {/* Empty state with suggestions */}
            {messages.length === 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
                <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg,#52D68A,#4ECDC4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>◆</div>
                  <div style={{ ...card, padding: "12px 16px", flex: 1 }}>
                    <p style={{ margin: 0, color: "rgba(255,255,255,.75)", fontSize: 14, lineHeight: 1.6 }}>
                      Hello! I'm your VitalAI health assistant. I can see your real-time health metrics and help you understand patterns, suggest improvements, and answer any health questions. What would you like to know?
                    </p>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,.28)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4, paddingLeft: 52 }}>Try asking…</div>
                <div className="assistant-suggestions-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, paddingLeft: 52 }}>
                  {SUGGESTIONS.map((q, i) => (
                    <button key={i} onClick={() => setInput(q)}
                      style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 10, padding: "9px 13px", color: "rgba(255,255,255,.55)", fontSize: 12, cursor: "pointer", textAlign: "left", fontFamily: "inherit" }}>
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Messages */}
            {messages.map((m, i) => (
              <div key={i} style={{ display: "flex", gap: 10, justifyContent: m.role === "user" ? "flex-end" : "flex-start", alignItems: "flex-end" }}>
                {m.role === "ai" && (
                  <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg,#52D68A,#4ECDC4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>◆</div>
                )}
                <div className="assistant-chat-bubble" style={{ maxWidth: "72%", padding: "11px 16px", borderRadius: m.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px", background: m.role === "user" ? "rgba(82,214,138,.13)" : "rgba(255,255,255,.06)", border: `1px solid ${m.role === "user" ? "rgba(82,214,138,.22)" : "rgba(255,255,255,.07)"}`, color: "rgba(255,255,255,.85)", fontSize: 14, lineHeight: 1.65 }}>
                  {m.text}
                </div>
                {m.role === "user" && (
                  <div style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(255,255,255,.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>👤</div>
                )}
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
                <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg,#52D68A,#4ECDC4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>◆</div>
                <div style={{ padding: "12px 16px", borderRadius: "18px 18px 18px 4px", background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.07)", display: "flex", gap: 5, alignItems: "center" }}>
                  {[0, 1, 2].map(i => <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: "#52D68A", animation: `vt-dot 1.1s ease-in-out ${i * 0.18}s infinite` }} />)}
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input bar */}
          <div className="assistant-input-row" style={{ display: "flex", gap: 10, borderTop: "1px solid rgba(255,255,255,.06)", paddingTop: 14, marginTop: 4 }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendMessage()}
              placeholder="Ask about your health…"
              style={{ flex: 1, background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 12, padding: "11px 16px", color: "#fff", fontSize: 14, outline: "none", fontFamily: "inherit", transition: "border-color .2s" }}
            />
            <button onClick={sendMessage} disabled={loading}
              style={{ ...btn("#52D68A"), padding: "11px 24px", borderRadius: 12, opacity: loading ? 0.5 : 1 }}>
              {loading ? "…" : "Send"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AIAssistant;