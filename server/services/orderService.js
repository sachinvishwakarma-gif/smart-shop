const Product = require("../models/Product");

// Cancel hone par stock wapas add karta hai
async function restockItems(items) {
  if (!items || !items.length) return;
  await Product.bulkWrite(
    items.map((i) => ({
      updateOne: { filter: { _id: i.product }, update: { $inc: { stock: i.quantity } } },
    }))
  );
}

module.exports = { restockItems };