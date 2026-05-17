import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";

function HealthChart() {
  const raw = (() => {
    try { return JSON.parse(localStorage.getItem("healthData")) || {}; } catch { return {}; }
  })();

  const hr  = Number(raw.heartRate) || 72;
  const sl  = Number(raw.sleep)     || 6.5;
  const cal = Number(raw.calories)  || 1800;

  const data = [
    { day: "Mon", heart: hr-4,  sleep: sl+0.8,  calories: Math.round((cal+260)/100) },
    { day: "Tue", heart: hr+3,  sleep: sl-0.6,  calories: Math.round((cal-20)/100)  },
    { day: "Wed", heart: hr-1,  sleep: sl+0.5,  calories: Math.round((cal+150)/100) },
    { day: "Thu", heart: hr+8,  sleep: sl-1.3,  calories: Math.round((cal+500)/100) },
    { day: "Fri", heart: hr-3,  sleep: sl+1.1,  calories: Math.round((cal+20)/100)  },
    { day: "Sat", heart: hr-6,  sleep: sl+1.7,  calories: Math.round((cal-150)/100) },
    { day: "Sun", heart: hr,    sleep: sl,       calories: Math.round(cal/100)       },
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: "rgba(8,12,20,.95)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 12, padding: "10px 14px" }}>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)", marginBottom: 6, letterSpacing: "0.06em" }}>{label}</div>
        {payload.map((p, i) => (
          <div key={i} style={{ fontSize: 12, color: p.color, fontFamily: "monospace", fontWeight: 700 }}>
            {p.name}: {p.value}{p.name === "Heart Rate" ? " bpm" : p.name === "Sleep" ? "h" : "00 kcal"}
          </div>
        ))}
      </div>
    );
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.05)" vertical={false} />
        <XAxis dataKey="day" stroke="rgba(255,255,255,.25)" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis stroke="rgba(255,255,255,.25)" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: 11, color: "rgba(255,255,255,.4)", paddingTop: 8 }} />
        <Line type="monotone" dataKey="heart" name="Heart Rate" stroke="#FF6B6B" strokeWidth={2.5} dot={{ fill: "#FF6B6B", r: 3, strokeWidth: 0 }} activeDot={{ r: 5 }} />
        <Line type="monotone" dataKey="sleep" name="Sleep"      stroke="#B8A9E0" strokeWidth={2.5} dot={{ fill: "#B8A9E0", r: 3, strokeWidth: 0 }} activeDot={{ r: 5 }} />
        <Line type="monotone" dataKey="calories" name="Calories (×100)" stroke="#F7C948" strokeWidth={2.5} dot={{ fill: "#F7C948", r: 3, strokeWidth: 0 }} activeDot={{ r: 5 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export default HealthChart;