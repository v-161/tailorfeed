import { useEffect, useState, useContext, useCallback } from "react";
import { useParams } from "react-router-dom";
import api from "../api";
import { AuthContext } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import ProfilePost from "../components/ProfilePost";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import { Navigation } from "swiper/modules";

// New PostModal component for displaying enlarged image
const PostModal = ({ post, onClose }) => {
  if (!post) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="relative p-4 rounded-lg shadow-lg max-w-2xl max-h-full">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-white text-2xl font-bold"
        >
          &times;
        </button>
        <img
          src={`${api.defaults.baseURL}/uploads/posts/${post.image}`}
          alt="Post"
          className="max-w-full max-h-[80vh] object-contain rounded"
        />
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

      // If no ID in URL or ID matches current user, fetch own profile
      if (!id || id === String(user?._id)) {
        res = await api.get("/users/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        // Fetch another user's profile
        res = await api.get(`/users/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      setProfile(res.data.user);
      setPosts(res.data.posts || []);
      
      // Check if current user is following this profile
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
  }, [id, token, user]); // Added proper dependencies

  useEffect(() => {
    if (user && token) {
      fetchProfile();
    }
  }, [fetchProfile, user, token, id]); // Added id to dependency array

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
      setAvatar(null); // Reset avatar state after update
      
      // Re-fetch profile to ensure data is fresh and synced
      fetchProfile(); 
    } catch (err) {
      console.error("Profile update failed:", err.response?.data || err.message);
      setError("Profile update failed. Please try again.");
    }
  };

  // --- New function to handle canceling the bio edit ---
  const handleCancel = () => {
    setEditing(false);
    setAvatar(null);
    setBio(profile.bio || ""); // Revert bio to the original profile value
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
      
      // Toggle the follow state immediately for better UX
      setIsFollowing(!isFollowing);
      
      // Then refetch to get updated follower counts
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
    <div className="min-h-screen bg-gray-100 dark:bg-black text-gray-900 dark:text-white">
      <Navbar />
      <div className="max-w-3xl mx-auto py-6 px-4">
        {/* Profile Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <img
              src={
                profile.avatar
                  ? `${api.defaults.baseURL}/uploads/avatars/${profile.avatar}`
                  : "https://placehold.co/100x100/A0AEC0/000000?text=Avatar"
              }
              alt="avatar"
              className="w-24 h-24 rounded-full object-cover"
            />
            <div>
              <h1 className="text-2xl font-bold">{profile.username}</h1>
              <p className="text-gray-600 dark:text-gray-300">{profile.email}</p>
              <p className="mt-2">{profile.bio || "No bio yet."}</p>
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
              className={`px-4 py-2 rounded ${
                isFollowing ? "bg-red-500 hover:bg-red-600" : "bg-blue-500 hover:bg-blue-600"
              } text-white transition-colors`}
            >
              {isFollowing ? "Unfollow" : "Follow"}
            </button>
          )}
        </div>

        <p className="mb-2">Followers: {profile.followers?.length || 0}</p>
        <p className="mb-6">Following: {profile.following?.length || 0}</p>

        {/* Posts Swiper */}
        <h3 className="text-xl font-semibold mb-4">Posts</h3>
        {posts.length === 0 ? (
          <p className="text-center text-gray-600 dark:text-gray-400">
            No posts found for this user.
          </p>
        ) : (
          <div className="relative">
            <Swiper
              navigation={true}
              modules={[Navigation]}
              slidesPerView={1}
              spaceBetween={10}
              className="mySwiper"
              breakpoints={{
                640: {
                  slidesPerView: 2,
                  spaceBetween: 20,
                },
                768: {
                  slidesPerView: 3,
                  spaceBetween: 30,
                },
              }}
            >
              {posts.map((post) => (
                <SwiperSlide key={post._id}>
                  <div onClick={() => setSelectedPost(post)} className="cursor-pointer">
                    <ProfilePost post={post} />
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        )}

        {/* Edit Profile Modal */}
        {editing && (
          // Fixed z-index issue by using a high value
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center" style={{ zIndex: 1000 }}>
            <form
              onSubmit={handleUpdate}
              className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-96"
            >
              <h2 className="text-xl font-bold mb-4 text-black dark:text-white">
                Edit Profile
              </h2>
              <label className="block mb-2 text-black dark:text-gray-200">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full p-2 rounded border dark:bg-gray-700 dark:text-white"
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
                  onClick={handleCancel} // Using the new dedicated function
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
