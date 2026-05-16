function AIPrediction() {

  const data = JSON.parse(
    localStorage.getItem("healthData")
  );

  const heartRate = Number(data?.heartRate || 0);
  const sleep = Number(data?.sleep || 0);
  const water = Number(data?.water || 0);

  let predictions = [];

  // Heart Rate Analysis
  if (heartRate > 100) {
    predictions.push(
      "⚠ High heart rate detected. Stress levels may be elevated."
    );
  } else {
    predictions.push(
      "✅ Heart rate appears stable."
    );
  }

  // Sleep Analysis
  if (sleep < 6) {
    predictions.push(
      "😴 Sleep quality is poor. Try improving sleep routine."
    );
  } else {
    predictions.push(
      "✅ Sleep pattern looks healthy."
    );
  }

  // Water Intake Analysis
  if (water < 2) {
    predictions.push(
      "💧 Hydration levels are low. Increase water intake."
    );
  } else {
    predictions.push(
      "✅ Hydration levels are good."
    );
  }

  return (
    <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-6 mt-8">

      <h2 className="text-2xl font-bold text-cyan-400 mb-6">
        AI Health Predictions
      </h2>

      <div className="space-y-4">

        {predictions.map((item, index) => (
          <div
            key={index}
            className="bg-white/5 border border-white/10 p-4 rounded-2xl"
          >
            <p className="text-slate-200">
              {item}
            </p>
          </div>
        ))}

      </div>

    </div>
  );
}

export default AIPrediction;