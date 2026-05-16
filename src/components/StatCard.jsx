function StatCard({ title, value, color }) {
  return (
    <div className="relative overflow-hidden backdrop-blur-xl bg-white/5 border border-white/10 p-6 rounded-3xl hover:scale-105 transition duration-300">

      <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl" />

      <h3 className="text-slate-400 text-lg mb-3">
        {title}
      </h3>

      <p className={`text-4xl font-bold ${color}`}>
        {value}
      </p>

    </div>
  );
}

export default StatCard;