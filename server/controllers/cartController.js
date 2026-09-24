const Cart = require("../models/Cart");
const Product = require("../models/Product");
const asyncHandler = require("../middleware/asyncHandler");
const { HttpError } = require("../middleware/errorHandler");

const MAX_QTY = 10;
const OBJECT_ID = /^[a-f\d]{24}$/i;

// Cart nahi hai to bana deta hai (atomic, duplicate nahi banta)
const getOrCreateCart = (userId) =>
  Cart.findOneAndUpdate({ user: userId }, { $setOnInsert: { user: userId } }, { upsert: true, new: true });

async function cartResponse(cart) {
  await cart.populate("items.product");
  const items = cart.items
    .filter((i) => i.product && i.product.isActive)
    .map((i) => ({ product: i.product, quantity: i.quantity, lineTotal: i.product.price * i.quantity }));
  return {
    items,
    itemCount: items.reduce((n, i) => n + i.quantity, 0),
    subtotal: items.reduce((s, i) => s + i.lineTotal, 0),
  };
}

const parseQty = (value) => {
  const qty = Number(value);
  if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QTY) {
    throw new HttpError(400, `Quantity must be a whole number between 1 and ${MAX_QTY}`);
  }
  return qty;
};

// GET /api/cart
exports.getCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  res.json({ success: true, cart: await cartResponse(cart) });
});

// POST /api/cart   body: { productId, quantity }
exports.addItem = asyncHandler(async (req, res) => {
  const { productId, quantity = 1 } = req.body || {};
  if (typeof productId !== "string" || !OBJECT_ID.test(productId)) throw new HttpError(400, "Valid productId is required");
  const qty = parseQty(quantity);

  const product = await Product.findOne({ _id: productId, isActive: true });
  if (!product) throw new HttpError(404, "Product not found");

  const cart = await getOrCreateCart(req.user._id);
  const existing = cart.items.find((i) => i.product.toString() === productId);
  const newQty = (existing ? existing.quantity : 0) + qty;

  if (newQty > MAX_QTY) throw new HttpError(400, `You can add at most ${MAX_QTY} of one item`);
  if (newQty > product.stock) throw new HttpError(400, `Only ${product.stock} in stock`);

  if (existing) existing.quantity = newQty;
  else cart.items.push({ product: productId, quantity: qty });
  await cart.save();

  res.status(201).json({ success: true, cart: await cartResponse(cart) });
});

// PUT /api/cart/:productId   body: { quantity }
exports.updateItem = asyncHandler(async (req, res) => {
  const qty = parseQty((req.body || {}).quantity);
  const cart = await getOrCreateCart(req.user._id);
  const item = cart.items.find((i) => i.product.toString() === req.params.productId);
  if (!item) throw new HttpError(404, "Item is not in your cart");

  const product = await Product.findOne({ _id: req.params.productId, isActive: true });
  if (!product) throw new HttpError(404, "Product not found");
  if (qty > product.stock) throw new HttpError(400, `Only ${product.stock} in stock`);

  item.quantity = qty;
  await cart.save();
  res.json({ success: true, cart: await cartResponse(cart) });
});

// DELETE /api/cart/:productId
exports.removeItem = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  cart.items = cart.items.filter((i) => i.product.toString() !== req.params.productId);
  await cart.save();
  res.json({ success: true, cart: await cartResponse(cart) });
});

// DELETE /api/cart
exports.clearCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  cart.items = [];
  await cart.save();
  res.json({ success: true, cart: await cartResponse(cart) });
});