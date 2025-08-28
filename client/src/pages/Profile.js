// src/pages/Profile.js
import React, { useEffect, useState, useCallback, useContext } from "react";
import { useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";

const API_BASE = "https://tailorfeed-backend.onrender.com";

// Small helper to build a usable media/avatar URL (supports both "url" and "secure_url")
function resolveUrl(item) {
  if (!item) return null;
  if (item.secure_url) return item.secure_url;
  if (item.url) {
    // url might already be absolute or relative (/uploads/...)
    return item.url.startsWith("http") ? item.url : `${API_BASE}${item.url}`;
  }
  return null;
}

// Thumbnail component for each post
function ProfilePost({ post, onClick }) {
  const first = post.media && post.media.length > 0 ? post.media[0] : null;
  const src = first ? resolveUrl(first) : null;

  return (
    <div
      className="relative w-full h-40 overflow-hidden rounded-lg shadow-md cursor-pointer"
      onClick={() => onClick(post)}
    >
      {src ? (
        first.type === "video" ? (
          <video src={src} className="w-full h-full object-cover" />
        ) : (
          <img src={src} alt="post thumbnail" className="w-full h-full object-cover" />
        )
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700">
          <span className="text-gray-500">No Media</span>
        </div>
      )}
    </div>
  );
}

// Modal to preview a post (image(s) or video(s))
function PostModal({ post, onClose }) {
  if (!post) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="relative max-w-4xl w-full bg-white dark:bg-[#111] rounded-lg p-4 overflow-auto">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 bg-gray-800 text-white rounded-full w-8 h-8 flex items-center justify-center"
        >
          &times;
        </button>

        <div className="flex gap-2 overflow-x-auto pb-2">
          {post.media?.map((m, i) => {
            const src = resolveUrl(m);
            if (!src) return null;
            return m.type === "video" ? (
              <video key={i} controls className="w-80 h-80 object-contain rounded">
                <source src={src} type="video/mp4" />
              </video>
            ) : (
              <img key={i} src={src} alt={`media-${i}`} className="w-80 h-80 object-contain rounded" />
            );
          })}
        </div>

        {post.caption && <p className="mt-4 text-center text-gray-800 dark:text-gray-200">{post.caption}</p>}
      </div>
    </div>
  );
}

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
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  const [selectedPost, setSelectedPost] = useState(null);

  const fetchProfile = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);

    try {
      let res;
      if (!id || id === String(user?._id)) {
        res = await axios.get(`${API_BASE}/users/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        res = await axios.get(`${API_BASE}/users/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      const fetchedProfile = res.data.user || res.data;
      const fetchedPosts = res.data.posts || [];

      setProfile(fetchedProfile);
      setPosts(fetchedPosts);

      setIsFollowing(Boolean(user && fetchedProfile.followers && fetchedProfile.followers.includes(user._id)));
      setBio(fetchedProfile.bio || "");
    } catch (err) {
      console.error("Profile fetch error:", err?.response?.data || err.message);
      setError(err?.response?.data?.message || "Could not load profile.");
    } finally {
      setLoading(false);
    }
  }, [id, token, user]);

  useEffect(() => {
    if (token && user) fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchProfile, token, user, id]);

  // Follow / Unfollow
  const handleFollowToggle = async () => {
    if (!profile || !token) return;
    try {
      await axios.post(`${API_BASE}/users/${profile._id}/follow`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // refresh profile to get updated followers/following counts
      await fetchProfile();
    } catch (err) {
      console.error("Follow/unfollow error:", err?.response?.data || err.message);
      setError(err?.response?.data?.message || "Action failed");
    }
  };

  // Profile update (bio + avatar)
  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  useEffect(() => {
    return () => {
      // revoke preview url on unmount
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!token) return;
    try {
      const formData = new FormData();
      formData.append("bio", bio);
      if (avatarFile) formData.append("avatar", avatarFile);

      const res = await axios.put(`${API_BASE}/users/profile`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setProfile(res.data.user || res.data);
      setEditing(false);
      setAvatarFile(null);
      setAvatarPreview(null);
      await fetchProfile();
    } catch (err) {
      console.error("Profile update failed:", err?.response?.data || err.message);
      setError(err?.response?.data?.message || "Profile update failed");
    }
  };

  const handleCancelEdit = () => {
    setEditing(false);
    setAvatarFile(null);
    setAvatarPreview(null);
    setBio(profile?.bio || "");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-black text-gray-900 dark:text-white">
        <Navbar />
        <div className="max-w-3xl mx-auto p-6 text-center">Loading profile...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-black text-gray-900 dark:text-white">
        <Navbar />
        <div className="max-w-3xl mx-auto p-6 text-center text-red-500">{error}</div>
      </div>
    );
  }

  // helper to resolve avatar location
  const avatarSrc = resolveUrl(profile?.avatar) || "https://placehold.co/100x100?text=Avatar";

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-black text-gray-900 dark:text-white">
      <Navbar />

      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-6">
          <img src={avatarPreview || avatarSrc} alt="avatar" className="w-24 h-24 rounded-full object-cover border" />
          <div className="flex-1">
            <h2 className="text-2xl font-bold">{profile?.username}</h2>
            <p className="text-gray-600 dark:text-gray-400">{profile?.email}</p>
            <p className="mt-2">{profile?.bio}</p>
            <div className="mt-3 flex gap-4 items-center">
              <span className="text-sm">Followers: {profile?.followers?.length || 0}</span>
              <span className="text-sm">Following: {profile?.following?.length || 0}</span>
            </div>
          </div>

          {/* Follow / Edit controls */}
          <div>
            {profile && user && profile._id !== user._id ? (
              <button
                onClick={handleFollowToggle}
                className={`px-4 py-2 rounded ${isFollowing ? "bg-red-500" : "bg-blue-500"} text-white`}
              >
                {isFollowing ? "Unfollow" : "Follow"}
              </button>
            ) : profile && user && profile._id === user._id ? (
              <div>
                {editing ? (
                  <div className="flex gap-2">
                    <button onClick={() => {}} className="px-4 py-2 bg-gray-500 text-white rounded mr-2"> </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setEditing(true)}
                    className="px-4 py-2 bg-gray-800 text-white rounded"
                  >
                    Edit Profile
                  </button>
                )}
              </div>
            ) : null}
          </div>
        </div>

        {/* Edit form (only for own profile) */}
        {profile && user && profile._id === user._id && editing && (
          <form onSubmit={handleUpdate} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full p-2 rounded text-black"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Avatar</label>
              <input type="file" accept="image/*" onChange={handleAvatarChange} />
            </div>

            <div className="flex gap-2">
              <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded">Save</button>
              <button type="button" onClick={handleCancelEdit} className="px-4 py-2 bg-gray-500 text-white rounded">Cancel</button>
            </div>
          </form>
        )}

        {/* Posts grid */}
        <div className="mt-8 grid grid-cols-3 gap-4">
          {posts.length === 0 ? (
            <div className="col-span-3 text-center text-gray-600 dark:text-gray-400">No posts yet.</div>
          ) : (
            posts.map((post) => (
              <ProfilePost key={post._id} post={post} onClick={setSelectedPost} />
            ))
          )}
        </div>
      </div>

      {/* Modal preview */}
      {selectedPost && <PostModal post={selectedPost} onClose={() => setSelectedPost(null)} />}
    </div>
  );
}
