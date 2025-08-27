import { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import api from "../api"; 
import { Link, useNavigate } from "react-router-dom";

export default function Login() {
  const { login } = useContext(AuthContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState(""); // State for error message
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      // ✅ Use api.post instead of axios.post with hardcoded URL
      const res = await api.post("/auth/login", { email, password });
      login(res.data.user, res.data.token);
      navigate("/");
    } catch (err) {
      // ✅ Use state to show a custom error message instead of alert
      setErrorMessage(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-black">
      <form
        onSubmit={handleLogin}
        className="bg-white dark:bg-[#111] p-6 rounded shadow-md w-96"
      >
        <h1 className="text-2xl mb-4 text-center text-gray-800 dark:text-white">Login</h1>

        {/* Email Input */}
        <input
          type="email"
          placeholder="Email"
          className="w-full p-2 mb-3 border rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        {/* Password Input */}
        <div className="relative mb-3">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            className="w-full p-2 border rounded pr-12"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="button"
            className="absolute right-2 top-2 text-sm text-blue-500"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>

        {/* Login Button */}
        <button className="w-full bg-blue-500 hover:bg-blue-600 text-white p-2 rounded">
          Login
        </button>

        {/* Links */}
        <div className="flex justify-between mt-3">
          <Link to="/forgot-password" className="text-blue-500">
            Forgot Password?
          </Link>
          <Link to="/signup" className="text-blue-500">
            Sign Up
          </Link>
        </div>
      </form>

      {/* Custom Error Modal */}
      {errorMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white dark:bg-[#111] p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold mb-4 text-black dark:text-white">Error</h2>
            <p className="mb-4 text-gray-800 dark:text-gray-200">{errorMessage}</p>
            <div className="flex justify-end">
              <button
                onClick={() => setErrorMessage("")}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
