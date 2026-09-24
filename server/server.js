require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const { notFound, errorHandler } = require("./middleware/errorHandler");

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 16) {
  console.error("JWT_SECRET .env mein set karo (kam se kam 16 characters).");
  process.exit(1);
}

const app = express();

const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5500,http://127.0.0.1:5500,http://localhost:5173")
  .split(",")
  .map((s) => s.trim());

app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      // origin undefined = Thunder Client / Postman jaise tools
      callback(null, !origin || allowedOrigins.includes(origin));
    },
  })
);
app.use(express.json({ limit: "10kb" }));

const limiter = (limit) =>
  rateLimit({ windowMs: 15 * 60 * 1000, limit, standardHeaders: true, legacyHeaders: false, message: { success: false, message: "Too many requests. Try again later." } });

app.use("/api", limiter(300));

app.get("/api/health", (req, res) => {
  const states = ["disconnected", "connected", "connecting", "disconnecting"];
  res.json({ success: true, status: "ok", database: states[mongoose.connection.readyState] || "unknown" });
});

app.use("/api/auth", limiter(20), require("./routes/authRoutes"));
app.use("/api/products", require("./routes/productRoutes"));
app.use("/api/cart", require("./routes/cartRoutes"));
app.use("/api/wishlist", require("./routes/wishlistRoutes"));
app.use("/api/orders", require("./routes/orderRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/ai", require("./routes/aiRoutes"));
app.use("/api/products", require("./routes/productRoutes"));

app.use(notFound);
app.use(errorHandler);

if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  connectDB().then(() => app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`)));
}

module.exports = app;