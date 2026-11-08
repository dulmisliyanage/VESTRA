
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";

export default function SellerProducts() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [deletingId, setDeletingId] = useState(null);

    useEffect(() => {
        let cancelled = false;

        async function loadProducts() {
            try {
                const response = await api.get(
                    "/products/my-products"
                );

                if (!cancelled) {
                    setProducts(response.data.products || []);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err.response?.data?.message ||
                        "Unable to load products"
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        loadProducts();

        return () => {
            cancelled = true;
        };
    }, []);

    async function handleDelete(productId) {
        const confirmed = window.confirm(
            "Are you sure you want to delete this product? This action cannot be undone."
        );

        if (!confirmed) return;

        try {
            setDeletingId(productId);
            setError("");

            await api.delete(`/products/${productId}`);

            setProducts((previous) =>
                previous.filter(
                    (product) => product._id !== productId
                )
            );
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to delete product"
            );
        } finally {
            setDeletingId(null);
        }
    }

    function getTotalStock(variants = []) {
        return variants.reduce(
            (total, variant) =>
                total + Number(variant.stock || 0),
            0
        );
    }

    function formatPrice(price) {
        return `LKR ${Number(price).toLocaleString("en-LK")}`;
    }

    if (loading) {
        return (
            <p className="py-8 text-sm text-gray-500">
                Loading products...
            </p>
        );
    }

    return (
        <div className="w-full">
            {error && (
                <p
                    role="alert"
                    className="mb-5 rounded-md bg-red-50 p-4 text-sm text-red-700"
                >
                    {error}
                </p>
            )}

            {products.length === 0 ? (
                <div className="rounded-xl border border-gray-200 bg-white px-6 py-12 text-center">
                    <p className="mb-2 text-lg font-medium">
                        No products yet
                    </p>

                    <p className="mb-6 text-sm text-gray-500">
                        Start adding products to your VESTRA store.
                    </p>

                    <Link
                        to="/seller/products/new"
                        className="inline-block rounded-md bg-black px-5 py-3 text-sm text-white"
                    >
                        Add Your First Product
                    </Link>
                </div>
            ) : (
                <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
                    <table className="w-full min-w-[760px] text-left text-sm">
                        <thead className="border-b border-gray-200 bg-gray-50">
                            <tr>
                                <th className="px-5 py-4 font-semibold">
                                    Product
                                </th>
                                <th className="px-5 py-4 font-semibold">
                                    Category
                                </th>
                                <th className="px-5 py-4 font-semibold">
                                    Price
                                </th>
                                <th className="px-5 py-4 font-semibold">
                                    Stock
                                </th>
                                <th className="px-5 py-4 font-semibold">
                                    Status
                                </th>
                                <th className="px-5 py-4 font-semibold">
                                    Actions
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {products.map((product) => {
                                const imageUrl =
                                    product.images?.[0] || null;

                                return (
                                    <tr
                                        key={product._id}
                                        className="border-b border-gray-100 last:border-b-0"
                                    >
                                        {/* Product image and name */}
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-4">
                                                {imageUrl ? (
                                                    <img
                                                        src={imageUrl}
                                                        alt={product.name}
                                                        loading="lazy"
                                                        className="h-16 w-16 shrink-0 rounded-md border border-gray-200 object-cover"
                                                    />
                                                ) : (
                                                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md bg-gray-100 text-center text-[10px] text-gray-400">
                                                        No Image
                                                    </div>
                                                )}

                                                <div>
                                                    <p className="font-medium text-gray-900">
                                                        {product.name}
                                                    </p>

                                                    <p className="mt-1 text-xs text-gray-400">
                                                        {product.variants?.length || 0}
                                                        {" "}variant(s)
                                                    </p>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-5 py-4 text-gray-600">
                                            {product.category}
                                        </td>

                                        <td className="px-5 py-4 font-medium">
                                            {formatPrice(product.price)}
                                        </td>

                                        <td className="px-5 py-4">
                                            {getTotalStock(product.variants)}
                                        </td>

                                        <td className="px-5 py-4">
                                            <span
                                                className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${product.status === "active"
                                                        ? "bg-green-50 text-green-700"
                                                        : product.status === "draft"
                                                            ? "bg-amber-50 text-amber-700"
                                                            : "bg-gray-100 text-gray-600"
                                                    }`}
                                            >
                                                {product.status}
                                            </span>
                                        </td>

                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <Link
                                                    to={`/seller/products/${product._id}/edit`}
                                                    className="text-sm font-medium text-gray-700 hover:underline"
                                                >
                                                    Edit
                                                </Link>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleDelete(product._id)
                                                    }
                                                    disabled={deletingId === product._id}
                                                    className="text-sm font-medium text-red-600 hover:underline disabled:opacity-50"
                                                >
                                                    {deletingId === product._id
                                                        ? "Deleting..."
                                                        : "Delete"}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
