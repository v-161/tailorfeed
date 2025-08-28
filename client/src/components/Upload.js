import React, { useState, useContext } from "react";
// Import the centralized API instance
import api from "../api";
import { AuthContext } from "../context/AuthContext"; // Import AuthContext to access the token

export default function Upload({ onUploadSuccess }) {
  // Use a state variable for the media files
  const [mediaFiles, setMediaFiles] = useState([]);
  // Use a state variable for the caption
  const [caption, setCaption] = useState("");
  // Use a state variable for the tags
  const [tags, setTags] = useState("");
  // Use a state variable for showing messages to the user
  const [message, setMessage] = useState("");

  // Get the token from the AuthContext to use for authentication
  const { user, token } = useContext(AuthContext);

  // Handle file input changes and store the selected files in state
  const handleFileChange = (e) => {
    setMediaFiles([...e.target.files]);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Simple validation to ensure files are selected
    if (mediaFiles.length === 0) {
      setMessage("Please select files to upload.");
      return;
    }

    // Check if the user and token exist before attempting the upload
    if (!user || !token) {
      setMessage("You must be logged in to upload content.");
      return;
    }

    // Create a new FormData object to send a multipart/form-data request
    const formData = new FormData();
    mediaFiles.forEach((file) => formData.append("media", file));
    formData.append("caption", caption);
    formData.append("tags", tags);

    try {
      // Make the authenticated POST request using the shared 'api' instance
      await api.post("/posts/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`, // Add the Authorization header
        },
      });

      // Reset the form fields on a successful upload
      setMediaFiles([]);
      setCaption("");
      setTags("");
      setMessage("Upload successful!");

      // Call the success callback to refresh the feed or perform other actions
      if (onUploadSuccess) onUploadSuccess();
    } catch (err) {
      console.error("Upload failed:", err);
      setMessage(err.response?.data?.message || "Upload failed");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-[#111] p-4 rounded shadow-md mb-4">
      <input
        type="file"
        multiple
        accept="image/*,video/*"
        onChange={handleFileChange}
        className="mb-2"
      />
      <input
        type="text"
        placeholder="Caption"
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        className="w-full mb-2 p-1 border rounded"
      />
      <input
        type="text"
        placeholder="Tags (comma separated)"
        value={tags}
        onChange={(e) => setTags(e.target.value)}
        className="w-full mb-2 p-1 border rounded"
      />
      <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
        Upload
      </button>
      {message && (
        <p className="mt-2 text-sm text-center text-gray-700 dark:text-gray-300">
          {message}
        </p>
      )}
    </form>
  );
}
