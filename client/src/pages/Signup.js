import { useState } from "react";
import api from "../api";
import { Link, useNavigate } from "react-router-dom";

export default function Signup() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [modalMessage, setModalMessage] = useState(""); // State for modal message
  const [modalType, setModalType] = useState(""); // 'success' or 'error'
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setModalMessage("Passwords do not match");
      setModalType("error");
      return;
    }

    try {
      // ✅ Use api.post instead of axios.post with hardcoded URL
      await api.post("/auth/register", {
        username,
        email,
        password,
      });
      setModalMessage("Account created successfully");
      setModalType("success");
    } catch (err) {
      setModalMessage(err.response?.data?.message || "Signup failed");
      setModalType("error");
    }
  };

  const closeModal = () => {
    setModalMessage("");
    if (modalType === "success") {
      navigate("/login");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-black">
      <form
        onSubmit={handleSignup}
        className="bg-white dark:bg-[#111] p-6 rounded shadow-md w-96"
      >
        <h1 className="text-2xl mb-4 text-center text-gray-800 dark:text-white">
          Sign Up
        </h1>

        {/* Username */}
        <input
          type="text"
          placeholder="Username"
          className="w-full p-2 mb-3 border rounded"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />

        {/* Email */}
        <input
          type="email"
          placeholder="Email"
          className="w-full p-2 mb-3 border rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        {/* Password */}
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

        {/* Confirm Password */}
        <div className="relative mb-3">
          <input
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirm Password"
            className="w-full p-2 border rounded pr-12"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <button
            type="button"
            className="absolute right-2 top-2 text-sm text-blue-500"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? "Hide" : "Show"}
          </button>
        </div>

        {/* Submit Button */}
        <button className="w-full bg-green-500 hover:bg-green-600 text-white p-2 rounded">
          Sign Up
        </button>

        {/* Login Link */}
        <p className="text-center mt-3 text-gray-700 dark:text-gray-300">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-500">
            Login
          </Link>
        </p>
      </form>

      {/* Custom Modal */}
      {modalMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white dark:bg-[#111] p-6 rounded-lg shadow-lg">
            <h2 className={`text-xl font-bold mb-4 ${modalType === 'error' ? 'text-red-500' : 'text-green-500'}`}>
              {modalType === 'error' ? 'Error' : 'Success'}
            </h2>
            <p className="mb-4 text-gray-800 dark:text-gray-200">{modalMessage}</p>
            <div className="flex justify-end">
              <button
                onClick={closeModal}
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
