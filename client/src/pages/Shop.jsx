
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

const categories = [
    "All",
    "Men",
    "Women",
    "Unisex",
    "Accessories",
    "Footwear",
];

export default function Shop() {
    const [products, setProducts] = useState([]);
    const [category, setCategory] = useState("All");
    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [totalProducts, setTotalProducts] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Fetch active products from the backend.
    useEffect(() => {
        let cancelled = false;

        async function loadProducts() {
            setLoading(true);
            setError("");

            try {
                const response = await api.get("/products", {
                    params: {
                        category,
                        search,
                        page,
                    },
                });

                if (!cancelled) {
                    setProducts(response.data.products || []);

                    setTotalPages(
                        response.data.pagination?.totalPages || 0
                    );

                    setTotalProducts(
                        response.data.pagination?.total || 0
                    );
                }
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err.response?.data?.message ||
                        "Unable to load products. Please try again."
                    );
                    setProducts([]);
                    setTotalPages(0);
                    setTotalProducts(0);
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
    }, [category, search, page]);

    // Search products by name.
    function handleSearch(event) {
        event.preventDefault();

        setPage(1);
        setSearch(searchInput.trim());
    }

    // Filter products by category.
    function changeCategory(value) {
        setCategory(value);
        setPage(1);
    }

    // Format prices in Sri Lankan Rupees.
    function formatPrice(price) {
        return Number(price).toLocaleString("en-LK");
    }

    return (
        <main className="min-h-screen w-full bg-[#faf9f6] text-[#202020]">
            <div className="mx-auto w-full max-w-[1280px] px-5 py-8 sm:px-8 sm:py-12 lg:px-12">

                {/* BACK TO HOME */}
                <Link
                    to="/"
                    className="inline-block text-sm text-gray-500 transition hover:text-black"
                >
                    ← Back to Home
                </Link>

                {/* CENTERED PAGE HEADER */}
                <header className="mb-12 mt-10 text-center sm:mb-14 sm:mt-14">
                    <p className="mb-5 text-xs uppercase tracking-[0.3em]">
                        THE VESTRA COLLECTION
                    </p>

                    <h1 className="mb-5 text-4xl font-normal md:text-5xl">
                        Discover Your Style
                    </h1>

                    <p className="text-base text-neutral-600">
                        Explore curated fashion from independent stores.
                    </p>
                </header>

                {/* CENTERED SEARCH BAR */}
                <form
                    onSubmit={handleSearch}
                    className="mx-auto mb-8 flex w-full max-w-xl flex-col gap-3 sm:flex-row"
                >
                    <input
                        type="search"
                        value={searchInput}
                        onChange={(event) =>
                            setSearchInput(event.target.value)
                        }
                        placeholder="Search products..."
                        aria-label="Search products"
                        className="min-w-0 w-full flex-1 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-black"
                    />

                    <button
                        type="submit"
                        className="w-full rounded-lg bg-black px-7 py-3 text-sm font-medium text-white transition hover:bg-gray-800 sm:w-auto"
                    >
                        Search
                    </button>
                </form>

                {/* CENTERED CATEGORY FILTERS */}
                <div className="mb-8 w-full overflow-x-auto pb-2 sm:mb-10">
                    <div className="mx-auto flex w-max gap-3">
                        {categories.map((item) => (
                            <button
                                key={item}
                                type="button"
                                onClick={() => changeCategory(item)}
                                aria-pressed={category === item}
                                className={`shrink-0 rounded-full border px-5 py-2.5 text-sm transition ${category === item
                                    ? "border-black bg-black text-white"
                                    : "border-gray-300 bg-white text-gray-700 hover:border-black"
                                    }`}
                            >
                                {item}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ERROR MESSAGE */}
                {error && (
                    <p
                        role="alert"
                        className="mb-6 rounded-md bg-red-50 p-4 text-sm text-red-700"
                    >
                        {error}
                    </p>
                )}

                {/* PRODUCT LIST */}
                {loading ? (
                    <div className="py-16 text-center text-gray-500">
                        Loading products...
                    </div>
                ) : error ? null : products.length === 0 ? (
                    <div className="rounded-xl border border-gray-200 bg-white px-5 py-20 text-center">
                        <h2 className="text-xl font-medium">
                            No products found
                        </h2>

                        <p className="mt-3 text-sm text-gray-500">
                            Try another category or search term.
                        </p>
                    </div>
                ) : (
                    <section className="w-full">
                        {/* PRODUCT COUNT - LEFT ALIGNED */}
                        <p className="mb-6 text-sm text-gray-500">
                            Showing {products.length} of {totalProducts} products
                        </p>

                        {/* RESPONSIVE PRODUCT GRID */}
                        <div className="grid w-full grid-cols-1 gap-x-5 gap-y-10 min-[480px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-6">
                            {products.map((product) => (
                                <Link
                                    key={product._id}
                                    to={`/shop/products/${product._id}`}
                                    className="vestra-product-card group block min-w-0 text-inherit no-underline"
                                >
                                    {/* PRODUCT IMAGE */}
                                    <div className="relative aspect-[4/5] w-full overflow-hidden rounded-lg bg-[#eeece7]">
                                        {product.images?.[0] ? (
                                            <img
                                                src={product.images[0]}
                                                alt={product.name}
                                                loading="lazy"
                                                className="vestra-product-image absolute inset-0 h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                                            />
                                        ) : (
                                            <div className="flex h-full items-center justify-center text-sm text-gray-400">
                                                No Image
                                            </div>
                                        )}
                                    </div>

                                    {/* PRODUCT INFORMATION */}
                                    <div className="pt-4">
                                        <p className="text-[11px] uppercase tracking-[0.15em] text-gray-500">
                                            {product.category}
                                        </p>

                                        <h2 className="vestra-product-title mt-2 line-clamp-2 text-base font-medium leading-6">
                                            {product.name}
                                        </h2>

                                        <p className="mt-2 text-sm font-semibold">
                                            LKR {formatPrice(product.price)}
                                        </p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                {/* CENTERED PAGINATION */}
                {!loading && !error && totalPages > 1 && (
                    <nav
                        aria-label="Product pagination"
                        className="mt-14 flex items-center justify-center gap-4"
                    >
                        <button
                            type="button"
                            disabled={page <= 1}
                            onClick={() => {
                                setPage((current) => current - 1);
                                window.scrollTo({
                                    top: 0,
                                    behavior: "smooth",
                                });
                            }}
                            className="rounded-lg border border-gray-300 px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            Previous
                        </button>

                        <span className="text-sm text-gray-600">
                            Page {page} of {totalPages}
                        </span>

                        <button
                            type="button"
                            disabled={page >= totalPages}
                            onClick={() => {
                                setPage((current) => current + 1);
                                window.scrollTo({
                                    top: 0,
                                    behavior: "smooth",
                                });
                            }}
                            className="rounded-lg border border-gray-300 px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            Next
                        </button>
                    </nav>
                )}
            </div>
        </main>
    );
}
