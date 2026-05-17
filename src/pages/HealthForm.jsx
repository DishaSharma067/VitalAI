import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { doc, setDoc } from "firebase/firestore";
import { db, auth } from "../firebase";

const FIELDS = [
  { key: "age",       label: "Age",           placeholder: "e.g. 24",   unit: "yrs",  icon: "👤" },
  { key: "weight",    label: "Weight",         placeholder: "e.g. 68",   unit: "kg",   icon: "⚖️" },
  { key: "heartRate", label: "Heart Rate",     placeholder: "e.g. 72",   unit: "BPM",  icon: "♥" },
  { key: "sleep",     label: "Sleep Hours",    placeholder: "e.g. 7",    unit: "hrs",  icon: "◗" },
  { key: "water",     label: "Water Intake",   placeholder: "e.g. 2.5",  unit: "L",    icon: "◉" },
  { key: "calories",  label: "Daily Calories", placeholder: "e.g. 2000", unit: "kcal", icon: "◈" },
];

function HealthForm() {
  const navigate = useNavigate();
  const [values, setValues]   = useState({ age: "", weight: "", heartRate: "", sleep: "", water: "", calories: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const set = (key, val) => setValues(v => ({ ...v, [key]: val }));

  const handleSubmit = async () => {
    // Validate all filled
    const empty = FIELDS.filter(f => !values[f.key]);
    if (empty.length) { setError(`Please fill in: ${empty.map(f => f.label).join(", ")}`); return; }

    setLoading(true);
    setError("");

    const data = {
      age:       Number(values.age),
      weight:    Number(values.weight),
      heartRate: Number(values.heartRate),
      sleep:     Number(values.sleep),
      water:     Number(values.water),
      calories:  Number(values.calories),
    };

    // Save to localStorage (for HealthChart fallback)
    localStorage.setItem("healthData", JSON.stringify(data));

    // Save to Firestore
    try {
      await setDoc(doc(db, "users", auth.currentUser.uid), { healthData: data }, { merge: true });
    } catch (e) {
      console.error("Firestore save failed:", e);
      // Still navigate — localStorage will work as fallback
    }

    setLoading(false);
    navigate("/dashboard");
  };

  return (
    <div style={{ minHeight: "100vh", background: "#080C14", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "'DM Sans','Segoe UI',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        input:focus { border-color: rgba(82,214,138,.5) !important; box-shadow: 0 0 0 3px rgba(82,214,138,.1); }
        input::placeholder { color: rgba(255,255,255,.25); }
        input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        button:hover { opacity: .88; transform: translateY(-1px); }
      `}</style>

      {/* Ambient glow */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: "20%", left: "50%", transform: "translateX(-50%)", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle,rgba(82,214,138,.06) 0%,transparent 70%)" }} />
      </div>

      <div style={{ width: "100%", maxWidth: 560, position: "relative", zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ fontSize: 28, fontWeight: 900, background: "linear-gradient(135deg,#52D68A,#4ECDC4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: "-0.02em" }}>VitalAI</div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: "#fff", margin: "10px 0 6px", letterSpacing: "-0.02em" }}>Your Health Profile</h1>
          <p style={{ color: "rgba(255,255,255,.38)", fontSize: 14, margin: 0 }}>Enter your stats — your AI dashboard will personalise around them</p>
        </div>

        {/* Card */}
        <div style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.09)", borderRadius: 24, padding: "32px 28px", backdropFilter: "blur(20px)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {FIELDS.map(f => (
              <div key={f.key}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,.4)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 7 }}>
                  {f.icon} {f.label}
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type="number"
                    placeholder={f.placeholder}
                    value={values[f.key]}
                    onChange={e => set(f.key, e.target.value)}
                    style={{ width: "100%", background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 12, padding: "12px 48px 12px 14px", color: "#fff", fontSize: 15, fontFamily: "inherit", outline: "none", transition: "border-color .2s, box-shadow .2s" }}
                  />
                  <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: "rgba(255,255,255,.3)", fontWeight: 600, pointerEvents: "none" }}>{f.unit}</span>
                </div>
              </div>
            ))}
          </div>

          {error && (
            <div style={{ marginTop: 16, padding: "10px 14px", background: "rgba(255,107,107,.1)", border: "1px solid rgba(255,107,107,.25)", borderRadius: 10, color: "#FF6B6B", fontSize: 13 }}>
              ⚠ {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{ width: "100%", marginTop: 24, padding: "15px", background: loading ? "rgba(82,214,138,.3)" : "linear-gradient(135deg,#52D68A,#4ECDC4)", border: "none", borderRadius: 14, color: "#080C14", fontSize: 16, fontWeight: 800, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", transition: "opacity .2s, transform .2s", letterSpacing: "-0.01em" }}>
            {loading ? "Saving your data…" : "Generate My Dashboard →"}
          </button>
        </div>

        <p style={{ textAlign: "center", marginTop: 18, color: "rgba(255,255,255,.22)", fontSize: 12 }}>
          Your data is encrypted and stored securely with Firebase
        </p>
      </div>
    </div>
  );
}

export default HealthForm;