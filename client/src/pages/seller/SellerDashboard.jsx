
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function SellerDashboard() {
    const { user } = useAuth();

    const dashboardLinks = [
        {
            title: "My Products",
            description:
                "View, edit, and manage products listed in your store.",
            path: "/seller/products",
            button: "Manage Products"
        },
        {
            title: "Add New Product",
            description:
                "Upload product images, set prices, and manage stock.",
            path: "/seller/products/new",
            button: "Add Product"
        },
        {
            title: "Customer Orders",
            description:
                "View customer orders containing products from your store.",
            path: "/seller/orders",
            button: "View Orders"
        }
    ];

    return (
        <main className="min-h-screen bg-[#faf9f6] px-5 py-12 text-[#191919] md:px-12 lg:px-20">
            <div className="mx-auto max-w-6xl">

                {/* Page heading */}
                <div className="mb-12">
                    <p className="mb-3 text-xs uppercase tracking-[0.3em] text-neutral-500">
                        VESTRA SELLER STUDIO
                    </p>

                    <h1 className="text-4xl md:text-5xl">
                        Seller Dashboard
                    </h1>

                    <p className="mt-4 text-sm leading-relaxed text-neutral-600">
                        Welcome back{user?.name ? `, ${user.name}` : ""}.
                        Manage your products and customer orders in one place.
                    </p>
                </div>

                {/* Dashboard navigation cards */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {dashboardLinks.map((item) => (
                        <div
                            key={item.path}
                            className="flex flex-col justify-between border border-neutral-200 bg-white p-7"
                        >
                            <div>
                                <h2 className="text-2xl">
                                    {item.title}
                                </h2>

                                <p className="mt-4 text-sm leading-relaxed text-neutral-600">
                                    {item.description}
                                </p>
                            </div>

                            <Link
                                to={item.path}
                                className="mt-10 inline-block border border-black px-5 py-3 text-center text-sm transition hover:bg-black hover:text-white"
                            >
                                {item.button}
                            </Link>
                        </div>
                    ))}
                </div>

                {/* Additional information */}
                <div className="mt-12 border-t border-neutral-200 pt-8">
                    <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
                        YOUR VESTRA STORE
                    </p>

                    <p className="mt-3 text-sm leading-relaxed text-neutral-600">
                        Keep your product listings updated, monitor available
                        stock, and review incoming customer orders.
                    </p>
                </div>
            </div>
        </main>
    );
}
