import HealthChart from "../charts/HealthChart";
import { useEffect, useState, useRef } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db, auth } from "../firebase";
import { useNavigate } from "react-router-dom";

const groqAI = async (prompt) => {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1000
    })
  });
  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
};

const buildWeeklyData = (base) => {
  const hr  = Number(base?.heartRate) || 72;
  const sl  = Number(base?.sleep)     || 6.5;
  const cal = Number(base?.calories)  || 1800;
  const st  = 7000;
  return [
    { day: "Mon", hr: hr-4,  sleep: sl+0.8,  steps: st+2100, stress: 30, calories: cal+260  },
    { day: "Tue", hr: hr+3,  sleep: sl-0.6,  steps: st-800,  stress: 55, calories: cal-20   },
    { day: "Wed", hr: hr-1,  sleep: sl+0.5,  steps: st+1400, stress: 35, calories: cal+150  },
    { day: "Thu", hr: hr+8,  sleep: sl-1.3,  steps: st-1400, stress: 70, calories: cal+500  },
    { day: "Fri", hr: hr-3,  sleep: sl+1.1,  steps: st+3200, stress: 25, calories: cal+20   },
    { day: "Sat", hr: hr-6,  sleep: sl+1.7,  steps: st+4500, stress: 20, calories: cal-150  },
    { day: "Sun", hr: hr,    sleep: sl,       steps: st,      stress: 38, calories: cal      },
  ];
};

const FORECAST = [
  { day: "Today", icon: "⚡", label: "High Energy", score: 74, color: "#F7C948" },
  { day: "Mon",   icon: "🌤", label: "Good",        score: 81, color: "#4ECDC4" },
  { day: "Tue",   icon: "⛈", label: "Fatigued",    score: 52, color: "#FF6B6B" },
  { day: "Wed",   icon: "🌥", label: "Recovery",    score: 63, color: "#A8DADC" },
  { day: "Thu",   icon: "☀", label: "Peak",         score: 88, color: "#52D68A" },
];

const INIT_DEVICES = [
  { id:1, name:"Bedroom Lights", icon:"💡", status:"on",  brightness:30, color:"#FF6B35", room:"Bedroom",     type:"light"      },
  { id:2, name:"Living Room",    icon:"🏠", status:"on",  brightness:70, color:"#4ECDC4", room:"Living Room", type:"light"      },
  { id:3, name:"Thermostat",     icon:"🌡️", status:"on",  temp:20,                        room:"Home",        type:"thermostat" },
  { id:4, name:"AC Unit",        icon:"❄️", status:"off", temp:22,                        room:"Bedroom",     type:"ac"         },
  { id:5, name:"Smart Speaker",  icon:"🔊", status:"on",  volume:40,                      room:"Living Room", type:"speaker"    },
  { id:6, name:"Humidifier",     icon:"💧", status:"off", humidity:55,                    room:"Bedroom",     type:"humidifier" },
];

// ── UI helpers ───────────────────────────────────────────────────
function SparkLine({ data, color }) {
  const max = Math.max(...data), min = Math.min(...data), range = max-min||1;
  const w=100, h=32;
  const pts = data.map((v,i) => `${(i/(data.length-1))*w},${h-((v-min)/range)*h}`).join(" ");
  const id = "g"+color.replace("#","");
  return (
    <svg width={w} height={h} style={{ overflow:"visible", display:"block" }}>
      <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity=".4"/><stop offset="100%" stopColor={color} stopOpacity="0"/></linearGradient></defs>
      <polyline points={`0,${h} ${pts} ${w},${h}`} fill={`url(#${id})`} stroke="none"/>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function Radial({ value, max=100, size=80, color, label, unit }) {
  const r=(size-10)/2, circ=2*Math.PI*r, dash=Math.min(value/max,1)*circ;
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center" }}>
      <div style={{ position:"relative", width:size, height:size }}>
        <svg width={size} height={size} style={{ transform:"rotate(-90deg)", position:"absolute" }}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,.07)" strokeWidth="7"/>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="7" strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" style={{ filter:`drop-shadow(0 0 4px ${color})`, transition:"stroke-dasharray 1s ease" }}/>
        </svg>
        <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
          <span style={{ color, fontSize:13, fontWeight:800, fontFamily:"monospace", lineHeight:1 }}>{value}<span style={{ fontSize:9 }}>{unit}</span></span>
          <span style={{ color:"rgba(255,255,255,.3)", fontSize:9, textTransform:"uppercase", letterSpacing:"0.05em" }}>{label}</span>
        </div>
      </div>
    </div>
  );
}

function Orb({ size=90, bpm=72, color="#FF6B6B" }) {
  return (
    <div style={{ position:"relative", width:size, height:size, display:"flex", alignItems:"center", justifyContent:"center" }}>
      {[0,.3,.6].map((d,i) => <div key={i} style={{ position:"absolute", width:"100%", height:"100%", borderRadius:"50%", border:`1.5px solid ${color}`, animation:`vt-ring ${60/bpm}s ease-out ${d}s infinite`, opacity:0 }}/>)}
      <div style={{ width:"66%", height:"66%", borderRadius:"50%", background:`radial-gradient(circle at 35% 35%,${color}99,${color}22)`, boxShadow:`0 0 22px ${color}44`, animation:`vt-core ${60/bpm}s ease-in-out infinite`, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
        <span style={{ color, fontSize:size*.17, fontFamily:"monospace", fontWeight:800, lineHeight:1 }}>{bpm}</span>
        <span style={{ color:`${color}88`, fontSize:size*.1 }}>BPM</span>
      </div>
    </div>
  );
}

function DevCard({ d, onToggle, onAdjust }) {
  const on = d.status==="on";
  return (
    <div onClick={() => onToggle(d.id)} style={{ background:on?"rgba(255,255,255,.07)":"rgba(255,255,255,.02)", border:`1px solid ${on?"rgba(255,255,255,.13)":"rgba(255,255,255,.05)"}`, borderRadius:16, padding:"13px 15px", cursor:"pointer", transition:"all .25s", position:"relative", overflow:"hidden" }}>
      {on && <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:d.color||"#52D68A", boxShadow:`0 0 8px ${d.color||"#52D68A"}` }}/>}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
        <div>
          <div style={{ fontSize:18 }}>{d.icon}</div>
          <div style={{ color:on?"#fff":"rgba(255,255,255,.3)", fontSize:12, fontWeight:600, marginTop:5 }}>{d.name}</div>
          <div style={{ color:"rgba(255,255,255,.24)", fontSize:10, marginTop:1 }}>{d.room}</div>
        </div>
        <div style={{ width:32, height:17, borderRadius:9, padding:2, background:on?"#52D68A":"rgba(255,255,255,.15)", position:"relative", transition:"background .25s", flexShrink:0 }}>
          <div style={{ width:13, height:13, borderRadius:7, background:"#fff", position:"absolute", top:2, left:on?17:2, transition:"left .25s" }}/>
        </div>
      </div>
      {on && d.type==="light" && (
        <div style={{ marginTop:9 }} onClick={e=>e.stopPropagation()}>
          <input type="range" min={5} max={100} value={d.brightness} onChange={e=>onAdjust(d.id,"brightness",+e.target.value)} style={{ width:"100%", accentColor:d.color }}/>
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:9, color:"rgba(255,255,255,.25)" }}><span>Dim</span><span>{d.brightness}%</span></div>
        </div>
      )}
      {on && d.type==="thermostat" && (
        <div style={{ marginTop:9, display:"flex", justifyContent:"space-between", alignItems:"center" }} onClick={e=>e.stopPropagation()}>
          <button onClick={()=>onAdjust(d.id,"temp",d.temp-1)} style={{ background:"rgba(255,255,255,.1)", border:"none", color:"#fff", borderRadius:6, width:24, height:24, cursor:"pointer" }}>−</button>
          <span style={{ color:"#F7C948", fontSize:17, fontFamily:"monospace", fontWeight:800 }}>{d.temp}°C</span>
          <button onClick={()=>onAdjust(d.id,"temp",d.temp+1)} style={{ background:"rgba(255,255,255,.1)", border:"none", color:"#fff", borderRadius:6, width:24, height:24, cursor:"pointer" }}>+</button>
        </div>
      )}
    </div>
  );
}

// ── Main Dashboard ───────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate();

  const [data, setData] = useState(() => {
    try { return JSON.parse(localStorage.getItem("healthData")) || {}; } catch { return {}; }
  });
  const [tab, setTab]                   = useState("dashboard");
  const [devices, setDevices]           = useState(INIT_DEVICES);
  const [report, setReport]             = useState("");
  const [reportLoading, setReportLoading] = useState(false);
  const [suggestion, setSuggestion]     = useState("");
  const [suggLoading, setSuggLoading]   = useState(false);
  const [insights, setInsights]         = useState([]);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [breatheOn, setBreatheOn]       = useState(false);
  const [breathePhase, setBreathePhase] = useState("inhale");
  const [breatheCount, setBreatheCount] = useState(0);
  const [msgs, setMsgs]                 = useState([]);
  const [chatInput, setChatInput]       = useState("");
  const [chatLoading, setChatLoading]   = useState(false);
  const chatEnd = useRef(null);

  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, "users", auth.currentUser.uid));
        if (snap.exists()?.healthData || snap.data()?.healthData) {
          const d = snap.data().healthData;
          setData(d);
          localStorage.setItem("healthData", JSON.stringify(d));
        }
      } catch(e) { console.log(e); }
    };
    load();
  }, []);

  useEffect(() => {
    if (!breatheOn) return;
    const phases = [["inhale",4000],["hold",4000],["exhale",6000]];
    let i=0;
    const run = () => { setBreathePhase(phases[i][0]); const t=setTimeout(()=>{ i=(i+1)%phases.length; if(i===0) setBreatheCount(c=>c+1); run(); }, phases[i][1]); return t; };
    const t=run(); return ()=>clearTimeout(t);
  }, [breatheOn]);

  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior:"smooth" }); }, [msgs]);

  const W = buildWeeklyData(data);

  const genReport = async () => {
    setReportLoading(true); setTab("report");
    try {
      const sum = W.map(d=>`${d.day}: HR=${d.hr}bpm, Sleep=${d.sleep.toFixed(1)}h, Steps=${d.steps}, Stress=${d.stress}%, Calories=${d.calories}kcal`).join("\n");
      setReport(await groqAI(
        `You are VitalAI's health narrator. Write a warm weekly health story like a letter from a personal health coach. 3-4 paragraphs, specific, empathetic, actionable. Mention real numbers. No bullet points, no markdown headers. Flowing narrative prose.\n\nMy health data:\n${sum}\n\nProfile: Age=${data.age||"unknown"}, Weight=${data.weight||"unknown"}kg. Write my weekly health story.`
      ));
    } catch(e) { setReport(`⚠ Could not generate: ${e.message}\n\nFix: Add VITE_GROQ_API_KEY=your_key to your .env file, then restart the dev server.`); }
    setReportLoading(false);
  };

  const genInsights = async () => {
    if (insights.length>0) return;
    setInsightsLoading(true);
    try {
      const text = await groqAI(
        `Return ONLY a JSON array of 3 objects. Each: { icon: emoji, color: hex, tag: string, text: string }. No markdown, no explanation.\n\nHealth: HR=${data.heartRate}bpm, Sleep=${data.sleep}h, Water=${data.water}L, Calories=${data.calories}kcal, Age=${data.age}, Weight=${data.weight}kg. Give 3 insights.`
      );
      setInsights(JSON.parse(text.replace(/```json|```/g,"").trim()));
    } catch {
      setInsights([
        { icon:"⚠", color:"#F7C948", tag:"Sleep",    text:`You're sleeping ${data.sleep||6}h — aim for 7-8h for optimal recovery.` },
        { icon:"✓", color:"#52D68A", tag:"Hydration", text:`${data.water||1.5}L tracked. Keep it above 2.5L daily.` },
        { icon:"♥", color:"#FF6B6B", tag:"Heart",     text:`HR of ${data.heartRate||72}bpm is ${(data.heartRate||72)<80?"healthy":"slightly elevated"}.` },
      ]);
    }
    setInsightsLoading(false);
  };

  const genSuggestion = async () => {
    setSuggLoading(true);
    try {
      const devs = devices.map(d=>`${d.name}:${d.status}`).join(", ");
      setSuggestion(await groqAI(
        `Smart home health optimizer. ONE specific, actionable recommendation. Friendly. Max 2 sentences.\n\nHealth: HR=${data.heartRate}bpm, Sleep=${data.sleep}h. Evening. Devices: ${devs}. What to adjust for better sleep?`
      ));
    } catch(e) { setSuggestion(`Error: ${e.message}. Check VITE_GROQ_API_KEY in .env`); }
    setSuggLoading(false);
  };

  const sendChat = async () => {
    if (!chatInput.trim()||chatLoading) return;
    const m=chatInput.trim(); setChatInput("");
    const h=[...msgs,{role:"user",text:m}]; setMsgs(h); setChatLoading(true);
    try {
      const prompt = `You are VitalAI. User: HR=${data.heartRate}bpm, Sleep=${data.sleep}h, Calories=${data.calories}kcal, Water=${data.water}L, Age=${data.age}, Weight=${data.weight}kg. Warm, concise, 2-3 sentences.\n\nConversation:\n${h.map(x => `${x.role === "user" ? "User" : "Assistant"}: ${x.text}`).join("\n")}`;
      const text = await groqAI(prompt);
      setMsgs([...h,{role:"ai",text: text || "I'm here to help!"}]);
    } catch(e) { setMsgs([...h,{role:"ai",text:`Error: ${e.message}`}]); }
    setChatLoading(false);
  };

  const toggleDev = id => setDevices(ds=>ds.map(d=>d.id===id?{...d,status:d.status==="on"?"off":"on"}:d));
  const adjDev    = (id,k,v) => setDevices(ds=>ds.map(d=>d.id===id?{...d,[k]:v}:d));

  // ── Styles ──────────────────────────────────────────────────
  const C  = { background:"rgba(255,255,255,.045)", border:"1px solid rgba(255,255,255,.09)", borderRadius:20, padding:"17px 19px", backdropFilter:"blur(12px)", position:"relative", overflow:"hidden" };
  const ST = { fontSize:10, fontWeight:700, color:"rgba(255,255,255,.33)", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:13 };
  const B  = (c="#52D68A") => ({ background:`${c}18`, border:`1px solid ${c}44`, color:c, borderRadius:10, padding:"8px 15px", fontSize:12, fontWeight:600, cursor:"pointer", transition:"opacity .2s,transform .2s", fontFamily:"inherit" });

  const TABS = [
    {id:"dashboard",label:"Dashboard",  icon:"◈"},
    {id:"analytics", label:"Analytics", icon:"∿"},
    {id:"smarthome", label:"Smart Home",icon:"⌂"},
    {id:"breathe",   label:"Breathe",   icon:"◉"},
    {id:"report",    label:"Weekly",    icon:"✦"},
    {id:"chat",      label:"AI Chat",   icon:"◆"},
  ];

  // ── Render tabs ──────────────────────────────────────────────
  const Dashboard = () => (
    <div style={{ display:"flex", flexDirection:"column", gap:15 }}>
      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:10 }}>
        <div>
          <h1 style={{ fontSize:26, fontWeight:900, letterSpacing:"-0.03em", margin:0, background:"linear-gradient(135deg,#fff 60%,rgba(255,255,255,.4))", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>Your Dashboard</h1>
          <p style={{ margin:"2px 0 0", color:"rgba(255,255,255,.3)", fontSize:12 }}>{data.age?`Age ${data.age}`:""}  {data.weight?`· ${data.weight}kg`:""}</p>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <div style={{ ...C, padding:"9px 15px", textAlign:"right" }}>
            <div style={{ fontSize:9, color:"rgba(255,255,255,.33)", textTransform:"uppercase", letterSpacing:"0.08em" }}>Body Budget</div>
            <div style={{ fontSize:28, fontWeight:900, color:"#52D68A", fontFamily:"monospace", lineHeight:1, textShadow:"0 0 14px #52D68A55" }}>74</div>
          </div>
          <button onClick={()=>navigate("/health-form")} style={{ ...B("#F7C948"), padding:"9px 13px", fontSize:11 }}>✏ Update</button>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:11 }}>
        {[
          { label:"Heart Rate", value:data.heartRate||"—", unit:"BPM",  color:"#FF6B6B", spark:W.map(d=>d.hr),              icon:"♥" },
          { label:"Sleep",      value:data.sleep||"—",     unit:"hrs",  color:"#B8A9E0", spark:W.map(d=>d.sleep),            icon:"◗" },
          { label:"Calories",   value:data.calories||"—",  unit:"kcal", color:"#F7C948", spark:W.map(d=>d.calories/100),     icon:"◈" },
          { label:"Hydration",  value:data.water||"—",     unit:"L",    color:"#4ECDC4", spark:W.map(d=>d.sleep*.3+.8),      icon:"◉" },
        ].map((m,i)=>(
          <div key={i} style={{ ...C, display:"flex", flexDirection:"column", gap:6 }}>
            <div style={{ display:"flex", justifyContent:"space-between" }}>
              <span style={{ color:"rgba(255,255,255,.33)", fontSize:11 }}>{m.label}</span>
              <span style={{ color:m.color, fontSize:13 }}>{m.icon}</span>
            </div>
            <div style={{ fontFamily:"monospace", fontSize:23, fontWeight:800, color:m.color, textShadow:`0 0 10px ${m.color}44`, lineHeight:1 }}>
              {m.value}<span style={{ fontSize:10, fontWeight:400, color:`${m.color}77` }}> {m.unit}</span>
            </div>
            <SparkLine data={m.spark} color={m.color}/>
          </div>
        ))}
      </div>

      {/* Middle */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1.1fr", gap:11 }}>
        <div style={{ ...C, display:"flex", flexDirection:"column", alignItems:"center", padding:20, gap:9 }}>
          <div style={ST}>Live Heart Rate</div>
          <Orb size={90} bpm={Number(data.heartRate)||72} color="#FF6B6B"/>
          <span style={{ background:"#52D68A1A", color:"#52D68A", border:"1px solid #52D68A33", borderRadius:20, padding:"2px 10px", fontSize:10, fontWeight:600 }}>
            {(Number(data.heartRate)||72)<60?"Low Zone":(Number(data.heartRate)||72)<100?"Normal Zone":"High Zone"}
          </span>
        </div>
        <div style={C}>
          <div style={ST}>Vitals</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, placeItems:"center" }}>
            <Radial value={38}  label="Stress"    unit="%" color="#F7C948"/>
            <Radial value={97}  label="SpO₂"      unit="%" color="#4ECDC4"/>
            <Radial value={Math.round((Number(data.water)||1.8)/3*100)} label="Hydration" unit="%" color="#52D68A"/>
            <Radial value={42} max={80} label="HRV" unit="ms" color="#B8A9E0"/>
          </div>
        </div>
        <div style={C}>
          <div style={ST}>Health Forecast</div>
          {FORECAST.map((f,i)=>(
            <div key={i} style={{ display:"flex", alignItems:"center", gap:9, padding:"6px 8px", borderRadius:9, background:i===0?"rgba(255,255,255,.05)":"transparent", marginBottom:4 }}>
              <span style={{ fontSize:14, width:19 }}>{f.icon}</span>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex", justifyContent:"space-between" }}>
                  <span style={{ fontSize:11, color:i===0?"#fff":"rgba(255,255,255,.42)", fontWeight:i===0?600:400 }}>{f.day}</span>
                  <span style={{ fontSize:10, color:f.color }}>{f.label}</span>
                </div>
                <div style={{ height:2.5, background:"rgba(255,255,255,.06)", borderRadius:2, marginTop:3 }}>
                  <div style={{ height:"100%", width:`${f.score}%`, background:f.color, borderRadius:2 }}/>
                </div>
              </div>
              <span style={{ fontSize:10, color:f.color, fontFamily:"monospace", fontWeight:700 }}>{f.score}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Chart + actions */}
      <div style={{ display:"grid", gridTemplateColumns:"1.6fr 1fr", gap:11 }}>
        <div style={C}>
          <div style={ST}>Health Analytics</div>
          <div style={{ height:210 }}><HealthChart/></div>
        </div>
        <div style={C}>
          <div style={ST}>Quick Actions</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:9, marginBottom:11 }}>
            {[
              {label:"Breathe",icon:"◉",color:"#4ECDC4",action:()=>setTab("breathe")},
              {label:"Smart Home",icon:"⌂",color:"#52D68A",action:()=>setTab("smarthome")},
              {label:"Weekly",icon:"✦",color:"#B8A9E0",action:genReport},
              {label:"AI Chat",icon:"◆",color:"#F7C948",action:()=>setTab("chat")},
            ].map((a,i)=>(
              <button key={i} onClick={a.action} style={{ ...B(a.color), display:"flex", alignItems:"center", gap:7, padding:"11px 12px", borderRadius:12 }}>
                <span style={{ fontSize:14 }}>{a.icon}</span><span style={{ fontSize:11 }}>{a.label}</span>
              </button>
            ))}
          </div>
          <div style={{ padding:"9px 12px", background:"rgba(82,214,138,.05)", borderRadius:10, border:"1px solid rgba(82,214,138,.13)" }}>
            <div style={{ fontSize:9, color:"#52D68A", fontWeight:700, marginBottom:2, letterSpacing:"0.06em" }}>◈ SLEEP PREP IN 2H</div>
            <div style={{ fontSize:10, color:"rgba(255,255,255,.33)" }}>Smart home auto-optimises at 10 PM</div>
          </div>
        </div>
      </div>

      {/* AI Insights */}
      <div style={C}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:13 }}>
          <div style={ST}>AI Insights</div>
          {insights.length===0 && <button onClick={genInsights} style={{ ...B("#52D68A"), padding:"5px 12px", fontSize:10 }}>{insightsLoading?"Analysing…":"✦ Generate"}</button>}
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
          {(insights.length>0 ? insights : [
            {icon:"⚠",color:"#F7C948",tag:"Sleep",    text:`Sleeping ${data.sleep||6}h — below the 7-8h recommendation.`},
            {icon:"✓",color:"#52D68A",tag:"Hydration", text:`${data.water||1.5}L tracked. Aim for 2.5L+ daily.`},
            {icon:"♥",color:"#FF6B6B",tag:"Heart",     text:`HR ${data.heartRate||72}bpm is ${(data.heartRate||72)<80?"healthy ✓":"slightly elevated"}.`},
          ]).map((ins,i)=>(
            <div key={i} style={{ display:"flex", gap:9, padding:"11px 12px", background:"rgba(255,255,255,.03)", borderRadius:12, border:"1px solid rgba(255,255,255,.05)" }}>
              <span style={{ color:ins.color, fontSize:14, marginTop:1 }}>{ins.icon}</span>
              <div>
                <span style={{ background:`${ins.color}1A`, color:ins.color, borderRadius:20, padding:"1px 7px", fontSize:9, fontWeight:700, display:"inline-block", marginBottom:4 }}>{ins.tag}</span>
                <p style={{ margin:0, color:"rgba(255,255,255,.62)", fontSize:12, lineHeight:1.5 }}>{ins.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const Analytics = () => (
    <div style={{ display:"flex", flexDirection:"column", gap:15 }}>
      <h2 style={{ fontSize:24, fontWeight:900, margin:0, letterSpacing:"-0.02em" }}>Analytics</h2>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:11 }}>
        {[
          {label:"Avg Heart Rate", value:`${Math.round(W.reduce((a,d)=>a+d.hr,0)/7)} BPM`, color:"#FF6B6B"},
          {label:"Avg Sleep",      value:`${(W.reduce((a,d)=>a+d.sleep,0)/7).toFixed(1)}h`, color:"#B8A9E0"},
          {label:"Avg Calories",   value:`${Math.round(W.reduce((a,d)=>a+d.calories,0)/7)}`, color:"#F7C948"},
        ].map((s,i)=>(
          <div key={i} style={C}>
            <div style={{ fontSize:11, color:"rgba(255,255,255,.33)" }}>{s.label}</div>
            <div style={{ fontSize:30, fontWeight:900, color:s.color, fontFamily:"monospace", margin:"6px 0 3px", textShadow:`0 0 14px ${s.color}44` }}>{s.value}</div>
          </div>
        ))}
      </div>
      <div style={C}>
        <div style={ST}>Weekly Heart Rate</div>
        <div style={{ display:"flex", gap:5, alignItems:"flex-end", height:80 }}>
          {W.map((d,i)=>(
            <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:3 }}>
              <div style={{ width:"100%", height:`${(d.hr/120)*64}px`, background:i===6?"#FF6B6B":"#FF6B6B44", borderRadius:4, transition:"height .8s", boxShadow:i===6?"0 0 10px #FF6B6B88":"none" }}/>
              <span style={{ fontSize:9, color:"rgba(255,255,255,.28)" }}>{d.day}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ ...C, height:260 }}>
        <div style={ST}>Health Chart</div>
        <HealthChart/>
      </div>
    </div>
  );

  const SmartHome = () => (
    <div style={{ display:"flex", flexDirection:"column", gap:15 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:10 }}>
        <div>
          <h2 style={{ fontSize:24, fontWeight:900, margin:0, letterSpacing:"-0.02em" }}>Smart Home Health Loop</h2>
          <p style={{ margin:"3px 0 0", color:"rgba(255,255,255,.3)", fontSize:12 }}>Environment optimised for your biology</p>
        </div>
        <button onClick={genSuggestion} style={{ ...B("#52D68A"), padding:"9px 16px" }}>{suggLoading?"Analysing…":"✦ AI Optimise"}</button>
      </div>
      {suggestion && (
        <div style={{ ...C, border:"1px solid rgba(82,214,138,.27)", background:"rgba(82,214,138,.05)" }}>
          <div style={{ display:"flex", gap:10 }}>
            <span>◆</span>
            <div>
              <div style={{ fontSize:10, color:"#52D68A", fontWeight:700, marginBottom:4, letterSpacing:"0.08em" }}>AI RECOMMENDATION</div>
              <p style={{ margin:0, color:"rgba(255,255,255,.8)", fontSize:13, lineHeight:1.6 }}>{suggestion}</p>
            </div>
          </div>
        </div>
      )}
      <div style={{ ...C, background:"rgba(247,201,72,.04)", border:"1px solid rgba(247,201,72,.14)" }}>
        <div style={{ display:"flex", gap:16, alignItems:"center" }}>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:10, color:"#F7C948", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em" }}>Sleep Prep Mode</div>
            <div style={{ fontSize:12, color:"rgba(255,255,255,.38)", marginTop:3 }}>Auto at 10 PM · Dims lights, cools to 18°C, white noise</div>
          </div>
          <div style={{ width:40, height:22, borderRadius:11, background:"#F7C948", position:"relative", cursor:"pointer", boxShadow:"0 0 12px #F7C94866", flexShrink:0 }}>
            <div style={{ width:18, height:18, borderRadius:9, background:"#fff", position:"absolute", top:2, left:20 }}/>
          </div>
        </div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:11 }}>
        {devices.map(d=><DevCard key={d.id} d={d} onToggle={toggleDev} onAdjust={adjDev}/>)}
      </div>
    </div>
  );

  const Breathe = () => {
    const ph={inhale:{label:"Inhale",scale:1.3,color:"#4ECDC4",dur:4},hold:{label:"Hold",scale:1.3,color:"#F7C948",dur:4},exhale:{label:"Exhale",scale:1,color:"#B8A9E0",dur:6}};
    const p=ph[breathePhase];
    return (
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:26, paddingTop:28 }}>
        <div style={{ textAlign:"center" }}>
          <h2 style={{ fontSize:24, fontWeight:900, margin:0 }}>Breathing Exercise</h2>
          <p style={{ color:"rgba(255,255,255,.33)", fontSize:12, marginTop:4 }}>4-4-6 Box Breathing · Reduces cortisol up to 40%</p>
        </div>
        <div style={{ position:"relative", width:220, height:220, display:"flex", alignItems:"center", justifyContent:"center" }}>
          {breatheOn && [1,2,3].map(r=>(
            <div key={r} style={{ position:"absolute", borderRadius:"50%", width:220-r*26, height:220-r*26, border:`1px solid ${p.color}`, transform:`scale(${p.scale})`, transition:`transform ${p.dur}s ease-in-out`, animation:`vt-ba 3s ease-in-out ${r*.28}s infinite` }}/>
          ))}
          <div style={{ width:140, height:140, borderRadius:"50%", background:`radial-gradient(circle at 35% 35%,${breatheOn?p.color:"#52D68A"}44,${breatheOn?p.color:"#52D68A"}11)`, border:`2px solid ${breatheOn?p.color:"#52D68A"}55`, boxShadow:breatheOn?`0 0 50px ${p.color}44`:"none", transform:breatheOn?`scale(${p.scale})`:"scale(1)", transition:`all ${p.dur}s ease-in-out`, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
            <div style={{ fontSize:15, fontWeight:700, color:breatheOn?p.color:"#52D68A" }}>{breatheOn?p.label:"Ready"}</div>
            {breatheOn && <div style={{ fontSize:11, color:"rgba(255,255,255,.3)", marginTop:2 }}>{p.dur}s</div>}
          </div>
        </div>
        <div style={{ display:"flex", gap:12, alignItems:"center" }}>
          <button onClick={()=>{ setBreatheOn(!breatheOn); if(breatheOn){setBreatheCount(0);setBreathePhase("inhale");} }} style={{ ...B("#4ECDC4"), padding:"11px 28px", fontSize:14, borderRadius:13 }}>
            {breatheOn?"Stop":"Begin"}
          </button>
          {breatheOn && <span style={{ color:"rgba(255,255,255,.33)", fontSize:12 }}>Cycle {breatheCount+1}</span>}
        </div>
        {breatheCount>0 && <div style={{ ...C, maxWidth:300, width:"100%", textAlign:"center" }}>
          <div style={{ fontSize:11, color:"rgba(255,255,255,.3)" }}>Completed</div>
          <div style={{ fontSize:27, fontWeight:900, color:"#4ECDC4", fontFamily:"monospace" }}>{breatheCount} {breatheCount===1?"cycle":"cycles"}</div>
          <div style={{ fontSize:12, color:"#52D68A", marginTop:2 }}>≈{Math.round(breatheCount*.7)} min · Well done!</div>
        </div>}
      </div>
    );
  };

  const Report = () => (
    <div style={{ display:"flex", flexDirection:"column", gap:15, maxWidth:720 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:10 }}>
        <div>
          <h2 style={{ fontSize:24, fontWeight:900, margin:0 }}>Weekly Health Story</h2>
          <p style={{ margin:"3px 0 0", color:"rgba(255,255,255,.3)", fontSize:12 }}>AI-narrated from your real data</p>
        </div>
        <button onClick={genReport} style={{ ...B("#B8A9E0"), padding:"9px 16px" }}>{reportLoading?"Writing…":"✦ Generate"}</button>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:7 }}>
        {W.map((d,i)=>(
          <div key={i} style={{ ...C, padding:"8px 9px", textAlign:"center" }}>
            <div style={{ fontSize:9, color:"rgba(255,255,255,.28)", textTransform:"uppercase" }}>{d.day}</div>
            <div style={{ fontSize:9, color:"#FF6B6B", marginTop:4 }}>♥{d.hr}</div>
            <div style={{ fontSize:9, color:"#B8A9E0" }}>◗{d.sleep.toFixed(1)}</div>
            <div style={{ fontSize:9, color:"#52D68A" }}>↑{(d.steps/1000).toFixed(1)}k</div>
          </div>
        ))}
      </div>
      <div style={{ ...C, minHeight:200, border:"1px solid rgba(178,169,224,.2)", background:"rgba(178,169,224,.04)" }}>
        {reportLoading?(
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:180, gap:12 }}>
            <div style={{ width:30, height:30, border:"2px solid rgba(178,169,224,.2)", borderTop:"2px solid #B8A9E0", borderRadius:"50%", animation:"vt-spin 1s linear infinite" }}/>
            <div style={{ color:"rgba(255,255,255,.33)", fontSize:13 }}>Writing your story…</div>
          </div>
        ):report?(
          <div>
            <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:15 }}>
              <span>✦</span>
              <span style={{ color:"#B8A9E0", fontSize:10, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase" }}>AI Health Narrative</span>
            </div>
            <p style={{ color:"rgba(255,255,255,.8)", fontSize:14, lineHeight:1.85, margin:0, whiteSpace:"pre-wrap" }}>{report}</p>
          </div>
        ):(
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:180, gap:9 }}>
            <span style={{ fontSize:30, opacity:.2 }}>✦</span>
            <div style={{ color:"rgba(255,255,255,.28)", fontSize:13, textAlign:"center" }}>Click "Generate" for your personalised weekly health story</div>
          </div>
        )}
      </div>
    </div>
  );

  const Chat = () => (
    <div style={{ display:"flex", flexDirection:"column", gap:14, height:"calc(100vh - 120px)" }}>
      <div>
        <h2 style={{ fontSize:24, fontWeight:900, margin:0 }}>AI Health Chat</h2>
        <p style={{ margin:"3px 0 0", color:"rgba(255,255,255,.3)", fontSize:12 }}>I know your health data — ask me anything</p>
      </div>
      <div style={{ flex:1, ...C, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        <div style={{ flex:1, overflow:"auto", display:"flex", flexDirection:"column", gap:10, paddingBottom:8 }}>
          {msgs.length===0&&(
            <div style={{ display:"flex", flexDirection:"column", gap:7, marginTop:10 }}>
              <div style={{ fontSize:11, color:"rgba(255,255,255,.22)", textAlign:"center", marginBottom:3 }}>Try asking…</div>
              {["Why is my heart rate high?","How can I sleep better?","Should I work out tonight?","Analyse my health"].map((q,i)=>(
                <button key={i} onClick={()=>setChatInput(q)} style={{ background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.08)", borderRadius:11, padding:"9px 13px", color:"rgba(255,255,255,.48)", fontSize:12, cursor:"pointer", textAlign:"left", fontFamily:"inherit" }}>{q}</button>
              ))}
            </div>
          )}
          {msgs.map((m,i)=>(
            <div key={i} style={{ display:"flex", justifyContent:m.role==="user"?"flex-end":"flex-start" }}>
              <div style={{ maxWidth:"80%", padding:"10px 14px", borderRadius:m.role==="user"?"16px 16px 4px 16px":"16px 16px 16px 4px", background:m.role==="user"?"rgba(82,214,138,.13)":"rgba(255,255,255,.06)", border:`1px solid ${m.role==="user"?"rgba(82,214,138,.22)":"rgba(255,255,255,.07)"}`, color:"rgba(255,255,255,.85)", fontSize:13, lineHeight:1.6 }}>
                {m.text}
              </div>
            </div>
          ))}
          {chatLoading&&<div style={{ display:"flex", gap:5, padding:"10px 14px" }}>{[0,1,2].map(i=><div key={i} style={{ width:7, height:7, borderRadius:"50%", background:"#52D68A", animation:`vt-ba 1.1s ease-in-out ${i*.18}s infinite` }}/>)}</div>}
          <div ref={chatEnd}/>
        </div>
        <div style={{ display:"flex", gap:9, borderTop:"1px solid rgba(255,255,255,.06)", paddingTop:12 }}>
          <input value={chatInput} onChange={e=>setChatInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendChat()} placeholder="Ask about your health…"
            style={{ flex:1, background:"rgba(255,255,255,.05)", border:"1px solid rgba(255,255,255,.1)", borderRadius:11, padding:"10px 14px", color:"#fff", fontSize:13, outline:"none", fontFamily:"inherit" }}/>
          <button onClick={sendChat} style={{ ...B("#52D68A"), padding:"10px 16px", borderRadius:11 }}>Send</button>
        </div>
      </div>
    </div>
  );

  const CONTENT = { dashboard:<Dashboard/>, analytics:<Analytics/>, smarthome:<SmartHome/>, breathe:<Breathe/>, report:<Report/>, chat:<Chat/> };

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:"#080C14", color:"#E8EDF5", fontFamily:"'DM Sans','Segoe UI',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:rgba(255,255,255,.1);border-radius:2px}
        input[type=range]{-webkit-appearance:none;height:3px;border-radius:3px;background:rgba(255,255,255,.1);outline:none;cursor:pointer}
        input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:12px;height:12px;border-radius:50%;cursor:pointer}
        button:hover{opacity:.82;transform:translateY(-1px)}
        @keyframes vt-ring{0%{transform:scale(1);opacity:.5}100%{transform:scale(2);opacity:0}}
        @keyframes vt-core{0%,100%{transform:scale(1)}50%{transform:scale(1.07)}}
        @keyframes vt-ba{0%,100%{opacity:.25}50%{opacity:.7}}
        @keyframes vt-spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
      `}</style>

      {/* Ambient glow */}
      <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0 }}>
        <div style={{ position:"absolute", top:-150, right:-150, width:500, height:500, borderRadius:"50%", background:"radial-gradient(circle,rgba(82,214,138,.04) 0%,transparent 70%)" }}/>
        <div style={{ position:"absolute", bottom:-100, left:60, width:400, height:400, borderRadius:"50%", background:"radial-gradient(circle,rgba(78,205,196,.03) 0%,transparent 70%)" }}/>
      </div>

      {/* Sidebar */}
      <div style={{ width:196, background:"rgba(255,255,255,.025)", borderRight:"1px solid rgba(255,255,255,.06)", display:"flex", flexDirection:"column", padding:"20px 12px", gap:3, flexShrink:0, zIndex:10, backdropFilter:"blur(20px)" }}>
        <div style={{ fontSize:20, fontWeight:900, background:"linear-gradient(135deg,#52D68A,#4ECDC4)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", letterSpacing:"-0.02em", marginBottom:24, paddingLeft:8 }}>VitalAI</div>
        {TABS.map(t=>(
          <button key={t.id}
            onClick={()=>{ setTab(t.id); if(t.id==="report"&&!report) genReport(); }}
            style={{ display:"flex", alignItems:"center", gap:8, padding:"9px 10px", borderRadius:10, cursor:"pointer", background:tab===t.id?"rgba(82,214,138,.1)":"transparent", border:tab===t.id?"1px solid rgba(82,214,138,.22)":"1px solid transparent", color:tab===t.id?"#52D68A":"rgba(255,255,255,.4)", fontSize:12, fontWeight:tab===t.id?600:400, fontFamily:"inherit" }}>
            <span style={{ width:15, textAlign:"center" }}>{t.icon}</span><span>{t.label}</span>
          </button>
        ))}
        <div style={{ flex:1 }}/>
        <div style={{ padding:"10px 11px", background:"rgba(255,255,255,.03)", borderRadius:12, border:"1px solid rgba(255,255,255,.06)" }}>
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            <Orb size={30} bpm={Number(data?.heartRate)||72} color="#FF6B6B"/>
            <div>
              <div style={{ fontSize:11, fontWeight:600, color:"#fff" }}>{data?.heartRate||"—"} BPM</div>
              <div style={{ fontSize:10, color:"#52D68A" }}>Live</div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex:1, overflow:"auto", padding:"24px 26px", position:"relative", zIndex:1 }}>
        {CONTENT[tab]||<Dashboard/>}
      </div>
    </div>
  );
}