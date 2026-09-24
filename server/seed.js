// Chalane ka tarika: npm run seed
// Dhyan: yeh saare purane products delete karke naye daalta hai.
require("dotenv").config();
const mongoose = require("mongoose");
const Product = require("./models/Product");
const User = require("./models/User");

const products = [
  { name: "Aero Laptop 14", brand: "Nimbus", category: "Laptops", price: 54999, originalPrice: 62999, rating: 4.5, numReviews: 312, icon: "💻", stock: 25, description: "Lightweight laptop with 16 GB RAM and a 512 GB SSD." },
  { name: "Pulse Wireless Earbuds", brand: "Sonic", category: "Audio", price: 2499, originalPrice: 3999, rating: 4.2, numReviews: 1840, icon: "🎧", stock: 120, description: "Noise-reducing earbuds with 24-hour battery life." },
  { name: "Nova 5G Smartphone", brand: "Zenith", category: "Phones", price: 24999, originalPrice: 27999, rating: 4.4, numReviews: 956, icon: "📱", stock: 60, description: "6.6-inch AMOLED display and a 50 MP camera." },
  { name: "Stride Running Shoes", brand: "Kinetic", category: "Fashion", price: 3299, originalPrice: 4499, rating: 4.1, numReviews: 623, icon: "👟", stock: 80, description: "Cushioned everyday running shoes with a breathable mesh." },
  { name: "Brew Master Coffee Maker", brand: "HomeCraft", category: "Home", price: 4799, originalPrice: 5999, rating: 4.6, numReviews: 418, icon: "☕", stock: 40, description: "Programmable 1.2 L drip coffee maker with a timer." },
  { name: "Vista Smartwatch", brand: "Zenith", category: "Wearables", price: 6999, originalPrice: 8999, rating: 4.0, numReviews: 774, icon: "⌚", stock: 55, description: "Heart-rate, sleep and step tracking with a 7-day battery." },
  { name: "Bass Boom Speaker", brand: "Sonic", category: "Audio", price: 3499, originalPrice: 3499, rating: 4.3, numReviews: 502, icon: "🔊", stock: 70, description: "Waterproof Bluetooth speaker with deep bass." },
  { name: "Trek Daypack 25L", brand: "Kinetic", category: "Fashion", price: 1799, originalPrice: 2499, rating: 4.4, numReviews: 289, icon: "🎒", stock: 90, description: "Water-resistant backpack with a padded laptop sleeve." },
];

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  await Product.deleteMany({});
  await Product.insertMany(products);
  console.log(`${products.length} products added`);

  const { ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
  if (ADMIN_EMAIL && ADMIN_PASSWORD) {
    const exists = await User.findOne({ email: ADMIN_EMAIL.toLowerCase() });
    if (exists) console.log("Admin already exists");
    else {
      await User.create({ name: "Admin", email: ADMIN_EMAIL, password: ADMIN_PASSWORD, role: "admin" });
      console.log(`Admin created: ${ADMIN_EMAIL}`);
    }
  }
  await mongoose.disconnect();
})().catch((err) => {
  console.error(err.message);
  process.exit(1);
});