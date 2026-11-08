
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../services/api";
import { useCart } from "../context/CartContext";

export default function ProductDetails() {
    const { id } = useParams();
    const { addToCart, cartCount } = useCart();

    const [product, setProduct] = useState(null);
    const [selectedImage, setSelectedImage] = useState(0);
    const [selectedSize, setSelectedSize] = useState("");
    const [selectedColor, setSelectedColor] = useState("");
    const [quantity, setQuantity] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [cartMessage, setCartMessage] = useState("");
    const [cartSuccess, setCartSuccess] = useState(false);

    useEffect(() => {
        let cancelled = false;

        async function loadProduct() {
            setLoading(true);
            setError("");
            setCartMessage("");

            try {
                const response = await api.get(`/products/${id}`);
                const item = response.data.product || response.data;

                if (cancelled) return;

                setProduct(item);
                setSelectedImage(0);
                setQuantity(1);

                const firstVariant = item.variants?.[0];

                setSelectedSize(firstVariant?.size || "");
                setSelectedColor(firstVariant?.color || "");
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err.response?.status === 404
                            ? "Product not found or unavailable."
                            : "Unable to load product details."
                    );
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        loadProduct();

        return () => {
            cancelled = true;
        };
    }, [id]);

    const variants = product?.variants || [];
    const images = product?.images || [];

    const sizes = useMemo(
        () => [...new Set(variants.map((variant) => variant.size))],
        [variants]
    );

    const colors = useMemo(
        () => [
            ...new Set(
                variants
                    .filter((variant) => variant.size === selectedSize)
                    .map((variant) => variant.color)
            )
        ],
        [variants, selectedSize]
    );

    const selectedVariant = variants.find(
        (variant) =>
            variant.size === selectedSize &&
            variant.color === selectedColor
    );

    const availableStock = selectedVariant?.stock || 0;

    function handleSizeChange(size) {
        setSelectedSize(size);

        const matchingVariant = variants.find(
            (variant) => variant.size === size
        );

        setSelectedColor(matchingVariant?.color || "");
        setQuantity(1);
        setCartMessage("");
    }

    function handleColorChange(color) {
        setSelectedColor(color);
        setQuantity(1);
        setCartMessage("");
    }

    function increaseQuantity() {
        setQuantity((current) =>
            Math.min(current + 1, availableStock)
        );
    }

    function decreaseQuantity() {
        setQuantity((current) => Math.max(1, current - 1));
    }

    function handleAddToCart() {
        if (!selectedVariant || availableStock < 1) {
            setCartSuccess(false);
            setCartMessage("This product variant is unavailable.");
            return;
        }

        const result = addToCart(
            product,
            selectedVariant,
            quantity
        );

        setCartSuccess(result.success);
        setCartMessage(result.message);
    }

    if (loading) {
        return (
            <main className="min-h-screen bg-[#faf9f6] px-5 py-20 text-center">
                Loading product details...
            </main>
        );
    }

    if (error || !product) {
        return (
            <main className="min-h-screen bg-[#faf9f6] px-5 py-20 text-center">
                <h1 className="text-2xl font-semibold">
                    {error || "Product not found"}
                </h1>

                <Link
                    to="/shop"
                    className="mt-6 inline-block text-sm underline"
                >
                    Back to Shop
                </Link>
            </main>
        );
    }

    return (
        <main className="min-h-screen w-full bg-[#faf9f6] text-[#202020]">
            <div className="mx-auto w-full max-w-[1280px] px-5 py-8 sm:px-8 sm:py-12 lg:px-12">

                {/* BREADCRUMB */}
                <nav className="mb-8 flex flex-wrap items-center justify-between gap-4 text-sm">
                    <div className="text-gray-500">
                        <Link to="/shop" className="hover:text-black">
                            Shop
                        </Link>

                        <span className="mx-2">/</span>

                        <span>{product.name}</span>
                    </div>

                    <Link
                        to="/cart"
                        className="text-sm text-gray-700 hover:text-black"
                    >
                        Shopping Cart ({cartCount})
                    </Link>
                </nav>

                <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-2 lg:gap-16">

                    {/* IMAGE GALLERY */}
                    <section className="min-w-0">
                        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-lg bg-[#eeece7]">
                            {images.length > 0 ? (
                                <img
                                    src={images[selectedImage]}
                                    alt={`${product.name} - image ${selectedImage + 1}`}
                                    className="absolute inset-0 h-full w-full object-contain"
                                />
                            ) : (
                                <div className="flex h-full items-center justify-center text-gray-400">
                                    No Image Available
                                </div>
                            )}
                        </div>

                        {images.length > 1 && (
                            <div className="mt-4 grid grid-cols-5 gap-3">
                                {images.map((image, index) => (
                                    <button
                                        key={`${image}-${index}`}
                                        type="button"
                                        onClick={() => setSelectedImage(index)}
                                        aria-label={`View image ${index + 1}`}
                                        aria-pressed={selectedImage === index}
                                        className={`relative aspect-square overflow-hidden rounded-md border-2 ${selectedImage === index
                                                ? "border-black"
                                                : "border-transparent"
                                            }`}
                                    >
                                        <img
                                            src={image}
                                            alt=""
                                            className="absolute inset-0 h-full w-full object-cover"
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* PRODUCT INFORMATION */}
                    <section className="min-w-0 lg:pt-4">

                        <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
                            {product.category}
                        </p>

                        <h1 className="mt-4 text-3xl font-semibold leading-tight sm:text-4xl">
                            {product.name}
                        </h1>

                        <p className="mt-5 text-xl">
                            LKR {Number(product.price).toLocaleString("en-LK")}
                        </p>

                        <div className="my-8 border-t border-gray-200" />

                        {/* SIZE */}
                        <div>
                            <h2 className="mb-3 text-sm font-medium">
                                Select Size
                            </h2>

                            <div className="flex flex-wrap gap-3">
                                {sizes.map((size) => (
                                    <button
                                        key={size}
                                        type="button"
                                        onClick={() => handleSizeChange(size)}
                                        aria-pressed={selectedSize === size}
                                        className={`min-w-12 rounded-md border px-4 py-3 text-sm transition ${selectedSize === size
                                                ? "border-black bg-black text-white"
                                                : "border-gray-300 bg-white hover:border-black"
                                            }`}
                                    >
                                        {size}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* COLOR */}
                        <div className="mt-7">
                            <h2 className="mb-3 text-sm font-medium">
                                Select Color
                            </h2>

                            <div className="flex flex-wrap gap-3">
                                {colors.map((color) => (
                                    <button
                                        key={color}
                                        type="button"
                                        onClick={() => handleColorChange(color)}
                                        aria-pressed={selectedColor === color}
                                        className={`rounded-md border px-5 py-3 text-sm transition ${selectedColor === color
                                                ? "border-black bg-black text-white"
                                                : "border-gray-300 bg-white hover:border-black"
                                            }`}
                                    >
                                        {color}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* STOCK */}
                        <div className="mt-7">
                            {selectedVariant && availableStock > 0 ? (
                                <p className="text-sm text-green-700">
                                    In Stock — {availableStock} available
                                </p>
                            ) : (
                                <p className="text-sm text-red-600">
                                    Out of Stock
                                </p>
                            )}
                        </div>

                        {/* QUANTITY */}
                        <div className="mt-7">
                            <h2 className="mb-3 text-sm font-medium">
                                Quantity
                            </h2>

                            <div className="inline-flex items-center overflow-hidden rounded-md border border-gray-300 bg-white">
                                <button
                                    type="button"
                                    onClick={decreaseQuantity}
                                    disabled={quantity <= 1 || availableStock < 1}
                                    aria-label="Decrease quantity"
                                    className="px-5 py-3 text-lg disabled:opacity-30"
                                >
                                    −
                                </button>

                                <span className="min-w-12 text-center text-sm">
                                    {quantity}
                                </span>

                                <button
                                    type="button"
                                    onClick={increaseQuantity}
                                    disabled={
                                        availableStock < 1 ||
                                        quantity >= availableStock
                                    }
                                    aria-label="Increase quantity"
                                    className="px-5 py-3 text-lg disabled:opacity-30"
                                >
                                    +
                                </button>
                            </div>
                        </div>

                        {/* ADD TO CART */}
                        <button
                            type="button"
                            onClick={handleAddToCart}
                            disabled={!selectedVariant || availableStock < 1}
                            className="mt-8 w-full rounded-md bg-black px-6 py-4 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            Add to Cart
                        </button>

                        {cartMessage && (
                            <div
                                role="status"
                                className={`mt-4 rounded-md px-4 py-3 text-sm ${cartSuccess
                                        ? "bg-green-50 text-green-800"
                                        : "bg-red-50 text-red-700"
                                    }`}
                            >
                                {cartMessage}
                            </div>
                        )}

                        <div className="my-10 border-t border-gray-200" />

                        {/* DESCRIPTION */}
                        <div>
                            <h2 className="mb-4 text-lg font-semibold">
                                Product Description
                            </h2>

                            <p className="whitespace-pre-line text-sm leading-7 text-gray-600">
                                {product.description}
                            </p>
                        </div>

                        <div className="mt-10">
                            <Link
                                to="/shop"
                                className="text-sm text-gray-500 underline hover:text-black"
                            >
                                ← Continue Shopping
                            </Link>
                        </div>
                    </section>
                </div>
            </div>
        </main>
    );
}
