const Product = require("../models/Product");
const asyncHandler = require("../middleware/asyncHandler");
const { HttpError } = require("../middleware/errorHandler");

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const SORTS = {
  newest: { createdAt: -1 },
  price_asc: { price: 1 },
  price_desc: { price: -1 },
  rating: { rating: -1, numReviews: -1 },
};

// GET /api/products?q=&category=&brand=&minPrice=&maxPrice=&sort=&page=&limit=
exports.listProducts = asyncHandler(async (req, res) => {
  const { q, category, brand, minPrice, maxPrice, sort = "newest" } = req.query;
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 12, 1), 50);

  const filter = { isActive: true };

  if (typeof q === "string" && q.trim()) {
    const rx = new RegExp(escapeRegex(q.trim().slice(0, 60)), "i");
    filter.$or = [{ name: rx }, { brand: rx }, { category: rx }, { description: rx }];
  }
  if (typeof category === "string" && category.trim()) {
    filter.category = new RegExp(`^${escapeRegex(category.trim())}$`, "i");
  }
  if (typeof brand === "string" && brand.trim()) {
    filter.brand = new RegExp(`^${escapeRegex(brand.trim())}$`, "i");
  }
  const min = Number(minPrice);
  const max = Number(maxPrice);
  if (minPrice !== undefined && minPrice !== "" && !Number.isNaN(min)) filter.price = { ...filter.price, $gte: min };
  if (maxPrice !== undefined && maxPrice !== "" && !Number.isNaN(max)) filter.price = { ...filter.price, $lte: max };

  const [products, total] = await Promise.all([
    Product.find(filter)
      .sort(SORTS[sort] || SORTS.newest)
      .skip((page - 1) * limit)
      .limit(limit),
    Product.countDocuments(filter),
  ]);

  res.json({ success: true, products, page, pages: Math.ceil(total / limit), total });
});

// GET /api/products/categories
exports.listCategories = asyncHandler(async (req, res) => {
  const categories = await Product.distinct("category", { isActive: true });
  res.json({ success: true, categories: categories.sort() });
});

// GET /api/products/:id
exports.getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ _id: req.params.id, isActive: true });
  if (!product) throw new HttpError(404, "Product not found");
  res.json({ success: true, product });
});