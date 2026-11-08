
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";

const formatPrice = (amount) =>
    `LKR ${Number(amount || 0).toLocaleString("en-LK")}`;

const formatDate = (date) =>
    new Date(date).toLocaleDateString("en-LK", {
        year: "numeric",
        month: "short",
        day: "numeric"
    });

export default function SellerOrders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function fetchOrders() {
            try {
                const response = await api.get("/seller/orders");
                setOrders(response.data.orders || []);
            } catch (err) {
                setError(
                    err.response?.data?.message ||
                    "Unable to load seller orders."
                );
            } finally {
                setLoading(false);
            }
        }

        fetchOrders();
    }, []);


    const [updatingItem, setUpdatingItem] = useState(null);

    const updateFulfillmentStatus = async (
        orderId,
        originalIndex,
        newStatus
    ) => {
        const itemKey = `${orderId}-${originalIndex}`;

        try {
            setUpdatingItem(itemKey);
            setError("");

            await api.patch(
                `/seller/orders/${orderId}/items/${originalIndex}/status`,
                {
                    fulfillmentStatus: newStatus
                }
            );

            // Refresh seller orders after a successful update
            const response = await api.get("/seller/orders");
            setOrders(response.data.orders || []);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to update fulfillment status."
            );
        } finally {
            setUpdatingItem(null);
        }
    };


    return (
        <main className="min-h-screen bg-[#faf9f6] px-5 py-12 text-[#191919] md:px-12 lg:px-20">
            <div className="mx-auto max-w-6xl">
                <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <p className="mb-2 text-xs uppercase tracking-[0.3em] text-neutral-500">
                            VESTRA SELLER STUDIO
                        </p>

                        <h1 className="text-3xl md:text-4xl">
                            Customer Orders
                        </h1>

                        <p className="mt-3 text-sm text-neutral-600">
                            View purchases containing products from your store.
                        </p>
                    </div>

                    <Link
                        to="/seller"
                        className="border border-neutral-300 px-5 py-3 text-sm transition hover:border-black"
                    >
                        Back to Dashboard
                    </Link>
                </div>

                {loading && (
                    <p className="py-12 text-center text-neutral-500">
                        Loading orders...
                    </p>
                )}

                {error && (
                    <div className="border border-red-200 bg-red-50 p-5 text-sm text-red-700">
                        {error}
                    </div>
                )}

                {!loading && !error && orders.length === 0 && (
                    <div className="border border-neutral-200 bg-white px-6 py-20 text-center">
                        <h2 className="text-2xl">No orders yet</h2>
                        <p className="mt-3 text-sm text-neutral-500">
                            Orders containing your products will appear here.
                        </p>
                    </div>
                )}

                {!loading && !error && orders.length > 0 && (
                    <div className="space-y-6">
                        {orders.map((order) => (
                            <article
                                key={order._id}
                                className="border border-neutral-200 bg-white"
                            >
                                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 px-5 py-5 md:px-7">
                                    <div>
                                        <p className="text-xs uppercase tracking-widest text-neutral-500">
                                            Order
                                        </p>

                                        <p className="mt-1 break-all text-sm">
                                            #{order._id}
                                        </p>

                                        <p className="mt-2 text-xs text-neutral-500">
                                            {formatDate(order.createdAt)}
                                        </p>
                                    </div>

                                    <span className="border border-neutral-300 px-4 py-2 text-xs uppercase tracking-wider">
                                        {order.orderStatus}
                                    </span>
                                </div>

                                <div className="space-y-5 px-5 py-6 md:px-7">
                                    {order.items.map((item, index) => (
                                        <div
                                            key={`${item.productId}-${item.sku}-${index}`}
                                            className="flex gap-5"
                                        >
                                            <div className="h-28 w-22 shrink-0 overflow-hidden bg-neutral-100">
                                                {item.image ? (
                                                    <img
                                                        src={item.image}
                                                        alt={item.productName}
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="flex h-full items-center justify-center text-xs text-neutral-400">
                                                        No image
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex-1">
                                                <h3 className="text-lg">
                                                    {item.productName}
                                                </h3>

                                                <p className="mt-1 text-sm text-neutral-500">
                                                    SKU: {item.sku}
                                                </p>

                                                <p className="mt-1 text-sm text-neutral-500">
                                                    {item.size || "One size"}
                                                    {item.color ? ` / ${item.color}` : ""}
                                                </p>

                                                <p className="mt-2 text-sm">
                                                    Quantity: {item.quantity}
                                                </p>

                                                <p className="mt-1 text-sm">
                                                    {formatPrice(item.subtotal)}
                                                </p>

                                                <div className="mt-4">
                                                    <label className="mb-2 block text-xs uppercase tracking-wider text-neutral-500">
                                                        Fulfillment Status
                                                    </label>

                                                    <select
                                                        value={item.fulfillmentStatus || "pending"}
                                                        disabled={
                                                            updatingItem ===
                                                            `${order._id}-${item.originalIndex}` ||
                                                            order.orderStatus === "cancelled" ||
                                                            (item.fulfillmentStatus || "pending") === "delivered"
                                                        }
                                                        onChange={(event) =>
                                                            updateFulfillmentStatus(
                                                                order._id,
                                                                item.originalIndex,
                                                                event.target.value
                                                            )
                                                        }
                                                        className="w-full max-w-52 border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-black disabled:opacity-50"
                                                    >
                                                        <option value={item.fulfillmentStatus || "pending"}>
                                                            {(item.fulfillmentStatus || "pending").toUpperCase()}
                                                        </option>

                                                        {(item.fulfillmentStatus || "pending") === "pending" && (
                                                            <option value="processing">
                                                                PROCESSING
                                                            </option>
                                                        )}

                                                        {(item.fulfillmentStatus || "pending") === "processing" && (
                                                            <option value="shipped">
                                                                SHIPPED
                                                            </option>
                                                        )}

                                                        {(item.fulfillmentStatus || "pending") === "shipped" && (
                                                            <option value="delivered">
                                                                DELIVERED
                                                            </option>
                                                        )}
                                                    </select>
                                                </div>

                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex flex-wrap items-center justify-between gap-4 border-t border-neutral-200 px-5 py-5 md:px-7">
                                    <div>
                                        <p className="text-xs uppercase tracking-widest text-neutral-500">
                                            Your Store Subtotal
                                        </p>

                                        <p className="mt-2 text-xl">
                                            {formatPrice(order.sellerSubtotal)}
                                        </p>
                                    </div>

                                    <div className="text-right text-sm text-neutral-600">
                                        <p>
                                            Payment:{" "}
                                            {order.paymentMethod === "cod"
                                                ? "Cash on Delivery"
                                                : order.paymentMethod}
                                        </p>

                                        <p className="mt-1">
                                            Payment status: {order.paymentStatus}
                                        </p>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
