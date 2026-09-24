const asyncHandler = require("../middleware/asyncHandler");
const { HttpError } = require("../middleware/errorHandler");
const { chat } = require("../services/aiService");

// POST /api/ai/chat   body: { message, history: [{role, content}] }
exports.chat = asyncHandler(async (req, res) => {
  const { message, history } = req.body || {};
  if (typeof message !== "string" || !message.trim()) throw new HttpError(400, "Message is required");
  if (message.length > 500) throw new HttpError(400, "Message is too long (max 500 characters)");

  const result = await chat(message.trim(), history);
  res.json({ success: true, ...result });
});