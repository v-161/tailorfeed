import { useEffect, useState, useContext } from "react";
// Since the other files are not provided, we will create mock components to resolve the import errors.
const api = {
  get: async (url, config) => {
    console.log(`Mock API GET call to ${url}`);
    // Return mock data for the posts feed
    return {
      data: [
        {
          _id: "post1",
          username: "userA",
          caption: "This is a mock post from User A!",
          likes: ["userB"],
          comments: [{ username: "userB", text: "Great post!" }],
        },
        {
          _id: "post2",
          username: "userB",
          caption: "Another mock post for testing.",
          likes: [],
          comments: [],
        },
      ],
    };
  },
  post: async (url, data, config) => {
    console.log(`Mock API POST call to ${url} with data:`, data);
    // Return updated mock data
    if (url.includes("/like")) {
      const postId = url.split("/")[2];
      const updatedPost = {
        _id: postId,
        username: "userA",
        caption: "This is a mock post from User A!",
        likes: ["userA"],
        comments: [],
      };
      return { data: updatedPost };
    }
    if (url.includes("/comment")) {
      const postId = url.split("/")[2];
      const updatedPost = {
        _id: postId,
        username: "userA",
        caption: "This is a mock post from User A!",
        likes: [],
        comments: [{ username: "userC", text: data.text }],
      };
      return { data: updatedPost };
    }
  },
};

const Navbar = () => (
  <nav className="p-4 bg-white dark:bg-gray-800 shadow-md">
    <div className="container mx-auto flex justify-between items-center">
      <div className="text-xl font-bold">TailorFeed</div>
      <div>
        <span className="mr-4">Welcome!</span>
      </div>
    </div>
  </nav>
);

const PostCard = ({ post, toggleLike, addComment, commentInputs, setCommentInputs }) => {
  const isLiked = post.likes && post.likes.includes("your-user-id"); // Mock check
  const [showComments, setShowComments] = useState(false);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-4 shadow-lg">
      <div className="flex items-center mb-4">
        <div className="w-10 h-10 rounded-full bg-blue-500 mr-3"></div>
        <p className="font-semibold">{post.username}</p>
      </div>
      <p className="mb-4">{post.caption}</p>
      <div className="flex items-center text-gray-500 dark:text-gray-400 mb-2">
        <span className="mr-4 cursor-pointer" onClick={() => toggleLike(post._id)}>
          {isLiked ? "❤️" : "🤍"} {post.likes ? post.likes.length : 0} Likes
        </span>
        <span className="cursor-pointer" onClick={() => setShowComments(!showComments)}>
          {post.comments ? post.comments.length : 0} Comments
        </span>
      </div>
      {showComments && (
        <div className="mt-4">
          {post.comments && post.comments.map((comment, index) => (
            <div key={index} className="flex items-center mb-2">
              <span className="font-semibold text-sm mr-2">{comment.username}:</span>
              <p className="text-sm">{comment.text}</p>
            </div>
          ))}
          <div className="flex mt-2">
            <input
              type="text"
              className="flex-grow rounded-lg p-2 text-gray-900 bg-gray-200 dark:bg-gray-700 dark:text-white"
              placeholder="Add a comment..."
              value={commentInputs[post._id] || ""}
              onChange={(e) =>
                setCommentInputs((prev) => ({ ...prev, [post._id]: e.target.value }))
              }
            />
            <button
              className="ml-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              onClick={() => addComment(post._id)}
            >
              Post
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const AuthContext = {
  token: "mock-token", // Use a mock token for the example
};
// Use a mock provider since the full application context is not available
const AuthProvider = ({ children }) => {
  return (
    <AuthContext.Provider value={{ token: "mock-token" }}>
      {children}
    </AuthContext.Provider>
  );
};

export default function Home() {
  // Use a mock hook to simulate useContext for AuthContext
  const { token } = { token: "mock-token" };

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

      // Update the post in state with updated one from backend
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
