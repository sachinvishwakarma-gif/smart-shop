const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Product name is required"], trim: true, maxlength: 120 },
    brand: { type: String, trim: true, default: "Generic", maxlength: 60 },
    category: { type: String, required: [true, "Category is required"], trim: true, maxlength: 60 },
    description: { type: String, trim: true, default: "", maxlength: 1000 },
    price: { type: Number, required: [true, "Price is required"], min: [0, "Price cannot be negative"] },
    originalPrice: { type: Number, min: 0 },
    stock: {
      type: Number,
      default: 0,
      min: [0, "Stock cannot be negative"],
      validate: { validator: Number.isInteger, message: "Stock must be a whole number" },
    },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    numReviews: { type: Number, default: 0, min: 0 },
    icon: { type: String, default: "🛍️" },
    imageUrl: {
      type: String,
      trim: true,
      default: "",
      match: [/^$|^https?:\/\/\S+$/, "Image URL must start with http:// or https://"],
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

productSchema.pre("save", function () {
  if (this.originalPrice == null || this.originalPrice < this.price) this.originalPrice = this.price;
});

productSchema.index({ category: 1, price: 1 });

module.exports = mongoose.model("Product", productSchema);