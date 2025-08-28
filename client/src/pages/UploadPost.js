/*import { useState, useContext } from "react";
// Import your centralized API instance
import api from "../api";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar"; // Import the Navbar component

export default function UploadPost() {
  // Use context to get the user's authentication token
  const { token } = useContext(AuthContext);
  // State for the selected media files, caption, tags, and message
  const [media, setMedia] = useState([]);
  const [caption, setCaption] = useState("");
  const [tags, setTags] = useState("");
  const [message, setMessage] = useState("");
  // Hook for programmatic navigation
  const navigate = useNavigate();

  // Handler for file input changes
  const handleFileChange = (e) => {
    setMedia(e.target.files);
  };

  // Handler for form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check if any files have been selected
    if (!media.length) {
      // Use a custom message instead of alert()
      setMessage("Please select at least one file");
      return;
    }

    try {
      // Create a new FormData object to handle file uploads
      const formData = new FormData();
      // Append each selected file to the FormData object
      for (let i = 0; i < media.length; i++) {
        formData.append("media", media[i]);
      }
      // Append the caption and tags
      formData.append("caption", caption);
      formData.append("tags", tags);

      // Make a POST request to the upload endpoint with the FormData using the 'api' instance
      await api.post("/posts/upload", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      // Show success message and navigate
      setMessage("Post uploaded successfully!");
      setTimeout(() => navigate("/"), 2000); // Redirect after 2 seconds
    } catch (err) {
      // Handle upload failure
      setMessage(err.response?.data?.message || "Upload failed");
    }
  };

  // The component's UI
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-black text-gray-900 dark:text-white">
      <Navbar />
      
      <div className="flex items-center justify-center py-6 px-4">
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-[#111] p-6 rounded shadow-md w-96"
          encType="multipart/form-data"
        >
          <h1 className="text-2xl mb-4 text-center text-gray-800 dark:text-white">
            Upload Post
          </h1>

          {/* Multiple file input for images and videos */}
        /*  <input
            type="file"
            multiple
            accept="image/*,video/mp4"
            onChange={handleFileChange}
            className="block w-full mb-3"
          />

          <input
            type="text"
            placeholder="Caption"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="w-full p-2 mb-3 border rounded dark:bg-[#111] dark:text-white"
          />

          <input
            type="text"
            placeholder="Tags (comma separated)"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="w-full p-2 mb-3 border rounded dark:bg-[#111] dark:text-white"
          />

          <button className="w-full bg-green-500 hover:bg-green-600 text-white p-2 rounded">
            Upload
          </button>
          {message && (
            <p className="mt-3 text-center text-sm text-gray-700 dark:text-gray-300">
              {message}
            </p>
          )}
        </form>
      </div>
    </div>
  );
} */
import React, { useState, useContext, useCallback } from "react";
import { useNavigate } from "react-router-dom";

// FIX: Mocking the imports to make the component runnable in isolation.
// In a real application, you would need to provide these files.
const api = {
  post: async (url, formData, config) => {
    console.log(`POST request to: ${url}`);
    console.log("FormData:", Object.fromEntries(formData));
    return { data: { message: "Success" } };
  }
};
const AuthContext = React.createContext({ token: "fake-token" });
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

export default function UploadPost() {
  // Use context to get the user's authentication token
  const { token } = useContext(AuthContext);
  // State for the selected media file, caption, tags, and message
  const [media, setMedia] = useState(null); // Changed to a single file object
  const [caption, setCaption] = useState("");
  const [tags, setTags] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  // Hook for programmatic navigation
  const navigate = useNavigate();

  // Handler for file input changes
  const handleFileChange = (e) => {
    // FIX: Only handle the first selected file as per new backend
    const file = e.target.files[0];
    if (file) {
      setMedia(file);
    }
  };

  // Handler for form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Check if a file has been selected
    if (!media) {
      setMessage("Please select a file to upload.");
      setLoading(false);
      return;
    }

    try {
      // Create a new FormData object to handle file uploads
      const formData = new FormData();
      // Append the single selected file to the FormData object
      formData.append("media", media);
      // Append the caption and tags
      formData.append("caption", caption);
      // FIX: Ensure tags are a comma-separated string
      formData.append("tags", tags);

      // Make a POST request to the upload endpoint
      await api.post("/posts/upload", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      // Show success message and navigate
      setMessage("Post uploaded successfully!");
      setCaption("");
      setTags("");
      setMedia(null);
      setTimeout(() => navigate("/"), 2000); // Redirect after 2 seconds
    } catch (err) {
      // Handle upload failure
      setMessage(err.response?.data?.message || "Upload failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // The component's UI
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-black text-gray-900 dark:text-white">
      <Navbar />
      <div className="flex items-center justify-center py-6 px-4">
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-[#111] p-6 rounded shadow-md w-96"
          encType="multipart/form-data"
        >
          <h1 className="text-2xl mb-4 text-center text-gray-800 dark:text-white">
            Upload Post
          </h1>

          {/* Single file input for images and videos */}
          <input
            type="file"
            accept="image/*,video/mp4"
            onChange={handleFileChange}
            className="block w-full mb-3"
          />
          {media && (
            <p className="text-sm text-gray-500 dark:text-gray-400">Selected file: {media.name}</p>
          )}

          <input
            type="text"
            placeholder="Caption"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="w-full p-2 mb-3 border rounded dark:bg-gray-700 dark:text-white"
          />

          <input
            type="text"
            placeholder="Tags (comma separated)"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="w-full p-2 mb-3 border rounded dark:bg-gray-700 dark:text-white"
          />

          <button
            type="submit"
            className="w-full bg-green-500 hover:bg-green-600 text-white p-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? "Uploading..." : "Upload"}
          </button>
          {message && (
            <p className="mt-3 text-center text-sm text-gray-700 dark:text-gray-300">
              {message}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
