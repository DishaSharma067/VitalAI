import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

function HealthChart() {

  const data = JSON.parse(
    localStorage.getItem("healthData")
  );

  const chartData = [
    {
      day: "Mon",
      heart: Number(data?.heartRate || 70),
      sleep: Number(data?.sleep || 6),
    },
    {
      day: "Tue",
      heart: Number(data?.heartRate || 70) - 2,
      sleep: Number(data?.sleep || 6) + 1,
    },
    {
      day: "Wed",
      heart: Number(data?.heartRate || 70) + 3,
      sleep: Number(data?.sleep || 6),
    },
    {
      day: "Thu",
      heart: Number(data?.heartRate || 70) - 1,
      sleep: Number(data?.sleep || 6) + 2,
    },
    {
      day: "Fri",
      heart: Number(data?.heartRate || 70) + 1,
      sleep: Number(data?.sleep || 6),
    },
  ];

  return (
    <ResponsiveContainer width="100%" height="100%">

      <LineChart data={chartData}>

        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />

        <XAxis dataKey="day" stroke="#94A3B8" />

        <YAxis stroke="#94A3B8" />

        <Tooltip />

        <Line
          type="monotone"
          dataKey="heart"
          stroke="#06B6D4"
          strokeWidth={3}
        />

        <Line
          type="monotone"
          dataKey="sleep"
          stroke="#10B981"
          strokeWidth={3}
        />

      </LineChart>

    </ResponsiveContainer>
  );
}

export default HealthChart;