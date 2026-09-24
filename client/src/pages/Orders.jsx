import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { getMyOrders, cancelOrder } from "../lib/api";

function formatPrice(amount) {
  return "₹" + Number(amount).toLocaleString("en-IN");
}

export default function Orders() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!token) return navigate("/login");
    load();
  }, [token]);

  function load() {
    setStatus("loading");
    getMyOrders(token)
      .then((data) => {
        setOrders(data);
        setStatus("ready");
      })
      .catch((err) => {
        setErrorMsg(err.message);
        setStatus("error");
      });
  }

  async function handleCancel(orderId) {
    try {
      await cancelOrder(token, orderId);
      load();
    } catch (err) {
      setErrorMsg(err.message);
    }
  }

  if (status === "loading") {
    return (
      <section className="products">
        <h2>Your Orders</h2>
        <p>Loading orders...</p>
      </section>
    );
  }

  if (status === "error") {
    return (
      <section className="products">
        <h2>Your Orders</h2>
        <p>Could not load orders: {errorMsg}</p>
      </section>
    );
  }

  return (
    <section className="products">
      <h2>Your Orders</h2>
      {location.state?.placed && <p className="toast-message">Order placed successfully!</p>}
      {orders.length === 0 ? (
        <p>No orders yet. <Link to="/">Start shopping</Link></p>
      ) : (
        <div className="cart-list">
          {orders.map((o) => (
            <div className="cart-row order-row" key={o._id}>
              <div className="cart-row-info">
                <p className="card-title">Order #{o._id.slice(-6)}</p>
                <p className="card-meta">{o.items.length} item(s) · {new Date(o.createdAt).toLocaleDateString()}</p>
                <p className="card-meta">Status: {o.status}</p>
              </div>
              <p className="cart-row-total">{formatPrice(o.totalPrice)}</p>
              {["placed", "processing"].includes(o.status) && (
                <button className="btn-link" onClick={() => handleCancel(o._id)}>Cancel</button>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}