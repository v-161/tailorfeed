import { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:5000/auth/forgot-password", { email });
      setMessage(res.data.message);
    } catch (err) {
      setMessage(err.response?.data?.message || "Something went wrong");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-black">
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-[#111] p-6 rounded shadow-md w-96"
      >
        <h1 className="text-2xl mb-4 text-center text-gray-800 dark:text-white">
          Forgot Password
        </h1>
        <input
          type="email"
          placeholder="Enter your email"
          className="w-full p-2 mb-3 border rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button className="w-full bg-yellow-500 hover:bg-yellow-600 text-white p-2 rounded">
          Send Reset Link
        </button>
        {message && (
          <p className="mt-3 text-center text-sm text-gray-700 dark:text-gray-300">
            {message}
          </p>
        )}
        <div className="mt-4 text-center">
          <Link to="/login" className="text-blue-500">
            Back to Login
          </Link>
        </div>
      </form>
    </div>
  );
}
