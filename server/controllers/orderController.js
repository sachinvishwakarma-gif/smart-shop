const Cart = require("../models/Cart");
const Order = require("../models/Order");
const Product = require("../models/Product");
const asyncHandler = require("../middleware/asyncHandler");
const { HttpError } = require("../middleware/errorHandler");
const { restockItems } = require("../services/orderService");

const FREE_SHIPPING_ABOVE = 999;
const SHIPPING_FEE = 49;

function cleanAddress(input) {
  const a = input || {};
  const out = {};
  for (const key of ["fullName", "phone", "address", "city", "state", "pincode"]) {
    if (typeof a[key] !== "string" || !a[key].trim()) throw new HttpError(400, `Shipping ${key} is required`);
    out[key] = a[key].trim().slice(0, 200);
  }
  if (!/^\d{10}$/.test(out.phone)) throw new HttpError(400, "Phone must be 10 digits");
  if (!/^\d{6}$/.test(out.pincode)) throw new HttpError(400, "Pincode must be 6 digits");
  return out;
}

// POST /api/orders   body: { shippingAddress: {...} }   (cart se order banta hai)
exports.createOrder = asyncHandler(async (req, res) => {
  const shippingAddress = cleanAddress((req.body || {}).shippingAddress);

  const cart = await Cart.findOne({ user: req.user._id }).populate("items.product");
  const lines = cart ? cart.items.filter((i) => i.product && i.product.isActive) : [];
  if (!lines.length) throw new HttpError(400, "Your cart is empty");

  const reserved = [];
  let order;
  try {
    // Har item ka stock ek-ek karke kam karo (agar kam stock ho to fail)
    for (const line of lines) {
      const result = await Product.updateOne(
        { _id: line.product._id, isActive: true, stock: { $gte: line.quantity } },
        { $inc: { stock: -line.quantity } }
      );
      if (result.modifiedCount !== 1) throw new HttpError(409, `Not enough stock for ${line.product.name}`);
      reserved.push(line);
    }

    // Price hamesha database se, frontend se kabhi nahi
    const items = lines.map((l) => ({
      product: l.product._id,
      name: l.product.name,
      price: l.product.price,
      quantity: l.quantity,
    }));
    const itemsPrice = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const shippingPrice = itemsPrice >= FREE_SHIPPING_ABOVE ? 0 : SHIPPING_FEE;

    order = await Order.create({
      user: req.user._id,
      items,
      shippingAddress,
      paymentMethod: "COD",
      itemsPrice,
      shippingPrice,
      totalPrice: itemsPrice + shippingPrice,
    });
  } catch (err) {
    // Kuch fail hua to reserve kiya hua stock wapas
    await restockItems(reserved.map((l) => ({ product: l.product._id, quantity: l.quantity })));
    throw err;
  }

  cart.items = [];
  await cart.save();
  res.status(201).json({ success: true, order });
});

// GET /api/orders   (meri saari orders)
exports.getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json({ success: true, orders });
});

// GET /api/orders/:id
exports.getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  const allowed = order && (order.user.toString() === req.user._id.toString() || req.user.role === "admin");
  if (!allowed) throw new HttpError(404, "Order not found");
  res.json({ success: true, order });
});

// PUT /api/orders/:id/cancel
exports.cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id, status: { $in: ["placed", "processing"] } },
    { status: "cancelled" },
    { new: true }
  );
  if (!order) {
    const exists = await Order.exists({ _id: req.params.id, user: req.user._id });
    if (!exists) throw new HttpError(404, "Order not found");
    throw new HttpError(400, "This order can no longer be cancelled");
  }
  await restockItems(order.items);
  res.json({ success: true, order });
});