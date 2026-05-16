import { BrowserRouter, Routes, Route } from "react-router-dom";
import AIAssistant from "./pages/AIAssistant";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import HealthForm from "./pages/HealthForm";
import Dashboard from "./pages/Dashboard";

function App() {
  return (
    <BrowserRouter>

      <Routes>

        <Route path="/" element={<Login />} />

        <Route path="/signup" element={<Signup />} />

        <Route path="/health-form" element={<HealthForm />} />

        <Route path="/dashboard" element={<Dashboard />} />

        <Route path="/assistant" element={<AIAssistant />} />

      </Routes>

    </BrowserRouter>
  );
}

export default App;