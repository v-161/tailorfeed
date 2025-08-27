import React, { useState } from "react";
import axios from "axios";

export default function Upload({ onUploadSuccess }) {
  const [mediaFiles, setMediaFiles] = useState([]);
  const [caption, setCaption] = useState("");
  const [tags, setTags] = useState("");

  const handleFileChange = (e) => {
    setMediaFiles([...e.target.files]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (mediaFiles.length === 0) return alert("Select files to upload");

    const formData = new FormData();
    mediaFiles.forEach((file) => formData.append("media", file));
    formData.append("caption", caption);
    formData.append("tags", tags.split(",").map((t) => t.trim()));

    try {
      await axios.post("http://localhost:5000/posts/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setMediaFiles([]);
      setCaption("");
      setTags("");
      if (onUploadSuccess) onUploadSuccess(); // Refresh feed
    } catch (err) {
      console.log(err);
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
    </form>
  );
}
