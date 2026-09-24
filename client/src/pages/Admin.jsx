import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";
import {
  getAdminStats, getAdminProducts, createAdminProduct, updateAdminProduct, deleteAdminProduct,
  getAdminOrders, updateAdminOrderStatus,
} from "../lib/api";

function formatPrice(amount) {
  return "₹" + Number(amount).toLocaleString("en-IN");
}

const STATUSES = ["placed", "processing", "shipped", "delivered", "cancelled"];
const BLANK_PRODUCT = { name: "", brand: "", category: "", description: "", price: "", originalPrice: "", stock: "", icon: "📦", imageUrl: "" };

export default function Admin() {
  const { user, token } = useAuth();
  const [tab, setTab] = useState("stats");

  if (!user || user.role !== "admin") return <Navigate to="/" replace />;

  return (
    <section className="products">
      <h2>Admin Dashboard</h2>
      <div className="admin-tabs">
        <button className={tab === "stats" ? "active" : ""} onClick={() => setTab("stats")}>Stats</button>
        <button className={tab === "products" ? "active" : ""} onClick={() => setTab("products")}>Products</button>
        <button className={tab === "orders" ? "active" : ""} onClick={() => setTab("orders")}>Orders</button>
      </div>
      {tab === "stats" && <StatsTab token={token} />}
      {tab === "products" && <ProductsTab token={token} />}
      {tab === "orders" && <OrdersTab token={token} />}
    </section>
  );
}

function StatsTab({ token }) {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getAdminStats(token).then(setStats).catch((e) => setError(e.message));
  }, [token]);

  if (error) return <p className="form-error">{error}</p>;
  if (!stats) return <p>Loading stats...</p>;

  return (
    <div className="admin-stats-grid">
      <div className="stat-card"><p className="stat-value">{stats.customers}</p><p className="stat-label">Customers</p></div>
      <div className="stat-card"><p className="stat-value">{stats.products}</p><p className="stat-label">Active products</p></div>
      <div className="stat-card"><p className="stat-value">{stats.orders}</p><p className="stat-label">Orders</p></div>
      <div className="stat-card"><p className="stat-value">{formatPrice(stats.revenue)}</p><p className="stat-label">Revenue</p></div>
      {stats.lowStock?.length > 0 && (
        <div className="stat-card stat-wide">
          <p className="stat-label">Low stock</p>
          <ul>
            {stats.lowStock.map((p) => <li key={p._id}>{p.name} — {p.stock} left</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}

function ProductsTab({ token }) {
  const [products, setProducts] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [form, setForm] = useState(BLANK_PRODUCT);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => { load(); }, [token]);

  function load() {
    setStatus("loading");
    getAdminProducts(token).then((data) => { setProducts(data); setStatus("ready"); })
      .catch((e) => { setError(e.message); setStatus("error"); });
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function startEdit(p) {
    setEditingId(p._id);
    setForm({
      name: p.name, brand: p.brand, category: p.category, description: p.description || "",
      price: p.price, originalPrice: p.originalPrice || "", stock: p.stock, icon: p.icon || "📦",
      imageUrl: p.imageUrl || "",
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(BLANK_PRODUCT);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const payload = {
      ...form,
      price: Number(form.price),
      originalPrice: form.originalPrice ? Number(form.originalPrice) : undefined,
      stock: Number(form.stock),
    };
    try {
      if (editingId) {
        await updateAdminProduct(token, editingId, payload);
      } else {
        await createAdminProduct(token, payload);
      }
      cancelEdit();
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    try {
      await deleteAdminProduct(token, id);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <form className="auth-form admin-product-form" onSubmit={handleSubmit}>
        <h3>{editingId ? "Edit product" : "Add new product"}</h3>
        {error && <p className="form-error">{error}</p>}
        <label>Name<input name="name" value={form.name} onChange={handleChange} required /></label>
        <label>Brand<input name="brand" value={form.brand} onChange={handleChange} required /></label>
        <label>Category<input name="category" value={form.category} onChange={handleChange} required /></label>
        <label>Description<input name="description" value={form.description} onChange={handleChange} /></label>
        <label>Price<input name="price" type="number" value={form.price} onChange={handleChange} required /></label>
        <label>Original price (optional)<input name="originalPrice" type="number" value={form.originalPrice} onChange={handleChange} /></label>
        <label>Stock<input name="stock" type="number" value={form.stock} onChange={handleChange} required /></label>
        <label>Icon (emoji)<input name="icon" value={form.icon} onChange={handleChange} /></label>
        <label>Image URL (optional)<input name="imageUrl" value={form.imageUrl} onChange={handleChange} /></label>
        <div className="card-actions">
          <button className="btn btn-primary" type="submit">{editingId ? "Save changes" : "Add product"}</button>
          {editingId && <button type="button" className="btn-link" onClick={cancelEdit}>Cancel</button>}
        </div>
      </form>

      <h3 style={{ marginTop: 30 }}>All products</h3>
      {status === "loading" && <p>Loading...</p>}
      {status === "ready" && (
        <div className="cart-list">
          {products.map((p) => (
            <div className="cart-row admin-row" key={p._id}>
              <div className="cart-row-info">
                <p className="card-title">{p.name} {!p.isActive && <span className="tag-inactive">removed</span>}</p>
                <p className="card-meta">{p.brand} · {p.category} · Stock: {p.stock}</p>
              </div>
              <p className="cart-row-total">{formatPrice(p.price)}</p>
              <button className="btn-link" onClick={() => startEdit(p)}>Edit</button>
              {p.isActive && <button className="btn-link" onClick={() => handleDelete(p._id)}>Remove</button>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function OrdersTab({ token }) {
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");

  useEffect(() => { load(); }, [token]);

  function load() {
    setStatus("loading");
    getAdminOrders(token).then((data) => { setOrders(data); setStatus("ready"); })
      .catch((e) => { setError(e.message); setStatus("error"); });
  }

  async function handleStatusChange(id, newStatus) {
    try {
      await updateAdminOrderStatus(token, id, newStatus);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  if (status === "loading") return <p>Loading orders...</p>;
  if (error) return <p className="form-error">{error}</p>;

  return (
    <div className="cart-list">
      {orders.map((o) => (
        <div className="cart-row admin-row" key={o._id}>
          <div className="cart-row-info">
            <p className="card-title">Order #{o._id.slice(-6)} — {o.user?.name || "Unknown"}</p>
            <p className="card-meta">{o.items.length} item(s) · {new Date(o.createdAt).toLocaleDateString()}</p>
          </div>
          <p className="cart-row-total">{formatPrice(o.totalPrice)}</p>
          <select
            value={o.status}
            disabled={["delivered", "cancelled"].includes(o.status)}
            onChange={(e) => handleStatusChange(o._id, e.target.value)}
          >
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      ))}
    </div>
  );
}