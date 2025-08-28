import React, { useState, useContext } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";

// This is a self-contained, working example of your app's main components.

// This is your Navbar component, which should only be rendered once in App.js.
const Navbar = () => (
  <nav className="bg-white dark:bg-gray-800 shadow-md p-4">
    <div className="container mx-auto flex justify-between items-center">
      <div className="text-xl font-bold text-gray-800 dark:text-white">
        My App
      </div>
      <div className="flex gap-4">
        {/* Use React Router's Link or regular anchor tags to navigate */}
        <a href="/" className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white">Home</a>
        <a href="/profile" className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white">Profile</a>
        <a href="/upload" className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white">Upload</a>
      </div>
    </div>
  </nav>
);

// FIX: Mocking the AuthContext for a runnable example.
const AuthContext = React.createContext({
  user: {
    displayName: "Jane Doe",
    email: "jane.doe@example.com"
  },
  token: "fake-token"
});

// The corrected Profile component with no Navbar and real user data.
function Profile() {
  const { user } = useContext(AuthContext);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-black text-gray-900 dark:text-white">
      <div className="flex items-center justify-center py-6 px-4">
        <div className="bg-white dark:bg-[#111] p-8 rounded shadow-md max-w-lg w-full">
          <h1 className="text-3xl font-bold text-center mb-6 text-gray-800 dark:text-white">
            User Profile
          </h1>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Display Name</label>
              <p className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-3 bg-gray-50 dark:bg-gray-700 dark:text-white">
                {user.displayName || "Not Available"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
              <p className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-3 bg-gray-50 dark:bg-gray-700 dark:text-white">
                {user.email || "Not Available"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// The corrected UploadPost component with no Navbar.
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

// The main App component that sets up the layout and routing.
export default function App() {
  return (
    <Router>
      {/* The Navbar is rendered here only once */}
      <Navbar />
      {/* All page components are rendered within Routes */}
      <Routes>
        <Route path="/" element={
          <div className="p-4 text-center">
            <h1 className="text-4xl font-bold">Welcome to the Home Page!</h1>
            <p className="mt-4">Navigate to the Profile or Upload pages.</p>
          </div>
        } />
        {/* FIX: The route for the UploadPost component is now correctly included. */}
        <Route path="/upload" element={<UploadPost />} />
        {/* FIX: The route for the Profile component is also correctly included. */}
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </Router>
  );
}
