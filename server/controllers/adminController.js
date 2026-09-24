const Product = require("../models/Product");
const Order = require("../models/Order");
const User = require("../models/User");
const asyncHandler = require("../middleware/asyncHandler");
const { HttpError } = require("../middleware/errorHandler");
const { restockItems } = require("../services/orderService");

const PRODUCT_FIELDS = ["name", "brand", "category", "description", "price", "originalPrice", "stock", "icon", "imageUrl", "isActive"];

// Sirf allowed fields lete hain (koi extra field database mein nahi jaata)
const pickProductFields = (body) => {
  const out = {};
  for (const key of PRODUCT_FIELDS) if (body && body[key] !== undefined) out[key] = body[key];
  return out;
};

// GET /api/admin/stats
exports.getStats = asyncHandler(async (req, res) => {
  const [customers, products, orders, revenueAgg, byStatus, lowStock] = await Promise.all([
    User.countDocuments({ role: "customer" }),
    Product.countDocuments({ isActive: true }),
    Order.countDocuments(),
    Order.aggregate([{ $match: { status: { $ne: "cancelled" } } }, { $group: { _id: null, total: { $sum: "$totalPrice" } } }]),
    Order.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    Product.find({ isActive: true, stock: { $lt: 5 } }).select("name stock").sort({ stock: 1 }).limit(10),
  ]);
  res.json({
    success: true,
    stats: {
      customers,
      products,
      orders,
      revenue: revenueAgg[0] ? revenueAgg[0].total : 0,
      ordersByStatus: Object.fromEntries(byStatus.map((s) => [s._id, s.count])),
      lowStock,
    },
  });
});

// GET /api/admin/products   (inactive bhi dikhte hain)
exports.listAllProducts = asyncHandler(async (req, res) => {
  const products = await Product.find().sort({ createdAt: -1 });
  res.json({ success: true, products });
});

// POST /api/admin/products
exports.createProduct = asyncHandler(async (req, res) => {
  const product = await Product.create(pickProductFields(req.body));
  res.status(201).json({ success: true, product });
});

// PUT /api/admin/products/:id
exports.updateProduct = asyncHandler(async (req, res) => {
  const updates = pickProductFields(req.body);
  if (!Object.keys(updates).length) throw new HttpError(400, "No valid fields to update");
  const product = await Product.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
  if (!product) throw new HttpError(404, "Product not found");
  res.json({ success: true, product });
});

// DELETE /api/admin/products/:id   (soft delete: purane orders safe rehte hain)
exports.deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!product) throw new HttpError(404, "Product not found");
  res.json({ success: true, message: "Product removed from the store" });
});

// GET /api/admin/orders?status=
exports.listOrders = asyncHandler(async (req, res) => {
  const filter = {};
  if (typeof req.query.status === "string" && Order.STATUSES.includes(req.query.status)) filter.status = req.query.status;
  const orders = await Order.find(filter).populate("user", "name email").sort({ createdAt: -1 });
  res.json({ success: true, orders });
});

// PUT /api/admin/orders/:id/status   body: { status }
exports.updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body || {};
  if (!Order.STATUSES.includes(status)) {
    throw new HttpError(400, `Status must be one of: ${Order.STATUSES.join(", ")}`);
  }
  const update = { status };
  if (status === "delivered") update.deliveredAt = new Date();

  // Delivered/cancelled order ka status dobara nahi badalta
  const order = await Order.findOneAndUpdate(
    { _id: req.params.id, status: { $nin: ["delivered", "cancelled"] } },
    update,
    { new: true }
  );
  if (!order) {
    if (!(await Order.exists({ _id: req.params.id }))) throw new HttpError(404, "Order not found");
    throw new HttpError(400, "Delivered or cancelled orders cannot be changed");
  }
  if (status === "cancelled") await restockItems(order.items);
  res.json({ success: true, order });
});