// ---------- Product data (temporary; a database replaces this later) ----------
const products = [
  { id: 1, name: "Aero Laptop 14", brand: "Nimbus", category: "Laptops", price: 54999, originalPrice: 62999, rating: 4.5, reviews: 312, icon: "💻", description: "Lightweight laptop with 16 GB RAM and a 512 GB SSD." },
  { id: 2, name: "Pulse Wireless Earbuds", brand: "Sonic", category: "Audio", price: 2499, originalPrice: 3999, rating: 4.2, reviews: 1840, icon: "🎧", description: "Noise-reducing earbuds with 24-hour battery life." },
  { id: 3, name: "Nova 5G Smartphone", brand: "Zenith", category: "Phones", price: 24999, originalPrice: 27999, rating: 4.4, reviews: 956, icon: "📱", description: "6.6-inch AMOLED display and a 50 MP camera." },
  { id: 4, name: "Stride Running Shoes", brand: "Kinetic", category: "Fashion", price: 3299, originalPrice: 4499, rating: 4.1, reviews: 623, icon: "👟", description: "Cushioned everyday running shoes with a breathable mesh." },
  { id: 5, name: "Brew Master Coffee Maker", brand: "HomeCraft", category: "Home", price: 4799, originalPrice: 5999, rating: 4.6, reviews: 418, icon: "☕", description: "Programmable 1.2 L drip coffee maker with a timer." },
  { id: 6, name: "Vista Smartwatch", brand: "Zenith", category: "Wearables", price: 6999, originalPrice: 8999, rating: 4.0, reviews: 774, icon: "⌚", description: "Heart-rate, sleep and step tracking with a 7-day battery." },
  { id: 7, name: "Bass Boom Speaker", brand: "Sonic", category: "Audio", price: 3499, originalPrice: 3499, rating: 4.3, reviews: 502, icon: "🔊", description: "Waterproof Bluetooth speaker with deep bass." },
  { id: 8, name: "Trek Daypack 25L", brand: "Kinetic", category: "Fashion", price: 1799, originalPrice: 2499, rating: 4.4, reviews: 289, icon: "🎒", description: "Water-resistant backpack with a padded laptop sleeve." },
];

// ---------- Helpers ----------
function formatPrice(amount) {
  return "₹" + amount.toLocaleString("en-IN");
}

function discountPercent(product) {
  if (product.originalPrice <= product.price) return 0;
  return Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
}

function starText(rating) {
  const full = Math.round(rating);
  return "★".repeat(full) + "☆".repeat(5 - full);
}

// ---------- Rendering ----------
function productCard(product) {
  const discount = discountPercent(product);
  return `
    <article class="card" data-id="${product.id}">
      <div class="card-image">
        <span class="card-icon" aria-hidden="true">${product.icon}</span>
        ${discount ? `<span class="badge">${discount}% off</span>` : ""}
      </div>
      <div class="card-body">
        <p class="card-meta">${product.brand} · ${product.category}</p>
        <h3 class="card-title">${product.name}</h3>
        <p class="card-desc">${product.description}</p>
        <p class="card-rating">
          <span class="stars" aria-label="${product.rating} out of 5">${starText(product.rating)}</span>
          <span class="reviews">${product.rating} (${product.reviews})</span>
        </p>
        <p class="card-price">
          <strong>${formatPrice(product.price)}</strong>
          ${discount ? `<s>${formatPrice(product.originalPrice)}</s>` : ""}
        </p>
        <div class="card-actions">
          <button class="btn btn-primary" data-action="add-to-cart">Add to cart</button>
          <button class="btn btn-ghost" data-action="wishlist" aria-label="Add to wishlist">♡</button>
        </div>
      </div>
    </article>
  `;
}

function renderProducts(list) {
  const container = document.getElementById("product-list");
  if (list.length === 0) {
    container.innerHTML = "<p>No products found.</p>";
    return;
  }
  container.innerHTML = list.map(productCard).join("");
}

// ---------- Start ----------
document.getElementById("year").textContent = new Date().getFullYear();
renderProducts(products);