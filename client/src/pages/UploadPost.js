import React, { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore, collection, addDoc, query, onSnapshot, orderBy } from "firebase/firestore";

// The rest of your imports
import Navbar from "../components/Navbar";

// This is your unique API key for ImgBB.
const IMGBB_API_KEY = "28a32508b8289106a69481044e67a173";

// Firebase configuration from your environment variables
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

// This component will handle the image upload and form submission
const UploadPost = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [caption, setCaption] = useState("");
  const [status, setStatus] = useState("");

  // Function to handle file selection from the input
  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  // Function to upload the image to ImgBB
  const uploadToImgBB = async (file) => {
    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload image to ImgBB");
      }

      const result = await response.json();
      return result.data.url; // Return the hosted image URL
    } catch (error) {
      console.error("Error uploading to ImgBB:", error);
      setStatus("Image upload failed. Please try again.");
      return null;
    }
  };

  // Function to handle the form submission
  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedFile || !caption) {
      setStatus("Please select an image and write a caption.");
      return;
    }

    setStatus("Uploading image...");

    // 1. Upload the image to ImgBB first
    const imageUrl = await uploadToImgBB(selectedFile);

    if (imageUrl) {
      // 2. If upload is successful, create a post object with the new URL
      const postData = {
        caption: caption,
        imageUrl: imageUrl, // Save the ImgBB URL instead of a file
        timestamp: new Date(),
        userId: "test-user-id", // You'll need to replace this with the actual user's ID
      };

      try {
        // 3. Add the post data to Firestore
        await addDoc(collection(db, "posts"), postData);
        setStatus("Post uploaded successfully!");
        setCaption("");
        setSelectedFile(null);
      } catch (error) {
        console.error("Error adding document:", error);
        setStatus("Failed to create post in Firestore.");
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">Create a New Post</h1>
      <form onSubmit={handleSubmit} className="w-full max-w-lg bg-white dark:bg-gray-800 shadow-xl rounded-lg p-8">
        <div className="mb-6">
          <label htmlFor="image-upload" className="block text-gray-700 dark:text-gray-200 text-sm font-semibold mb-2">
            Upload Image
          </label>
          <input
            id="image-upload"
            type="file"
            onChange={handleFileChange}
            accept="image/*"
            className="w-full text-gray-900 dark:text-gray-100 bg-gray-200 dark:bg-gray-700 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="mb-6">
          <label htmlFor="caption" className="block text-gray-700 dark:text-gray-200 text-sm font-semibold mb-2">
            Caption
          </label>
          <textarea
            id="caption"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows="3"
            className="w-full text-gray-900 dark:text-gray-100 bg-gray-200 dark:bg-gray-700 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Write a caption for your post..."
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition duration-300 ease-in-out"
        >
          Publish Post
        </button>
      </form>

      {status && (
        <div className="mt-4 p-3 rounded-md text-sm bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
          {status}
        </div>
      )}
    </div>
  );
};

export default UploadPost;
