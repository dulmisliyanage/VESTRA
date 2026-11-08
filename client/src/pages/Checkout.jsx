
import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import api from "../services/api";

const SHIPPING_FEE = 350;

const initialForm = {
    fullName: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    district: "",
    postalCode: "",
    notes: ""
};

export default function Checkout() {
    const checkoutKeyRef = useRef(null);
    const navigate = useNavigate();
    const { user } = useAuth();

    const {
        cartItems,
        cartSubtotal,
        clearCart,
        validateCart
    } = useCart();

    const [form, setForm] = useState(initialForm);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const total = cartSubtotal + SHIPPING_FEE;

    function handleChange(event) {
        const { name, value } = event.target;

        setForm((previous) => ({
            ...previous,
            [name]: value
        }));
    }

    async function handleSubmit(event) {
        event.preventDefault();

        if (submitting) return;

        setError("");

        if (!user || user.role !== "customer") {
            setError(
                "Please log in with a customer account to place an order."
            );
            return;
        }

        if (cartItems.length === 0) {
            setError("Your shopping bag is empty.");
            return;
        }

        setSubmitting(true);

        try {
            // Check current prices and stock before checkout.
            const validation = await validateCart();

            if (validation.stale) {
                setError(
                    "Your shopping bag changed. Please review it and try again."
                );
                return;
            }

            if (validation.failed) {
                setError(
                    "Unable to verify product availability. Please try again."
                );
                return;
            }

            if (validation.changed) {
                setError(
                    "Some product details or quantities changed. Please review your shopping bag before placing the order."
                );
                return;
            }

            const orderItems = cartItems.map((item) => ({
                productId: item.productId,
                sku: item.sku,
                quantity: item.quantity
            }));

            const shippingAddress = {
                fullName: form.fullName.trim(),
                phone: form.phone.trim(),
                addressLine1: form.addressLine1.trim(),
                addressLine2: form.addressLine2.trim(),
                city: form.city.trim(),
                district: form.district.trim(),
                postalCode: form.postalCode.trim(),
                country: "Sri Lanka"
            };

            if (!checkoutKeyRef.current) {
                checkoutKeyRef.current = crypto.randomUUID();
            }

            const response = await api.post("/orders", {
                items: orderItems,
                shippingAddress,
                notes: form.notes.trim(),
                idempotencyKey: checkoutKeyRef.current
            });

            const order = response.data.order;

            if (!order?._id) {
                throw new Error("Order confirmation was not received.");
            }

            clearCart();

            navigate(`/orders/${order._id}`, {
                replace: true
            });
        } catch (err) {
            setError(
                err.response?.data?.message ||
                err.message ||
                "Unable to place your order. Please try again."
            );
        } finally {
            setSubmitting(false);
        }
    }

    function formatPrice(value) {
        return `LKR ${Number(value).toLocaleString("en-LK")}`;
    }

    return (
        <main className="min-h-screen bg-[#faf9f6] text-[#202020]">
            <div className="mx-auto w-full max-w-[1200px] px-5 py-10 sm:px-8 lg:px-12">
                <Link
                    to="/cart"
                    className="text-sm text-gray-500 hover:text-black"
                >
                    ← Back to Shopping Bag
                </Link>

                <header className="mb-10 mt-10">
                    <p className="text-xs uppercase tracking-[0.3em] text-gray-500">
                        VESTRA
                    </p>

                    <h1 className="mt-4 text-4xl tracking-tight sm:text-5xl">
                        Checkout
                    </h1>

                    <p className="mt-4 text-sm text-gray-500">
                        Complete your delivery details to place your order.
                    </p>
                </header>

                {cartItems.length === 0 ? (
                    <div className="border border-gray-200 bg-white p-10 text-center">
                        <h2 className="text-2xl">
                            Your shopping bag is empty
                        </h2>

                        <p className="mt-3 text-sm text-gray-500">
                            Discover something you love in our collection.
                        </p>

                        <Link
                            to="/shop"
                            className="mt-8 inline-block bg-black px-8 py-3 text-sm text-white"
                        >
                            Continue Shopping
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_380px]">
                            {/* DELIVERY INFORMATION */}
                            <section className="min-w-0">
                                <div className="border border-gray-200 bg-white p-5 sm:p-8">
                                    <h2 className="text-2xl">
                                        Delivery Information
                                    </h2>

                                    <p className="mt-2 text-sm text-gray-500">
                                        Enter the address where your order should be delivered.
                                    </p>

                                    <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
                                        <div className="sm:col-span-2">
                                            <label
                                                htmlFor="fullName"
                                                className="mb-2 block text-sm"
                                            >
                                                Full Name *
                                            </label>

                                            <input
                                                id="fullName"
                                                name="fullName"
                                                type="text"
                                                required
                                                maxLength={100}
                                                autoComplete="name"
                                                value={form.fullName}
                                                onChange={handleChange}
                                                className="w-full rounded-md border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black"
                                                placeholder="Enter your full name"
                                            />
                                        </div>

                                        <div className="sm:col-span-2">
                                            <label
                                                htmlFor="phone"
                                                className="mb-2 block text-sm"
                                            >
                                                Phone Number *
                                            </label>

                                            <input
                                                id="phone"
                                                name="phone"
                                                type="tel"
                                                required
                                                maxLength={20}
                                                autoComplete="tel"
                                                value={form.phone}
                                                onChange={handleChange}
                                                className="w-full rounded-md border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black"
                                                placeholder="07XXXXXXXX"
                                            />
                                        </div>

                                        <div className="sm:col-span-2">
                                            <label
                                                htmlFor="addressLine1"
                                                className="mb-2 block text-sm"
                                            >
                                                Address Line 1 *
                                            </label>

                                            <input
                                                id="addressLine1"
                                                name="addressLine1"
                                                type="text"
                                                required
                                                maxLength={200}
                                                autoComplete="address-line1"
                                                value={form.addressLine1}
                                                onChange={handleChange}
                                                className="w-full rounded-md border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black"
                                                placeholder="House number and street address"
                                            />
                                        </div>

                                        <div className="sm:col-span-2">
                                            <label
                                                htmlFor="addressLine2"
                                                className="mb-2 block text-sm"
                                            >
                                                Address Line 2 (Optional)
                                            </label>

                                            <input
                                                id="addressLine2"
                                                name="addressLine2"
                                                type="text"
                                                maxLength={200}
                                                autoComplete="address-line2"
                                                value={form.addressLine2}
                                                onChange={handleChange}
                                                className="w-full rounded-md border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black"
                                                placeholder="Apartment, building, or landmark"
                                            />
                                        </div>

                                        <div>
                                            <label
                                                htmlFor="city"
                                                className="mb-2 block text-sm"
                                            >
                                                City *
                                            </label>

                                            <input
                                                id="city"
                                                name="city"
                                                type="text"
                                                required
                                                maxLength={100}
                                                autoComplete="address-level2"
                                                value={form.city}
                                                onChange={handleChange}
                                                className="w-full rounded-md border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black"
                                                placeholder="City"
                                            />
                                        </div>

                                        <div>
                                            <label
                                                htmlFor="district"
                                                className="mb-2 block text-sm"
                                            >
                                                District *
                                            </label>

                                            <input
                                                id="district"
                                                name="district"
                                                type="text"
                                                required
                                                maxLength={100}
                                                value={form.district}
                                                onChange={handleChange}
                                                className="w-full rounded-md border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black"
                                                placeholder="District"
                                            />
                                        </div>

                                        <div className="sm:col-span-2">
                                            <label
                                                htmlFor="postalCode"
                                                className="mb-2 block text-sm"
                                            >
                                                Postal Code (Optional)
                                            </label>

                                            <input
                                                id="postalCode"
                                                name="postalCode"
                                                type="text"
                                                maxLength={10}
                                                autoComplete="postal-code"
                                                value={form.postalCode}
                                                onChange={handleChange}
                                                className="w-full rounded-md border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black"
                                                placeholder="Postal code"
                                            />
                                        </div>

                                        <div className="sm:col-span-2">
                                            <label
                                                htmlFor="notes"
                                                className="mb-2 block text-sm"
                                            >
                                                Order Notes (Optional)
                                            </label>

                                            <textarea
                                                id="notes"
                                                name="notes"
                                                rows={3}
                                                maxLength={500}
                                                value={form.notes}
                                                onChange={handleChange}
                                                className="w-full resize-y rounded-md border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black"
                                                placeholder="Additional delivery instructions"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* PAYMENT METHOD */}
                                <div className="mt-6 border border-gray-200 bg-white p-5 sm:p-8">
                                    <h2 className="text-2xl">
                                        Payment Method
                                    </h2>

                                    <div className="mt-6 flex items-start gap-3 border border-black p-4">
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            checked
                                            readOnly
                                            className="mt-1 accent-black"
                                        />

                                        <div>
                                            <p className="text-sm font-semibold">
                                                Cash on Delivery
                                            </p>

                                            <p className="mt-1 text-sm text-gray-500">
                                                Development checkout using simulated COD orders.
                                                No payment is collected online.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* ORDER SUMMARY */}
                            <aside className="min-w-0">
                                <div className="border border-gray-200 bg-white p-5 sm:p-7 lg:sticky lg:top-8">
                                    <h2 className="text-2xl">
                                        Order Summary
                                    </h2>

                                    <div className="mt-6 space-y-5">
                                        {cartItems.map((item) => (
                                            <div
                                                key={item.cartItemId}
                                                className="flex gap-4 border-b border-gray-100 pb-5"
                                            >
                                                <div className="h-24 w-20 shrink-0 overflow-hidden bg-[#eeece7]">
                                                    {item.image ? (
                                                        <img
                                                            src={item.image}
                                                            alt={item.name}
                                                            className="h-full w-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="flex h-full items-center justify-center text-xs text-gray-400">
                                                            No Image
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <h3 className="text-sm font-medium">
                                                        {item.name}
                                                    </h3>

                                                    <p className="mt-1 text-xs text-gray-500">
                                                        Size: {item.size || "N/A"}
                                                    </p>

                                                    <p className="text-xs text-gray-500">
                                                        Color: {item.color || "N/A"}
                                                    </p>

                                                    <p className="mt-1 text-xs text-gray-500">
                                                        Qty: {item.quantity}
                                                    </p>

                                                    <p className="mt-2 text-sm font-semibold">
                                                        {formatPrice(
                                                            item.price * item.quantity
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-6 space-y-4 text-sm">
                                        <div className="flex justify-between gap-4">
                                            <span className="text-gray-500">
                                                Subtotal
                                            </span>

                                            <span>
                                                {formatPrice(cartSubtotal)}
                                            </span>
                                        </div>

                                        <div className="flex justify-between gap-4">
                                            <span className="text-gray-500">
                                                Shipping
                                            </span>

                                            <span>
                                                {formatPrice(SHIPPING_FEE)}
                                            </span>
                                        </div>

                                        <div className="flex justify-between gap-4 border-t border-gray-200 pt-5 text-lg font-semibold">
                                            <span>Total</span>

                                            <span>
                                                {formatPrice(total)}
                                            </span>
                                        </div>
                                    </div>

                                    <p className="mt-4 text-xs leading-5 text-gray-500">
                                        The final amount is calculated by the server
                                        using current product prices.
                                    </p>

                                    {error && (
                                        <p
                                            role="alert"
                                            className="mt-5 rounded-md bg-red-50 p-4 text-sm text-red-700"
                                        >
                                            {error}
                                        </p>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={submitting || user?.role !== "customer"}
                                        className="mt-6 w-full bg-black px-6 py-4 text-sm text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {submitting
                                            ? "Placing Order..."
                                            : "Place Order"}
                                    </button>

                                    {user?.role !== "customer" && (
                                        <p className="mt-3 text-center text-xs text-gray-500">
                                            Please{" "}
                                            <Link
                                                to="/login"
                                                className="underline"
                                            >
                                                log in as a customer
                                            </Link>{" "}
                                            to place an order.
                                        </p>
                                    )}
                                </div>
                            </aside>
                        </div>
                    </form>
                )}
            </div>
        </main>
    );
}
