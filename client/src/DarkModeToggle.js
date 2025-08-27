import { useContext } from "react";
import { ThemeContext } from "./context/ThemeContext";

export default function DarkModeToggle() {
  const { darkMode, toggleDarkMode } = useContext(ThemeContext);

  return (
    <button
      onClick={toggleDarkMode}
      className={`fixed top-4 right-4 p-2 rounded shadow transition-colors
        ${darkMode ? "bg-black text-white" : "bg-gray-300 text-black"}`}
    >
      {darkMode ? "☀️ Light" : "🌙 Dark"}
    </button>
  );
}
