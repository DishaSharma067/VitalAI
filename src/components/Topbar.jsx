import { calculateHealthScore } from "../utils/healthScore";

function Topbar() {

  const data = JSON.parse(
    localStorage.getItem("healthData")
  );

  const score = calculateHealthScore(data);

  // Dynamic color
  let scoreColor = "text-green-400";

  if (score < 70) {
    scoreColor = "text-yellow-400";
  }

  if (score < 50) {
    scoreColor = "text-red-400";
  }

  return (
    <div className="flex justify-between items-center mb-10">

      <div>

        <h1 className="text-5xl font-bold">
          AI Health Dashboard
        </h1>

        <p className="text-slate-400 mt-2 text-lg">
          Real-time wellness analytics
        </p>

      </div>

      <div className="backdrop-blur-xl bg-white/5 border border-white/10 px-8 py-5 rounded-3xl">

        <p className="text-cyan-400 text-lg font-semibold mb-2">
          AI Health Score
        </p>

        <h2 className={`text-5xl font-bold ${scoreColor}`}>
          {score}%
        </h2>

      </div>

    </div>
  );
}

export default Topbar;