import React, { useEffect, useState, useContext, useCallback } from "react";
import { useParams } from "react-router-dom";
// FIX: Mocking the imports to make the component runnable in isolation.
// In a real application, you would need to provide these files.
const api = {
  get: async (url, config) => {
    console.log(`GET request to: ${url}`);
    if (url.includes("/users/profile") || url.includes("/users/")) {
      return {
        data: {
          user: {
            _id: "user123",
            username: "testuser",
            email: "test@example.com",
            bio: "This is a test bio.",
            avatar: {
              secure_url: "https://placehold.co/100x100/A0AEC0/000000?text=Avatar"
            },
            followers: ["follower1", "follower2"],
            following: ["following1"],
          },
          posts: [
            {
              _id: "post1",
              caption: "First post!",
              media: [
                {
                  secure_url: "https://placehold.co/400x400/2F855A/FFFFFF?text=Post+1",
                  type: "image"
                }
              ]
            },
            {
              _id: "post2",
              caption: "Second post!",
              media: [
                {
                  secure_url: "https://placehold.co/400x400/805AD5/FFFFFF?text=Post+2",
                  type: "image"
                }
              ]
            }
          ]
        }
      };
    }
    return {};
  },
  put: async (url, data, config) => {
    console.log(`PUT request to: ${url}`);
    // Simulate a successful update and return mock data
    return { data: { user: { ...data, bio: data.get("bio") } } };
  },
  post: async (url, data, config) => {
    console.log(`POST request to: ${url}`);
    return {};
  }
};
const AuthContext = React.createContext({
  user: { _id: "user123", username: "testuser" },
  token: "fake-token"
});
const Navbar = () => (
  <nav className="bg-white dark:bg-gray-800 shadow-md p-4">
    <div className="container mx-auto flex justify-between items-center">
      <div className="text-xl font-bold text-gray-800 dark:text-white">
        My App
      </div>
      <div className="flex gap-4">
        <a href="#" className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white">Home</a>
        <a href="#" className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white">Profile</a>
        <a href="#" className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white">Logout</a>
      </div>
    </div>
  </nav>
);
// Post thumbnail component for the profile grid
const ProfilePost = ({ post }) => (
  <div className="relative w-full h-48 overflow-hidden rounded-lg shadow-md">
    {post.media && post.media.length > 0 ? (
      post.media[0].type === "image" ? (
        <img
          src={post.media[0].secure_url}
          alt="post thumbnail"
          className="w-full h-full object-cover"
        />
      ) : (
        <video
          src={post.media[0].secure_url}
          className="w-full h-full object-cover"
          poster="https://placehold.co/400x400/A0AEC0/000000?text=Video"
        />
      )
    ) : (
      <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700">
        <span className="text-gray-500">No Media</span>
      </div>
    )}
  </div>
);

// New PostModal component for displaying enlarged content
const PostModal = ({ post, onClose }) => {
  if (!post || !post.media || post.media.length === 0) return null;

  const mediaItem = post.media[0];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="relative bg-white dark:bg-[#111] p-4 rounded-lg shadow-lg max-w-2xl max-h-full">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-white text-2xl font-bold bg-gray-800 rounded-full w-8 h-8 flex items-center justify-center"
        >
          &times;
        </button>
        {mediaItem.type === "image" ? (
          <img
            src={mediaItem.secure_url}
            alt="Enlarged Post"
            className="max-w-full max-h-[80vh] object-contain rounded"
          />
        ) : (
          <video
            src={mediaItem.secure_url}
            controls
            className="max-w-full max-h-[80vh] object-contain rounded"
          >
            <source src={mediaItem.secure_url} type="video/mp4" />
          </video>
        )}
        <div className="mt-4 text-white text-center">
          <p className="text-xl font-bold">{post.caption}</p>
        </div>
      </div>
    </div>
  );
};

export default function Profile() {
  const { id } = useParams();
  const { user, token } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);

  // --- Fetch profile data ---
  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      let res;

      // Determine which user's profile to fetch (current user or another user by ID)
      if (!id || id === String(user?._id)) {
        res = await api.get("/users/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        res = await api.get(`/users/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      setProfile(res.data.user);
      setPosts(res.data.posts || []);

      if (user && res.data.user.followers) {
        setIsFollowing(res.data.user.followers.includes(user._id));
      }

      setBio(res.data.user.bio || "");
    } catch (err) {
      console.error("Profile fetch error:", err.response?.data || err.message);
      setError("Could not load profile.");
    } finally {
      setLoading(false);
    }
  }, [id, token, user]);

  useEffect(() => {
    if (user && token) {
      fetchProfile();
    }
  }, [fetchProfile, user, token, id]);

  // --- Handle profile update ---
  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append("bio", bio);
      if (avatar) {
        formData.append("avatar", avatar);
      }

      const res = await api.put("/users/profile", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      console.log("Update response:", res.data);
      setProfile(res.data.user);
      setEditing(false);
      setAvatar(null);

      // Re-fetch profile to get the most updated data from the server
      fetchProfile();
    } catch (err) {
      console.error("Profile update failed:", err.response?.data || err.message);
      setError("Profile update failed. Please try again.");
    }
  };

  // --- Function to handle canceling the bio edit ---
  const handleCancel = () => {
    setEditing(false);
    setAvatar(null);
    setBio(profile.bio || "");
  };

  // --- Follow/Unfollow ---
  const handleFollow = async () => {
    try {
      if (isFollowing) {
        await api.post(
          `/users/${id}/unfollow`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        await api.post(
          `/users/${id}/follow`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      setIsFollowing(!isFollowing);

      fetchProfile();
    } catch (err) {
      console.error("Follow error:", err.response?.data || err.message);
      setError("Failed to update follow status.");
    }
  };

  // --- UI states ---
  if (loading) return (
    <div className="min-h-screen bg-gray-100 dark:bg-black">
      <Navbar />
      <p className="text-center mt-10">Loading...</p>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gray-100 dark:bg-black">
      <Navbar />
      <p className="text-center mt-10 text-red-500">{error}</p>
    </div>
  );

  if (!profile) return (
    <div className="min-h-screen bg-gray-100 dark:bg-black">
      <Navbar />
      <p className="text-center mt-10">No profile found.</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 dark:bg-black dark:text-white">
      <Navbar />
      <div className="max-w-3xl mx-auto py-6 px-4">
        {/* Profile Header */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between mb-6 gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <img
              src={
                profile.avatar?.secure_url || "https://placehold.co/100x100/A0AEC0/000000?text=Avatar"
              }
              alt="avatar"
              className="w-24 h-24 rounded-full object-cover"
            />
            <div className="text-center sm:text-left">
              <h1 className="text-2xl font-bold">{profile.username}</h1>
              <p className="text-gray-600 dark:text-gray-300">{profile.email}</p>
              <p className="mt-2 text-gray-800 dark:text-gray-100">{profile.bio || "No bio yet."}</p>
              {profile._id === user._id && (
                <button
                  onClick={() => setEditing(true)}
                  className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Edit Profile
                </button>
              )}
            </div>
          </div>
          {profile._id !== user._id && (
            <button
              onClick={handleFollow}
              className={`px-4 py-2 rounded-lg transition-colors mt-4 sm:mt-0 ${
                isFollowing ? "bg-red-500 hover:bg-red-600" : "bg-blue-500 hover:bg-blue-600"
              } text-white`}
            >
              {isFollowing ? "Unfollow" : "Follow"}
            </button>
          )}
        </div>

        <p className="mb-2">Followers: {profile.followers?.length || 0}</p>
        <p className="mb-6">Following: {profile.following?.length || 0}</p>

        {/* Posts Grid */}
        <h3 className="text-xl font-semibold mb-4">Posts</h3>
        {posts.length === 0 ? (
          <p className="text-center text-gray-600 dark:text-gray-400">
            No posts found for this user.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {posts.map((post) => (
              <div key={post._id} onClick={() => setSelectedPost(post)} className="cursor-pointer">
                <ProfilePost post={post} />
              </div>
            ))}
          </div>
        )}

        {/* Edit Profile Modal */}
        {editing && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000]">
            <form
              onSubmit={handleUpdate}
              className="bg-white p-6 rounded-lg shadow-lg w-96 dark:bg-[#111]"
            >
              <h2 className="text-xl font-bold mb-4 text-black dark:text-white">
                Edit Profile
              </h2>
              <label className="block mb-2 text-black dark:text-gray-200">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full p-2 rounded border border-gray-300 dark:bg-gray-700 dark:text-white"
                rows="4"
              />
              <label className="block mt-4 mb-2 text-black dark:text-gray-200">
                Avatar
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setAvatar(e.target.files[0])}
                className="mb-4 w-full"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Post Modal for enlarged image view */}
        <PostModal
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
        />
      </div>
    </div>
  );
}
