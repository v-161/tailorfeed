import { Link } from "react-router-dom";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <nav className="bg-white dark:bg-[#111] border-b border-gray-300 dark:border-gray-800 px-6 py-3 flex justify-between items-center sticky top-0 z-10">
      {/* Left - App name */}
      <Link to="/" className="text-xl font-bold text-gray-900 dark:text-white">
        TailorFeed
      </Link>

      {/* Center - Nav links */}
      <div className="flex gap-6">
        <Link to="/" className="text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white">Home</Link>
        <Link to="/search" className="text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white">Search</Link>
        <Link to="/explore" className="text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white">Explore</Link>
        <Link to="/upload" className="text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white">Upload</Link>
        {user && (
          <Link to={`/profile/${user._id}`} className="text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white">
            Profile
          </Link>
        )}
      </div>

      {/* Right - Theme toggle + Logout/Login */}
      <div className="flex items-center gap-4">
        {/* Theme switch */}
        <button
          onClick={toggleTheme}
          className="px-3 py-2 rounded-lg shadow-md bg-gray-200 text-black hover:bg-gray-300 dark:bg-[#111] dark:text-white dark:hover:bg-black transition-colors"
        >
          {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
        </button>

        {user ? (
          <button
            onClick={logout}
            className="text-red-500 hover:text-red-600 font-semibold"
          >
            Logout
          </button>
        ) : (
          <Link
            to="/login"
            className="text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white"
          >
            Login
          </Link>
        )}
      </div>
    </nav>
  );
}
