import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { createOrder } from "../lib/api";

export default function Checkout() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: "", phone: "", address: "", city: "", state: "", pincode: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const order = await createOrder(token, form);
      navigate("/orders", { state: { placed: true, orderId: order._id } });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="products">
      <h2>Checkout</h2>
      <form className="auth-form" onSubmit={handleSubmit}>
        {error && <p className="form-error">{error}</p>}
        <label>Full Name
          <input name="fullName" value={form.fullName} onChange={handleChange} required />
        </label>
        <label>Phone (10 digits)
          <input name="phone" value={form.phone} onChange={handleChange} pattern="\d{10}" required />
        </label>
        <label>Address
          <input name="address" value={form.address} onChange={handleChange} required />
        </label>
        <label>City
          <input name="city" value={form.city} onChange={handleChange} required />
        </label>
        <label>State
          <input name="state" value={form.state} onChange={handleChange} required />
        </label>
        <label>Pincode (6 digits)
          <input name="pincode" value={form.pincode} onChange={handleChange} pattern="\d{6}" required />
        </label>
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? "Placing order..." : "Place Order"}
        </button>
      </form>
    </section>
  );
}