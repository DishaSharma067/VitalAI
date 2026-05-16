import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import HealthChart from "../charts/HealthChart";
import { useEffect, useState, useRef } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db, auth } from "../firebase";

// ── Mock weekly data ─────────────────────────────────────────────
const WEEKLY_DATA = [
  { day: "Mon", hr: 68, sleep: 7.2, steps: 9100, stress: 30, calories: 2100 },
  { day: "Tue", hr: 75, sleep: 5.8, steps: 6200, stress: 55, calories: 1780 },
  { day: "Wed", hr: 71, sleep: 6.9, steps: 8400, stress: 35, calories: 1950 },
  { day: "Thu", hr: 80, sleep: 5.1, steps: 5600, stress: 70, calories: 2300 },
  { day: "Fri", hr: 69, sleep: 7.5, steps: 10200, stress: 25, calories: 1820 },
  { day: "Sat", hr: 66, sleep: 8.1, steps: 11500, stress: 20, calories: 1650 },
  { day: "Sun", hr: 72, sleep: 6.4, steps: 7342, stress: 38, calories: 1840 },
];

const HEALTH_FORECAST = [
  { day: "Today", icon: "⚡", label: "High Energy", score: 74, color: "#F7C948" },
  { day: "Mon",   icon: "🌤", label: "Good",        score: 81, color: "#4ECDC4" },
  { day: "Tue",   icon: "⛈", label: "Fatigued",    score: 52, color: "#FF6B6B" },
  { day: "Wed",   icon: "🌥", label: "Recovery",    score: 63, color: "#A8DADC" },
  { day: "Thu",   icon: "☀", label: "Peak",         score: 88, color: "#52D68A" },
];

const SMART_DEVICES = [
  { id: 1, name: "Bedroom Lights", icon: "💡", status: "on",  brightness: 30, color: "#FF6B35", room: "Bedroom",     type: "light"      },
  { id: 2, name: "Living Room",    icon: "🏠", status: "on",  brightness: 70, color: "#4ECDC4", room: "Living Room", type: "light"      },
  { id: 3, name: "Thermostat",     icon: "🌡️", status: "on",  temp: 20,                          room: "Home",        type: "thermostat" },
  { id: 4, name: "AC Unit",        icon: "❄️", status: "off", temp: 22,                          room: "Bedroom",     type: "ac"         },
  { id: 5, name: "Smart Speaker",  icon: "🔊", status: "on",  volume: 40,                        room: "Living Room", type: "speaker"    },
  { id: 6, name: "Humidifier",     icon: "💧", status: "off", humidity: 55,                      room: "Bedroom",     type: "humidifier" },
];

// ── Tiny helpers ─────────────────────────────────────────────────
function SparkLine({ data, color, height = 36 }) {
  const max = Math.max(...data), min = Math.min(...data), range = max - min || 1;
  const w = 110, h = height;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(" ");
  const id = `g${color.replace("#", "")}`;
  return (
    <svg width={w} height={h} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.5" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline points={`0,${h} ${pts} ${w},${h}`} fill={`url(#${id})`} stroke="none" />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function RadialProgress({ value, max = 100, size = 84, color, label, sublabel }) {
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (value / max) * circ;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)", position: "absolute", top: 0, left: 0 }}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="8" />
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color}
            strokeWidth="8" strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 5px ${color})`, transition: "stroke-dasharray 1s ease" }} />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <span style={{ color, fontSize: 15, fontWeight: 800, fontFamily: "monospace", lineHeight: 1 }}>{value}<span style={{ fontSize: 9 }}>{sublabel}</span></span>
          <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 9, letterSpacing: "0.06em", textTransform: "uppercase" }}>{label}</span>
        </div>
      </div>
    </div>
  );
}

function PulsingOrb({ size = 100, bpm = 72, color = "#52D68A" }) {
  return (
    <div style={{ position: "relative", width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <style>{`
        @keyframes vt-ring { 0%{transform:scale(1);opacity:.5} 100%{transform:scale(1.9);opacity:0} }
        @keyframes vt-core { 0%,100%{transform:scale(1)} 50%{transform:scale(1.06)} }
      `}</style>
      {[0, 0.28, 0.56].map((d, i) => (
        <div key={i} style={{
          position: "absolute", width: "100%", height: "100%", borderRadius: "50%",
          border: `1.5px solid ${color}`,
          animation: `vt-ring ${60 / bpm}s ease-out ${d}s infinite`, opacity: 0,
        }} />
      ))}
      <div style={{
        width: "68%", height: "68%", borderRadius: "50%",
        background: `radial-gradient(circle at 35% 35%, ${color}99, ${color}22)`,
        boxShadow: `0 0 28px ${color}55, inset 0 0 16px ${color}18`,
        animation: `vt-core ${60 / bpm}s ease-in-out infinite`,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      }}>
        <span style={{ color, fontSize: size * 0.17, fontFamily: "monospace", fontWeight: 800 }}>{bpm}</span>
        <span style={{ color: `${color}88`, fontSize: size * 0.1 }}>BPM</span>
      </div>
    </div>
  );
}

function SmartDeviceCard({ device, onToggle, onAdjust }) {
  const on = device.status === "on";
  return (
    <div onClick={() => onToggle(device.id)} style={{
      background: on ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.02)",
      border: `1px solid ${on ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.05)"}`,
      borderRadius: 16, padding: "14px 16px", cursor: "pointer",
      transition: "all 0.25s", position: "relative", overflow: "hidden",
    }}>
      {on && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: device.color || "#52D68A", boxShadow: `0 0 10px ${device.color || "#52D68A"}` }} />}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 20 }}>{device.icon}</div>
          <div style={{ color: on ? "#fff" : "rgba(255,255,255,0.35)", fontSize: 13, fontWeight: 600, marginTop: 5 }}>{device.name}</div>
          <div style={{ color: "rgba(255,255,255,0.28)", fontSize: 11, marginTop: 1 }}>{device.room}</div>
        </div>
        <div style={{ width: 34, height: 18, borderRadius: 9, padding: 2, background: on ? "#52D68A" : "rgba(255,255,255,0.15)", position: "relative", transition: "background 0.3s", boxShadow: on ? "0 0 10px #52D68A66" : "none", flexShrink: 0 }}>
          <div style={{ width: 14, height: 14, borderRadius: 7, background: "#fff", position: "absolute", top: 2, left: on ? 18 : 2, transition: "left 0.25s" }} />
        </div>
      </div>
      {on && device.type === "light" && (
        <div style={{ marginTop: 10 }} onClick={e => e.stopPropagation()}>
          <input type="range" min={5} max={100} value={device.brightness}
            onChange={e => onAdjust(device.id, "brightness", +e.target.value)}
            style={{ width: "100%", accentColor: device.color }} />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "rgba(255,255,255,0.3)" }}>
            <span>Brightness</span><span>{device.brightness}%</span>
          </div>
        </div>
      )}
      {on && device.type === "thermostat" && (
        <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }} onClick={e => e.stopPropagation()}>
          <button onClick={() => onAdjust(device.id, "temp", device.temp - 1)}
            style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", borderRadius: 6, width: 26, height: 26, cursor: "pointer", fontSize: 15 }}>−</button>
          <span style={{ color: "#F7C948", fontSize: 18, fontFamily: "monospace", fontWeight: 800 }}>{device.temp}°C</span>
          <button onClick={() => onAdjust(device.id, "temp", device.temp + 1)}
            style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", borderRadius: 6, width: 26, height: 26, cursor: "pointer", fontSize: 15 }}>+</button>
        </div>
      )}
    </div>
  );
}

// ── Main Dashboard ───────────────────────────────────────────────
function Dashboard() {
  const [healthData, setHealthData]       = useState(null);
  const [activeTab, setActiveTab]         = useState("dashboard");
  const [devices, setDevices]             = useState(SMART_DEVICES);
  const [weeklyReport, setWeeklyReport]   = useState("");
  const [reportLoading, setReportLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion]   = useState("");
  const [suggLoading, setSuggLoading]     = useState(false);
  const [breatheActive, setBreatheActive] = useState(false);
  const [breathePhase, setBreathePhase]   = useState("inhale");
  const [breatheCount, setBreatheCount]   = useState(0);
  const [chatMessages, setChatMessages]   = useState([]);
  const [chatInput, setChatInput]         = useState("");
  const [chatLoading, setChatLoading]     = useState(false);
  const chatEndRef = useRef(null);

  // Fetch Firebase health data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const docRef  = doc(db, "users", auth.currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) setHealthData(docSnap.data().healthData);
      } catch (e) { console.log("Data fetch:", e); }
    };
    fetchData();
  }, []);

  // Breathe exercise loop
  useEffect(() => {
    if (!breatheActive) return;
    const phases = [["inhale", 4000], ["hold", 4000], ["exhale", 6000]];
    let i = 0;
    const run = () => {
      setBreathePhase(phases[i][0]);
      const t = setTimeout(() => {
        i = (i + 1) % phases.length;
        if (i === 0) setBreatheCount(c => c + 1);
        run();
      }, phases[i][1]);
      return t;
    };
    const t = run();
    return () => clearTimeout(t);
  }, [breatheActive]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMessages]);

  const data = healthData;

  // ── Claude API call ──────────────────────────────────────────
  const callClaude = async (system, user) => {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514", max_tokens: 1000,
        system, messages: [{ role: "user", content: user }],
      }),
    });
    const d = await res.json();
    return d.content?.[0]?.text || "";
  };

  const generateWeeklyReport = async () => {
    setReportLoading(true);
    setActiveTab("report");
    try {
      const summary = WEEKLY_DATA.map(d =>
        `${d.day}: HR=${d.hr}bpm, Sleep=${d.sleep}h, Steps=${d.steps}, Stress=${d.stress}%, Calories=${d.calories}kcal`
      ).join("\n");
      const text = await callClaude(
        "You are VitalAI's health narrator. Write a warm, insightful weekly health story — like a letter from a personal health coach. Use 3-4 paragraphs. Be specific, empathetic, and actionable. No bullet points, no markdown headers. Flowing narrative prose that feels human.",
        `My health data this week:\n${summary}\nWrite my weekly health story.`
      );
      setWeeklyReport(text);
    } catch { setWeeklyReport("Could not generate report. Please check your connection and try again."); }
    setReportLoading(false);
  };

  const getSmartSuggestion = async () => {
    setSuggLoading(true);
    try {
      const devStatus = devices.map(d =>
        `${d.name}: ${d.status}${d.brightness ? `, brightness ${d.brightness}%` : ""}${d.temp ? `, ${d.temp}°C` : ""}`
      ).join("; ");
      const text = await callClaude(
        "You are a smart home health optimizer. Give ONE specific, actionable environment optimization based on the user's health data. Be concrete and friendly. Max 2 sentences.",
        `Health: HR=${data?.heartRate || 72}bpm, Sleep=${data?.sleep || 6.4}h, Stress=38%. Time: evening. Devices: ${devStatus}. What should I adjust?`
      );
      setAiSuggestion(text);
    } catch { setAiSuggestion("Could not fetch suggestion. Please try again."); }
    setSuggLoading(false);
  };

  const sendChat = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const msg = chatInput.trim();
    setChatInput("");
    const history = [...chatMessages, { role: "user", text: msg }];
    setChatMessages(history);
    setChatLoading(true);
    try {
      const ctx = `User health data: HR=${data?.heartRate || 72}bpm, Sleep=${data?.sleep || 6.4}h, Calories=${data?.calories || 1840}kcal, Water=${data?.water || 1.8}L.`;
      const msgs = history.map(m => ({ role: m.role === "user" ? "user" : "assistant", content: m.text }));
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514", max_tokens: 1000,
          system: `You are VitalAI, a personal health AI assistant. ${ctx} Be warm, specific, and concise (2-3 sentences). You have full access to the user's data.`,
          messages: msgs,
        }),
      });
      const d = await res.json();
      setChatMessages([...history, { role: "ai", text: d.content?.[0]?.text || "I'm here to help!" }]);
    } catch { setChatMessages([...history, { role: "ai", text: "Connection issue. Please retry." }]); }
    setChatLoading(false);
  };

  const toggleDevice  = (id)           => setDevices(ds => ds.map(d => d.id === id ? { ...d, status: d.status === "on" ? "off" : "on" } : d));
  const adjustDevice  = (id, key, val) => setDevices(ds => ds.map(d => d.id === id ? { ...d, [key]: val } : d));

  // ── Shared style helpers ──────────────────────────────────────
  const card = { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: "18px 22px", backdropFilter: "blur(10px)", position: "relative", overflow: "hidden" };
  const secTitle = { fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.38)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 14 };
  const btn = (c = "#52D68A") => ({ background: `${c}1A`, border: `1px solid ${c}44`, color: c, borderRadius: 10, padding: "9px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "opacity .2s, transform .2s" });

  const tabs = [
    { id: "dashboard", label: "Dashboard",    icon: "◈" },
    { id: "analytics", label: "Analytics",    icon: "∿" },
    { id: "smarthome", label: "Smart Home",   icon: "⌂" },
    { id: "breathe",   label: "Breathe",      icon: "◉" },
    { id: "report",    label: "Weekly Story", icon: "✦" },
    { id: "chat",      label: "AI Chat",      icon: "◆" },
  ];

  // ── Tab renders ───────────────────────────────────────────────

  const renderDashboard = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ fontSize: 30, fontWeight: 900, letterSpacing: "-0.03em", margin: 0, background: "linear-gradient(135deg,#fff 60%,rgba(255,255,255,.4))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Good Evening</h1>
          <p style={{ margin: "3px 0 0", color: "rgba(255,255,255,.33)", fontSize: 13 }}>Saturday, May 16 · Real-time wellness</p>
        </div>
        <div style={{ ...card, padding: "12px 18px", textAlign: "right" }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,.38)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Body Budget</div>
          <div style={{ fontSize: 34, fontWeight: 900, color: "#52D68A", fontFamily: "monospace", lineHeight: 1, marginTop: 2, textShadow: "0 0 18px #52D68A55" }}>74</div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,.28)" }}>out of 100</div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="dashboard-stats-grid" style={{ display: "grid", gap: 12 }}>
        {[
          { label: "Heart Rate", value: data?.heartRate || 72, unit: "BPM",  color: "#FF6B6B", spark: WEEKLY_DATA.map(d => d.hr),                     icon: "♥" },
          { label: "Sleep",      value: data?.sleep     || 6.4,unit: "hrs",  color: "#B8A9E0", spark: WEEKLY_DATA.map(d => d.sleep),                   icon: "◗" },
          { label: "Calories",   value: data?.calories  || 1840,unit: "kcal",color: "#F7C948", spark: WEEKLY_DATA.map(d => d.calories / 100),           icon: "◈" },
          { label: "Hydration",  value: data?.water     || 1.8, unit: "L",   color: "#4ECDC4", spark: [1.2,1.5,1.8,1.3,2.0,1.9,1.8],                   icon: "◉" },
        ].map((m, i) => (
          <div key={i} style={{ ...card, display: "flex", flexDirection: "column", gap: 7 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "rgba(255,255,255,.38)", fontSize: 11 }}>{m.label}</span>
              <span style={{ color: m.color, fontSize: 14 }}>{m.icon}</span>
            </div>
            <div style={{ fontFamily: "monospace", fontSize: 26, fontWeight: 800, color: m.color, textShadow: `0 0 14px ${m.color}44`, lineHeight: 1 }}>
              {m.value}<span style={{ fontSize: 12, fontWeight: 400, color: `${m.color}88` }}> {m.unit}</span>
            </div>
            <SparkLine data={m.spark} color={m.color} />
          </div>
        ))}
      </div>

      {/* Middle row */}
      <div className="dashboard-row-grid" style={{ display: "grid", gap: 12 }}>
        {/* Heart orb */}
        <div style={{ ...card, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, gap: 10 }}>
          <div style={secTitle}>Live Heart Rate</div>
          <PulsingOrb size={105} bpm={Number(data?.heartRate) || 72} color="#FF6B6B" />
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <span style={{ background: "#52D68A22", color: "#52D68A", border: "1px solid #52D68A44", borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 600 }}>Normal Zone</span>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,.28)" }}>HRV: 42ms</span>
          </div>
        </div>

        {/* Radial gauges */}
        <div style={{ ...card }}>
          <div style={secTitle}>Vitals</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, placeItems: "center" }}>
            <RadialProgress value={38}  label="Stress" sublabel="%" color="#F7C948" />
            <RadialProgress value={97}  label="SpO₂"   sublabel="%" color="#4ECDC4" />
            <RadialProgress value={73}  label="Steps"  sublabel="k" color="#52D68A" />
            <RadialProgress value={42} max={80} label="HRV" sublabel="ms" color="#B8A9E0" />
          </div>
        </div>

        {/* Forecast */}
        <div style={{ ...card }}>
          <div style={secTitle}>Health Forecast</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {HEALTH_FORECAST.map((f, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 10px", borderRadius: 10, background: i === 0 ? "rgba(255,255,255,.05)" : "transparent" }}>
                <span style={{ fontSize: 16, width: 22 }}>{f.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 12, color: i === 0 ? "#fff" : "rgba(255,255,255,.5)", fontWeight: i === 0 ? 600 : 400 }}>{f.day}</span>
                    <span style={{ fontSize: 11, color: f.color }}>{f.label}</span>
                  </div>
                  <div style={{ height: 3, background: "rgba(255,255,255,.06)", borderRadius: 3, marginTop: 4 }}>
                    <div style={{ height: "100%", width: `${f.score}%`, background: f.color, borderRadius: 3, boxShadow: `0 0 5px ${f.color}` }} />
                  </div>
                </div>
                <span style={{ fontSize: 11, color: f.color, fontFamily: "monospace", fontWeight: 700, width: 26, textAlign: "right" }}>{f.score}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Chart + actions */}
      <div className="dashboard-chart-grid" style={{ display: "grid", gap: 12 }}>
        <div style={{ ...card }}>
          <div style={secTitle}>Health Analytics</div>
          <div style={{ height: 240 }}><HealthChart /></div>
        </div>
        <div style={{ ...card }}>
          <div style={secTitle}>Quick Actions</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
            {[
              { label: "Breathing",    icon: "◉", color: "#4ECDC4", action: () => setActiveTab("breathe") },
              { label: "Smart Home",   icon: "⌂", color: "#52D68A", action: () => setActiveTab("smarthome") },
              { label: "Weekly Story", icon: "✦", color: "#B8A9E0", action: generateWeeklyReport },
              { label: "AI Chat",      icon: "◆", color: "#F7C948", action: () => setActiveTab("chat") },
            ].map((a, i) => (
              <button key={i} onClick={a.action} style={{ ...btn(a.color), display: "flex", alignItems: "center", gap: 8, padding: "12px 14px", borderRadius: 14 }}>
                <span style={{ fontSize: 16 }}>{a.icon}</span><span>{a.label}</span>
              </button>
            ))}
          </div>
          <div style={{ padding: "11px 14px", background: "rgba(82,214,138,.05)", borderRadius: 12, border: "1px solid rgba(82,214,138,.15)" }}>
            <div style={{ fontSize: 11, color: "#52D68A", fontWeight: 600, marginBottom: 3 }}>◈ SLEEP PREP IN 2H</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,.4)" }}>Smart home auto-optimises at 10:00 PM</div>
          </div>
        </div>
      </div>

      {/* AI Insights */}
      <div style={{ ...card }}>
        <div style={secTitle}>AI Insights</div>
        <div className="dashboard-ai-grid" style={{ display: "grid", gap: 10 }}>
          {[
            { icon: "⚠", color: "#F7C948", text: "Sleep dropped 12% — 2 nights under 6h. Aim for 10 PM bedtime tonight.", tag: "Action" },
            { icon: "✓", color: "#52D68A", text: "Hydration improving consistently. You're on a 4-day water streak!", tag: "Win" },
            { icon: "◈", color: "#4ECDC4", text: "HRV of 42ms suggests mild recovery deficit. Light activity recommended.", tag: "Recovery" },
          ].map((ins, i) => (
            <div key={i} style={{ display: "flex", gap: 10, padding: "12px 14px", background: "rgba(255,255,255,.03)", borderRadius: 12, border: "1px solid rgba(255,255,255,.05)" }}>
              <span style={{ color: ins.color, fontSize: 15, marginTop: 1 }}>{ins.icon}</span>
              <div style={{ flex: 1 }}>
                <span style={{ color: "rgba(255,255,255,.7)", fontSize: 13, lineHeight: 1.5 }}>{ins.text}</span>
              </div>
              <span style={{ background: `${ins.color}1A`, color: ins.color, border: `1px solid ${ins.color}33`, borderRadius: 20, padding: "2px 8px", fontSize: 10, fontWeight: 600, height: "fit-content", whiteSpace: "nowrap" }}>{ins.tag}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <h2 style={{ fontSize: 26, fontWeight: 900, margin: 0, letterSpacing: "-0.02em" }}>Analytics</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
        {[
          { label: "Sleep Quality Score", value: "71%",  trend: "↓ 12% this week", color: "#B8A9E0" },
          { label: "Recovery Index",      value: "63",   trend: "Moderate load",    color: "#4ECDC4" },
          { label: "Activity Consistency",value: "5/7",  trend: "Days active",      color: "#52D68A" },
        ].map((s, i) => (
          <div key={i} style={{ ...card }}>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,.38)" }}>{s.label}</div>
            <div style={{ fontSize: 34, fontWeight: 900, color: s.color, fontFamily: "monospace", margin: "8px 0 4px", textShadow: `0 0 18px ${s.color}44` }}>{s.value}</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,.33)" }}>{s.trend}</div>
          </div>
        ))}
      </div>
      <div style={{ ...card }}>
        <div style={secTitle}>Weekly Trend</div>
        <div style={{ display: "flex", gap: 6, alignItems: "flex-end", height: 80 }}>
          {WEEKLY_DATA.map((d, i) => (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{ width: "100%", height: (d.hr / 90) * 60, background: i === 6 ? "#FF6B6B" : "#FF6B6B44", borderRadius: 4, transition: "height .8s", boxShadow: i === 6 ? "0 0 10px #FF6B6B88" : "none" }} />
              <span style={{ fontSize: 9, color: "rgba(255,255,255,.35)" }}>{d.day}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ ...card, height: 300 }}>
        <div style={secTitle}>Health Chart</div>
        <HealthChart />
      </div>
    </div>
  );

  const renderSmartHome = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h2 style={{ fontSize: 26, fontWeight: 900, margin: 0, letterSpacing: "-0.02em" }}>Smart Home Health Loop</h2>
          <p style={{ margin: "4px 0 0", color: "rgba(255,255,255,.33)", fontSize: 13 }}>Your environment, optimised for your biology</p>
        </div>
        <button onClick={getSmartSuggestion} style={{ ...btn("#52D68A"), padding: "10px 20px" }}>{suggLoading ? "Analysing…" : "✦ AI Optimise"}</button>
      </div>

      {aiSuggestion && (
        <div style={{ ...card, border: "1px solid rgba(82,214,138,.28)", background: "rgba(82,214,138,.05)" }}>
          <div style={{ display: "flex", gap: 12 }}>
            <span style={{ fontSize: 18 }}>◆</span>
            <div>
              <div style={{ fontSize: 11, color: "#52D68A", fontWeight: 600, marginBottom: 5, letterSpacing: "0.08em" }}>AI RECOMMENDATION</div>
              <p style={{ margin: 0, color: "rgba(255,255,255,.8)", fontSize: 14, lineHeight: 1.6 }}>{aiSuggestion}</p>
            </div>
          </div>
        </div>
      )}

      <div style={{ ...card, background: "rgba(247,201,72,.04)", border: "1px solid rgba(247,201,72,.15)" }}>
        <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: "#F7C948", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>Sleep Prep Mode</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,.45)", marginTop: 4 }}>Auto-activates 10:00 PM · Dims lights, cools to 18°C, plays white noise</div>
          </div>
          <div style={{ width: 44, height: 24, borderRadius: 12, background: "#F7C948", position: "relative", cursor: "pointer", boxShadow: "0 0 14px #F7C94866", flexShrink: 0 }}>
            <div style={{ width: 20, height: 20, borderRadius: 10, background: "#fff", position: "absolute", top: 2, left: 22 }} />
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
        {devices.map(d => <SmartDeviceCard key={d.id} device={d} onToggle={toggleDevice} onAdjust={adjustDevice} />)}
      </div>

      <div style={{ ...card }}>
        <div style={secTitle}>Environment Health Score</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
          {[
            { label: "Light Quality", value: 72, unit: "%",  color: "#F7C948" },
            { label: "Temperature",   value: 20, unit: "°C", color: "#4ECDC4" },
            { label: "Humidity",      value: 48, unit: "%",  color: "#52D68A" },
            { label: "Noise Level",   value: 32, unit: "dB", color: "#B8A9E0" },
          ].map((e, i) => (
            <div key={i} style={{ background: "rgba(255,255,255,.03)", borderRadius: 14, padding: 14 }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,.33)", marginBottom: 7 }}>{e.label}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: e.color, fontFamily: "monospace" }}>{e.value}<span style={{ fontSize: 12 }}>{e.unit}</span></div>
              <div style={{ height: 3, background: "rgba(255,255,255,.06)", borderRadius: 3, marginTop: 8 }}>
                <div style={{ height: "100%", width: `${e.value}%`, background: e.color, borderRadius: 3 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderBreathe = () => {
    const phases = { inhale: { label: "Inhale", scale: 1.32, color: "#4ECDC4", dur: 4 }, hold: { label: "Hold", scale: 1.32, color: "#F7C948", dur: 4 }, exhale: { label: "Exhale", scale: 1, color: "#B8A9E0", dur: 6 } };
    const p = phases[breathePhase];
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 28, paddingTop: 32 }}>
        <div style={{ textAlign: "center" }}>
          <h2 style={{ fontSize: 26, fontWeight: 900, margin: 0 }}>Breathing Exercise</h2>
          <p style={{ color: "rgba(255,255,255,.35)", fontSize: 13, marginTop: 5 }}>4-4-6 Box Breathing · Reduces stress up to 40%</p>
        </div>
        <div style={{ position: "relative", width: 240, height: 240, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <style>{`@keyframes vt-breathe{0%,100%{opacity:.25}50%{opacity:.6}}`}</style>
          {breatheActive && [1, 2, 3].map(r => (
            <div key={r} style={{ position: "absolute", borderRadius: "50%", width: 240 - r * 28, height: 240 - r * 28, border: `1px solid ${p.color}`, transform: `scale(${p.scale})`, transition: `transform ${p.dur}s ease-in-out`, animation: `vt-breathe 3s ease-in-out ${r * 0.28}s infinite` }} />
          ))}
          <div style={{ width: 150, height: 150, borderRadius: "50%", background: `radial-gradient(circle at 35% 35%, ${breatheActive ? p.color : "#52D68A"}44, ${breatheActive ? p.color : "#52D68A"}11)`, border: `2px solid ${breatheActive ? p.color : "#52D68A"}55`, boxShadow: breatheActive ? `0 0 55px ${p.color}44` : "none", transform: breatheActive ? `scale(${p.scale})` : "scale(1)", transition: `all ${p.dur}s ease-in-out`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: breatheActive ? p.color : "#52D68A" }}>{breatheActive ? p.label : "Ready"}</div>
            {breatheActive && <div style={{ fontSize: 12, color: "rgba(255,255,255,.35)", marginTop: 3 }}>{p.dur}s</div>}
          </div>
        </div>
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <button onClick={() => { setBreatheActive(!breatheActive); if (breatheActive) { setBreatheCount(0); setBreathePhase("inhale"); } }}
            style={{ ...btn("#4ECDC4"), padding: "11px 30px", fontSize: 15, borderRadius: 14 }}>
            {breatheActive ? "Stop" : "Begin"}
          </button>
          {breatheActive && <span style={{ color: "rgba(255,255,255,.38)", fontSize: 13 }}>Cycle {breatheCount + 1}</span>}
        </div>
        {breatheCount > 0 && (
          <div style={{ ...card, width: "100%", maxWidth: 360, textAlign: "center" }}>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,.35)" }}>Completed</div>
            <div style={{ fontSize: 30, fontWeight: 900, color: "#4ECDC4", fontFamily: "monospace" }}>{breatheCount} {breatheCount === 1 ? "cycle" : "cycles"}</div>
            <div style={{ fontSize: 12, color: "#52D68A", marginTop: 3 }}>≈ {Math.round(breatheCount * 0.7)} min · Stress reduced</div>
          </div>
        )}
      </div>
    );
  };

  const renderReport = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 760 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h2 style={{ fontSize: 26, fontWeight: 900, margin: 0 }}>Your Weekly Health Story</h2>
          <p style={{ margin: "4px 0 0", color: "rgba(255,255,255,.33)", fontSize: 13 }}>Week of May 10–16, 2026</p>
        </div>
        <button onClick={generateWeeklyReport} style={{ ...btn("#B8A9E0"), padding: "10px 20px" }}>{reportLoading ? "Writing…" : "✦ Generate Story"}</button>
      </div>
      <div className="dashboard-week-grid" style={{ display: "grid", gap: 8 }}>
        {WEEKLY_DATA.map((d, i) => (
          <div key={i} style={{ ...card, padding: "10px 12px", textAlign: "center" }}>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,.33)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{d.day}</div>
            <div style={{ fontSize: 10, color: "#FF6B6B", marginTop: 5 }}>♥ {d.hr}</div>
            <div style={{ fontSize: 10, color: "#B8A9E0" }}>◗ {d.sleep}h</div>
            <div style={{ fontSize: 10, color: "#52D68A" }}>↑ {(d.steps / 1000).toFixed(1)}k</div>
          </div>
        ))}
      </div>
      <div style={{ ...card, minHeight: 220, border: "1px solid rgba(178,169,224,.2)", background: "rgba(178,169,224,.04)" }}>
        {reportLoading ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 200, gap: 14 }}>
            <style>{`@keyframes vt-spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
            <div style={{ width: 36, height: 36, border: "2px solid rgba(178,169,224,.2)", borderTop: "2px solid #B8A9E0", borderRadius: "50%", animation: "vt-spin 1s linear infinite" }} />
            <div style={{ color: "rgba(255,255,255,.35)", fontSize: 13 }}>VitalAI is writing your story…</div>
          </div>
        ) : weeklyReport ? (
          <div>
            <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 18 }}>
              <span style={{ fontSize: 18 }}>✦</span>
              <span style={{ color: "#B8A9E0", fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>AI-Generated Health Narrative</span>
            </div>
            <p style={{ color: "rgba(255,255,255,.8)", fontSize: 14, lineHeight: 1.85, margin: 0, whiteSpace: "pre-wrap" }}>{weeklyReport}</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 200, gap: 10 }}>
            <span style={{ fontSize: 36, opacity: .25 }}>✦</span>
            <div style={{ color: "rgba(255,255,255,.28)", fontSize: 13 }}>Click "Generate Story" to get your personalised weekly health narrative</div>
          </div>
        )}
      </div>
    </div>
  );

  const renderChat = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, height: "calc(100vh - 140px)" }}>
      <div>
        <h2 style={{ fontSize: 26, fontWeight: 900, margin: 0 }}>AI Health Assistant</h2>
        <p style={{ margin: "4px 0 0", color: "rgba(255,255,255,.33)", fontSize: 13 }}>Ask anything about your health data</p>
      </div>
      <div style={{ flex: 1, ...card, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column", gap: 10, paddingBottom: 10 }}>
          {chatMessages.length === 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 16 }}>
              <div style={{ textAlign: "center", color: "rgba(255,255,255,.22)", fontSize: 12, marginBottom: 6 }}>Try asking…</div>
              {["Why is my stress high today?", "How can I improve my HRV?", "Should I work out tonight?", "What's causing my poor sleep?"].map((q, i) => (
                <button key={i} onClick={() => setChatInput(q)} style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 12, padding: "9px 14px", color: "rgba(255,255,255,.55)", fontSize: 13, cursor: "pointer", textAlign: "left" }}>{q}</button>
              ))}
            </div>
          )}
          {chatMessages.map((m, i) => (
            <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
              <div style={{ maxWidth: "80%", padding: "11px 15px", borderRadius: m.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px", background: m.role === "user" ? "rgba(82,214,138,.14)" : "rgba(255,255,255,.06)", border: `1px solid ${m.role === "user" ? "rgba(82,214,138,.24)" : "rgba(255,255,255,.07)"}`, color: "rgba(255,255,255,.85)", fontSize: 14, lineHeight: 1.6 }}>{m.text}</div>
            </div>
          ))}
          {chatLoading && (
            <div style={{ display: "flex", gap: 5, padding: "11px 14px" }}>
              {[0,1,2].map(i => <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: "#52D68A", animation: `vt-breathe 1.1s ease-in-out ${i * 0.18}s infinite` }} />)}
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
        <div style={{ display: "flex", gap: 10, borderTop: "1px solid rgba(255,255,255,.06)", paddingTop: 14 }}>
          <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendChat()}
            placeholder="Ask about your health…"
            style={{ flex: 1, background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 12, padding: "10px 15px", color: "#fff", fontSize: 14, outline: "none", fontFamily: "inherit" }} />
          <button onClick={sendChat} style={{ ...btn("#52D68A"), padding: "10px 20px", borderRadius: 12 }}>Send</button>
        </div>
      </div>
    </div>
  );

  const tabContent = { dashboard: renderDashboard, analytics: renderAnalytics, smarthome: renderSmartHome, breathe: renderBreathe, report: renderReport, chat: renderChat };

  return (
    <div className="dashboard-shell" style={{ display: "flex", minHeight: "100vh", background: "#080C14", color: "#E8EDF5", fontFamily: "'DM Sans','Segoe UI',sans-serif", position: "relative" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:rgba(255,255,255,.1);border-radius:2px}
        input[type=range]{-webkit-appearance:none;height:3px;border-radius:3px;background:rgba(255,255,255,.1);outline:none;cursor:pointer}
        input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:12px;height:12px;border-radius:50%;cursor:pointer}
        button:hover{opacity:.82;transform:translateY(-1px)}
        @keyframes vt-breathe{0%,100%{opacity:.25}50%{opacity:.6}}
        @media (max-width: 900px) {
          .dashboard-shell { flex-direction: column !important; }
          .dashboard-sidebar { width: 100% !important; border-right: none !important; border-bottom: 1px solid rgba(255,255,255,.06) !important; }
          .dashboard-main { padding: 18px 16px !important; }
          .dashboard-stats-grid,
          .dashboard-row-grid,
          .dashboard-chart-grid,
          .dashboard-ai-grid,
          .dashboard-week-grid,
          .dashboard-smart-grid { grid-template-columns: 1fr !important; }
          .dashboard-row-grid > div,
          .dashboard-chart-grid > div,
          .dashboard-ai-grid > div,
          .dashboard-week-grid > div,
          .dashboard-smart-grid > div { min-width: 0; }
        }
      `}</style>

      {/* Ambient glow */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: -200, right: -200, width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle,rgba(82,214,138,.04) 0%,transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: -200, left: 80, width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle,rgba(78,205,196,.03) 0%,transparent 70%)" }} />
      </div>

      {/* Left nav */}
      <div className="dashboard-sidebar" style={{ width: 210, background: "rgba(255,255,255,.025)", borderRight: "1px solid rgba(255,255,255,.06)", display: "flex", flexDirection: "column", padding: "26px 14px", gap: 3, flexShrink: 0, zIndex: 10, backdropFilter: "blur(20px)" }}>
        <div style={{ fontSize: 21, fontWeight: 900, letterSpacing: "-0.02em", background: "linear-gradient(135deg,#52D68A,#4ECDC4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: 28, paddingLeft: 8 }}>VitalAI</div>
        {tabs.map(t => (
          <button key={t.id}
            onClick={() => { setActiveTab(t.id); if (t.id === "report" && !weeklyReport) generateWeeklyReport(); }}
            style={{ display: "flex", alignItems: "center", gap: 9, padding: "9px 11px", borderRadius: 11, cursor: "pointer", transition: "all .2s", background: activeTab === t.id ? "rgba(82,214,138,.11)" : "transparent", border: activeTab === t.id ? "1px solid rgba(82,214,138,.24)" : "1px solid transparent", color: activeTab === t.id ? "#52D68A" : "rgba(255,255,255,.45)", fontSize: 13, fontWeight: activeTab === t.id ? 600 : 400, fontFamily: "inherit" }}>
            <span style={{ width: 18, textAlign: "center" }}>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
        <div style={{ flex: 1 }} />
        {/* Live vitals mini */}
        <div style={{ padding: "12px", background: "rgba(255,255,255,.03)", borderRadius: 13, border: "1px solid rgba(255,255,255,.06)" }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <PulsingOrb size={34} bpm={Number(data?.heartRate) || 72} color="#FF6B6B" />
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#fff" }}>Live · {data?.heartRate || 72} BPM</div>
              <div style={{ fontSize: 11, color: "#52D68A" }}>SpO₂ 97%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="dashboard-main" style={{ flex: 1, overflow: "auto", padding: "30px 32px", position: "relative", zIndex: 1 }}>
        {(tabContent[activeTab] || renderDashboard)()}
      </div>
    </div>
  );
}

export default Dashboard;