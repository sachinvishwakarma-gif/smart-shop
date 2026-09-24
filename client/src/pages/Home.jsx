import { useEffect, useState } from "react";
import { getProducts, addToCart, getWishlist, addToWishlist, removeFromWishlist } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

function formatPrice(amount) {
  return "₹" + Number(amount).toLocaleString("en-IN");
}

export default function Home() {
  const [products, setProducts] = useState([]);
  const [status, setStatus] = useState("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [addingId, setAddingId] = useState(null);
  const [message, setMessage] = useState("");
  const [wishlistIds, setWishlistIds] = useState([]);
  const { token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    getProducts()
      .then((data) => {
        setProducts(data);
        setStatus("ready");
      })
      .catch((err) => {
        setErrorMsg(err.message);
        setStatus("error");
      });
  }, []);

  useEffect(() => {
    if (!token) return;
    getWishlist(token)
      .then((list) => setWishlistIds(list.map((p) => p._id)))
      .catch(() => {});
  }, [token]);

  async function handleAddToCart(productId) {
    if (!token) return navigate("/login");
    setAddingId(productId);
    setMessage("");
    try {
      await addToCart(token, productId, 1);
      setMessage("Added to cart!");
    } catch (err) {
      setMessage(err.message);
    } finally {
      setAddingId(null);
      setTimeout(() => setMessage(""), 2000);
    }
  }

  async function handleToggleWishlist(productId) {
    if (!token) return navigate("/login");
    try {
      const isSaved = wishlistIds.includes(productId);
      const ids = isSaved
        ? await removeFromWishlist(token, productId)
        : await addToWishlist(token, productId);
      setWishlistIds(ids);
    } catch (err) {
      setMessage(err.message);
      setTimeout(() => setMessage(""), 2000);
    }
  }

  if (status === "loading") {
    return (
      <section className="products">
        <h2>Products</h2>
        <p>Loading products...</p>
      </section>
    );
  }

  if (status === "error") {
    return (
      <section className="products">
        <h2>Products</h2>
        <p>Could not load products: {errorMsg}</p>
      </section>
    );
  }

  return (
    <section className="products">
      <h2>Products</h2>
      {message && <p className="toast-message">{message}</p>}
      <div className="product-grid">
        {products.map((p) => {
          const saved = wishlistIds.includes(p._id);
          return (
            <article className="card" key={p._id}>
              <div className="card-image">
                {p.imageUrl ? (
                  <img src={p.imageUrl} alt={p.name} />
                ) : (
                  <span className="card-icon">{p.icon || "📦"}</span>
                )}
              </div>
              <div className="card-body">
                <div className="card-top-row">
                  <p className="card-meta">{p.brand} · {p.category}</p>
                  <button
                    className={`btn-heart ${saved ? "saved" : ""}`}
                    onClick={() => handleToggleWishlist(p._id)}
                    aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}
                  >
                    {saved ? "♥" : "♡"}
                  </button>
                </div>
                <h3 className="card-title">{p.name}</h3>
                <p className="card-price"><strong>{formatPrice(p.price)}</strong></p>
                <button
                  className="btn btn-primary"
                  disabled={addingId === p._id}
                  onClick={() => handleAddToCart(p._id)}
                >
                  {addingId === p._id ? "Adding..." : "Add to cart"}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}