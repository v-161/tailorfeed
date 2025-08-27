import { useEffect, useState, useContext } from "react";
import api from "../api"; 
import Navbar from "../components/Navbar";
import PostCard from "../components/PostCard";
import { AuthContext } from "../context/AuthContext";

export default function Home() {
  const { token } = useContext(AuthContext);

  const [posts, setPosts] = useState([]);
  const [commentInputs, setCommentInputs] = useState({});

  // Fetch feed posts
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await api.get("/posts/feed", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setPosts(res.data);
      } catch (err) {
        console.error("Error fetching posts:", err.message);
      }
    };

    if (token) {
      fetchPosts();
    }
  }, [token]);

  // Toggle Like
  const toggleLike = async (postId) => {
    try {
      const res = await api.post(
        `/posts/${postId}/like`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // ✅ Update the post in state with updated one from backend
      setPosts((prev) =>
        prev.map((p) =>
          p._id === postId ? res.data : p
        )
      );
    } catch (err) {
      console.error("Like error:", err.message);
    }
  };

  // Add Comment
  const addComment = async (postId) => {
    if (!commentInputs[postId]) return;
    try {
      const res = await api.post(
        `/posts/${postId}/comment`,
        { text: commentInputs[postId] },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setPosts((prev) =>
        prev.map((p) =>
          p._id === postId ? { ...p, comments: res.data.comments } : p
        )
      );

      setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
    } catch (err) {
      console.error("Comment error:", err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-black text-gray-900 dark:text-white">
      <Navbar />
      <div className="max-w-2xl mx-auto py-6 px-4">
        <h1 className="text-2xl font-bold mb-6">Home Feed</h1>

        {posts.length === 0 ? (
          <p className="text-center text-gray-600 dark:text-gray-400">
            No posts available. Follow people to see their posts.
          </p>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post._id}
              post={post}
              toggleLike={toggleLike}
              addComment={addComment}
              commentInputs={commentInputs}
              setCommentInputs={setCommentInputs}
            />
          ))
        )}
      </div>
    </div>
  );
}
