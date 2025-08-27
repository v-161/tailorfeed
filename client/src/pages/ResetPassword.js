import { useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";

export default function ResetPassword() {
  // Extract the reset token from the URL parameters
  const { token } = useParams();
  // Hook for programmatic navigation
  const navigate = useNavigate();

  // State variables for the new password and any message to display
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  // Handler function for the form submission
  const handleReset = async (e) => {
    e.preventDefault();
    try {
      // Make a POST request to the reset password endpoint with the new password
      const res = await axios.post(
        `http://localhost:5000/auth/reset-password/${token}`,
        { password }
      );
      // Set the success message from the API response
      setMessage(res.data.message);
      // Redirect to the login page after a 2-second delay
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      // Handle errors and set the error message
      setMessage(err.response?.data?.message || "Something went wrong");
    }
  };

  // The component's UI
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-black">
      <form
        onSubmit={handleReset}
        className="bg-white dark:bg-[#111] p-6 rounded shadow-md w-96"
      >
        <h1 className="text-2xl mb-4 text-center text-gray-800 dark:text-white">
          Reset Password
        </h1>
        <input
          type="password"
          placeholder="New Password"
          className="w-full p-2 mb-3 border rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button className="w-full bg-green-500 hover:bg-green-600 text-white p-2 rounded">
          Reset Password
        </button>
        {/* Display the message if it exists */}
        {message && (
          <p className="mt-3 text-center text-sm text-gray-700 dark:text-gray-300">
            {message}
          </p>
        )}
      </form>
    </div>
  );
}
