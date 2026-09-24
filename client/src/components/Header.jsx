import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <header className="site-header">
      <Link to="/" className="logo">Smart Shop</Link>
      <nav>
        <Link to="/">Products</Link>
        <Link to="/wishlist">Wishlist</Link>
        <Link to="/cart">Cart</Link>
        <Link to="/orders">Orders</Link>
        {user ? (
          <>
            <span>Hi, {user.name}</span>
            {user.role === "admin" && <Link to="/admin">Admin</Link>}
            <button className="btn-link" onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <Link to="/login">Login</Link>
        )}
      </nav>
    </header>
  );
}