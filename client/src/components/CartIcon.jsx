
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";

export default function CartIcon() {
    const { cartCount } = useCart();

    return (
        <Link
            to="/cart"
            aria-label={`Shopping bag with ${cartCount} items`}
            className="relative inline-flex items-center justify-center p-2 text-[#202020] transition hover:opacity-60"
        >
            {/* Shopping Bag Icon */}
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
            >
                <path d="M5 8h14l1 13H4L5 8Z" />
                <path d="M9 9V6a3 3 0 0 1 6 0v3" />
            </svg>

            {/* Live Cart Count */}
            {cartCount > 0 && (
                <span
                    className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-black px-1 text-[10px] text-white"
                >
                    {cartCount > 99 ? "99+" : cartCount}
                </span>
            )}
        </Link>
    );
}
