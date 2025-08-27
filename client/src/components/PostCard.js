import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import { Navigation } from "swiper/modules";
import { Link } from "react-router-dom";

export default function PostCard({
  post,
  toggleLike,
  addComment,
  commentInputs,
  setCommentInputs,
}) {
  // ✅ Add safe check
  if (!post) return null;

  const hasMedia = post && post.media && post.media.length > 0;

  return (
    <div className="bg-white dark:bg-[#111] shadow-md rounded-lg p-2 mb-4">
      {/* Post Header */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-800">
        <Link to={`/profile/${post.user?._id}`}>
          <p className="font-semibold hover:underline">
            {post.user?.username || "Unknown"}
          </p>
        </Link>
      </div>

      {/* Media Gallery */}
      {hasMedia ? (
        <Swiper navigation={true} modules={[Navigation]} className="w-full my-2">
          {post.media.map((m, i) => (
            <SwiperSlide key={i}>
              {m.type === "image" ? (
                <div className="w-full bg-black flex items-center justify-center rounded-lg">
                  <img
                    src={`http://localhost:5000${m.url}`}
                    alt="Post"
                    className="max-h-[600px] w-auto object-contain"
                  />
                </div>
              ) : (
                <div className="w-full bg-black flex items-center justify-center rounded-lg">
                  <video
                    src={`http://localhost:5000${m.url}`}
                    controls
                    className="max-h-[600px] w-auto object-contain"
                  >
                    <source
                      src={`http://localhost:5000${m.url}`}
                      type="video/mp4"
                    />
                  </video>
                </div>
              )}
            </SwiperSlide>
          ))}
        </Swiper>
      ) : (
        <div className="w-full h-64 bg-gray-200 dark:bg-gray-700 flex items-center justify-center rounded-lg my-2">
          <p className="text-gray-500 dark:text-gray-400">No media available</p>
        </div>
      )}

      {/* Caption + Tags */}
      <div className="p-3">
        {post.caption && (
          <p className="mb-2">
            <span className="font-semibold">{post.user?.username}: </span>
            {post.caption}
          </p>
        )}
        {post.tags.length > 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {post.tags.map((tag, i) => (
              <span key={i}>#{tag} </span>
            ))}
          </p>
        )}
      </div>

      {/* Like button */}
      <div className="p-3 flex gap-4 items-center">
        <button
          onClick={() => toggleLike(post._id)}
          className="text-red-500 hover:text-red-600"
        >
          ❤️ {post.likes?.length || 0}
        </button>
      </div>

      {/* Comments */}
      <div className="px-3 pb-3">
        {post.comments?.map((c, i) => (
          <p key={i} className="text-sm text-gray-700 dark:text-gray-300">
            <span className="font-semibold">
              {c.user?.username || "User"}:{" "}
            </span>
            {c.text}
          </p>
        ))}

        {/* Add comment input */}
        <div className="flex gap-2 mt-2">
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
            className="flex-1 border rounded px-2 py-1 text-black"
          />
          <button
            onClick={() => addComment(post._id)}
            className="bg-blue-500 text-white px-3 py-1 rounded"
          >
            Post
          </button>
        </div>
      </div>
    </div>
  );
}
