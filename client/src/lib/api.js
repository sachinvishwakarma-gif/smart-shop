const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export async function getProducts() {
  const res = await fetch(`${API_URL}/products`);

  if (!res.ok) {
    throw new Error("Failed to load products");
  }

  const data = await res.json();

  return data.products || data;
}

export async function registerUser({ name, email, password }) {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name, email, password }),
  });

  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.message || "Registration failed");
  }

  return data;
}

export async function loginUser({ email, password }) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.message || "Login failed");
  }

  return data;
}

function authHeaders(token) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export async function getCart(token) {
  const res = await fetch(`${API_URL}/cart`, {
    headers: authHeaders(token),
  });

  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.message || "Failed to load cart");
  }

  return data.cart;
}

export async function addToCart(token, productId, quantity = 1) {
  const res = await fetch(`${API_URL}/cart`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({
      productId,
      quantity,
    }),
  });

  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.message || "Failed to add to cart");
  }

  return data.cart;
}

export async function updateCartItem(token, productId, quantity) {
  const res = await fetch(`${API_URL}/cart/${productId}`, {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify({
      quantity,
    }),
  });

  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.message || "Failed to update cart");
  }

  return data.cart;
}

export async function removeCartItem(token, productId) {
  const res = await fetch(`${API_URL}/cart/${productId}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });

  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.message || "Failed to remove item");
  }

  return data.cart;
}

export async function getWishlist(token) {
  const res = await fetch(`${API_URL}/wishlist`, {
    headers: authHeaders(token),
  });

  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.message || "Failed to load wishlist");
  }

  return data.wishlist;
}

export async function addToWishlist(token, productId) {
  const res = await fetch(`${API_URL}/wishlist/${productId}`, {
    method: "POST",
    headers: authHeaders(token),
  });

  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.message || "Failed to add to wishlist");
  }

  return data.wishlistIds;
}

export async function removeFromWishlist(token, productId) {
  const res = await fetch(`${API_URL}/wishlist/${productId}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });

  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.message || "Failed to remove from wishlist");
  }

  return data.wishlistIds;
}

export async function createOrder(token, shippingAddress) {
  const res = await fetch(`${API_URL}/orders`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({
      shippingAddress,
    }),
  });

  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.message || "Failed to place order");
  }

  return data.order;
}

export async function getMyOrders(token) {
  const res = await fetch(`${API_URL}/orders`, {
    headers: authHeaders(token),
  });

  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.message || "Failed to load orders");
  }

  return data.orders;
}

export async function cancelOrder(token, orderId) {
  const res = await fetch(`${API_URL}/orders/${orderId}/cancel`, {
    method: "PUT",
    headers: authHeaders(token),
  });

  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.message || "Failed to cancel order");
  }

  return data.order;
}

export async function sendChatMessage(message, history = []) {
  const res = await fetch(`${API_URL}/ai/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message,
      history,
    }),
  });

  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.message || "Chat failed");
  }

  return data;
}

export async function getAdminStats(token) {
  const res = await fetch(`${API_URL}/admin/stats`, {
    headers: authHeaders(token),
  });

  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.message || "Failed to load stats");
  }

  return data.stats;
}

export async function getAdminProducts(token) {
  const res = await fetch(`${API_URL}/admin/products`, {
    headers: authHeaders(token),
  });

  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.message || "Failed to load products");
  }

  return data.products;
}

export async function createAdminProduct(token, product) {
  const res = await fetch(`${API_URL}/admin/products`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(product),
  });

  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.message || "Failed to create product");
  }

  return data.product;
}

export async function updateAdminProduct(token, id, updates) {
  const res = await fetch(`${API_URL}/admin/products/${id}`, {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify(updates),
  });

  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.message || "Failed to update product");
  }

  return data.product;
}

export async function deleteAdminProduct(token, id) {
  const res = await fetch(`${API_URL}/admin/products/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });

  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.message || "Failed to delete product");
  }

  return data;
}

export async function getAdminOrders(token) {
  const res = await fetch(`${API_URL}/admin/orders`, {
    headers: authHeaders(token),
  });

  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.message || "Failed to load orders");
  }

  return data.orders;
}

export async function updateAdminOrderStatus(token, id, status) {
  const res = await fetch(`${API_URL}/admin/orders/${id}/status`, {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify({
      status,
    }),
  });

  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.message || "Failed to update order status");
  }

  return data.order;
}