import React, { useState, useContext } from "react";
import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";

// FIX: Mocking the imports to make the component runnable in isolation.
// In your real application, these would be in separate files.
const api = {
  post: async (url, formData, config) => {
    console.log(`POST request to: ${url}`);
    console.log("FormData:", Object.fromEntries(formData));
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ data: { message: "Success" } });
      }, 1000);
    });
  },
};
const AuthContext = React.createContext({ token: "fake-token" });

export default function UploadPost() {
  const navigate = useNavigate();
  const { token } = useContext(AuthContext);

  const [media, setMedia] = useState(null);
  const [caption, setCaption] = useState("");
  const [tags, setTags] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setMedia(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!media) {
      setMessage("Please select a file to upload.");
      setLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("media", media);
      formData.append("caption", caption);
      formData.append("tags", tags);

      await api.post("/posts/upload", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setMessage("Post uploaded successfully!");
      setCaption("");
      setTags("");
      setMedia(null);
      setTimeout(() => navigate("/"), 2000); // Redirect to home page
    } catch (err) {
      setMessage(err.response?.data?.message || "Upload failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-black text-gray-900 dark:text-white">
      <div className="max-w-2xl mx-auto py-6 px-4">
        <h1 className="text-2xl font-bold mb-6 text-center">Upload New Post</h1>
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-[#111] p-6 rounded shadow-md w-full"
          encType="multipart/form-data"
        >
          <div className="space-y-4">
            <div>
              <label htmlFor="media" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Media</label>
              <input
                id="media"
                type="file"
                accept="image/*,video/mp4"
                onChange={handleFileChange}
                className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100 dark:file:bg-gray-600 dark:file:text-white"
              />
            </div>
            <div>
              <label htmlFor="caption" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Caption</label>
              <input
                id="caption"
                type="text"
                placeholder="Write a caption..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-3 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tags</label>
              <input
                id="tags"
                type="text"
                placeholder="e.g., #nature #photography"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-3 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
          <button
            type="submit"
            className="mt-6 w-full bg-green-500 hover:bg-green-600 text-white p-3 rounded disabled:opacity-50 disabled:cursor-not-allowed transition duration-150"
            disabled={loading}
          >
            {loading ? "Uploading..." : "Upload"}
          </button>
          {message && (
            <p className="mt-4 text-center text-sm text-gray-700 dark:text-gray-300">
              {message}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
