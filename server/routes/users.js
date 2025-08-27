const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const User = require("../models/User");
const Post = require("../models/Post");
const auth = require("../middleware/authMiddleware");

// ---------- Multer setup for avatar uploads ----------
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/avatars"); // inside uploads/avatars
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// ---------- GET own profile ----------
router.get("/profile", auth, async (req, res) => {
  try {
    // ✅ FIXED: Use req.userId as set by the middleware
    console.log("Fetching profile for user:", req.userId);

    const user = await User.findById(req.userId)
      .populate("followers following", "username avatar");

    if (!user) return res.status(404).json({ message: "User not found" });

    // ✅ FIXED: Use req.userId to find posts
    const posts = await Post.find({ user: req.userId });

    res.json({
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        bio: user.bio || "",
        avatar: user.avatar || null,
        followers: user.followers,
        following: user.following,
      },
      posts,
    });
  } catch (err) {
    console.error("Error fetching profile:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ---------- UPDATE own profile ----------
router.put("/profile", auth, upload.single("avatar"), async (req, res) => {
  try {
    // ✅ FIXED: Use req.userId for fetching the user
    console.log("Updating profile for user:", req.userId);

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (req.body.bio !== undefined) user.bio = req.body.bio;
    if (req.file) user.avatar = `/uploads/avatars/${req.file.filename}`;

    await user.save();
    console.log("Updated user:", user);

    res.json({
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        bio: user.bio || "",
        avatar: user.avatar || null,
        followers: user.followers,
        following: user.following,
      },
    });
  } catch (err) {
    console.error("Profile update error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ---------- GET another user profile ----------
router.get("/:id", auth, async (req, res) => {
  try {
    // ✅ FIXED: Removed 'email' from the select statement
    const user = await User.findById(req.params.id)
      .populate("followers following", "username avatar");

    if (!user) return res.status(404).json({ message: "User not found" });

    const posts = await Post.find({ user: req.params.id });

    // ✅ FIXED: Remove email from the JSON response
    res.json({
      user: {
        _id: user._id,
        username: user.username,
        // Removed email from this object to prevent it from being sent
        bio: user.bio || "",
        avatar: user.avatar || null,
        followers: user.followers,
        following: user.following,
      },
      posts,
    });
  } catch (err) {
    console.error("Error fetching other user profile:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ---------- FOLLOW/UNFOLLOW ----------
router.post("/:id/follow", auth, async (req, res) => {
  try {
    // ✅ FIXED: Use req.userId
    if (req.userId === req.params.id) {
      return res.status(400).json({ message: "You cannot follow yourself" });
    }

    const userToFollow = await User.findById(req.params.id);
    const currentUser = await User.findById(req.userId); // ✅ FIXED: Use req.userId

    if (!userToFollow || !currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // ✅ FIXED: Use req.userId for pull/push operations
    if (userToFollow.followers.includes(req.userId)) {
      // Already following → unfollow
      await userToFollow.updateOne({ $pull: { followers: req.userId } });
      await currentUser.updateOne({ $pull: { following: req.params.id } });
      res.json({ message: "Unfollowed successfully" });
    } else {
      // Not following → follow
      await userToFollow.updateOne({ $push: { followers: req.userId } });
      await currentUser.updateOne({ $push: { following: req.params.id } });
      res.json({ message: "Followed successfully" });
    }
  } catch (err) {
    console.error("Error in follow/unfollow:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ---------- SEARCH USERS ----------
router.get("/search/:query", async (req, res) => {
  try {
    const regex = new RegExp(req.params.query, "i"); // "i" = case-insensitive
    const users = await User.find({ username: regex }).select(
      "username avatar"
    );
    res.json(users);
  } catch (err) {
    console.error("Error searching for users:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
