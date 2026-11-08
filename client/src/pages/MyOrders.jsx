
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import api from "../services/api";
import OrderTracking from "../components/OrderTracking";

import { getOverallOrderStatus } from "../utils/orderStatus";

// ========================================
// HELPER FUNCTIONS
// ========================================

const formatPrice = (amount) => {
    return `LKR ${Number(amount || 0).toLocaleString("en-LK", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;
};

const formatDate = (date) => {
    if (!date) return "Date unavailable";

    return new Date(date).toLocaleDateString("en-LK", {
        year: "numeric",
        month: "long",
        day: "numeric"
    });
};

const formatStatus = (status) => {
    if (!status) return "Pending";

    return status.charAt(0).toUpperCase() + status.slice(1);
};

// ========================================
// MY ORDERS PAGE
// ========================================

export default function MyOrders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // ========================================
    // FETCH CUSTOMER ORDERS
    // ========================================

    useEffect(() => {
        let active = true;

        const fetchOrders = async () => {
            try {
                setLoading(true);
                setError("");

                const response = await api.get("/orders/my-orders");

                if (active) {
                    setOrders(response.data.orders || []);
                }
            } catch (err) {
                if (active) {
                    setError(
                        err.response?.data?.message ||
                        "Unable to load your orders. Please try again."
                    );
                }
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        };

        fetchOrders();

        return () => {
            active = false;
        };
    }, []);

    // ========================================
    // LOADING STATE
    // ========================================

    if (loading) {
        return (
            <main className="min-h-[75vh] bg-[#faf9f6] px-5 py-16 text-[#191919]">
                <div className="mx-auto max-w-6xl">
                    <h1 className="text-4xl">My Orders</h1>

                    <p className="mt-8 text-sm text-neutral-500">
                        Loading your orders...
                    </p>
                </div>
            </main>
        );
    }

    // ========================================
    // MAIN PAGE
    // ========================================

    return (
        <main className="min-h-screen bg-[#faf9f6] px-5 py-12 text-[#191919] md:px-12 lg:px-20">
            <div className="mx-auto max-w-6xl">

                {/* PAGE HEADING */}
                <div className="mb-12">
                    <p className="mb-3 text-xs uppercase tracking-[0.3em] text-neutral-500">
                        VESTRA ACCOUNT
                    </p>

                    <h1 className="text-4xl md:text-5xl">
                        My Orders
                    </h1>

                    <p className="mt-4 text-sm leading-relaxed text-neutral-600">
                        Review your purchases and track the delivery
                        progress of every product.
                    </p>
                </div>

                {/* ERROR MESSAGE */}
                {error && (
                    <div
                        role="alert"
                        className="mb-8 border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700"
                    >
                        {error}
                    </div>
                )}

                {/* EMPTY STATE */}
                {!error && orders.length === 0 && (
                    <div className="border border-neutral-200 bg-white px-6 py-20 text-center">
                        <h2 className="text-2xl">
                            No orders yet
                        </h2>

                        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-neutral-500">
                            Your fashion journey starts here.
                            Explore our collection and discover pieces
                            that express your personal style.
                        </p>

                        <Link
                            to="/shop"
                            className="mt-8 inline-block bg-[#242120] px-8 py-4 text-sm text-white transition hover:bg-black"
                        >
                            Explore Collection
                        </Link>
                    </div>
                )}

                {/* ORDER LIST */}
                {!error && orders.length > 0 && (
                    <div className="space-y-8">
                        {orders.map((order) => (
                            <article
                                key={order._id}
                                className="overflow-hidden border border-neutral-200 bg-white"
                            >

                                {/* ORDER HEADER */}
                                <div className="flex flex-wrap items-center justify-between gap-5 border-b border-neutral-200 px-5 py-6 sm:px-8">
                                    <div>
                                        <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
                                            Order Number
                                        </p>

                                        <p className="mt-2 break-all text-sm">
                                            #{order._id}
                                        </p>

                                        <p className="mt-3 text-xs text-neutral-500">
                                            Placed on {formatDate(order.createdAt)}
                                        </p>
                                    </div>

                                    <div className="text-left sm:text-right">
                                        <p className="text-xs uppercase tracking-[0.15em] text-neutral-500">
                                            Order Status
                                        </p>

                                        <span className="mt-2 inline-block border border-neutral-300 px-4 py-2 text-xs uppercase tracking-wider">
                                            {formatStatus(getOverallOrderStatus(order))}
                                        </span>
                                    </div>
                                </div>

                                {/* ORDER ITEMS */}
                                <div className="divide-y divide-neutral-100">
                                    {(order.items || []).map((item, index) => (
                                        <div
                                            key={`${item.productId}-${item.sku}-${index}`}
                                            className="px-5 py-7 sm:px-8"
                                        >
                                            <div className="flex flex-col gap-5 sm:flex-row">

                                                {/* PRODUCT IMAGE */}
                                                <div className="h-36 w-28 shrink-0 overflow-hidden bg-neutral-100">
                                                    {item.image ? (
                                                        <img
                                                            src={item.image}
                                                            alt={item.productName}
                                                            className="h-full w-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="flex h-full items-center justify-center text-center text-xs text-neutral-400">
                                                            No Image
                                                        </div>
                                                    )}
                                                </div>

                                                {/* PRODUCT INFORMATION */}
                                                <div className="flex-1">
                                                    <h2 className="text-xl">
                                                        {item.productName}
                                                    </h2>

                                                    <p className="mt-2 text-sm text-neutral-500">
                                                        SKU: {item.sku}
                                                    </p>

                                                    <p className="mt-2 text-sm text-neutral-500">
                                                        Size: {item.size || "One size"}
                                                    </p>

                                                    {item.color && (
                                                        <p className="mt-1 text-sm text-neutral-500">
                                                            Color: {item.color}
                                                        </p>
                                                    )}

                                                    <p className="mt-2 text-sm text-neutral-500">
                                                        Quantity: {item.quantity}
                                                    </p>

                                                    <p className="mt-3 text-lg">
                                                        {formatPrice(item.subtotal)}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* PRODUCT DELIVERY TRACKING */}
                                            <div className="mt-7 border-t border-neutral-100 pt-6">
                                                <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
                                                    Product Delivery Progress
                                                </p>

                                                <OrderTracking
                                                    status={
                                                        order.orderStatus === "cancelled"
                                                            ? "cancelled"
                                                            : item.fulfillmentStatus || "pending"
                                                    }
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* ORDER FOOTER */}
                                <div className="flex flex-wrap items-center justify-between gap-5 border-t border-neutral-200 bg-[#fdfcfb] px-5 py-6 sm:px-8">
                                    <div>
                                        <p className="text-xs uppercase tracking-[0.15em] text-neutral-500">
                                            Order Total
                                        </p>

                                        <p className="mt-2 text-2xl">
                                            {formatPrice(order.totalAmount)}
                                        </p>

                                        <p className="mt-2 text-xs text-neutral-500">
                                            {order.paymentMethod === "cod"
                                                ? "Cash on Delivery"
                                                : order.paymentMethod}
                                        </p>
                                    </div>

                                    <Link
                                        to={`/orders/${order._id}`}
                                        className="inline-block border border-[#242120] px-6 py-3 text-sm transition hover:bg-[#242120] hover:text-white"
                                    >
                                        View Order Details
                                    </Link>
                                </div>
                            </article>
                        ))}
                    </div>
                )}

                {/* CONTINUE SHOPPING */}
                {orders.length > 0 && (
                    <div className="mt-12 text-center">
                        <Link
                            to="/shop"
                            className="inline-block border-b border-black pb-1 text-sm transition hover:text-neutral-500"
                        >
                            Continue Shopping
                        </Link>
                    </div>
                )}
            </div>
        </main>
    );
}
