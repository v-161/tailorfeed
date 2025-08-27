const express = require("express");
const multer = require("multer");
const path = require("path");
const Post = require("../models/Post");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const router = express.Router();

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});

// Accept only images & videos
const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/jpg", "video/mp4"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only .jpg, .png, and .mp4 allowed"), false);
  }
};

const upload = multer({ storage, fileFilter });

// Middleware to verify token
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token provided" });

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ message: "Invalid token" });
    req.userId = decoded.id;
    next();
  });
}

// ---------- Upload Post ----------
router.post(
  "/upload",
  authMiddleware,
  upload.array("media", 10),
  async (req, res) => {
    try {
      const { caption, tags } = req.body;

      const mediaFiles = req.files.map((file) => {
        const type = file.mimetype.startsWith("video") ? "video" : "image";
        return { url: `/uploads/${file.filename}`, type };
      });

      const newPost = new Post({
        user: req.userId,
        media: mediaFiles,
        caption,
        tags: tags ? tags.split(",").map((t) => t.trim()) : [],
      });

      await newPost.save();

      const populated = await Post.findById(newPost._id)
        .populate("user", "username avatar")
        .populate("comments.user", "username avatar");

      res.status(201).json(populated);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// ---------- Get Feed (self + following) ----------
router.get("/feed", authMiddleware, async (req, res) => {
  try {
    const currentUser = await User.findById(req.userId);
    if (!currentUser)
      return res.status(404).json({ message: "User not found" });

    const following = currentUser.following.concat(req.userId); // include self

    const posts = await Post.find({ user: { $in: following } })
      .populate("user", "username avatar")
      .populate("comments.user", "username avatar")
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ---------- Like / Unlike ----------
router.post("/:id/like", authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    // ✅ FIX: Use .some() and .toString() to correctly check for the user ID
    const alreadyLiked = post.likes.some(id => id.toString() === req.userId);

    if (alreadyLiked) {
      post.likes = post.likes.filter((id) => id.toString() !== req.userId);
    } else {
      post.likes.push(req.userId);
    }

    await post.save();

    const updated = await Post.findById(req.params.id)
      .populate("user", "username avatar")
      .populate("comments.user", "username avatar");

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ---------- Add Comment ----------
router.post("/:id/comment", authMiddleware, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text)
      return res.status(400).json({ message: "Comment text is required" });

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    post.comments.push({ user: req.userId, text });
    await post.save();

    const updated = await Post.findById(req.params.id)
      .populate("user", "username avatar")
      .populate("comments.user", "username avatar");

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ---------- Explore (all posts) ----------
router.get("/explore", authMiddleware, async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("user", "username avatar")
      .populate("comments.user", "username avatar")
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ---------- Get Single Post ----------
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate("user", "username avatar")
      .populate("comments.user", "username avatar");

    if (!post) return res.status(404).json({ message: "Post not found" });
    res.json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ---------- Edit Post ----------
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { caption, tags } = req.body;
    const post = await Post.findById(req.params.id);

    if (!post) return res.status(404).json({ message: "Post not found" });
    if (post.user.toString() !== req.userId)
      return res.status(403).json({ message: "Not authorized" });

    if (caption) post.caption = caption;
    if (tags) post.tags = tags.split(",").map((t) => t.trim());

    await post.save();

    const updated = await Post.findById(req.params.id)
      .populate("user", "username avatar")
      .populate("comments.user", "username avatar");

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ---------- Delete Post ----------
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    if (post.user.toString() !== req.userId)
      return res.status(403).json({ message: "Not authorized" });

    await post.deleteOne();
    res.json({ message: "Post deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ---------- Save / Unsave ----------
router.post("/:id/save", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // ✅ FIX: Use .some() and .toString() to correctly check for the post ID
    const alreadySaved = user.savedPosts.some(pid => pid.toString() === req.params.id);

    if (alreadySaved) {
      user.savedPosts = user.savedPosts.filter(
        (pid) => pid.toString() !== req.params.id
      );
    } else {
      user.savedPosts.push(req.params.id);
    }

    await user.save();
    res.json({ saved: !alreadySaved, savedPosts: user.savedPosts });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ---------- Search by caption/tags ----------
router.get("/search/:query", authMiddleware, async (req, res) => {
  try {
    const regex = new RegExp(req.params.query, "i");
    const posts = await Post.find({
      $or: [{ caption: regex }, { tags: regex }],
    })
      .populate("user", "username avatar")
      .populate("comments.user", "username avatar")
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
