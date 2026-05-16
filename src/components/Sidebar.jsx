import {
  LayoutDashboard,
  Activity,
  Brain,
  FileText,
  Settings,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard" },
  { icon: Activity, label: "Analytics" },
  { icon: Brain, label: "AI Assistant" },
  { icon: FileText, label: "Reports" },
  { icon: Settings, label: "Settings" },
];

function Sidebar() {

  const navigate = useNavigate();

  return (
    <div className="w-72 h-screen backdrop-blur-xl bg-white/5 border-r border-white/10 p-6">

      <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-12">
        VitalAI
      </h1>

      <div className="space-y-4">

        {menuItems.map((item, index) => (

          <div
            key={index}
            onClick={() => {

              if (item.label === "AI Assistant") {
                navigate("/assistant");
              }

              if (item.label === "Dashboard") {
                navigate("/dashboard");
              }

            }}
            className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 hover:bg-cyan-500/10 border border-white/5 hover:border-cyan-400/20 transition-all duration-300 cursor-pointer group"
          >

            <item.icon className="text-cyan-400 group-hover:scale-110 transition" />

            <span className="text-slate-200 text-lg">
              {item.label}
            </span>

          </div>

        ))}

      </div>

    </div>
  );
}

export default Sidebar;