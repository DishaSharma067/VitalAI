function AIInsights() {
  return (
    <div className="backdrop-blur-xl bg-white/5 border border-white/10 p-6 rounded-3xl h-full">

      <h2 className="text-2xl font-bold text-cyan-400 mb-6">
        AI Insights
      </h2>

      <div className="space-y-5">

        <div className="bg-cyan-500/10 border border-cyan-400/20 p-5 rounded-2xl">
          <p className="text-slate-200">
            Sleep quality dropped by 12% this week.
          </p>
        </div>

        <div className="bg-emerald-500/10 border border-emerald-400/20 p-5 rounded-2xl">
          <p className="text-slate-200">
            Water intake is improving consistently.
          </p>
        </div>

        <div className="bg-red-500/10 border border-red-400/20 p-5 rounded-2xl">
          <p className="text-slate-200">
            Stress levels are moderately elevated.
          </p>
        </div>

      </div>

    </div>
  );
}

export default AIInsights;