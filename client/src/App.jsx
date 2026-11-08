
import {
  Routes,
  Route,
  Link,
  NavLink,
  Navigate,
} from "react-router-dom";

import { useAuth } from "./context/AuthContext";
import { useCart } from "./context/CartContext";

// Components
import ProtectedRoute from "./routes/ProtectedRoute";
import CartIcon from "./components/CartIcon";
import ProductMarquee from "./components/ProductMarquee";

// Public pages
import Shop from "./pages/Shop";
import ProductDetails from "./pages/ProductDetails";
import Cart from "./pages/Cart";

// Authentication pages
import AuthPage from "./pages/auth/AuthPage";

// Customer pages
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";
import MyOrders from "./pages/MyOrders";

// Seller pages
import SellerDashboard from "./pages/seller/SellerDashboard";
import SellerProducts from "./pages/seller/SellerProducts";
import AddProduct from "./pages/seller/AddProduct";
import EditProduct from "./pages/seller/EditProduct";
import SellerOrders from "./pages/seller/SellerOrders";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";

// ========================================
// HOME PAGE
// ========================================



function Home() {
  const reveal = (delay) => ({
    animationName: "vestraFadeUp",
    animationDuration: "1.3s",
    animationTimingFunction: "ease-out",
    animationDelay: `${delay}s`,
    animationFillMode: "both",
  });

  return (
    <main className="min-h-[75vh] bg-[#faf9f6] px-6 py-20 text-center text-[#191919]">

      <div className="mx-auto flex max-w-4xl flex-col items-center justify-center">

        <p
          className="mb-5 text-xs uppercase tracking-[0.35em] text-neutral-500"
          style={reveal(0.2)}
        >
          THE VESTRA EDIT
        </p>

        <h1
          className="text-5xl leading-tight md:text-7xl"
          style={reveal(0.5)}
        >
          Discover Your Style
        </h1>

        <p
          className="mt-7 max-w-xl text-base leading-relaxed text-neutral-600"
          style={reveal(0.8)}
        >
          Explore a curated collection of fashion from independent
          brands and emerging designers.
        </p>

        <Link
          to="/shop"
          className="mt-10 inline-block bg-black px-10 py-4 text-sm uppercase tracking-[0.2em] text-white transition hover:bg-neutral-800"
          style={reveal(1.1)}
        >
          Explore Collection
        </Link>

      </div>

      {/* MOVING PRODUCT IMAGES BELOW HERO TEXT */}
      <ProductMarquee />

    </main>
  );
}



// ========================================
// ACCOUNT PAGE
// ========================================

function Account() {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <main className="min-h-[70vh] bg-[#faf9f6] px-6 py-16 text-[#191919]">
      <div className="mx-auto max-w-4xl">

        <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">
          VESTRA ACCOUNT
        </p>

        <h1 className="mt-4 text-4xl">
          My Account
        </h1>

        <div className="mt-10 border border-neutral-200 bg-white p-8">

          <p className="text-sm text-neutral-500">
            Welcome back
          </p>

          <h2 className="mt-2 text-2xl">
            {user.name}
          </h2>

          <p className="mt-3 text-sm text-neutral-600">
            {user.email}
          </p>

          <p className="mt-2 text-sm capitalize text-neutral-500">
            Account type: {user.role}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">

            {user.role === "customer" && (
              <Link
                to="/my-orders"
                className="bg-black px-6 py-3 text-sm text-white transition hover:bg-neutral-800"
              >
                My Orders
              </Link>
            )}

            {user.role === "seller" && (
              <Link
                to="/seller"
                className="bg-black px-6 py-3 text-sm text-white transition hover:bg-neutral-800"
              >
                Seller Dashboard
              </Link>
            )}

            {user.role === "admin" && (
              <Link
                to="/admin"
                className="bg-black px-6 py-3 text-sm text-white transition hover:bg-neutral-800"
              >
                Admin Dashboard
              </Link>
            )}

            <Link
              to="/shop"
              className="border border-neutral-300 px-6 py-3 text-sm transition hover:border-black"
            >
              Continue Shopping
            </Link>

          </div>
        </div>
      </div>
    </main>
  );
}

// ========================================
// NAVBAR
// ========================================

function Navbar() {
  const { user, logout } = useAuth();
  const { cartCount } = useCart();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // Active navigation link styling
  const navLinkClass = ({ isActive }) =>
    `relative border-b pb-1 transition-all duration-300 ${isActive
      ? "border-black font-semibold text-black"
      : "border-transparent text-neutral-500 hover:border-neutral-400 hover:text-black"
    }`;

  return (
    <header className="border-b border-neutral-200 bg-[#faf9f6] text-[#191919]">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-5 px-6 py-6 md:px-10">

        {/* LOGO */}
        <Link
          to="/"
          className="text-3xl font-semibold tracking-[0.2em]"
        >
          VESTRA
        </Link>

        {/* NAVIGATION */}
        <nav className="flex flex-wrap items-center gap-5 text-sm md:gap-8">

          {/* HOME */}
          <NavLink
            to="/"
            end
            className={navLinkClass}
          >
            Home
          </NavLink>

          {/* SHOP */}
          <NavLink
            to="/shop"
            className={navLinkClass}
          >
            Shop
          </NavLink>

          {/* SELLER NAVIGATION */}
          {user?.role === "seller" && (
            <>
              <NavLink
                to="/seller"
                end
                className={navLinkClass}
              >
                Seller Studio
              </NavLink>

              <NavLink
                to="/seller/orders"
                className={navLinkClass}
              >
                Seller Orders
              </NavLink>
            </>
          )}

          {/* ADMIN NAVIGATION */}
          {user?.role === "admin" && (
            <NavLink
              to="/admin"
              className={navLinkClass}
            >
              Admin
            </NavLink>
          )}

          {/* AUTHENTICATED USER */}
          {user ? (
            <>
              <NavLink
                to="/account"
                className={navLinkClass}
              >
                Account
              </NavLink>

              {user.role === "customer" && (
                <NavLink
                  to="/my-orders"
                  className={navLinkClass}
                >
                  My Orders
                </NavLink>
              )}

              <button
                type="button"
                onClick={handleLogout}
                className="cursor-pointer border-b border-transparent pb-1 text-neutral-500 transition-all duration-300 hover:border-neutral-400 hover:text-black"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink
                to="/login"
                className={navLinkClass}
              >
                Login
              </NavLink>

              <NavLink
                to="/register"
                className={navLinkClass}
              >
                Register
              </NavLink>
            </>
          )}

          {/* CART */}
          <CartIcon />

        </nav>
      </div>
    </header>
  );
}

// ========================================
// FOOTER
// ========================================

function Footer() {
  return (
    <footer className="border-t border-neutral-200 bg-[#faf9f6] px-6 py-10 text-[#191919]">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">

        <div>
          <p className="text-2xl tracking-[0.2em]">
            VESTRA
          </p>

          <p className="mt-2 text-xs text-neutral-500">
            Curated fashion. Individual expression.
          </p>
        </div>

        <p className="text-xs text-neutral-500">
          © {new Date().getFullYear()} VESTRA. All rights reserved.
        </p>

      </div>
    </footer>
  );
}

// ========================================
// MAIN APP
// ========================================

export default function App() {
  return (
    <div className="flex min-h-screen flex-col">

      <Navbar />

      <div className="flex-1">
        <Routes>

          {/* PUBLIC ROUTES */}
          <Route
            path="/"
            element={<Home />}
          />

          <Route
            path="/shop"
            element={<Shop />}
          />

          <Route
            path="/shop/products/:id"
            element={<ProductDetails />}
          />

          <Route
            path="/cart"
            element={<Cart />}
          />

          {/* AUTHENTICATION */}
          <Route
            path="/login"
            element={<AuthPage />}
          />

          <Route
            path="/register"
            element={<AuthPage />}
          />

          {/* ACCOUNT */}
          <Route
            path="/account"
            element={
              <ProtectedRoute>
                <Account />
              </ProtectedRoute>
            }
          />

          {/* CUSTOMER ROUTES */}
          <Route
            path="/checkout"
            element={
              <ProtectedRoute allowedRoles={["customer"]}>
                <Checkout />
              </ProtectedRoute>
            }
          />

          <Route
            path="/orders/:id"
            element={
              <ProtectedRoute allowedRoles={["customer"]}>
                <OrderConfirmation />
              </ProtectedRoute>
            }
          />

          <Route
            path="/my-orders"
            element={
              <ProtectedRoute allowedRoles={["customer"]}>
                <MyOrders />
              </ProtectedRoute>
            }
          />

          {/* SELLER ROUTES */}
          <Route
            path="/seller"
            element={
              <ProtectedRoute allowedRoles={["seller"]}>
                <SellerDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/seller/products"
            element={
              <ProtectedRoute allowedRoles={["seller"]}>
                <SellerProducts />
              </ProtectedRoute>
            }
          />

          <Route
            path="/seller/products/new"
            element={
              <ProtectedRoute allowedRoles={["seller"]}>
                <AddProduct />
              </ProtectedRoute>
            }
          />

          <Route
            path="/seller/products/:id/edit"
            element={
              <ProtectedRoute allowedRoles={["seller"]}>
                <EditProduct />
              </ProtectedRoute>
            }
          />

          <Route
            path="/seller/orders"
            element={
              <ProtectedRoute allowedRoles={["seller"]}>
                <SellerOrders />
              </ProtectedRoute>
            }
          />

          {/* ADMIN ROUTES */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* 404 PAGE */}
          <Route
            path="*"
            element={
              <main className="flex min-h-[65vh] flex-col items-center justify-center bg-[#faf9f6] px-6 text-center">

                <h1 className="text-5xl">
                  404
                </h1>

                <p className="mt-4 text-neutral-600">
                  The page you are looking for does not exist.
                </p>

                <Link
                  to="/"
                  className="mt-8 border border-black px-6 py-3 text-sm"
                >
                  Return Home
                </Link>

              </main>
            }
          />

        </Routes>
      </div>

      <Footer />

    </div>
  );
}
