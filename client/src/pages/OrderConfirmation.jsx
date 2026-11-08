
import { useEffect, useState } from "react";
import {
    Link,
    useParams
} from "react-router-dom";

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
// ORDER CONFIRMATION PAGE
// ========================================

export default function OrderConfirmation() {
    const { id } = useParams();

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // ========================================
    // FETCH ORDER DETAILS
    // ========================================

    useEffect(() => {
        let active = true;

        const fetchOrder = async () => {
            try {
                setLoading(true);
                setError("");

                const response = await api.get(`/orders/${id}`);

                if (active) {
                    setOrder(response.data.order || null);
                }
            } catch (err) {
                if (active) {
                    setError(
                        err.response?.data?.message ||
                        "Unable to load your order details."
                    );
                }
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        };

        fetchOrder();

        return () => {
            active = false;
        };
    }, [id]);

    // ========================================
    // LOADING STATE
    // ========================================

    if (loading) {
        return (
            <main className="min-h-[75vh] bg-[#faf9f6] px-5 py-16 text-[#191919]">
                <div className="mx-auto max-w-5xl">
                    <h1 className="text-3xl">
                        Order Details
                    </h1>

                    <p className="mt-6 text-sm text-neutral-500">
                        Loading order information...
                    </p>
                </div>
            </main>
        );
    }

    // ========================================
    // ERROR STATE
    // ========================================

    if (error || !order) {
        return (
            <main className="flex min-h-[75vh] items-center justify-center bg-[#faf9f6] px-5 py-16 text-[#191919]">
                <div className="max-w-md text-center">
                    <h1 className="text-3xl">
                        Order Unavailable
                    </h1>

                    <p className="mt-4 text-sm text-neutral-500">
                        {error || "We couldn't find this order."}
                    </p>

                    <Link
                        to="/my-orders"
                        className="mt-8 inline-block border border-black px-7 py-3 text-sm transition hover:bg-black hover:text-white"
                    >
                        Back to My Orders
                    </Link>
                </div>
            </main>
        );
    }

    const address = order.shippingAddress || {};

    // ========================================
    // MAIN PAGE
    // ========================================

    return (
        <main className="min-h-screen bg-[#faf9f6] px-5 py-12 text-[#191919] md:px-12 lg:px-20">
            <div className="mx-auto max-w-5xl">

                {/* PAGE HEADING */}
                <div className="mb-12 text-center">
                    <p className="mb-3 text-xs uppercase tracking-[0.3em] text-neutral-500">
                        VESTRA ORDERS
                    </p>

                    <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-neutral-300 bg-white text-3xl">
                        ✓
                    </div>

                    <h1 className="text-4xl md:text-5xl">
                        Order Details
                    </h1>

                    <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-neutral-600">
                        Your order has been received.
                        Follow the delivery progress of each purchased item below.
                    </p>
                </div>

                {/* ORDER INFORMATION */}
                <section className="border border-neutral-200 bg-white p-6 sm:p-9">
                    <div className="flex flex-wrap items-start justify-between gap-6">
                        <div>
                            <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
                                Order Number
                            </p>

                            <p className="mt-2 break-all text-sm">
                                #{order._id}
                            </p>

                            <p className="mt-3 text-sm text-neutral-500">
                                Placed on {formatDate(order.createdAt)}
                            </p>
                        </div>

                        <div className="text-left sm:text-right">
                            <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
                                Order Status
                            </p>

                            <span className="mt-2 inline-block border border-neutral-300 px-4 py-2 text-xs uppercase tracking-wider">
                                {formatStatus(getOverallOrderStatus(order))}
                            </span>
                        </div>
                    </div>
                </section>

                {/* PRODUCT TRACKING */}
                <section className="mt-10">
                    <div className="mb-7">
                        <h2 className="text-2xl">
                            Track Your Order
                        </h2>

                        <p className="mt-3 text-sm text-neutral-500">
                            Each product is tracked independently.
                            Items from different sellers may arrive at different times.
                        </p>
                    </div>

                    <div className="space-y-6">
                        {(order.items || []).map((item, index) => (
                            <article
                                key={`${item.productId}-${item.sku}-${index}`}
                                className="border border-neutral-200 bg-white p-5 sm:p-8"
                            >
                                {/* PRODUCT DETAILS */}
                                <div className="flex flex-col gap-5 sm:flex-row">
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

                                    <div className="flex-1">
                                        <h3 className="text-xl">
                                            {item.productName}
                                        </h3>

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

                                {/* TRACKING PROGRESS */}
                                <div className="mt-7 border-t border-neutral-100 pt-6">
                                    <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
                                        Delivery Progress
                                    </p>

                                    <OrderTracking
                                        status={
                                            order.orderStatus === "cancelled"
                                                ? "cancelled"
                                                : item.fulfillmentStatus || "pending"
                                        }
                                    />
                                </div>
                            </article>
                        ))}
                    </div>
                </section>

                {/* SHIPPING AND PAYMENT */}
                <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">

                    {/* SHIPPING ADDRESS */}
                    <section className="border border-neutral-200 bg-white p-6 sm:p-8">
                        <h2 className="text-2xl">
                            Shipping Address
                        </h2>

                        <div className="mt-6 space-y-2 text-sm leading-relaxed text-neutral-600">
                            <p className="text-base text-[#191919]">
                                {address.fullName}
                            </p>

                            <p>{address.phone}</p>

                            <p>{address.addressLine1}</p>

                            {address.addressLine2 && (
                                <p>{address.addressLine2}</p>
                            )}

                            <p>
                                {[address.city, address.district]
                                    .filter(Boolean)
                                    .join(", ")}
                            </p>

                            {address.postalCode && (
                                <p>{address.postalCode}</p>
                            )}

                            <p>{address.country || "Sri Lanka"}</p>
                        </div>
                    </section>

                    {/* PAYMENT DETAILS */}
                    <section className="border border-neutral-200 bg-white p-6 sm:p-8">
                        <h2 className="text-2xl">
                            Payment Information
                        </h2>

                        <div className="mt-6 space-y-4 text-sm">
                            <div className="flex justify-between gap-4">
                                <span className="text-neutral-500">
                                    Payment Method
                                </span>

                                <span>
                                    {order.paymentMethod === "cod"
                                        ? "Cash on Delivery"
                                        : order.paymentMethod}
                                </span>
                            </div>

                            <div className="flex justify-between gap-4">
                                <span className="text-neutral-500">
                                    Payment Status
                                </span>

                                <span className="capitalize">
                                    {order.paymentStatus}
                                </span>
                            </div>

                            <div className="border-t border-neutral-200 pt-4">
                                <div className="flex justify-between gap-4">
                                    <span className="text-neutral-500">
                                        Subtotal
                                    </span>

                                    <span>
                                        {formatPrice(order.subtotal)}
                                    </span>
                                </div>

                                <div className="mt-4 flex justify-between gap-4">
                                    <span className="text-neutral-500">
                                        Shipping Fee
                                    </span>

                                    <span>
                                        {formatPrice(order.shippingFee)}
                                    </span>
                                </div>
                            </div>

                            <div className="flex justify-between gap-4 border-t border-neutral-200 pt-4 text-lg">
                                <span>Order Total</span>

                                <span>
                                    {formatPrice(order.totalAmount)}
                                </span>
                            </div>
                        </div>
                    </section>
                </div>

                {/* ORDER NOTES */}
                {order.notes && (
                    <section className="mt-6 border border-neutral-200 bg-white p-6 sm:p-8">
                        <h2 className="text-xl">
                            Delivery Instructions
                        </h2>

                        <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-neutral-600">
                            {order.notes}
                        </p>
                    </section>
                )}

                {/* ACTION BUTTONS */}
                <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
                    <Link
                        to="/my-orders"
                        className="border border-[#242120] px-8 py-4 text-sm transition hover:bg-[#242120] hover:text-white"
                    >
                        View All Orders
                    </Link>

                    <Link
                        to="/shop"
                        className="bg-[#242120] px-8 py-4 text-sm text-white transition hover:bg-black"
                    >
                        Continue Shopping
                    </Link>
                </div>
            </div>
        </main>
    );
}
