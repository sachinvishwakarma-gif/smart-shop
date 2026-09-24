const User = require("../models/User");
const Product = require("../models/Product");
const asyncHandler = require("../middleware/asyncHandler");
const { HttpError } = require("../middleware/errorHandler");

// GET /api/wishlist
exports.getWishlist = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate({ path: "wishlist", match: { isActive: true } });
  res.json({ success: true, wishlist: user.wishlist });
});

// POST /api/wishlist/:productId
exports.addToWishlist = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ _id: req.params.productId, isActive: true });
  if (!product) throw new HttpError(404, "Product not found");
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $addToSet: { wishlist: product._id } },
    { new: true }
  );
  res.status(201).json({ success: true, wishlistIds: user.wishlist });
});

// DELETE /api/wishlist/:productId
exports.removeFromWishlist = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $pull: { wishlist: req.params.productId } },
    { new: true }
  );
  res.json({ success: true, wishlistIds: user.wishlist });
});