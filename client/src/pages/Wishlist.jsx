import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { getWishlist, removeFromWishlist, addToCart } from "../lib/api";

function formatPrice(amount) {
  return "₹" + Number(amount).toLocaleString("en-IN");
}

export default function Wishlist() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) return navigate("/login");
    load();
  }, [token]);

  function load() {
    setStatus("loading");
    getWishlist(token)
      .then((list) => {
        setItems(list);
        setStatus("ready");
      })
      .catch((err) => {
        setErrorMsg(err.message);
        setStatus("error");
      });
  }

  async function handleRemove(productId) {
    try {
      await removeFromWishlist(token, productId);
      setItems((prev) => prev.filter((p) => p._id !== productId));
    } catch (err) {
      setErrorMsg(err.message);
    }
  }

  async function handleAddToCart(productId) {
    try {
      await addToCart(token, productId, 1);
      setMessage("Added to cart!");
    } catch (err) {
      setMessage(err.message);
    } finally {
      setTimeout(() => setMessage(""), 2000);
    }
  }

  if (status === "loading") {
    return (
      <section className="products">
        <h2>Your Wishlist</h2>
        <p>Loading wishlist...</p>
      </section>
    );
  }

  if (status === "error") {
    return (
      <section className="products">
        <h2>Your Wishlist</h2>
        <p>Could not load wishlist: {errorMsg}</p>
      </section>
    );
  }

  if (items.length === 0) {
    return (
      <section className="products">
        <h2>Your Wishlist</h2>
        <p>Wishlist is empty. <Link to="/">Browse products</Link></p>
      </section>
    );
  }

  return (
    <section className="products">
      <h2>Your Wishlist</h2>
      {message && <p className="toast-message">{message}</p>}
      <div className="product-grid">
        {items.map((p) => (
          <article className="card" key={p._id}>
            <div className="card-body">
              <p className="card-meta">{p.brand} · {p.category}</p>
              <h3 className="card-title">{p.name}</h3>
              <p className="card-price"><strong>{formatPrice(p.price)}</strong></p>
              <div className="card-actions">
                <button className="btn btn-primary" onClick={() => handleAddToCart(p._id)}>Add to cart</button>
                <button className="btn-link" onClick={() => handleRemove(p._id)}>Remove</button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}