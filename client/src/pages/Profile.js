import React, { useEffect, useState, useContext, useCallback } from "react";
import { useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";

// Thumbnail of profile posts
const ProfilePost = ({ post, onClick }) => (
  <div
    className="relative w-full h-48 overflow-hidden rounded-lg shadow-md cursor-pointer"
    onClick={() => onClick(post)}
  >
    {post.media && post.media.length > 0 ? (
      post.media[0].type === "image" ? (
        <img
          src={`http://localhost:5000${post.media[0].url}`}
          alt="post thumbnail"
          className="w-full h-full object-cover"
        />
      ) : (
        <video
          src={`http://localhost:5000${post.media[0].url}`}
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

// Modal for enlarged post preview
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
            src={`http://localhost:5000${mediaItem.url}`}
            alt="Enlarged Post"
            className="max-w-full max-h-[80vh] object-contain rounded"
          />
        ) : (
          <video
            src={`http://localhost:5000${mediaItem.url}`}
            controls
            className="max-w-full max-h-[80vh] object-contain rounded"
          >
            <source
              src={`http://localhost:5000${mediaItem.url}`}
              type="video/mp4"
            />
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

  // Fetch profile data
  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let res;
      if (!id || id === String(user?._id)) {
        res = await axios.get("http://localhost:5000/users/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        res = await axios.get(`http://localhost:5000/users/${id}`, {
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

  // Update profile
  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append("bio", bio);
      if (avatar) {
        formData.append("avatar", avatar);
      }

      const res = await axios.put("http://localhost:5000/users/profile", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setProfile(res.data.user);
      setEditing(false);
      setAvatar(null);
      fetchProfile();
    } catch (err) {
      console.error("Profile update failed:", err.response?.data || err.message);
      setError("Profile update failed. Please try again.");
    }
  };

  // Cancel edit
  const handleCancel = () => {
    setEditing(false);
    setAvatar(null);
    setBio(profile.bio || "");
  };

  if (loading) return <p className="text-center p-6">Loading...</p>;
  if (error) return <p className="text-center text-red-500 p-6">{error}</p>;

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-black text-gray-900 dark:text-white">
      <Navbar />

      <div className="max-w-4xl mx-auto p-6">
        {/* Profile Header */}
        <div className="flex items-center gap-6">
          <img
            src={
              profile?.avatar?.url
                ? `http://localhost:5000${profile.avatar.url}`
                : "https://placehold.co/100x100?text=Avatar"
            }
            alt="avatar"
            className="w-24 h-24 rounded-full object-cover border"
          />
          <div>
            <h2 className="text-2xl font-bold">{profile?.username}</h2>
            <p className="text-gray-600 dark:text-gray-400">{profile?.email}</p>
            <p className="mt-2">{profile?.bio}</p>
          </div>
        </div>

        {/* Edit profile */}
        {id === String(user?._id) && (
          <div className="mt-6">
            {editing ? (
              <form onSubmit={handleUpdate} className="space-y-4">
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full p-2 border rounded text-black"
                />
                <input
                  type="file"
                  onChange={(e) => setAvatar(e.target.files[0])}
                  className="block"
                />
                <div className="flex gap-2">
                  <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="bg-gray-500 text-white px-4 py-2 rounded"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className="mt-4 bg-gray-800 text-white px-4 py-2 rounded"
              >
                Edit Profile
              </button>
            )}
          </div>
        )}

        {/* Posts Grid */}
        <div className="mt-8 grid grid-cols-3 gap-4">
          {posts.map((post) => (
            <ProfilePost key={post._id} post={post} onClick={setSelectedPost} />
          ))}
        </div>
      </div>

      {/* Modal */}
      {selectedPost && <PostModal post={selectedPost} onClose={() => setSelectedPost(null)} />}
    </div>
  );
}
