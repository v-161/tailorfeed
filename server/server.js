const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");

dotenv.config();

const authRoutes = require("./routes/auth");
const postRoutes = require("./routes/posts");
const userRoutes = require("./routes/users");

const app = express();

// --- THE FIX IS HERE ---
const allowedOrigins = [
  'https://tailorfeed-app.vercel.app'
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};
app.use(cors(corsOptions));
// ----------------------

app.use(express.json());

// Serve uploads folder (static files)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/auth", authRoutes);
app.use("/posts", postRoutes);
app.use("/users", userRoutes);

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error(err));

// Change the port to 10000 to match the client's configuration
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
