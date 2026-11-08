
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";

export default function Cart() {
    const {
        cartItems,
        cartCount,
        cartSubtotal,
        removeFromCart,
        updateQuantity,
        clearCart,
        validateCart
    } = useCart();

    const [validationMessage, setValidationMessage] = useState("");
    const [validating, setValidating] = useState(true);

    // Validate once when the Cart page mounts.
    // CartContext must expose a stable validateCart function.
    useEffect(() => {
        let cancelled = false;

        async function checkCart() {
            setValidating(true);

            try {
                const result = await validateCart();

                if (cancelled) return;

                if (result.changed) {
                    setValidationMessage(
                        `Your cart was updated: ${result.removed} unavailable item(s) removed and ${result.adjusted} item(s) adjusted.`
                    );
                }
            } catch {
                if (!cancelled) {
                    setValidationMessage(
                        "We couldn't verify all cart items right now."
                    );
                }
            } finally {
                if (!cancelled) {
                    setValidating(false);
                }
            }
        }

        if (typeof validateCart === "function") {
            checkCart();
        } else {
            setValidating(false);
            setValidationMessage(
                "Cart validation is currently unavailable."
            );
        }

        return () => {
            cancelled = true;
        };
    }, [validateCart]);

    // Format prices in Sri Lankan Rupees.
    function formatPrice(amount) {
        return Number(amount).toLocaleString("en-LK", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    return (
        <main className="min-h-screen w-full bg-[#faf9f6] text-[#202020]">
            <div className="mx-auto w-full max-w-[1280px] px-5 py-8 sm:px-8 sm:py-12 lg:px-12">

                {/* BACK TO SHOP */}
                <Link
                    to="/shop"
                    className="text-sm text-gray-500 transition hover:text-black"
                >
                    ← Continue Shopping
                </Link>

                {/* PAGE HEADER */}
                <header className="mb-10 mt-10">
                    <p className="text-[11px] uppercase tracking-[0.3em] text-gray-500">
                        Your Selection
                    </p>

                    <h1 className="mt-4 text-3xl font-semibold sm:text-4xl lg:text-5xl">
                        Shopping Bag
                    </h1>

                    <p className="mt-3 text-sm text-gray-500">
                        {cartCount} {cartCount === 1 ? "item" : "items"} in your bag
                    </p>
                </header>

                {/* VALIDATION LOADING MESSAGE */}
                {validating && (
                    <div
                        role="status"
                        className="mb-6 rounded-md border border-gray-200 bg-white px-4 py-3 text-sm text-gray-600"
                    >
                        Checking product availability...
                    </div>
                )}

                {/* VALIDATION RESULT */}
                {validationMessage && (
                    <div
                        role="status"
                        className="mb-6 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
                    >
                        {validationMessage}
                    </div>
                )}

                {/* EMPTY CART */}
                {cartItems.length === 0 ? (
                    <section className="rounded-xl border border-gray-200 bg-white px-6 py-20 text-center">
                        <h2 className="text-2xl font-medium">
                            Your shopping bag is empty
                        </h2>

                        <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-gray-500">
                            Discover something special from the VESTRA collection.
                        </p>

                        <Link
                            to="/shop"
                            className="mt-8 inline-block rounded-md bg-black px-8 py-4 text-sm text-white transition hover:bg-gray-800"
                        >
                            Explore Collection
                        </Link>
                    </section>
                ) : (
                    <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-12">

                        {/* CART ITEMS */}
                        <section className="min-w-0">

                            <div className="mb-5 flex items-center justify-between border-b border-gray-200 pb-4">
                                <h2 className="text-lg font-semibold">
                                    Your Items
                                </h2>

                                {/* CLEAR BAG */}
                                <button
                                    type="button"
                                    onClick={() => {
                                        clearCart();
                                        setValidationMessage("");
                                    }}
                                    className="text-sm text-gray-500 underline transition hover:text-red-600"
                                >
                                    Clear Bag
                                </button>
                            </div>

                            <div className="divide-y divide-gray-200">
                                {cartItems.map((item) => (
                                    <article
                                        key={item.cartItemId}
                                        className="flex flex-col gap-5 py-7 sm:flex-row"
                                    >

                                        {/* PRODUCT IMAGE */}
                                        <Link
                                            to={`/shop/products/${item.productId}`}
                                            className="block w-full shrink-0 sm:w-36"
                                        >
                                            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-lg bg-[#eeece7]">
                                                {item.image ? (
                                                    <img
                                                        src={item.image}
                                                        alt={item.name}
                                                        className="absolute inset-0 h-full w-full object-cover object-center"
                                                    />
                                                ) : (
                                                    <div className="flex h-full items-center justify-center text-xs text-gray-400">
                                                        No Image
                                                    </div>
                                                )}
                                            </div>
                                        </Link>

                                        {/* PRODUCT INFORMATION */}
                                        <div className="flex min-w-0 flex-1 flex-col justify-between gap-5">

                                            <div>
                                                <Link
                                                    to={`/shop/products/${item.productId}`}
                                                    className="text-lg font-medium transition hover:underline"
                                                >
                                                    {item.name}
                                                </Link>

                                                <p className="mt-2 text-sm text-gray-500">
                                                    Size: {item.size}
                                                </p>

                                                <p className="mt-1 text-sm text-gray-500">
                                                    Color: {item.color}
                                                </p>

                                                <p className="mt-3 text-sm font-semibold">
                                                    LKR {formatPrice(item.price)}
                                                </p>

                                                <p className="mt-2 text-xs text-gray-500">
                                                    {item.stock > 0
                                                        ? `${item.stock} available in stock`
                                                        : "Out of stock"}
                                                </p>
                                            </div>

                                            {/* QUANTITY AND REMOVE */}
                                            <div className="flex flex-wrap items-center justify-between gap-4">

                                                {/* QUANTITY CONTROLS */}
                                                <div className="inline-flex items-center overflow-hidden rounded-md border border-gray-300 bg-white">

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            updateQuantity(
                                                                item.cartItemId,
                                                                item.quantity - 1
                                                            )
                                                        }
                                                        disabled={item.quantity <= 1}
                                                        aria-label={`Decrease quantity of ${item.name}`}
                                                        className="px-4 py-2.5 text-lg disabled:cursor-not-allowed disabled:opacity-30"
                                                    >
                                                        −
                                                    </button>

                                                    <span className="min-w-10 text-center text-sm">
                                                        {item.quantity}
                                                    </span>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            updateQuantity(
                                                                item.cartItemId,
                                                                item.quantity + 1
                                                            )
                                                        }
                                                        disabled={item.quantity >= item.stock}
                                                        aria-label={`Increase quantity of ${item.name}`}
                                                        className="px-4 py-2.5 text-lg disabled:cursor-not-allowed disabled:opacity-30"
                                                    >
                                                        +
                                                    </button>
                                                </div>

                                                {/* REMOVE ITEM */}
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        removeFromCart(item.cartItemId)
                                                    }
                                                    className="text-sm text-gray-500 underline transition hover:text-red-600"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        </div>

                                        {/* ITEM TOTAL */}
                                        <div className="shrink-0 text-left sm:text-right">
                                            <p className="text-sm font-semibold">
                                                LKR{" "}
                                                {formatPrice(
                                                    item.price * item.quantity
                                                )}
                                            </p>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        </section>

                        {/* ORDER SUMMARY */}
                        <aside className="rounded-xl border border-gray-200 bg-white p-6 sm:p-8">

                            <h2 className="text-xl font-semibold">
                                Order Summary
                            </h2>

                            <div className="mt-8 space-y-5 text-sm">

                                <div className="flex items-center justify-between gap-4">
                                    <span className="text-gray-500">
                                        Subtotal ({cartCount} items)
                                    </span>

                                    <span>
                                        LKR {formatPrice(cartSubtotal)}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between gap-4">
                                    <span className="text-gray-500">
                                        Delivery
                                    </span>

                                    <span className="text-gray-500">
                                        Calculated at checkout
                                    </span>
                                </div>
                            </div>

                            <div className="my-7 border-t border-gray-200" />

                            <div className="flex items-center justify-between gap-4">
                                <span className="text-base font-semibold">
                                    Subtotal
                                </span>

                                <span className="text-lg font-semibold">
                                    LKR {formatPrice(cartSubtotal)}
                                </span>
                            </div>

                            <p className="mt-3 text-xs leading-5 text-gray-500">
                                Delivery fees and any applicable discounts will
                                be calculated during checkout.
                            </p>

                            <Link
                                to="/checkout"
                                className="mt-6 block w-full bg-black px-6 py-4 text-center text-sm text-white transition hover:bg-gray-800"
                            >
                                Proceed to Checkout
                            </Link>

                            <Link
                                to="/shop"
                                className="mt-5 block text-center text-sm text-gray-600 underline transition hover:text-black"
                            >
                                Continue Shopping
                            </Link>
                        </aside>
                    </div>
                )}
            </div>
        </main>
    );
}
