
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";

export default function SellerApply() {
    const [storeName, setStoreName] = useState("");
    const [description, setDescription] = useState("");
    const [store, setStore] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        async function loadStore() {
            try {
                const response = await api.get("/seller/my-store");
                setStore(response.data.store);
            } catch (err) {
                setError(
                    err.response?.data?.message ||
                    "Unable to load your store information."
                );
            } finally {
                setLoading(false);
            }
        }

        loadStore();
    }, []);

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");
        setSuccess("");
        setSubmitting(true);

        try {
            const response = await api.post("/seller/apply", {
                storeName: storeName.trim(),
                description: description.trim(),
            });

            setStore(response.data.store);
            setSuccess("Your seller application was submitted successfully!");
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Something went wrong. Please try again."
            );
        } finally {
            setSubmitting(false);
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[#faf9f6] p-12">
                Loading...
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-[#faf9f6] px-6 py-12">
            <div className="mx-auto max-w-2xl">
                <div className="mb-12 flex items-center justify-between">
                    <Link to="/" className="font-serif text-2xl tracking-[0.3em]">
                        VESTRA
                    </Link>

                    <Link to="/account" className="text-sm underline">
                        My Account
                    </Link>
                </div>

                <p className="mb-3 text-xs uppercase tracking-[0.3em] text-stone-500">
                    Partner With Us
                </p>

                <h1 className="mb-4 font-serif text-5xl">
                    Become a Seller
                </h1>

                <p className="mb-10 text-stone-600">
                    Join VESTRA and introduce your fashion brand
                    to customers across Sri Lanka.
                </p>

                {error && (
                    <p role="alert" className="mb-6 text-sm text-red-700">
                        {error}
                    </p>
                )}

                {success && (
                    <p role="status" className="mb-6 text-sm text-green-700">
                        {success}
                    </p>
                )}

                {store ? (
                    <section className="border border-stone-200 bg-white p-8">
                        <p className="text-xs uppercase tracking-widest text-stone-500">
                            Your Store
                        </p>

                        <h2 className="mt-3 font-serif text-3xl">
                            {store.storeName}
                        </h2>

                        <p className="mt-5 text-sm">
                            Application Status:
                            <span className="ml-2 font-semibold capitalize">
                                {store.approvalStatus}
                            </span>
                        </p>

                        <p className="mt-5 text-stone-600">
                            {store.approvalStatus === "pending"
                                ? "Your application is under review by the VESTRA team."
                                : store.approvalStatus === "approved"
                                    ? "Congratulations! Your store has been approved."
                                    : "Your application was not approved."}
                        </p>

                        {store.approvalStatus === "approved" && (
                            <Link
                                to="/seller"
                                className="mt-8 inline-block bg-black px-8 py-3 text-sm text-white"
                            >
                                Go to Seller Dashboard
                            </Link>
                        )}
                    </section>
                ) : (
                    <form
                        onSubmit={handleSubmit}
                        className="space-y-7 border border-stone-200 bg-white p-8"
                    >
                        <div>
                            <label
                                htmlFor="storeName"
                                className="mb-2 block text-sm font-medium"
                            >
                                Store Name
                            </label>

                            <input
                                id="storeName"
                                type="text"
                                required
                                minLength={3}
                                maxLength={80}
                                value={storeName}
                                onChange={(e) => setStoreName(e.target.value)}
                                placeholder="e.g. Urban Atelier"
                                className="w-full border border-stone-300 px-4 py-3 outline-none focus:border-black"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="description"
                                className="mb-2 block text-sm font-medium"
                            >
                                About Your Brand
                            </label>

                            <textarea
                                id="description"
                                rows={5}
                                maxLength={1000}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Describe your fashion brand and products..."
                                className="w-full resize-none border border-stone-300 px-4 py-3 outline-none focus:border-black"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full bg-black py-4 text-sm uppercase tracking-[0.2em] text-white transition hover:bg-stone-800 disabled:opacity-50"
                        >
                            {submitting
                                ? "Submitting..."
                                : "Submit Application"}
                        </button>
                    </form>
                )}
            </div>
        </main>
    );
}
