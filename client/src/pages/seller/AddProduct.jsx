
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

const categories = [
    "Men",
    "Women",
    "Unisex",
    "Accessories",
    "Footwear"
];

const emptyVariant = () => ({
    size: "M",
    color: "Black",
    sku: "",
    stock: "0"
});

export default function AddProduct() {
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

    const [selectedImages, setSelectedImages] = useState([]);
    const [imagePreviews, setImagePreviews] = useState([]);

    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    // Create local previews and release their URLs on cleanup.
    useEffect(() => {
        const previews = selectedImages.map((file) =>
            URL.createObjectURL(file)
        );

        setImagePreviews(previews);

        return () => {
            previews.forEach((url) => URL.revokeObjectURL(url));
        };
    }, [selectedImages]);

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
            previous.filter((_, currentIndex) =>
                currentIndex !== index
            )
        );
    }

    function handleImageSelection(event) {
        const files = Array.from(event.target.files || []);

        if (files.length > 5) {
            setError("Please select no more than 5 images.");
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
                file.size > 5 * 1024 * 1024
        );

        if (invalidFile) {
            setError(
                "Images must be JPG, PNG, or WebP and no larger than 5 MB each."
            );
            event.target.value = "";
            return;
        }

        setError("");
        setSelectedImages(files);
    }

    function removeImage(index) {
        setSelectedImages((previous) =>
            previous.filter((_, currentIndex) =>
                currentIndex !== index
            )
        );
    }

    async function uploadImages() {
        const uploadedUrls = [];

        for (const file of selectedImages) {
            const formData = new FormData();

            // Must match upload.single("image") in Express.
            formData.append("image", file);

            const response = await api.post(
                "/uploads/product-image",
                formData
            );

            uploadedUrls.push(response.data.imageUrl);
        }

        return uploadedUrls;
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setError("");

        if (saving || uploading) return;

        if (!form.name.trim() || !form.description.trim()) {
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
            setError("Add at least one product variant.");
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
            setError("Please complete all variant details.");
            return;
        }

        setSaving(true);

        try {
            setUploading(true);

            // Upload files before creating the product.
            const imageUrls = await uploadImages();

            setUploading(false);

            const productData = {
                ...form,
                name: form.name.trim(),
                description: form.description.trim(),
                price: Number(form.price),
                images: imageUrls,
                variants: variants.map((variant) => ({
                    size: variant.size.trim(),
                    color: variant.color.trim(),
                    sku: variant.sku.trim(),
                    stock: Number(variant.stock)
                }))
            };

            await api.post("/products", productData);

            navigate("/seller");
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to save product. Please try again."
            );
        } finally {
            setUploading(false);
            setSaving(false);
        }
    }

    return (
        <main className="min-h-screen bg-[#faf9f6] px-5 py-12 text-[#202020]">
            <div className="mx-auto max-w-3xl">
                <button
                    type="button"
                    onClick={() => navigate("/seller")}
                    className="mb-8 text-sm text-gray-600 hover:text-black"
                >
                    ← Back to Seller Dashboard
                </button>

                <h1 className="mb-2 text-3xl font-semibold">
                    Add New Product
                </h1>

                <p className="mb-10 text-sm text-gray-500">
                    Create a new fashion listing for your VESTRA store.
                </p>

                <form
                    onSubmit={handleSubmit}
                    className="space-y-8 rounded-xl border border-gray-200 bg-white p-6 md:p-8"
                >
                    {/* Product details */}
                    <section className="space-y-5">
                        <h2 className="text-xl font-semibold">
                            Product Information
                        </h2>

                        <div>
                            <label
                                htmlFor="product-name"
                                className="mb-2 block text-sm font-medium"
                            >
                                Product Name
                            </label>

                            <input
                                id="product-name"
                                name="name"
                                value={form.name}
                                onChange={handleChange}
                                maxLength={150}
                                required
                                placeholder="Classic Oversized T-Shirt"
                                className="w-full rounded-md border border-gray-300 px-4 py-3 outline-none focus:border-black"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="product-description"
                                className="mb-2 block text-sm font-medium"
                            >
                                Description
                            </label>

                            <textarea
                                id="product-description"
                                name="description"
                                value={form.description}
                                onChange={handleChange}
                                maxLength={3000}
                                required
                                rows={4}
                                placeholder="Describe the material, fit, and design."
                                className="w-full rounded-md border border-gray-300 px-4 py-3 outline-none focus:border-black"
                            />
                        </div>

                        <div className="grid gap-5 md:grid-cols-2">
                            <div>
                                <label
                                    htmlFor="product-category"
                                    className="mb-2 block text-sm font-medium"
                                >
                                    Category
                                </label>

                                <select
                                    id="product-category"
                                    name="category"
                                    value={form.category}
                                    onChange={handleChange}
                                    className="w-full rounded-md border border-gray-300 px-4 py-3"
                                >
                                    {categories.map((category) => (
                                        <option key={category} value={category}>
                                            {category}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label
                                    htmlFor="product-price"
                                    className="mb-2 block text-sm font-medium"
                                >
                                    Price (LKR)
                                </label>

                                <input
                                    id="product-price"
                                    name="price"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={form.price}
                                    onChange={handleChange}
                                    required
                                    placeholder="3500"
                                    className="w-full rounded-md border border-gray-300 px-4 py-3"
                                />
                            </div>
                        </div>
                    </section>

                    {/* Product images */}
                    <section className="space-y-4 border-t border-gray-200 pt-8">
                        <h2 className="text-xl font-semibold">
                            Product Images
                        </h2>

                        <p className="text-sm text-gray-500">
                            Select up to 5 images. JPG, PNG, or WebP.
                            Maximum 5 MB per image.
                        </p>

                        <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            multiple
                            onChange={handleImageSelection}
                            disabled={saving}
                            className="block w-full text-sm file:mr-4 file:rounded-md file:border-0 file:bg-black file:px-5 file:py-3 file:text-white hover:file:bg-gray-800"
                        />

                        {imagePreviews.length > 0 && (
                            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                                {imagePreviews.map((preview, index) => (
                                    <div
                                        key={preview}
                                        className="relative overflow-hidden rounded-lg border border-gray-200"
                                    >
                                        <img
                                            src={preview}
                                            alt={`Selected product image ${index + 1}`}
                                            className="aspect-square w-full object-cover"
                                        />

                                        <button
                                            type="button"
                                            onClick={() => removeImage(index)}
                                            disabled={saving}
                                            aria-label={`Remove image ${index + 1}`}
                                            className="absolute right-2 top-2 rounded bg-white px-2 py-1 text-xs text-black shadow"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* Product variants */}
                    <section className="space-y-5 border-t border-gray-200 pt-8">
                        <div className="flex items-center justify-between gap-4">
                            <h2 className="text-xl font-semibold">
                                Product Variants
                            </h2>

                            <button
                                type="button"
                                onClick={addVariant}
                                disabled={saving}
                                className="rounded-md border border-black px-4 py-2 text-sm hover:bg-gray-100"
                            >
                                + Add Variant
                            </button>
                        </div>

                        {variants.map((variant, index) => (
                            <div
                                key={index}
                                className="space-y-4 rounded-lg border border-gray-200 p-4"
                            >
                                <div className="flex items-center justify-between">
                                    <h3 className="font-medium">
                                        Variant {index + 1}
                                    </h3>

                                    {variants.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeVariant(index)}
                                            disabled={saving}
                                            className="text-sm text-red-600"
                                        >
                                            Remove
                                        </button>
                                    )}
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
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
                                            placeholder="M"
                                            className="w-full rounded-md border border-gray-300 px-3 py-2"
                                        />
                                    </div>

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
                                            placeholder="Black"
                                            className="w-full rounded-md border border-gray-300 px-3 py-2"
                                        />
                                    </div>

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
                                            placeholder="VST-TSHIRT-BLK-M"
                                            className="w-full rounded-md border border-gray-300 px-3 py-2"
                                        />
                                    </div>

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

                    {/* Product status */}
                    <section className="border-t border-gray-200 pt-8">
                        <label
                            htmlFor="product-status"
                            className="mb-2 block text-sm font-medium"
                        >
                            Product Status
                        </label>

                        <select
                            id="product-status"
                            name="status"
                            value={form.status}
                            onChange={handleChange}
                            className="w-full rounded-md border border-gray-300 px-4 py-3"
                        >
                            <option value="draft">Draft</option>
                            <option value="active">Active</option>
                        </select>

                        <p className="mt-2 text-xs text-gray-500">
                            Draft products are not publicly visible.
                        </p>
                    </section>

                    {error && (
                        <p
                            role="alert"
                            className="rounded-md bg-red-50 p-4 text-sm text-red-700"
                        >
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full rounded-md bg-black px-6 py-4 font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {uploading
                            ? "Uploading Images..."
                            : saving
                                ? "Saving Product..."
                                : "Create Product"}
                    </button>
                </form>
            </div>
        </main>
    );
}
