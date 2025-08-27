const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },

    // Profile fields
    bio: { type: String, default: "" },
    avatar: { type: String, default: "" },

    // Followers / Following
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    // Saved posts
    savedPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" }],

    // Password reset fields
    resetToken: { type: String },
    resetTokenExpiry: { type: Date }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
