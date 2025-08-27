import { useContext, useState } from "react";
// Import your centralized API instance
import api from "../api";
import { AuthContext } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import { Link } from "react-router-dom";

export default function Search() {
  const { token } = useContext(AuthContext);
  // State for the search query and the results
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  // Handler function for the search form submission
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query) return; // Prevent empty searches
    try {
      // Make a GET request using the imported 'api' instance
      const res = await api.get(`/users/search/${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Set the search results from the API response
      setResults(res.data);
    } catch (err) {
      console.error("Search error:", err);
    }
  };

  // The component's UI
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-black text-gray-900 dark:text-white">
      <Navbar />

      <div className="max-w-2xl mx-auto py-6 px-4">
        <form onSubmit={handleSearch} className="flex gap-2 mb-6">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search..."
            className="flex-1 p-2 border rounded dark:bg-[#111] dark:text-white"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            Search
          </button>
        </form>

        <ul>
          {results.map((u) => (
            <li key={u._id} className="mb-3">
              <Link
                to={`/profile/${u._id}`}
                className="font-semibold hover:underline"
              >
                {u.username}
              </Link>
              <p className="text-sm text-gray-500">{u.email}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
