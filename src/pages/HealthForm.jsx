import { useState } from "react";

import { useNavigate } from "react-router-dom";

function HealthForm() {

  const navigate = useNavigate();

  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");
  const [heartRate, setHeartRate] = useState("");
  const [sleep, setSleep] = useState("");
  const [water, setWater] = useState("");
  const [calories, setCalories] = useState("");

  const handleSubmit = () => {

    const data = {
      age,
      weight,
      heartRate,
      sleep,
      water,
      calories,
    };

    localStorage.setItem(
      "healthData",
      JSON.stringify(data)
    );

    navigate("/dashboard");
  };

  return (

    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 sm:p-10">

      <div className="w-full max-w-xl sm:max-w-2xl bg-slate-900 p-6 sm:p-10 rounded-3xl">

        <h1 className="text-5xl sm:text-6xl font-bold text-cyan-400 mb-10 text-center">
          Health Details
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          <input
            type="number"
            placeholder="Age"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            className="p-4 rounded-2xl bg-slate-800 text-white outline-none"
          />

          <input
            type="number"
            placeholder="Weight"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="p-4 rounded-2xl bg-slate-800 text-white outline-none"
          />

          <input
            type="number"
            placeholder="Heart Rate"
            value={heartRate}
            onChange={(e) => setHeartRate(e.target.value)}
            className="p-4 rounded-2xl bg-slate-800 text-white outline-none"
          />

          <input
            type="number"
            placeholder="Sleep Hours"
            value={sleep}
            onChange={(e) => setSleep(e.target.value)}
            className="p-4 rounded-2xl bg-slate-800 text-white outline-none"
          />

          <input
            type="number"
            placeholder="Water Intake"
            value={water}
            onChange={(e) => setWater(e.target.value)}
            className="p-4 rounded-2xl bg-slate-800 text-white outline-none"
          />

          <input
            type="number"
            placeholder="Calories"
            value={calories}
            onChange={(e) => setCalories(e.target.value)}
            className="p-4 rounded-2xl bg-slate-800 text-white outline-none"
          />

        </div>

        <button
          type="button"
          onClick={handleSubmit}
          className="w-full mt-10 bg-cyan-400 text-black font-bold py-4 rounded-2xl hover:scale-105 transition"
        >
          Generate Dashboard
        </button>

      </div>

    </div>
  );
}

export default HealthForm;