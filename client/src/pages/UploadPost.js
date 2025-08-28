import React, { useState, useContext } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";

// This is the corrected Navbar component from your original code.
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

// This is the corrected UploadPost component.
// NOTE: I have removed the import and rendering of the <Navbar /> component from here.
function UploadPost() {
  // FIX: Mocking the imports to make the component runnable in isolation.
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

  const { token } = useContext(AuthContext);
  const [media, setMedia] = useState(null);
  const [caption, setCaption] = useState("");
  const [tags, setTags] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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
      setTimeout(() => navigate("/"), 2000);
    } catch (err) {
      setMessage(err.response?.data?.message || "Upload failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-black text-gray-900 dark:text-white">
      <div className="flex items-center justify-center py-6 px-4">
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-[#111] p-6 rounded shadow-md w-96"
          encType="multipart/form-data"
        >
          <h1 className="text-2xl mb-4 text-center text-gray-800 dark:text-white">
            Upload Post
          </h1>

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

// This is the component that will be rendered, including a sample of how to use react-router-dom
export default function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<div>Home Page</div>} />
        <Route path="/upload" element={<UploadPost />} />
      </Routes>
    </Router>
  );
}
