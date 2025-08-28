import React, { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getAuth } from 'firebase/auth'; 
import { getAnalytics } from "firebase/analytics";
import { getFirestore, collection, addDoc, query, onSnapshot, orderBy } from "firebase/firestore";
import Navbar from "../components/Navbar";

const firebaseConfig = {
  apiKey: "AIzaSyBYWgX6Qi-4TCYmegHTGonRUXWAoajttjg",
  authDomain: "tailorfeed-project.firebaseapp.com",
  projectId: "tailorfeed-project",
  storageBucket: "tailorfeed-project.firebasestorage.app",
  messagingSenderId: "247917038406",
  appId: "1:247917038406:web:223ad6e29f4bda66967347",
  measurementId: "G-CNR0MJQBHF"
};

// Cloudinary credentials
const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/dxkt5xsno/image/upload";
const CLOUDINARY_UPLOAD_PRESET = "tailorfeed_image_app";

// Initialize Firebase App and Firestore
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

export default function UploadPost() {
  const [media, setMedia] = useState(null);
  const [caption, setCaption] = useState("");
  const [tags, setTags] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  // Set up a real-time listener for posts from Firestore
  useEffect(() => {
    const postsCollection = collection(db, "posts");
    const q = query(postsCollection, orderBy("createdAt", "desc"));

    // onSnapshot listens for real-time updates and automatically re-fetches data
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedPosts = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPosts(fetchedPosts);
      setLoadingPosts(false);
    });

    // Cleanup the listener when the component unmounts
    return () => unsubscribe();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setMedia(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    if (!media) {
      setMessage("Please select a file to upload.");
      setLoading(false);
      return;
    }

    try {
      // 1. Upload image to Cloudinary
      const formData = new FormData();
      formData.append("file", media);
      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

      const cloudinaryResponse = await fetch(CLOUDINARY_URL, {
        method: "POST",
        body: formData,
      });

      if (!cloudinaryResponse.ok) {
        throw new Error("Cloudinary upload failed.");
      }

      const cloudinaryData = await cloudinaryResponse.json();
      const imageUrl = cloudinaryData.secure_url;

      // 2. Save post data (including the image URL) to Firestore
      await addDoc(collection(db, "posts"), {
        caption,
        tags,
        imageUrl,
        createdAt: new Date(),
      });

      setMessage("Post uploaded successfully!");
      setCaption("");
      setTags("");
      setMedia(null);
    } catch (err) {
      console.error("Upload failed:", err);
      setMessage(err.message || "Upload failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-black text-gray-900 dark:text-white font-sans">
      <Navbar />
      
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
                required
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
                required
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

      <hr className="my-8 max-w-2xl mx-auto" />

      {/* This section simulates your home feed */}
      <div className="max-w-2xl mx-auto py-6 px-4">
        <h2 className="text-2xl font-bold mb-6">Recent Posts</h2>
        {loadingPosts ? (
          <p className="text-center text-gray-600 dark:text-gray-400">Loading posts...</p>
        ) : posts.length === 0 ? (
          <p className="text-center text-gray-600 dark:text-gray-400">
            No posts available. Upload one to get started!
          </p>
        ) : (
          posts.map((post) => (
            <div key={post.id} className="bg-white dark:bg-[#111] p-6 rounded shadow-md mb-4">
              <p className="font-semibold text-gray-900 dark:text-white mb-2">{post.caption}</p>
              <p className="text-gray-500 text-sm dark:text-gray-400">Tags: {post.tags}</p>
              {post.imageUrl && (
                <img
                  src={post.imageUrl}
                  alt={post.caption}
                  className="mt-4 rounded-lg w-full"
                />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
