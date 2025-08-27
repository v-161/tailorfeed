import { useContext, useEffect, useState, useCallback } from "react";
import api from "../api"; // ✅ Use the central API instance
import { AuthContext } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import { Link } from "react-router-dom";

export default function Explore() {
  const { token, isAuthenticated } = useContext(AuthContext);
  const [posts, setPosts] = useState([]);

  // Memoize the fetchExplore function using useCallback to prevent infinite loops
  const fetchExplore = useCallback(async () => {
    try {
      // ✅ Use api.get instead of axios.get with hardcoded URL
      const res = await api.get("/posts/explore", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPosts(res.data);
    } catch (err) {
      console.error("Explore fetch error:", err);
    }
  }, [token]); // Add token as a dependency

  useEffect(() => {
    if (isAuthenticated()) {
      fetchExplore();
    }
  }, [fetchExplore, isAuthenticated]); // ✅ Corrected dependencies

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-black text-gray-900 dark:text-white">
      <Navbar />

      <div className="max-w-5xl mx-auto py-6 px-4">
        <h1 className="text-2xl font-bold mb-6">Explore</h1>

        <div className="grid grid-cols-3 gap-2">
          {posts.map((post) => (
            <Link to={`/profile/${post.user._id}`} key={post._id}>
              {post.imageUrl && (
                <img
                  // ✅ Use a relative path instead of a hardcoded URL
                  src={`${post.imageUrl}`}
                  alt="Explore"
                  className="w-full h-40 object-cover hover:opacity-80 transition"
                />
              )}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
