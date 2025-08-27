import { useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar"; // Import the Navbar component

export default function UploadPost() {
  // Use context to get the user's authentication token
  const { token } = useContext(AuthContext);
  // State for the selected media files, caption, and tags
  const [media, setMedia] = useState([]);
  const [caption, setCaption] = useState("");
  const [tags, setTags] = useState("");
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
      // Use a custom message box instead of alert()
      alert("Please select at least one file");
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

      // Make a POST request to the upload endpoint with the FormData
      await axios.post("http://localhost:10000/posts/upload", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      // Show success message and navigate
      alert("Post uploaded successfully");
      navigate("/");
    } catch (err) {
      // Handle upload failure
      alert(err.response?.data?.message || "Upload failed");
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
          <input
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
        </form>
      </div>
    </div>
  );
}
