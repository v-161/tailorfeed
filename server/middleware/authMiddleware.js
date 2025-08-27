const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
  const token = req.header("Authorization")?.split(" ")[1]; // Bearer <token>
  if (!token) return res.status(401).json({ message: "Access denied" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 🔑 Store userId on req for later use
    req.userId = decoded.id;

    console.log("Decoded token:", decoded);

    next();
  } catch (err) {
    console.error("JWT verification failed:", err);
    res.status(400).json({ message: "Invalid token" });
  }
};
