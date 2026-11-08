
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import CartIcon from "./CartIcon";

export default function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    async function handleLogout() {
        try {
            await logout();
            navigate("/login", { replace: true });
        } catch (error) {
            console.error("Logout failed:", error);
            alert("Unable to log out. Please try again.");
        }
    }

    return (
        <header className="border-b border-gray-200 bg-[#faf9f7]">
            <div className="mx-auto flex w-full max-w-[1280px] flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-8 lg:px-12">
                <Link
                    to="/"
                    className="text-3xl tracking-[0.2em] text-[#202020]"
                >
                    VESTRA
                </Link>

                <nav
                    aria-label="Main navigation"
                    className="flex flex-wrap items-center gap-4 text-sm sm:gap-6"
                >
                    <Link to="/shop" className="hover:underline">
                        Shop
                    </Link>

                    {user ? (
                        <>
                            <Link to="/account" className="hover:underline">
                                My Account
                            </Link>

                            {user.role === "seller" && (
                                <Link to="/seller" className="hover:underline">
                                    Seller Dashboard
                                </Link>
                            )}

                            {user.role === "admin" && (
                                <Link to="/admin" className="hover:underline">
                                    Admin Dashboard
                                </Link>
                            )}

                            <button
                                type="button"
                                onClick={handleLogout}
                                className="border border-black px-5 py-2 transition hover:bg-black hover:text-white"
                            >
                                Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="hover:underline">
                                Login
                            </Link>

                            <Link
                                to="/register"
                                className="border border-black px-5 py-2 transition hover:bg-black hover:text-white"
                            >
                                Register
                            </Link>
                        </>
                    )}

                    <CartIcon />
                </nav>
            </div>
        </header>
    );
}
