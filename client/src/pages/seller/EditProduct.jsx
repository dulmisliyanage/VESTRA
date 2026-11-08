
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";

const MAX_IMAGES = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const categories = [
    "Men",
    "Women",
    "Unisex",
    "Accessories",
    "Footwear"
];

function emptyVariant() {
    return {
        size: "M",
        color: "Black",
        sku: "",
        stock: "0"
    };
}

export default function EditProduct() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [form, setForm] = useState({
        name: "",
        description: "",
        category: "Unisex",
        price: "",
        status: "draft"
    });

    const [variants, setVariants] = useState([
        emptyVariant()
    ]);

    // Images already stored in MongoDB
    const [existingImages, setExistingImages] = useState([]);

    // New files selected from the computer
    const [newImages, setNewImages] = useState([]);

    // Temporary browser preview URLs
    const [previews, setPreviews] = useState([]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState("");

    // ==========================================
    // LOAD SELLER'S PRODUCT SECURELY
    // ==========================================

    useEffect(() => {
        let cancelled = false;

        async function loadProduct() {
            try {
                setLoading(true);
                setError("");

                // NEW: Load only the requested product
                // through the protected seller endpoint.
                const response = await api.get(
                    "/products/my-products"
                );

                const product = response.data.products.find(
                    (item) => item._id === id
                );
                if (!product) {
                    throw new Error("Product not found");
                }

                if (cancelled) return;

                setForm({
                    name: product.name || "",
                    description: product.description || "",
                    category: product.category || "Unisex",
                    price: String(product.price ?? ""),
                    status: product.status || "draft"
                });

                setVariants(
                    product.variants?.length
                        ? product.variants.map((variant) => ({
                            size: variant.size || "",
                            color: variant.color || "",
                            sku: variant.sku || "",
                            stock: String(variant.stock ?? 0)
                        }))
                        : [emptyVariant()]
                );

                setExistingImages(product.images || []);
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err.response?.data?.message ||
                        err.message ||
                        "Unable to load product"
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        loadProduct();

        return () => {
            cancelled = true;
        };
    }, [id]);

    // ==========================================
    // IMAGE PREVIEWS
    // ==========================================

    useEffect(() => {
        const urls = newImages.map((file) =>
            URL.createObjectURL(file)
        );

        setPreviews(urls);

        return () => {
            urls.forEach((url) => URL.revokeObjectURL(url));
        };
    }, [newImages]);

    // ==========================================
    // FORM HANDLERS
    // ==========================================

    function handleChange(event) {
        const { name, value } = event.target;

        setForm((previous) => ({
            ...previous,
            [name]: value
        }));
    }

    function updateVariant(index, field, value) {
        setVariants((previous) =>
            previous.map((variant, currentIndex) =>
                currentIndex === index
                    ? { ...variant, [field]: value }
                    : variant
            )
        );
    }

    function addVariant() {
        setVariants((previous) => [
            ...previous,
            emptyVariant()
        ]);
    }

    function removeVariant(index) {
        setVariants((previous) =>
            previous.filter(
                (_, currentIndex) => currentIndex !== index
            )
        );
    }

    // ==========================================
    // IMAGE HANDLERS
    // ==========================================

    function removeExistingImage(index) {
        setExistingImages((previous) =>
            previous.filter(
                (_, currentIndex) => currentIndex !== index
            )
        );
    }

    function removeNewImage(index) {
        setNewImages((previous) =>
            previous.filter(
                (_, currentIndex) => currentIndex !== index
            )
        );
    }

    function handleImageSelection(event) {
        const files = Array.from(event.target.files || []);

        const total =
            existingImages.length +
            newImages.length +
            files.length;

        if (total > MAX_IMAGES) {
            setError(
                `You can have a maximum of ${MAX_IMAGES} images per product.`
            );

            event.target.value = "";
            return;
        }

        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp"
        ];

        const invalidFile = files.find(
            (file) =>
                !allowedTypes.includes(file.type) ||
                file.size > MAX_FILE_SIZE
        );

        if (invalidFile) {
            setError(
                "Only JPG, PNG, or WebP images up to 5 MB are allowed."
            );

            event.target.value = "";
            return;
        }

        setNewImages((previous) => [
            ...previous,
            ...files
        ]);

        setError("");

        event.target.value = "";
    }

    // ==========================================
    // UPLOAD NEW IMAGES
    // ==========================================

    async function uploadNewImages() {
        const uploadedUrls = [];

        for (const file of newImages) {
            const formData = new FormData();

            formData.append("image", file);

            const response = await api.post(
                "/uploads/product-image",
                formData
            );

            uploadedUrls.push(response.data.imageUrl);
        }

        return uploadedUrls;
    }

    // ==========================================
    // SAVE PRODUCT
    // ==========================================

    async function handleSubmit(event) {
        event.preventDefault();

        if (saving) return;

        setError("");

        if (
            !form.name.trim() ||
            !form.description.trim()
        ) {
            setError("Please complete the product details.");
            return;
        }

        if (
            form.price.trim() === "" ||
            !Number.isFinite(Number(form.price)) ||
            Number(form.price) < 0
        ) {
            setError("Please enter a valid product price.");
            return;
        }

        if (variants.length === 0) {
            setError("At least one variant is required.");
            return;
        }

        const invalidVariant = variants.some(
            (variant) =>
                !variant.size.trim() ||
                !variant.color.trim() ||
                !variant.sku.trim() ||
                variant.stock === "" ||
                !Number.isInteger(Number(variant.stock)) ||
                Number(variant.stock) < 0
        );

        if (invalidVariant) {
            setError("Please complete all variant fields.");
            return;
        }

        if (
            existingImages.length + newImages.length >
            MAX_IMAGES
        ) {
            setError("Too many product images.");
            return;
        }

        setSaving(true);

        try {
            setUploading(true);

            // Upload only newly selected images.
            const uploadedUrls = await uploadNewImages();

            setUploading(false);

            // Keep existing images unless removed.
            const finalImages = [
                ...existingImages,
                ...uploadedUrls
            ];

            const productData = {
                name: form.name.trim(),
                description: form.description.trim(),
                category: form.category,
                price: Number(form.price),
                status: form.status,
                images: finalImages,
                variants: variants.map((variant) => ({
                    size: variant.size.trim(),
                    color: variant.color.trim(),
                    sku: variant.sku.trim(),
                    stock: Number(variant.stock)
                }))
            };

            // Existing protected seller update endpoint.
            await api.patch(
                `/products/${id}`,
                productData
            );

            navigate("/seller");
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to update product. Please try again."
            );
        } finally {
            setUploading(false);
            setSaving(false);
        }
    }

    // ==========================================
    // LOADING STATE
    // ==========================================

    if (loading) {
        return (
            <main className="min-h-screen bg-[#faf9f6] p-10">
                <p>Loading product...</p>
            </main>
        );
    }

    // ==========================================
    // PRODUCT LOAD ERROR
    // ==========================================

    if (error && !form.name) {
        return (
            <main className="min-h-screen bg-[#faf9f6] p-10">
                <p className="text-red-600">{error}</p>

                <button
                    type="button"
                    onClick={() => navigate("/seller")}
                    className="mt-5 underline"
                >
                    Back to Dashboard
                </button>
            </main>
        );
    }

    // ==========================================
    // MAIN EDIT PRODUCT PAGE
    // ==========================================

    return (
        <main className="min-h-screen bg-[#faf9f6] px-5 py-12 text-[#202020]">
            <div className="mx-auto max-w-3xl">

                {/* BACK BUTTON */}
                <button
                    type="button"
                    onClick={() => navigate("/seller")}
                    className="mb-8 text-sm text-gray-600 hover:text-black"
                >
                    ← Back to Seller Dashboard
                </button>

                {/* PAGE HEADING */}
                <h1 className="mb-2 text-3xl font-semibold">
                    Edit Product
                </h1>

                <p className="mb-10 text-sm text-gray-500">
                    Update your product information and images.
                </p>

                <form
                    onSubmit={handleSubmit}
                    className="space-y-8 rounded-xl border border-gray-200 bg-white p-6 md:p-8"
                >

                    {/* ====================================
                        PRODUCT INFORMATION
                    ==================================== */}

                    <section className="space-y-5">
                        <h2 className="text-xl font-semibold">
                            Product Information
                        </h2>

                        {/* NAME */}
                        <div>
                            <label
                                htmlFor="edit-name"
                                className="mb-2 block text-sm font-medium"
                            >
                                Product Name
                            </label>

                            <input
                                id="edit-name"
                                name="name"
                                value={form.name}
                                onChange={handleChange}
                                maxLength={150}
                                required
                                className="w-full rounded-md border border-gray-300 px-4 py-3"
                            />
                        </div>

                        {/* DESCRIPTION */}
                        <div>
                            <label
                                htmlFor="edit-description"
                                className="mb-2 block text-sm font-medium"
                            >
                                Description
                            </label>

                            <textarea
                                id="edit-description"
                                name="description"
                                value={form.description}
                                onChange={handleChange}
                                maxLength={3000}
                                required
                                rows={4}
                                className="w-full rounded-md border border-gray-300 px-4 py-3"
                            />
                        </div>

                        {/* CATEGORY AND PRICE */}
                        <div className="grid gap-5 md:grid-cols-2">

                            <div>
                                <label
                                    htmlFor="edit-category"
                                    className="mb-2 block text-sm font-medium"
                                >
                                    Category
                                </label>

                                <select
                                    id="edit-category"
                                    name="category"
                                    value={form.category}
                                    onChange={handleChange}
                                    className="w-full rounded-md border border-gray-300 px-4 py-3"
                                >
                                    {categories.map((category) => (
                                        <option
                                            key={category}
                                            value={category}
                                        >
                                            {category}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label
                                    htmlFor="edit-price"
                                    className="mb-2 block text-sm font-medium"
                                >
                                    Price (LKR)
                                </label>

                                <input
                                    id="edit-price"
                                    name="price"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={form.price}
                                    onChange={handleChange}
                                    required
                                    className="w-full rounded-md border border-gray-300 px-4 py-3"
                                />
                            </div>

                        </div>
                    </section>

                    {/* ====================================
                        PRODUCT IMAGES
                    ==================================== */}

                    <section className="space-y-4 border-t border-gray-200 pt-8">

                        <h2 className="text-xl font-semibold">
                            Product Images
                        </h2>

                        <p className="text-sm text-gray-500">
                            Up to 5 images per product.
                            JPG, PNG, or WebP.
                            Maximum 5 MB each.
                        </p>

                        {/* EXISTING IMAGES */}
                        {existingImages.length > 0 && (
                            <div>
                                <h3 className="mb-3 text-sm font-medium">
                                    Existing Images
                                </h3>

                                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                                    {existingImages.map((url, index) => (
                                        <div
                                            key={`${url}-${index}`}
                                            className="relative overflow-hidden rounded-lg border border-gray-200"
                                        >
                                            <img
                                                src={url}
                                                alt={`Product image ${index + 1}`}
                                                className="aspect-square w-full object-cover"
                                            />

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    removeExistingImage(index)
                                                }
                                                disabled={saving}
                                                aria-label={`Remove existing image ${index + 1}`}
                                                className="absolute right-2 top-2 rounded bg-white px-2 py-1 text-xs shadow"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ADD NEW IMAGES */}
                        <div>
                            <label
                                htmlFor="new-images"
                                className="mb-3 block text-sm font-medium"
                            >
                                Add New Images
                            </label>

                            <input
                                id="new-images"
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                multiple
                                onChange={handleImageSelection}
                                disabled={saving}
                                className="block w-full text-sm file:mr-4 file:rounded-md file:border-0 file:bg-black file:px-5 file:py-3 file:text-white"
                            />
                        </div>

                        {/* NEW IMAGE PREVIEWS */}
                        {previews.length > 0 && (
                            <div>
                                <h3 className="mb-3 text-sm font-medium">
                                    New Image Previews
                                </h3>

                                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                                    {previews.map((url, index) => (
                                        <div
                                            key={url}
                                            className="relative overflow-hidden rounded-lg border border-gray-200"
                                        >
                                            <img
                                                src={url}
                                                alt={`New image ${index + 1}`}
                                                className="aspect-square w-full object-cover"
                                            />

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    removeNewImage(index)
                                                }
                                                disabled={saving}
                                                aria-label={`Remove new image ${index + 1}`}
                                                className="absolute right-2 top-2 rounded bg-white px-2 py-1 text-xs shadow"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <p className="text-xs text-gray-500">
                            {existingImages.length + newImages.length}
                            {" "}of {MAX_IMAGES} images selected
                        </p>
                    </section>

                    {/* ====================================
                        PRODUCT VARIANTS
                    ==================================== */}

                    <section className="space-y-5 border-t border-gray-200 pt-8">

                        <div className="flex items-center justify-between gap-4">
                            <h2 className="text-xl font-semibold">
                                Product Variants
                            </h2>

                            <button
                                type="button"
                                onClick={addVariant}
                                disabled={saving}
                                className="rounded-md border border-black px-4 py-2 text-sm"
                            >
                                + Add Variant
                            </button>
                        </div>

                        {variants.map((variant, index) => (
                            <div
                                key={index}
                                className="space-y-4 rounded-lg border border-gray-200 p-4"
                            >

                                {/* VARIANT HEADER */}
                                <div className="flex items-center justify-between">
                                    <h3 className="font-medium">
                                        Variant {index + 1}
                                    </h3>

                                    {variants.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                removeVariant(index)
                                            }
                                            disabled={saving}
                                            className="text-sm text-red-600"
                                        >
                                            Remove
                                        </button>
                                    )}
                                </div>

                                {/* VARIANT FIELDS */}
                                <div className="grid gap-4 sm:grid-cols-2">

                                    {/* SIZE */}
                                    <div>
                                        <label className="mb-1 block text-sm">
                                            Size
                                        </label>

                                        <input
                                            value={variant.size}
                                            onChange={(event) =>
                                                updateVariant(
                                                    index,
                                                    "size",
                                                    event.target.value
                                                )
                                            }
                                            required
                                            className="w-full rounded-md border border-gray-300 px-3 py-2"
                                        />
                                    </div>

                                    {/* COLOR */}
                                    <div>
                                        <label className="mb-1 block text-sm">
                                            Color
                                        </label>

                                        <input
                                            value={variant.color}
                                            onChange={(event) =>
                                                updateVariant(
                                                    index,
                                                    "color",
                                                    event.target.value
                                                )
                                            }
                                            required
                                            className="w-full rounded-md border border-gray-300 px-3 py-2"
                                        />
                                    </div>

                                    {/* SKU */}
                                    <div>
                                        <label className="mb-1 block text-sm">
                                            SKU
                                        </label>

                                        <input
                                            value={variant.sku}
                                            onChange={(event) =>
                                                updateVariant(
                                                    index,
                                                    "sku",
                                                    event.target.value
                                                )
                                            }
                                            required
                                            className="w-full rounded-md border border-gray-300 px-3 py-2"
                                        />
                                    </div>

                                    {/* STOCK */}
                                    <div>
                                        <label className="mb-1 block text-sm">
                                            Stock
                                        </label>

                                        <input
                                            type="number"
                                            min="0"
                                            step="1"
                                            value={variant.stock}
                                            onChange={(event) =>
                                                updateVariant(
                                                    index,
                                                    "stock",
                                                    event.target.value
                                                )
                                            }
                                            required
                                            className="w-full rounded-md border border-gray-300 px-3 py-2"
                                        />
                                    </div>

                                </div>
                            </div>
                        ))}
                    </section>

                    {/* ====================================
                        PRODUCT STATUS
                    ==================================== */}

                    <section className="border-t border-gray-200 pt-8">
                        <label
                            htmlFor="edit-status"
                            className="mb-2 block text-sm font-medium"
                        >
                            Product Status
                        </label>

                        <select
                            id="edit-status"
                            name="status"
                            value={form.status}
                            onChange={handleChange}
                            className="w-full rounded-md border border-gray-300 px-4 py-3"
                        >
                            <option value="draft">Draft</option>
                            <option value="active">Active</option>
                            <option value="archived">Archived</option>
                        </select>
                    </section>

                    {/* ERROR MESSAGE */}
                    {error && (
                        <p
                            role="alert"
                            className="rounded-md bg-red-50 p-4 text-sm text-red-700"
                        >
                            {error}
                        </p>
                    )}

                    {/* SAVE BUTTON */}
                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full rounded-md bg-black px-6 py-4 font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                    >
                        {uploading
                            ? "Uploading Images..."
                            : saving
                                ? "Saving Changes..."
                                : "Save Changes"}
                    </button>

                </form>
            </div>
        </main>
    );
}
