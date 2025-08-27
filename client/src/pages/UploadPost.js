import { useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar"; // Import the Navbar component

export default function UploadPost() {
  const { token } = useContext(AuthContext);
  const [media, setMedia] = useState([]);
  const [caption, setCaption] = useState("");
  const [tags, setTags] = useState("");
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    setMedia(e.target.files);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!media.length) {
      alert("Please select at least one file");
      return;
    }

    try {
      const formData = new FormData();
      for (let i = 0; i < media.length; i++) {
        formData.append("media", media[i]); // must match backend `upload.array("media", 10)`
      }
      formData.append("caption", caption);
      formData.append("tags", tags);

      await axios.post("http://localhost:5000/posts/upload", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      alert("Post uploaded successfully");
      navigate("/"); // Go back to home after upload
    } catch (err) {
      alert(err.response?.data?.message || "Upload failed");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-black text-gray-900 dark:text-white">
      {/* Add the Navbar component here */}
      <Navbar />
      
      {/* The main content container with the form */}
      <div className="flex items-center justify-center py-6 px-4">
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-[#111] p-6 rounded shadow-md w-96"
          encType="multipart/form-data"
        >
          <h1 className="text-2xl mb-4 text-center text-gray-800 dark:text-white">
            Upload Post
          </h1>

          {/* Multiple file input (images + mp4 videos) */}
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
