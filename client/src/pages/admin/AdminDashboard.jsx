
import { useCallback, useEffect, useState } from "react";
import api from "../../services/api";

// ========================================
// HELPERS
// ========================================

function formatPrice(value) {
    return `LKR ${Number(value || 0).toLocaleString("en-LK")}`;
}

function formatDate(value) {
    if (!value) return "—";

    return new Date(value).toLocaleString("en-LK", {
        dateStyle: "medium",
        timeStyle: "short",
    });
}

function formatStatus(value) {
    if (!value) return "Unknown";

    return value.charAt(0).toUpperCase() + value.slice(1);
}

function getStatusStyle(status) {
    switch (status) {
        case "delivered":
        case "paid":
        case "approved":
            return "bg-green-50 text-green-800 border-green-200";

        case "shipped":
        case "processing":
        case "confirmed":
            return "bg-blue-50 text-blue-800 border-blue-200";

        case "cancelled":
        case "failed":
        case "rejected":
            return "bg-red-50 text-red-800 border-red-200";

        default:
            return "bg-amber-50 text-amber-800 border-amber-200";
    }
}

function StatusBadge({ status }) {
    return (
        <span
            className={`inline-block rounded-full border px-3 py-1 text-xs ${getStatusStyle(
                status
            )}`}
        >
            {formatStatus(status)}
        </span>
    );
}

function canConfirmPayment(order) {
    return (
        order.paymentMethod === "cod" &&
        order.paymentStatus === "pending" &&
        order.orderStatus === "delivered" &&
        Array.isArray(order.items) &&
        order.items.length > 0 &&
        order.items.every(
            (item) => item.fulfillmentStatus === "delivered"
        )
    );
}

// ========================================
// ADMIN DASHBOARD
// ========================================

export default function AdminDashboard() {
    // Existing seller management
    const [summary, setSummary] = useState(null);
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);

    // New order management
    const [orders, setOrders] = useState([]);
    const [ordersLoading, setOrdersLoading] = useState(true);
    const [ordersError, setOrdersError] = useState("");
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [confirmingId, setConfirmingId] = useState(null);

    // Search and filters
    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");
    const [orderStatus, setOrderStatus] = useState("all");
    const [paymentFilter, setPaymentFilter] = useState("all");
    const [page, setPage] = useState(1);

    const [pagination, setPagination] = useState({
        page: 1,
        total: 0,
        totalPages: 0,
    });

    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    // ========================================
    // LOAD EXISTING ADMIN DASHBOARD
    // ========================================

    const loadDashboard = useCallback(async () => {
        try {
            setError("");

            const [summaryRes, applicationsRes] =
                await Promise.all([
                    api.get("/admin/summary"),
                    api.get("/admin/seller-applications"),
                ]);

            setSummary(summaryRes.data);

            const data = applicationsRes.data;

            setApplications(
                Array.isArray(data)
                    ? data
                    : data.applications || data.stores || []
            );
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to load admin dashboard."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    // ========================================
    // LOAD MARKETPLACE ORDERS
    // ========================================

    const loadOrders = useCallback(async (signal) => {
        try {
            setOrdersLoading(true);
            setOrdersError("");

            const response = await api.get("/admin/orders", {
                params: {
                    page,
                    limit: 10,
                    status: orderStatus,
                    paymentStatus: paymentFilter,
                    search,
                },
                signal,
            });

            setOrders(response.data.orders || []);

            setPagination(
                response.data.pagination || {
                    page: 1,
                    total: 0,
                    totalPages: 0,
                }
            );
        } catch (err) {
            if (
                err.code === "ERR_CANCELED" ||
                err.name === "CanceledError"
            ) {
                return;
            }

            setOrdersError(
                err.response?.data?.message ||
                "Unable to load marketplace orders."
            );
        } finally {
            if (!signal?.aborted) {
                setOrdersLoading(false);
            }
        }
    }, [page, orderStatus, paymentFilter, search]);

    useEffect(() => {
        loadDashboard();
    }, [loadDashboard]);

    useEffect(() => {
        const controller = new AbortController();

        loadOrders(controller.signal);

        return () => controller.abort();
    }, [loadOrders]);

    // ========================================
    // SELLER APPROVAL / REJECTION
    // ========================================

    async function handleDecision(id, decision) {
        const confirmed = window.confirm(
            `Are you sure you want to ${decision} this seller application?`
        );

        if (!confirmed) return;

        setProcessingId(id);
        setError("");
        setMessage("");

        try {
            const status =
                decision === "approve" ? "approved" : "rejected";

            await api.patch(
                `/admin/seller-applications/${id}`,
                { status }
            );

            setMessage(
                status === "approved"
                    ? "Seller approved successfully!"
                    : "Seller application rejected successfully."
            );

            await loadDashboard();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to update seller application."
            );
        } finally {
            setProcessingId(null);
        }
    }

    // ========================================
    // SEARCH ORDERS
    // ========================================

    function handleSearch(event) {
        event.preventDefault();
        setPage(1);
        setSearch(searchInput.trim());
    }

    function clearFilters() {
        setSearchInput("");
        setSearch("");
        setOrderStatus("all");
        setPaymentFilter("all");
        setPage(1);
    }

    // ========================================
    // VIEW ORDER DETAILS
    // ========================================

    async function viewOrder(id) {
        setDetailsLoading(true);
        setOrdersError("");
        setSelectedOrder(null);

        try {
            const response = await api.get(`/admin/orders/${id}`);

            setSelectedOrder(response.data.order);
        } catch (err) {
            setOrdersError(
                err.response?.data?.message ||
                "Unable to load order details."
            );
        } finally {
            setDetailsLoading(false);
        }
    }

    // ========================================
    // CONFIRM COD PAYMENT
    // ========================================

    async function handleConfirmPayment(order) {
        if (!canConfirmPayment(order)) {
            setOrdersError(
                "Only fully delivered COD orders with pending payments can be confirmed."
            );
            return;
        }

        const confirmed = window.confirm(
            "Have you verified that the cash payment was actually collected for this order?"
        );

        if (!confirmed) return;

        setConfirmingId(order._id);
        setOrdersError("");
        setMessage("");

        try {
            const response = await api.patch(
                `/admin/orders/${order._id}/confirm-payment`
            );

            setMessage(
                response.data.message ||
                "COD payment confirmed successfully."
            );

            // Update the selected order immediately.
            setSelectedOrder((current) =>
                current?._id === order._id
                    ? {
                        ...current,
                        paymentStatus: "paid",
                    }
                    : current
            );

            // Refresh order listing.
            await loadOrders();
        } catch (err) {
            setOrdersError(
                err.response?.data?.message ||
                "Unable to confirm COD payment."
            );
        } finally {
            setConfirmingId(null);
        }
    }

    // ========================================
    // STATISTICS FOR CURRENT PAGE
    // ========================================

    const pendingPaymentsOnPage = orders.filter(
        (order) =>
            order.paymentMethod === "cod" &&
            order.paymentStatus === "pending"
    ).length;

    const paidValueOnPage = orders
        .filter((order) => order.paymentStatus === "paid")
        .reduce(
            (total, order) => total + Number(order.totalAmount || 0),
            0
        );

    // ========================================
    // RENDER
    // ========================================

    return (
        <main className="min-h-screen bg-[#faf9f6] px-6 py-12 text-[#191919]">
            <div className="mx-auto max-w-6xl">

                {/* PAGE HEADER */}
                <p className="mb-3 text-xs uppercase tracking-[0.3em] text-stone-500">
                    VESTRA Administration
                </p>

                <h1 className="mb-4 font-serif text-4xl">
                    Admin Dashboard
                </h1>

                <p className="mb-10 text-sm text-stone-600">
                    Manage sellers, marketplace orders, and payments.
                </p>

                {/* NOTIFICATIONS */}
                {error && (
                    <p
                        role="alert"
                        className="mb-6 border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                    >
                        {error}
                    </p>
                )}

                {message && (
                    <p
                        role="status"
                        className="mb-6 border border-green-200 bg-green-50 p-4 text-sm text-green-700"
                    >
                        {message}
                    </p>
                )}

                {/* ====================================
            EXISTING ADMIN SUMMARY
           ==================================== */}

                {loading ? (
                    <p className="mb-10 text-stone-500">
                        Loading dashboard...
                    </p>
                ) : (
                    <section className="mb-14">
                        <h2 className="mb-6 font-serif text-2xl">
                            Marketplace Overview
                        </h2>

                        <div className="grid gap-6 md:grid-cols-3">
                            {[
                                ["Customers", summary?.customers],
                                ["Sellers", summary?.sellers],
                                ["Pending Applications", summary?.pendingStores],
                            ].map(([label, value]) => (
                                <div
                                    key={label}
                                    className="border border-stone-200 bg-white p-7"
                                >
                                    <p className="text-sm text-stone-500">
                                        {label}
                                    </p>

                                    <p className="mt-4 font-serif text-4xl">
                                        {value ?? "—"}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* ====================================
            NEW: ORDER MANAGEMENT
           ==================================== */}

                <section className="mb-16">
                    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <p className="mb-2 text-xs uppercase tracking-[0.25em] text-stone-500">
                                Marketplace Operations
                            </p>

                            <h2 className="font-serif text-3xl">
                                Order Management
                            </h2>
                        </div>

                        <button
                            type="button"
                            onClick={() => loadOrders()}
                            disabled={ordersLoading}
                            className="border border-stone-300 px-5 py-2 text-sm transition hover:border-black disabled:opacity-50"
                        >
                            Refresh Orders
                        </button>
                    </div>

                    {/* ORDER STATISTICS */}
                    <div className="mb-8 grid gap-4 md:grid-cols-3">
                        <div className="border border-stone-200 bg-white p-6">
                            <p className="text-sm text-stone-500">
                                Matching Orders
                            </p>

                            <p className="mt-3 font-serif text-3xl">
                                {pagination.total}
                            </p>
                        </div>

                        <div className="border border-stone-200 bg-white p-6">
                            <p className="text-sm text-stone-500">
                                Pending COD — Current Page
                            </p>

                            <p className="mt-3 font-serif text-3xl">
                                {pendingPaymentsOnPage}
                            </p>
                        </div>

                        <div className="border border-stone-200 bg-white p-6">
                            <p className="text-sm text-stone-500">
                                Paid Order Value — Current Page
                            </p>

                            <p className="mt-3 font-serif text-2xl">
                                {formatPrice(paidValueOnPage)}
                            </p>
                        </div>
                    </div>

                    {/* SEARCH */}
                    <form
                        onSubmit={handleSearch}
                        className="mb-5 flex flex-col gap-3 sm:flex-row"
                    >
                        <input
                            type="search"
                            value={searchInput}
                            onChange={(event) =>
                                setSearchInput(event.target.value)
                            }
                            placeholder="Search by order ID, customer name or email"
                            className="min-w-0 flex-1 border border-stone-300 bg-white px-4 py-3 text-sm outline-none focus:border-black"
                        />

                        <button
                            type="submit"
                            className="bg-black px-7 py-3 text-sm text-white transition hover:bg-stone-800"
                        >
                            Search
                        </button>
                    </form>

                    {/* FILTERS */}
                    <div className="mb-7 flex flex-wrap gap-3">
                        <select
                            value={orderStatus}
                            onChange={(event) => {
                                setOrderStatus(event.target.value);
                                setPage(1);
                            }}
                            className="border border-stone-300 bg-white px-4 py-3 text-sm outline-none focus:border-black"
                        >
                            <option value="all">All Order Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                        </select>

                        <select
                            value={paymentFilter}
                            onChange={(event) => {
                                setPaymentFilter(event.target.value);
                                setPage(1);
                            }}
                            className="border border-stone-300 bg-white px-4 py-3 text-sm outline-none focus:border-black"
                        >
                            <option value="all">All Payment Statuses</option>
                            <option value="pending">Pending Payment</option>
                            <option value="paid">Paid</option>
                            <option value="failed">Failed</option>
                        </select>

                        <button
                            type="button"
                            onClick={clearFilters}
                            className="border border-stone-300 px-5 py-3 text-sm transition hover:border-black"
                        >
                            Clear Filters
                        </button>
                    </div>

                    {/* ORDER ERRORS */}
                    {ordersError && (
                        <p
                            role="alert"
                            className="mb-6 border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                        >
                            {ordersError}
                        </p>
                    )}

                    {/* ORDERS LIST */}
                    {ordersLoading ? (
                        <div className="border border-stone-200 bg-white p-10 text-center text-stone-500">
                            Loading orders...
                        </div>
                    ) : orders.length === 0 ? (
                        <div className="border border-stone-200 bg-white p-10 text-center text-stone-500">
                            No orders found.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {orders.map((order) => (
                                <article
                                    key={order._id}
                                    className="border border-stone-200 bg-white p-6"
                                >
                                    <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">

                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs uppercase tracking-[0.2em] text-stone-500">
                                                Order
                                            </p>

                                            <h3 className="mt-2 break-all font-serif text-lg">
                                                #{order._id}
                                            </h3>

                                            <p className="mt-3 text-sm text-stone-600">
                                                Customer:{" "}
                                                <span className="text-black">
                                                    {order.customerId?.name || "Unknown"}
                                                </span>
                                            </p>

                                            <p className="mt-1 break-all text-sm text-stone-500">
                                                {order.customerId?.email || ""}
                                            </p>

                                            <p className="mt-2 text-xs text-stone-500">
                                                {formatDate(order.createdAt)}
                                            </p>
                                        </div>

                                        <div className="flex flex-col gap-3 md:items-end">
                                            <p className="font-serif text-2xl">
                                                {formatPrice(order.totalAmount)}
                                            </p>

                                            <div className="flex flex-wrap gap-2">
                                                <StatusBadge status={order.orderStatus} />
                                                <StatusBadge status={order.paymentStatus} />
                                            </div>

                                            <p className="text-xs uppercase tracking-wider text-stone-500">
                                                {order.paymentMethod === "cod"
                                                    ? "Cash on Delivery"
                                                    : order.paymentMethod}
                                            </p>

                                            <button
                                                type="button"
                                                onClick={() => viewOrder(order._id)}
                                                disabled={detailsLoading}
                                                className="border border-black px-6 py-2 text-sm transition hover:bg-black hover:text-white disabled:opacity-50"
                                            >
                                                View Details
                                            </button>
                                        </div>

                                    </div>
                                </article>
                            ))}
                        </div>
                    )}

                    {/* PAGINATION */}
                    {!ordersLoading && pagination.totalPages > 1 && (
                        <div className="mt-8 flex items-center justify-center gap-5">
                            <button
                                type="button"
                                disabled={page <= 1}
                                onClick={() =>
                                    setPage((current) => current - 1)
                                }
                                className="border border-stone-300 px-5 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Previous
                            </button>

                            <span className="text-sm text-stone-600">
                                Page {page} of {pagination.totalPages}
                            </span>

                            <button
                                type="button"
                                disabled={page >= pagination.totalPages}
                                onClick={() =>
                                    setPage((current) => current + 1)
                                }
                                className="border border-stone-300 px-5 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </section>

                {/* ====================================
            EXISTING SELLER APPLICATIONS
           ==================================== */}

                <section>
                    <div className="mb-6 flex items-center justify-between gap-4">
                        <h2 className="font-serif text-2xl">
                            Pending Seller Applications
                        </h2>

                        <button
                            type="button"
                            onClick={loadDashboard}
                            className="border border-stone-300 px-5 py-2 text-sm transition hover:border-black"
                        >
                            Refresh
                        </button>
                    </div>

                    {loading ? (
                        <p className="text-stone-500">
                            Loading applications...
                        </p>
                    ) : applications.length === 0 ? (
                        <div className="border border-stone-200 bg-white p-8 text-stone-600">
                            No pending seller applications.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {applications.map((store) => (
                                <div
                                    key={store._id}
                                    className="flex flex-col justify-between gap-6 border border-stone-200 bg-white p-7 md:flex-row md:items-center"
                                >
                                    <div>
                                        <h3 className="font-serif text-2xl">
                                            {store.storeName}
                                        </h3>

                                        <p className="mt-2 text-sm text-stone-600">
                                            {store.ownerId?.name || "Unknown owner"}
                                            {" · "}
                                            {store.ownerId?.email || ""}
                                        </p>

                                        <p className="mt-4 max-w-xl text-sm text-stone-700">
                                            {store.description ||
                                                "No description provided."}
                                        </p>
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            type="button"
                                            disabled={processingId !== null}
                                            onClick={() =>
                                                handleDecision(store._id, "approve")
                                            }
                                            className="bg-black px-6 py-3 text-sm text-white transition hover:bg-stone-800 disabled:opacity-50"
                                        >
                                            Approve
                                        </button>

                                        <button
                                            type="button"
                                            disabled={processingId !== null}
                                            onClick={() =>
                                                handleDecision(store._id, "reject")
                                            }
                                            className="border border-black px-6 py-3 text-sm transition hover:bg-stone-100 disabled:opacity-50"
                                        >
                                            Reject
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

            </div>

            {/* ====================================
          ORDER DETAILS MODAL
         ==================================== */}

            {selectedOrder && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
                    onClick={() => setSelectedOrder(null)}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="admin-order-title"
                        className="max-h-[90vh] w-full max-w-3xl overflow-y-auto bg-[#faf9f6] p-6 shadow-xl sm:p-9"
                        onClick={(event) => event.stopPropagation()}
                    >
                        {/* MODAL HEADER */}
                        <div className="mb-7 flex items-start justify-between gap-4">
                            <div className="min-w-0">
                                <p className="mb-2 text-xs uppercase tracking-[0.25em] text-stone-500">
                                    VESTRA Order Details
                                </p>

                                <h2
                                    id="admin-order-title"
                                    className="break-all font-serif text-2xl"
                                >
                                    #{selectedOrder._id}
                                </h2>
                            </div>

                            <button
                                type="button"
                                onClick={() => setSelectedOrder(null)}
                                aria-label="Close order details"
                                className="shrink-0 text-2xl text-stone-500 hover:text-black"
                            >
                                ×
                            </button>
                        </div>

                        {/* STATUS */}
                        <div className="mb-8 flex flex-wrap gap-3">
                            <StatusBadge status={selectedOrder.orderStatus} />
                            <StatusBadge status={selectedOrder.paymentStatus} />
                        </div>

                        {/* CUSTOMER */}
                        <div className="mb-7 border-b border-stone-200 pb-6">
                            <h3 className="mb-3 font-serif text-xl">
                                Customer Information
                            </h3>

                            <p className="text-sm">
                                {selectedOrder.customerId?.name || "Unknown"}
                            </p>

                            <p className="mt-1 text-sm text-stone-600">
                                {selectedOrder.customerId?.email || "—"}
                            </p>

                            <p className="mt-2 text-xs text-stone-500">
                                Ordered: {formatDate(selectedOrder.createdAt)}
                            </p>
                        </div>

                        {/* DELIVERY ADDRESS */}
                        <div className="mb-7 border-b border-stone-200 pb-6">
                            <h3 className="mb-3 font-serif text-xl">
                                Delivery Address
                            </h3>

                            <div className="space-y-1 text-sm text-stone-700">
                                <p>
                                    {selectedOrder.shippingAddress?.fullName || "—"}
                                </p>

                                <p>
                                    {selectedOrder.shippingAddress?.phone || "—"}
                                </p>

                                <p>
                                    {selectedOrder.shippingAddress?.addressLine1}
                                </p>

                                {selectedOrder.shippingAddress?.addressLine2 && (
                                    <p>
                                        {selectedOrder.shippingAddress.addressLine2}
                                    </p>
                                )}

                                <p>
                                    {[
                                        selectedOrder.shippingAddress?.city,
                                        selectedOrder.shippingAddress?.district,
                                        selectedOrder.shippingAddress?.postalCode,
                                    ]
                                        .filter(Boolean)
                                        .join(", ")}
                                </p>

                                <p>
                                    {selectedOrder.shippingAddress?.country ||
                                        "Sri Lanka"}
                                </p>
                            </div>
                        </div>

                        {/* ORDER ITEMS */}
                        <div className="mb-7 border-b border-stone-200 pb-6">
                            <h3 className="mb-5 font-serif text-xl">
                                Ordered Products
                            </h3>

                            <div className="space-y-5">
                                {(selectedOrder.items || []).map((item, index) => (
                                    <div
                                        key={`${item.productId || index}-${index}`}
                                        className="flex gap-4"
                                    >
                                        {item.image ? (
                                            <img
                                                src={item.image}
                                                alt={item.productName}
                                                className="h-24 w-20 shrink-0 object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-24 w-20 shrink-0 items-center justify-center bg-stone-200 text-xs text-stone-500">
                                                No Image
                                            </div>
                                        )}

                                        <div className="min-w-0 flex-1">
                                            <p className="font-serif text-lg">
                                                {item.productName}
                                            </p>

                                            <p className="mt-1 text-xs text-stone-500">
                                                Seller:{" "}
                                                {item.storeId?.storeName ||
                                                    "Unknown Store"}
                                            </p>

                                            <p className="mt-1 text-xs text-stone-500">
                                                {item.size ? `Size: ${item.size}` : ""}
                                                {item.color
                                                    ? ` · Color: ${item.color}`
                                                    : ""}
                                            </p>

                                            <p className="mt-1 text-sm text-stone-600">
                                                Qty: {item.quantity}
                                            </p>

                                            <div className="mt-2">
                                                <StatusBadge
                                                    status={
                                                        item.fulfillmentStatus || "pending"
                                                    }
                                                />
                                            </div>

                                            <p className="mt-2 text-sm font-medium">
                                                {formatPrice(item.subtotal)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* TOTALS */}
                        <div className="mb-7 space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-stone-600">
                                    Subtotal
                                </span>

                                <span>
                                    {formatPrice(selectedOrder.subtotal)}
                                </span>
                            </div>

                            <div className="flex justify-between">
                                <span className="text-stone-600">
                                    Shipping
                                </span>

                                <span>
                                    {formatPrice(selectedOrder.shippingFee)}
                                </span>
                            </div>

                            <div className="flex justify-between border-t border-stone-300 pt-4 font-serif text-xl">
                                <span>Total</span>

                                <span>
                                    {formatPrice(selectedOrder.totalAmount)}
                                </span>
                            </div>
                        </div>

                        {/* PAYMENT INFORMATION */}
                        <div className="mb-7 border-t border-stone-200 pt-6">
                            <h3 className="mb-3 font-serif text-xl">
                                Payment Information
                            </h3>

                            <p className="text-sm text-stone-600">
                                Method:{" "}
                                {selectedOrder.paymentMethod === "cod"
                                    ? "Cash on Delivery"
                                    : selectedOrder.paymentMethod}
                            </p>

                            <div className="mt-3 flex items-center gap-3">
                                <span className="text-sm text-stone-600">
                                    Status:
                                </span>

                                <StatusBadge
                                    status={selectedOrder.paymentStatus}
                                />
                            </div>

                            {canConfirmPayment(selectedOrder) && (
                                <div className="mt-6">
                                    <p className="mb-3 text-xs text-stone-600">
                                        Confirm only after verifying that the
                                        cash payment has been collected.
                                    </p>

                                    <button
                                        type="button"
                                        disabled={confirmingId !== null}
                                        onClick={() =>
                                            handleConfirmPayment(selectedOrder)
                                        }
                                        className="bg-black px-7 py-3 text-sm text-white transition hover:bg-stone-800 disabled:opacity-50"
                                    >
                                        {confirmingId === selectedOrder._id
                                            ? "Confirming..."
                                            : "Confirm COD Payment"}
                                    </button>
                                </div>
                            )}

                            {selectedOrder.paymentMethod === "cod" &&
                                selectedOrder.paymentStatus === "pending" &&
                                !canConfirmPayment(selectedOrder) && (
                                    <p className="mt-4 text-xs text-stone-500">
                                        COD payment confirmation becomes available
                                        after every item is delivered.
                                    </p>
                                )}
                        </div>

                        <button
                            type="button"
                            onClick={() => setSelectedOrder(null)}
                            className="w-full border border-black px-6 py-3 text-sm transition hover:bg-black hover:text-white"
                        >
                            Close Details
                        </button>
                    </div>
                </div>
            )}
        </main>
    );
}
