import React from "react";
import { Link } from "react-router-dom";

/**
 * A reusable React component for displaying a single social media post.
 * This component includes user information, media (image/video),
 * caption, tags, like button, and a comment section.
 *
 * It is designed to work as a presentational component, receiving data
 * and functions as props from a parent component.
 *
 * @param {object} props The component props.
 * @param {object} props.post The post data object to be displayed.
 * @param {Function} props.toggleLike Function to handle liking/unliking a post.
 * @param {Function} props.addComment Function to handle adding a new comment.
 * @param {object} props.commentInputs Object containing the current comment input values for all posts.
 * @param {Function} props.setCommentInputs Function to update the comment input values.
 */
export default function PostCard({
  post,
  toggleLike,
  addComment,
  commentInputs,
  setCommentInputs,
}) {
  // Return null if the post object is not provided, to prevent errors.
  if (!post) {
    return null;
  }

  // Check if the post has any media content.
  const hasMedia = post && post.media && post.media.length > 0;

  return (
    <div className="bg-white dark:bg-[#111] shadow-md rounded-lg p-2 mb-4">
      {/* Post Header */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-800">
        <Link to={`/profile/${post.user?._id}`} className="block">
          <p className="font-semibold text-gray-800 dark:text-gray-200 hover:underline">
            {post.user?.username || "Unknown"}
          </p>
        </Link>
      </div>

      {/* Media Gallery */}
      {/* This section iterates through the media array and displays each item. */}
      {hasMedia ? (
        <div className="w-full my-2">
          {post.media.map((m, i) => (
            <div key={i} className="mb-2 last:mb-0">
              {m.type === "image" ? (
                <div className="w-full bg-black flex items-center justify-center rounded-lg overflow-hidden">
                  <img
                    src={m.secure_url}
                    alt="Post media"
                    className="max-h-[600px] w-auto object-contain"
                  />
                </div>
              ) : (
                <div className="w-full bg-black flex items-center justify-center rounded-lg overflow-hidden">
                  <video
                    src={m.secure_url}
                    controls
                    className="max-h-[600px] w-full object-contain"
                  >
                    <source src={m.secure_url} type="video/mp4" />
                  </video>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        // Placeholder message if no media is available.
        <div className="w-full h-64 bg-gray-200 dark:bg-gray-700 flex items-center justify-center rounded-lg my-2">
          <p className="text-gray-500 dark:text-gray-400">No media available</p>
        </div>
      )}

      {/* Caption and Tags */}
      <div className="p-3">
        {post.caption && (
          <p className="mb-2 text-gray-800 dark:text-gray-200">
            <span className="font-semibold">{post.user?.username}: </span>
            {post.caption}
          </p>
        )}
        {post.tags.length > 0 && (
          <p className="text-sm text-blue-500">
            {post.tags.map((tag, i) => (
              <span key={i}>#{tag} </span>
            ))}
          </p>
        )}
      </div>

      {/* Like button and count */}
      <div className="p-3 flex gap-4 items-center">
        <button
          onClick={() => toggleLike(post._id)}
          className="text-red-500 hover:text-red-600 transition-colors"
        >
          ❤️ {post.likes?.length || 0}
        </button>
      </div>

      {/* Comments Section */}
      <div className="px-3 pb-3">
        <p className="font-semibold text-sm mb-2 text-gray-800 dark:text-gray-200">Comments</p>
        {post.comments?.map((c, i) => (
          <p key={i} className="text-sm text-gray-700 dark:text-gray-300">
            <span className="font-semibold">{c.user?.username || "User"}: </span>
            {c.text}
          </p>
        ))}

        {/* Add new comment input field and post button */}
        <div className="flex gap-2 mt-4">
          <input
            type="text"
            placeholder="Add a comment..."
            value={commentInputs[post._id] || ""}
            onChange={(e) =>
              setCommentInputs({
                ...commentInputs,
                [post._id]: e.target.value,
              })
            }
            className="flex-1 border rounded-lg px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => addComment(post._id)}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-600 transition-colors"
          >
            Post
          </button>
        </div>
      </div>
    </div>
  );
}
