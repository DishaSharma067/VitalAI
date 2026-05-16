import { Link, useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();

  const handleLogin = () => {
    navigate("/health-form");
  };

  return (
    <div className="h-screen flex items-center justify-center bg-slate-950 p-4">

      <div className="bg-slate-900 p-6 sm:p-10 rounded-3xl w-full max-w-md mx-4 sm:mx-auto">

        <h1 className="text-4xl font-bold text-cyan-400 mb-6 text-center">
          VitalAI
        </h1>

        <input
          type="email"
          placeholder="Email"
          className="w-full p-3 rounded-xl bg-slate-800 text-white mb-4 outline-none"
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full p-3 rounded-xl bg-slate-800 text-white mb-6 outline-none"
        />

        <button
          onClick={handleLogin}
          className="w-full bg-cyan-400 text-black font-bold py-3 rounded-xl hover:scale-105 transition"
        >
          Login
        </button>

        <p className="text-slate-400 mt-4 text-center">
          Don’t have an account?

          <Link
            to="/signup"
            className="text-cyan-400 ml-2"
          >
            Signup
          </Link>
        </p>

      </div>
    </div>
  );
}

export default Login;