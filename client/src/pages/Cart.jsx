import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { getCart, updateCartItem, removeCartItem } from "../lib/api";

function formatPrice(amount) {
  return "₹" + Number(amount).toLocaleString("en-IN");
}

export default function Cart() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [status, setStatus] = useState("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    loadCart();
  }, [token]);

  function loadCart() {
    setStatus("loading");
    getCart(token)
      .then((data) => {
        setCart(data);
        setStatus("ready");
      })
      .catch((err) => {
        setErrorMsg(err.message);
        setStatus("error");
      });
  }

  async function handleQuantityChange(productId, newQty) {
    if (newQty < 1) return;
    try {
      const updated = await updateCartItem(token, productId, newQty);
      setCart(updated);
    } catch (err) {
      setErrorMsg(err.message);
    }
  }

  async function handleRemove(productId) {
    try {
      const updated = await removeCartItem(token, productId);
      setCart(updated);
    } catch (err) {
      setErrorMsg(err.message);
    }
  }

  if (status === "loading") {
    return (
      <section className="products">
        <h2>Your Cart</h2>
        <p>Loading cart...</p>
      </section>
    );
  }

  if (status === "error") {
    return (
      <section className="products">
        <h2>Your Cart</h2>
        <p>Could not load cart: {errorMsg}</p>
      </section>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <section className="products">
        <h2>Your Cart</h2>
        <p>Cart is empty. <Link to="/">Browse products</Link></p>
      </section>
    );
  }

  return (
    <section className="products">
      <h2>Your Cart</h2>
      <div className="cart-list">
        {cart.items.map(({ product, quantity, lineTotal }) => (
          <div className="cart-row" key={product._id}>
            <div className="cart-row-info">
              <p className="card-title">{product.name}</p>
              <p className="card-meta">{formatPrice(product.price)} each</p>
            </div>
            <div className="cart-row-qty">
              <button onClick={() => handleQuantityChange(product._id, quantity - 1)}>-</button>
              <span>{quantity}</span>
              <button onClick={() => handleQuantityChange(product._id, quantity + 1)}>+</button>
            </div>
            <p className="cart-row-total">{formatPrice(lineTotal)}</p>
            <button className="btn-link" onClick={() => handleRemove(product._id)}>Remove</button>
          </div>
        ))}
      </div>
      <div className="cart-summary">
        <p>Items: {cart.itemCount}</p>
        <p><strong>Subtotal: {formatPrice(cart.subtotal)}</strong></p>
        <Link to="/checkout" className="btn btn-primary" style={{ marginTop: "12px", display: "inline-block" }}>
  Proceed to Checkout
</Link>
      </div>
    </section>
  );
}