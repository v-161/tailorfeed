import { useState } from "react";

export default function ProfilePost({ post }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [open, setOpen] = useState(false);

  const nextImage = () => {
    setCurrentIndex((prev) =>
      prev + 1 < post.media.length ? prev + 1 : 0
    );
  };

  const prevImage = () => {
    setCurrentIndex((prev) =>
      prev - 1 >= 0 ? prev - 1 : post.media.length - 1
    );
  };

  return (
    <>
      {/* Thumbnail grid item */}
      <div
        onClick={() => setOpen(true)}
        className="relative w-full h-48 bg-black flex items-center justify-center cursor-pointer"
      >
        <img
          src={`http://localhost:10000${post.media[currentIndex].url}`}
          alt="post"
          className="max-w-full max-h-full object-contain"
        />
        {post.media.length > 1 && (
          <span className="absolute top-1 right-1 bg-black/70 text-white text-xs px-2 py-1 rounded">
            {currentIndex + 1}/{post.media.length}
          </span>
        )}
      </div>

      {/* Modal when clicked */}
      {open && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-[#111] rounded-lg max-w-2xl w-full p-4 relative">
            <button
              onClick={() => setOpen(false)}
              className="absolute top-2 right-2 text-white bg-red-500 px-2 py-1 rounded"
            >
              ✕
            </button>

            <div className="flex items-center justify-center relative">
              <img
                src={`http://localhost:10000${post.media[currentIndex].url}`}
                alt="post"
                className="max-w-full max-h-[500px] object-contain"
              />

              {post.media.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-2 bg-black/50 text-white px-2 py-1 rounded"
                  >
                    ◀
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-2 bg-black/50 text-white px-2 py-1 rounded"
                  >
                    ▶
                  </button>
                </>
              )}
            </div>

            {/* Post caption + comments later */}
            <div className="mt-4 text-black dark:text-white">
              <p className="font-bold">{post.caption}</p>
              {/* here you can render likes/comments if needed */}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
